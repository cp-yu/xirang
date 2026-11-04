local M = {}
local uv = vim.uv or vim.loop
local sessions = {}
local defaults = { cli = { 'xirang' }, cwd = nil, runner = nil }

local function notify(message, level)
  vim.notify(message, level or vim.log.levels.INFO, { title = 'Xirang Review' })
end

local function lines(text)
  local result = {}
  for line in (text .. '\n'):gmatch('(.-)\n') do result[#result + 1] = line end
  if #result == 0 then result[1] = '' end
  return result
end

local function buf(name, content, modifiable)
  local b = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_name(b, name)
  vim.api.nvim_buf_set_lines(b, 0, -1, false, lines(content or ''))
  vim.bo[b].buftype = 'nofile'
  vim.bo[b].bufhidden = 'wipe'
  vim.bo[b].swapfile = false
  vim.bo[b].modifiable = modifiable == true
  vim.bo[b].filetype = name:match('%.md$') and 'markdown' or 'yaml'
  return b
end

local function stop(session)
  for _, watcher in ipairs(session.watchers) do
    watcher:stop()
    watcher:close()
  end
  session.watchers = {}
  for _, b in ipairs(session.buffers) do
    if vim.api.nvim_buf_is_valid(b) then
      local displayed = false
      for _, win in ipairs(vim.api.nvim_list_wins()) do
        if vim.api.nvim_win_get_buf(win) == b then displayed = true; break end
      end
      if not displayed then pcall(vim.api.nvim_buf_delete, b, { force = true }) end
    end
  end
end

local function selected(session)
  return session.items[session.cursor]
end

local function selectedText(session)
  local item = selected(session)
  if not item then return end
  if item.plan then
    if session.rightWin and vim.api.nvim_win_is_valid(session.rightWin) then
      pcall(vim.api.nvim_win_call, session.rightWin, function() vim.cmd('diffoff') end)
    end
    if session.leftWin and vim.api.nvim_win_is_valid(session.leftWin) then
      pcall(vim.api.nvim_win_close, session.leftWin, true)
      session.leftWin = nil
    end
    vim.bo[session.right].modifiable = true
    vim.api.nvim_buf_set_lines(session.right, 0, -1, false, lines(item.content))
    vim.bo[session.right].modifiable = false
    return
  end
  if not session.leftWin or not vim.api.nvim_win_is_valid(session.leftWin) then
    vim.api.nvim_set_current_win(session.rightWin)
    vim.cmd('vsplit')
    session.leftWin = session.rightWin
    session.rightWin = vim.api.nvim_get_current_win()
    vim.api.nvim_win_set_buf(session.leftWin, session.left)
    vim.api.nvim_win_set_buf(session.rightWin, session.right)
  end
  for _, b in ipairs({ session.left, session.right }) do
    if vim.api.nvim_buf_is_valid(b) then vim.bo[b].modifiable = true end
  end
  vim.api.nvim_buf_set_lines(session.left, 0, -1, false, lines(item.before))
  vim.api.nvim_buf_set_lines(session.right, 0, -1, false, lines(item.after))
  vim.bo[session.left].modifiable = false
  vim.bo[session.right].modifiable = false
  vim.api.nvim_set_current_win(session.leftWin)
  vim.cmd('diffthis')
  vim.api.nvim_set_current_win(session.rightWin)
  vim.cmd('diffthis')
end

local function renderList(session)
  local result, items = {}, {}
  local partitions = { 'elements', 'metamodel', 'relationships', 'views' }
  for _, partition in ipairs(partitions) do
    local group = session.groups[partition] or {}
    result[#result + 1] = (session.expanded[partition] and 'v ' or '> ') .. partition .. '/'
    if session.expanded[partition] then
      for _, item in ipairs(group) do
        result[#result + 1] = '  ' .. item.path
        items[#items + 1] = item
      end
    end
  end
  result[#result + 1] = (session.expanded.plan and 'v ' or '> ') .. 'Plan'
  if session.expanded.plan then
    for _, item in ipairs(session.plans or {}) do
      result[#result + 1] = '  ' .. item.path
      items[#items + 1] = item
    end
  end
  vim.bo[session.list].modifiable = true
  vim.api.nvim_buf_set_lines(session.list, 0, -1, false, result)
  vim.bo[session.list].modifiable = false
  session.items = items
end

local function refresh(session, initial)
  session.generation = session.generation + 1
  local generation = session.generation
  local argv = vim.deepcopy(defaults.cli)
  vim.list_extend(argv, { 'show', session.change, '--review', '--json' })
  local callback = function(result)
    vim.schedule(function()
      if generation ~= session.generation or session.closed then return end
      local ok, data = pcall(vim.json.decode, result.stdout or '')
      if result.code ~= 0 or not ok or not data.valid then
        if initial then
          notify('Change review is invalid: ' .. session.change, vim.log.levels.ERROR)
          session.closed = true
          stop(session)
          if vim.api.nvim_tabpage_is_valid(session.tab) then pcall(vim.api.nvim_set_current_tabpage, session.tab); vim.cmd('tabclose!') end
          return
        end
        session.groups = { elements = {}, metamodel = {}, relationships = {}, views = {} }
        session.diagnostics = data and data.diagnostics or {}
        for _, b in ipairs({ session.left, session.right }) do
          if vim.api.nvim_buf_is_valid(b) then
            vim.bo[b].modifiable = true
            vim.api.nvim_buf_set_lines(b, 0, -1, false, { '' })
            vim.bo[b].modifiable = false
          end
        end
        if session.leftWin and vim.api.nvim_win_is_valid(session.leftWin) then
          pcall(vim.api.nvim_win_call, session.leftWin, function() vim.cmd('diffoff') end)
        end
        if session.rightWin and vim.api.nvim_win_is_valid(session.rightWin) then
          pcall(vim.api.nvim_win_call, session.rightWin, function() vim.cmd('diffoff') end)
        end
        renderList(session)
        notify('Change review became invalid: ' .. session.change, vim.log.levels.ERROR)
        return
      end
      local groups = { elements = {}, metamodel = {}, relationships = {}, views = {} }
      for _, source in ipairs(data.sources or {}) do
        local partition = source.path:match('^([^/]+)/')
        local before, after = {}, {}
        local seenBefore, seenAfter = {}, {}
        for _, entry in ipairs(source.entries) do
          if not seenBefore[entry.before] then before[#before + 1] = entry.before; seenBefore[entry.before] = true end
          if not seenAfter[entry.after] then after[#after + 1] = entry.after; seenAfter[entry.after] = true end
        end
        groups[partition][#groups[partition] + 1] = {
          path = source.path, source = vim.fs.joinpath(session.cwd, '.xirang', 'changes', session.change, source.path),
          before = table.concat(before, '\n\n'), after = table.concat(after, '\n\n'),
        }
      end
      session.groups, session.plans = groups, {}
      for _, plan in ipairs(data.plans or {}) do
        session.plans[#session.plans + 1] = {
          path = plan.path, source = vim.fs.joinpath(session.cwd, '.xirang', 'changes', session.change, plan.path),
          content = plan.content, plan = true,
        }
      end
      renderList(session)
      if #session.items > 0 then session.cursor = math.min(session.cursor, #session.items); selectedText(session) end
    end)
  end
  if defaults.runner then defaults.runner(argv, session.cwd, callback)
  else vim.system(argv, { cwd = session.cwd, text = true }, callback) end
end

local function sourceJump(session)
  local item = selected(session)
  if not item then return end
  vim.cmd('tabclose!')
  vim.cmd('edit ' .. vim.fn.fnameescape(item.source))
end

local function open(change)
  local cwd = defaults.cwd or vim.fn.getcwd()
  if not change then
    local argv = vim.deepcopy(defaults.cli)
    vim.list_extend(argv, { 'list', '--json' })
    local result = vim.system(argv, { cwd = cwd, text = true }):wait()
    local ok, data = pcall(vim.json.decode, result.stdout or '')
    if not ok or not data.changes or #data.changes == 0 then notify('No active Changes found.', vim.log.levels.WARN); return end
    vim.ui.select(data.changes, { prompt = 'Xirang Change', format_item = function(item) return item.name end }, function(item)
      if item then open(item.name) end
    end)
    return
  end
  vim.cmd('tabnew')
  local tab = vim.api.nvim_get_current_tabpage()
  vim.cmd('vsplit')
  local leftWin = vim.api.nvim_get_current_win()
  vim.cmd('wincmd h')
  local listWin = vim.api.nvim_get_current_win()
  local list = buf('xirang://' .. change .. '/files', '', false)
  vim.api.nvim_win_set_buf(listWin, list)
  vim.cmd('wincmd l')
  local left = buf('xirang://' .. change .. '/current', '', false)
  vim.api.nvim_win_set_buf(0, left)
  vim.cmd('vsplit')
  local rightWin = vim.api.nvim_get_current_win()
  local right = buf('xirang://' .. change .. '/expected', '', false)
  vim.api.nvim_win_set_buf(0, right)
  local session = {
    change = change, cwd = cwd, tab = tab, list = list, listWin = listWin, left = left, right = right,
    leftWin = leftWin, rightWin = rightWin, buffers = { list, left, right }, watchers = {},
    generation = 0, cursor = 1, groups = { elements = {}, metamodel = {}, relationships = {}, views = {} },
    expanded = { elements = true, metamodel = true, relationships = true, views = true, plan = true },
  }
  sessions[tab] = session
  local function map(key, action) vim.keymap.set('n', key, action, { buffer = list, silent = true }) end
  map('<Tab>', function() session.cursor = session.cursor % math.max(#session.items, 1) + 1; selectedText(session) end)
  map('<S-Tab>', function() session.cursor = (session.cursor - 2) % math.max(#session.items, 1) + 1; selectedText(session) end)
  map('<CR>', function()
    local row = vim.api.nvim_win_get_cursor(0)[1]
    local line = vim.api.nvim_buf_get_lines(list, row - 1, row, false)[1] or ''
    local group = line:match('^[>v] (.+)/$') or (line:match('^[>v] Plan$') and 'plan')
    if group then session.expanded[group] = not session.expanded[group]; renderList(session)
    else
      local item = selected(session)
      if item and item.source then selectedText(session) end
    end
  end)
  map('o', function() sourceJump(session) end)
  map('e', function() sourceJump(session) end)
  map('r', function() refresh(session, false) end)
  vim.api.nvim_create_autocmd('BufWipeout', { buffer = list, once = true, callback = function() session.closed = true; stop(session); sessions[tab] = nil end })
  local xirang = vim.fs.joinpath(cwd, '.xirang')
  local watchDirs = { vim.fs.joinpath(xirang, 'model'), vim.fs.joinpath(xirang, 'changes', change) }
  for _, base in ipairs({ watchDirs[1], watchDirs[2] }) do
    for _, partition in ipairs({ 'elements', 'metamodel', 'relationships', 'views' }) do
      watchDirs[#watchDirs + 1] = vim.fs.joinpath(base, partition)
    end
  end
  for _, dir in ipairs(watchDirs) do
    local stat = uv.fs_stat(dir)
    if stat and stat.type == 'directory' then
      local watcher = uv.new_fs_event()
      if watcher then
        local ok = pcall(watcher.start, watcher, dir, {}, function()
          vim.schedule(function() if not session.closed then refresh(session, false) end end)
        end)
        if ok then session.watchers[#session.watchers + 1] = watcher else watcher:close() end
      end
    end
  end
  refresh(session, true)
end

function M.setup(opts)
  opts = opts or {}
  if opts.cli then defaults.cli = opts.cli end
  defaults.cwd = opts.cwd
  defaults.runner = opts.runner
  vim.api.nvim_create_user_command('XirangReview', function(command) open(command.args ~= '' and command.args or nil) end, { nargs = '?' })
  vim.api.nvim_create_autocmd('BufWritePost', { callback = function(event)
    local path = vim.api.nvim_buf_get_name(event.buf)
    for _, session in pairs(sessions) do
      if path:find(vim.fs.joinpath(session.cwd, '.xirang', 'changes', session.change), 1, true)
        or path:find(vim.fs.joinpath(session.cwd, '.xirang', 'model'), 1, true) then refresh(session, false) end
    end
  end })
end

M._open = open
M._sourceJump = sourceJump
M._showSelected = selectedText
M._sessions = sessions
return M
