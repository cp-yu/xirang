local M = {}
local uv = vim.uv or vim.loop
local sessions = {}
local bufferSerial = 0
local defaults = { cli = { 'xirang' }, cwd = nil, runner = nil }
local partitions = { 'elements', 'metamodel', 'relationships', 'views' }
local highlightGroups = {
  XirangReviewSelected = { link = 'CursorLine', default = true },
  XirangReviewAdded = { link = 'DiagnosticOk', default = true },
  XirangReviewModified = { link = 'DiagnosticWarn', default = true },
  XirangReviewRemoved = { link = 'DiagnosticError', default = true },
}

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
  bufferSerial = bufferSerial + 1
  local b = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_name(b, name .. '#' .. bufferSerial)
  vim.api.nvim_buf_set_lines(b, 0, -1, false, lines(content or ''))
  vim.bo[b].buftype = 'nofile'
  vim.bo[b].bufhidden = 'hide'
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
  return session.items and session.items[session.cursor]
end

local function saveTargetDraft(session)
  local item = selected(session)
  if not item or item.plan or not vim.api.nvim_buf_is_valid(session.right) then return end
  if vim.bo[session.right].modifiable then
    local text = table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n')
    session.drafts[item.path] = text ~= item.after and text or nil
  end
end

local function setBufferText(buffer, text)
  vim.bo[buffer].modifiable = true
  vim.api.nvim_buf_set_lines(buffer, 0, -1, false, lines(text))
  vim.bo[buffer].modifiable = false
  vim.bo[buffer].modified = false
end

local function restoreListWidth(session)
  if session.listWin and vim.api.nvim_win_is_valid(session.listWin) then
    pcall(vim.api.nvim_win_set_width, session.listWin, session.listWidth)
  end
end

local function showPlan(session, item)
  if session.rightWin and vim.api.nvim_win_is_valid(session.rightWin) then
    pcall(vim.api.nvim_win_call, session.rightWin, function() vim.cmd('diffoff') end)
  end
  if session.leftWin and vim.api.nvim_win_is_valid(session.leftWin) then
    pcall(vim.api.nvim_win_close, session.leftWin, true)
    session.leftWin = nil
    restoreListWidth(session)
  end
  setBufferText(session.right, item.content)
  vim.wo[session.rightWin].winbar = ' PLAN | Change plan'
end

local function ensureDiffWindows(session)
  if session.leftWin and vim.api.nvim_win_is_valid(session.leftWin) then return end
  vim.api.nvim_set_current_win(session.rightWin)
  vim.cmd('rightbelow vsplit')
  session.leftWin = session.rightWin
  session.rightWin = vim.api.nvim_get_current_win()
  restoreListWidth(session)
  vim.api.nvim_win_set_buf(session.leftWin, session.left)
  vim.api.nvim_win_set_buf(session.rightWin, session.right)
end

local function showDelta(session, item)
  ensureDiffWindows(session)
  for _, win in ipairs({ session.leftWin, session.rightWin }) do
    pcall(vim.api.nvim_win_call, win, function() vim.cmd('diffoff') end)
  end
  local target = session.drafts[item.path] or item.after
  setBufferText(session.left, item.before)
  setBufferText(session.right, target)
  vim.bo[session.right].modifiable = true
  vim.bo[session.right].modified = target ~= item.after
  for _, win in ipairs({ session.leftWin, session.rightWin }) do
    vim.wo[win].wrap = true
  end
  vim.api.nvim_set_current_win(session.leftWin)
  vim.wo[session.leftWin].winbar = ' NOW | Current model'
  vim.cmd('diffthis')
  vim.wo[session.leftWin].wrap = true
  vim.api.nvim_win_set_cursor(session.leftWin, { 1, 0 })
  vim.api.nvim_set_current_win(session.rightWin)
  vim.wo[session.rightWin].winbar = ' TARGET | Expected model'
  vim.cmd('diffthis')
  vim.wo[session.rightWin].wrap = true
  vim.api.nvim_win_set_cursor(session.leftWin, { 1, 0 })
  vim.api.nvim_win_set_cursor(session.rightWin, { 1, 0 })
  vim.api.nvim_set_current_win(session.listWin)
end

local function selectedText(session)
  local item = selected(session)
  if not item then return end
  if item.plan then showPlan(session, item) else showDelta(session, item) end
end

local function setSelectedRow(session, row)
  if session.selectedMark then
    pcall(vim.api.nvim_buf_del_extmark, session.list, session.listNs, session.selectedMark)
  end
  session.selectedMark = vim.api.nvim_buf_set_extmark(session.list, session.listNs, row - 1, 0,
    { line_hl_group = 'XirangReviewSelected', priority = 150 })
  vim.api.nvim_win_set_cursor(session.listWin, { row, 0 })
end

local function selectRow(session, direction)
  if #session.items == 0 then return end
  local nextItem = ((session.cursor - 1 + direction) % #session.items) + 1
  local target
  for line, index in pairs(session.itemRows) do if index == nextItem then target = line; break end end
  if not target then return end
  local focus = vim.api.nvim_get_current_win()
  saveTargetDraft(session)
  session.cursor = nextItem
  setSelectedRow(session, target)
  selectedText(session)
  if vim.api.nvim_win_is_valid(focus) then vim.api.nvim_set_current_win(focus) end
end

local function operationForEntries(entries)
  local operation
  for _, entry in ipairs(entries) do
    if operation and operation ~= entry.operation then return 'MIXED' end
    operation = entry.operation
  end
  return operation or 'MIXED'
end

local operationMarkers = {
  ADDED = { '+', 'XirangReviewAdded' },
  MODIFIED = { '~', 'XirangReviewModified' },
  REMOVED = { '-', 'XirangReviewRemoved' },
  MIXED = { '*', 'Comment' },
}

local function markerFor(item)
  local marker = operationMarkers[item.operation]
  return marker and marker[1] or ' ', marker and marker[2] or nil
end

local function renderList(session)
  local result, items, itemRows, markerMarks = {}, {}, {}, {}
  local selectedNs = vim.api.nvim_create_namespace('XirangReviewSelected')
  vim.api.nvim_buf_clear_namespace(session.list, selectedNs, 0, -1)
  session.listNs = selectedNs
  local function addEntry(item)
    local marker, markerHighlight = markerFor(item)
    local name = item.path:gsub('^[^/]+/', '', 1)
    result[#result + 1] = item.plan and (' ' .. name) or (' ' .. marker .. ' ' .. name)
    items[#items + 1] = item
    itemRows[#result] = #items
    if markerHighlight then markerMarks[#markerMarks + 1] = { row = #result - 1, hl = markerHighlight } end
  end
  for _, partition in ipairs(partitions) do
    local group = session.groups[partition] or {}
    result[#result + 1] = (session.expanded[partition] and 'v ' or '> ') .. partition .. '/'
    if session.expanded[partition] then
      for _, item in ipairs(group) do
        addEntry(item)
      end
    end
  end
  result[#result + 1] = (session.expanded.plan and 'v ' or '> ') .. 'Plan'
  if session.expanded.plan then
    for _, item in ipairs(session.plans or {}) do
      addEntry(item)
    end
  end
  vim.bo[session.list].modifiable = true
  vim.api.nvim_buf_set_lines(session.list, 0, -1, false, result)
  for _, marker in ipairs(markerMarks) do
    vim.api.nvim_buf_set_extmark(session.list, selectedNs, marker.row, 1, { end_col = 2, hl_group = marker.hl })
  end
  vim.bo[session.list].modifiable = false
  session.items, session.itemRows = items, itemRows
  if #items > 0 then
    local row
    for line, index in pairs(itemRows) do if index == session.cursor then row = line; break end end
    if not row then
      for line, index in pairs(itemRows) do if index == 1 then row = line; break end end
      session.cursor = 1
    end
    if row and vim.api.nvim_win_is_valid(session.listWin) then setSelectedRow(session, row) end
  end
end

local function captureView(session)
  local view = { focus = vim.api.nvim_get_current_win(), windows = {}, path = selected(session) and selected(session).path }
  for _, win in ipairs({ session.listWin, session.rightWin, session.leftWin }) do
    if win and vim.api.nvim_win_is_valid(win) then
      view.windows[win] = vim.api.nvim_win_call(win, vim.fn.winsaveview)
    end
  end
  session.listWidth = vim.api.nvim_win_get_width(session.listWin)
  return view
end

local function restoreView(view)
  for win, state in pairs(view.windows) do
    if vim.api.nvim_win_is_valid(win) then
      local buffer = vim.api.nvim_win_get_buf(win)
      state.lnum = math.min(state.lnum, vim.api.nvim_buf_line_count(buffer))
      local line = vim.api.nvim_buf_get_lines(buffer, state.lnum - 1, state.lnum, false)[1] or ''
      state.col = math.min(state.col, math.max(0, #line - 1))
      vim.api.nvim_win_call(win, function() vim.fn.winrestview(state) end)
    end
  end
  if vim.api.nvim_win_is_valid(view.focus) then vim.api.nvim_set_current_win(view.focus) end
end

local function refresh(session, initial)
  if session.saving then return end
  saveTargetDraft(session)
  session.generation = session.generation + 1
  local generation = session.generation
  local argv = vim.deepcopy(defaults.cli)
  vim.list_extend(argv, { 'show', session.change, '--review', '--json' })
  local callback = function(result)
    vim.schedule(function()
      if generation ~= session.generation or session.closed then return end
      saveTargetDraft(session)
      local view = not initial and captureView(session) or nil
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
        groups[partition][#groups[partition] + 1] = {
          path = source.path, source = vim.fs.joinpath(session.cwd, '.xirang', 'changes', session.change, source.path),
          before = source.before, after = source.after,
          operation = operationForEntries(source.entries),
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
      if view then
        for index, item in ipairs(session.items) do
          if item.path == view.path then session.cursor = index; break end
        end
        renderList(session)
      end
      if #session.items > 0 then session.cursor = math.min(session.cursor, #session.items); selectedText(session) end
      if view then restoreView(view) end
    end)
  end
  if defaults.runner then defaults.runner(argv, session.cwd, callback)
  else vim.system(argv, { cwd = session.cwd, text = true }, callback) end
end

local function save(session, request)
  if not request then
    local item = selected(session)
    if not item or item.plan then return end
    saveTargetDraft(session)
    request = { item = item, path = item.path, text = table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n') }
  end
  if session.saving then
    session.saveQueue[#session.saveQueue + 1] = request
    return
  end
  local item, path, text = request.item, request.path, request.text
  session.saving = true
  session.saveError = nil
  session.generation = session.generation + 1
  local argv = vim.deepcopy(defaults.cli)
  vim.list_extend(argv, { 'delta', 'writeback', session.change, '--source', path, '--json' })
  local callback = function(result)
    vim.schedule(function()
      if session.closed then return end
      saveTargetDraft(session)
      session.saving = false
      local ok, data = pcall(vim.json.decode, result.stdout or '')
      if result.code ~= 0 or not ok or not data.ok then
        session.saveError = ok and data.message or result.stderr or '保存失败'
        vim.wo[session.rightWin].statusline = ' Xirang | 保存失败'
        notify(session.saveError, vim.log.levels.ERROR)
        if #session.saveQueue > 0 then save(session, table.remove(session.saveQueue, 1)) end
        return
      end
      if session.drafts[path] == text then session.drafts[path] = nil end
      -- 避免切回源文件或刷新时把已保存文本重新当作草稿。
      item.after = text
      local ignored = data.ignoredChanges or {}
      local message = #ignored > 0 and ('已忽略不支持的修改: ' .. table.concat(ignored, ', ')) or '已保存'
      vim.wo[session.rightWin].statusline = (' Xirang | ' .. message):gsub('%%', '%%%%')
      if #session.saveQueue > 0 then save(session, table.remove(session.saveQueue, 1))
      else refresh(session, false) end
    end)
  end
  if defaults.runner then defaults.runner(argv, session.cwd, callback, text)
  else vim.system(argv, { cwd = session.cwd, text = true, stdin = text }, callback) end
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
  vim.cmd('rightbelow vsplit')
  local leftWin = vim.api.nvim_get_current_win()
  vim.cmd('wincmd h')
  local listWin = vim.api.nvim_get_current_win()
  local list = buf('xirang://' .. change .. '/files', '', false)
  vim.bo[list].bufhidden = 'wipe'
  vim.api.nvim_win_set_buf(listWin, list)
  vim.wo[listWin].wrap = true
  vim.wo[listWin].cursorline = true
  vim.api.nvim_win_set_width(listWin, math.min(34, math.max(24, math.floor(vim.o.columns * 0.24))))
  vim.cmd('wincmd l')
  local leftWin = vim.api.nvim_get_current_win()
  local left = buf('xirang://' .. change .. '/current', '', false)
  vim.api.nvim_win_set_buf(leftWin, left)
  vim.wo[leftWin].wrap = true
  vim.cmd('rightbelow vsplit')
  local rightWin = vim.api.nvim_get_current_win()
  local right = buf('xirang://' .. change .. '/expected', '', false)
  vim.api.nvim_win_set_buf(0, right)
  vim.wo[rightWin].wrap = true
  local session = {
    change = change, cwd = cwd, tab = tab, list = list, listWin = listWin, left = left, right = right,
    leftWin = leftWin, rightWin = rightWin, buffers = { list, left, right }, watchers = {},
    generation = 0, cursor = 1, drafts = {}, saveQueue = {}, listWidth = vim.api.nvim_win_get_width(listWin), groups = { elements = {}, metamodel = {}, relationships = {}, views = {} },
    expanded = { elements = true, metamodel = true, relationships = true, views = true, plan = true },
  }
  sessions[tab] = session
  vim.bo[right].buftype = 'acwrite'
  vim.api.nvim_create_autocmd('BufWriteCmd', { buffer = right, callback = function() save(session) end })
  local function map(key, action)
    for _, target in ipairs({ list, left, right }) do
      vim.keymap.set('n', key, action, { buffer = target, silent = true })
    end
  end
  for _, key in ipairs({ 'j', '<Down>' }) do
    vim.keymap.set('n', key, function() selectRow(session, 1) end, { buffer = list, silent = true })
  end
  for _, key in ipairs({ 'k', '<Up>' }) do
    vim.keymap.set('n', key, function() selectRow(session, -1) end, { buffer = list, silent = true })
  end
  map('<Tab>', function() selectRow(session, 1) end)
  map('<S-Tab>', function() selectRow(session, -1) end)
  map('<CR>', function()
    local row = vim.api.nvim_win_get_cursor(0)[1]
    local line = vim.api.nvim_buf_get_lines(list, row - 1, row, false)[1] or ''
    local group = line:match('^[>v] (.+)/$') or (line:match('^[>v] Plan$') and 'plan')
    if group then
      session.expanded[group] = not session.expanded[group]
      renderList(session)
      selectRow(session, 1)
    elseif session.itemRows[row] then
      saveTargetDraft(session)
      session.cursor = session.itemRows[row]
      selectedText(session)
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

function M.closeCurrent()
  local session = sessions[vim.api.nvim_get_current_tabpage()]
  if not session then return false end
  vim.cmd('tabclose!')
  return true
end

function M.setup(opts)
  opts = opts or {}
  for name, definition in pairs(highlightGroups) do vim.api.nvim_set_hl(0, name, definition) end
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
