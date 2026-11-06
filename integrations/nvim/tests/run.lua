local mode = vim.v.argv[#vim.v.argv] or 'list'
local root = vim.fn.tempname()
vim.fn.mkdir(root .. '/.xirang/model/elements', 'p')
vim.fn.mkdir(root .. '/.xirang/model/metamodel', 'p')
vim.fn.mkdir(root .. '/.xirang/model/relationships', 'p')
vim.fn.mkdir(root .. '/.xirang/model/views', 'p')
vim.fn.mkdir(root .. '/.xirang/changes/demo/elements', 'p')
vim.fn.mkdir(root .. '/.xirang/changes/demo/metamodel', 'p')
vim.fn.mkdir(root .. '/.xirang/changes/demo/relationships', 'p')
vim.fn.mkdir(root .. '/.xirang/changes/demo/views', 'p')
local source = root .. '/.xirang/changes/demo/elements/item.md'
local handle = io.open(source, 'w'); handle:write('delta'); handle:close()
local state = { valid = true, after = 'target\nsecond\nthird\n', pending = {}, calls = 0 }
local review = dofile('integrations/nvim/lua/xirang/review.lua')
local function payload()
  return vim.json.encode({ valid = state.valid, diagnostics = {}, sources = state.valid and {
    { path = 'elements/item.md', entries = {
      { entity = 'element-declaration', identity = 'item', operation = 'MODIFIED', before = 'current\nsecond\nthird\n', after = state.after },
      { entity = 'section', identity = 'item#Contract', operation = 'MODIFIED', before = 'current\nsecond\nthird\n', after = state.after },
    } },
  } or {}, plans = state.valid and {{ path = 'design.md', content = 'Plan text\n' }} or {} })
end
review.setup({ cwd = root, runner = function(_, _, callback)
  state.calls = state.calls + 1
  state.pending[#state.pending + 1] = function() callback({ code = 0, stdout = payload() }) end
  state.pending[#state.pending]()
end })
local function waitFor(predicate)
  assert(vim.wait(3000, predicate, 10), 'timed out waiting for async review update')
end
local function current()
  return review._sessions[vim.api.nvim_get_current_tabpage()]
end
local function launch()
  vim.cmd('XirangReview demo')
  waitFor(function() return current() and current().items and #current().items > 0 end)
end
local function assertContains(text, needle)
  assert(text:find(needle, 1, true), 'missing: ' .. needle .. '\n' .. text)
end

if mode == 'list' then
  vim.fn.setqflist({ { filename = source, lnum = 1, text = 'untouched' } })
  launch()
  local session = current()
  local text = table.concat(vim.api.nvim_buf_get_lines(session.list, 0, -1, false), '\n')
  assertContains(text, 'elements/')
  assertContains(text, 'metamodel/')
  assertContains(text, 'relationships/')
  assertContains(text, 'views/')
  assertContains(text, 'item.md')
  assertContains(text, '~ item.md')
  assertContains(text, ' Plan')
  assert(#session.items == 2)
  assert(#session.groups.elements == 1)
  local info = {}
  for _, win in ipairs(vim.fn.getwininfo()) do info[win.winid] = win.wincol end
  assert(info[session.listWin] < info[session.leftWin] and info[session.leftWin] < info[session.rightWin])
  assert(vim.wo[session.leftWin].winbar:find('NOW', 1, true))
  assert(vim.wo[session.rightWin].winbar:find('TARGET', 1, true))
  local listWidth = vim.api.nvim_win_get_width(session.listWin)
  local markerRows = vim.api.nvim_buf_get_lines(session.list, 0, -1, false)
  assert(markerRows[2] == ' ~ item.md')
  vim.api.nvim_set_current_win(session.listWin)
  vim.api.nvim_win_set_cursor(session.listWin, { 1, 0 })
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes('<CR>', true, false, true), 'xt', false)
  assert(not table.concat(vim.api.nvim_buf_get_lines(session.list, 0, -1, false), '\n'):find('item.md', 1, true))
  vim.api.nvim_win_set_cursor(session.listWin, { 1, 0 })
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes('<CR>', true, false, true), 'xt', false)
  assert(table.concat(vim.api.nvim_buf_get_lines(session.list, 0, -1, false), '\n'):find('item.md', 1, true))
  session.cursor = 1
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes('<Tab>', true, false, true), 'xt', false)
  assert(session.cursor == 2)
  assert(session.cursor == 2)
  local before = #vim.fn.getqflist()
  assert(before == 1 and vim.fn.getqflist()[1].text == 'untouched')
elseif mode == 'compare' then
  launch()
  local session = current()
  local listWidth = vim.api.nvim_win_get_width(session.listWin)
  local wins = vim.fn.getwininfo()
  local cols = {}
  for _, win in ipairs(wins) do cols[win.winid] = win.wincol end
  assert(cols[session.listWin] < cols[session.leftWin] and cols[session.leftWin] < cols[session.rightWin])
  local diffJMapping = vim.api.nvim_buf_call(session.right, function() return vim.fn.maparg('j', 'n') end)
  assert(diffJMapping == '')
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes('<Tab>', true, false, true), 'xt', false)
  assert(session.cursor == 2)
  local before = #vim.fn.getqflist()
  local item = session.items[session.cursor]
  assert(item.plan and item.content == 'Plan text\n')
  review._showSelected(session)
  assert(#vim.api.nvim_tabpage_list_wins(session.tab) == 2)
  assert(not vim.wo[session.rightWin].diff)
  assert(vim.api.nvim_win_get_width(session.listWin) == listWidth)
  assert(table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n'):find('Plan text', 1, true))
  session.cursor = 1
  review._showSelected(session)
  assert(vim.api.nvim_win_get_width(session.listWin) == listWidth)
  assert(vim.wo[session.leftWin].diff and vim.wo[session.rightWin].diff)
  review._sourceJump(session)
  assert(vim.api.nvim_buf_get_name(vim.api.nvim_get_current_buf()) == source)
elseif mode == 'refresh' then
  state.valid = false
  local priorTab = vim.api.nvim_get_current_tabpage()
  vim.cmd('XirangReview demo')
  waitFor(function()
    return vim.api.nvim_get_current_tabpage() == priorTab and next(review._sessions) == nil
  end)
  assert(review._sessions[priorTab] == nil)
  state.valid = true
  launch()
  local session = current()
  local initialCalls = state.calls
  local sourceBuf = vim.fn.bufadd(source)
  state.after = 'new target\n'
  local output = io.open(source, 'w'); output:write('external change'); output:close()
  waitFor(function() return state.calls > initialCalls end)
  local modelSource = root .. '/.xirang/model/elements/root.md'
  local modelFile = io.open(modelSource, 'w'); modelFile:write('external model change'); modelFile:close()
  waitFor(function() return state.calls > initialCalls + 1 end)
  vim.api.nvim_exec_autocmds('BufWritePost', { buffer = sourceBuf })
  waitFor(function() return table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n'):find('new target', 1, true) ~= nil end)
  state.valid = false
  vim.api.nvim_exec_autocmds('BufWritePost', { buffer = sourceBuf })
  waitFor(function() return #session.items == 1 and session.items[1].plan end)
  assert(not table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n'):find('new target', 1, true))
  assert(session.items[1].content == 'Plan text\n')
  local callbacks = {}
  review.setup({ cwd = root, runner = function(_, _, callback) callbacks[#callbacks + 1] = callback end })
  vim.api.nvim_exec_autocmds('BufWritePost', { buffer = sourceBuf })
  vim.api.nvim_exec_autocmds('BufWritePost', { buffer = sourceBuf })
  assert(#callbacks >= 2)
  local function response(value)
    return vim.json.encode({ valid = true, sources = {
      { path = 'elements/item.md', entries = {{ entity = 'element-declaration', identity = 'item', before = 'current\n', after = value }} },
    }, plans = {} })
  end
  callbacks[#callbacks]({ code = 0, stdout = response('fresh result\n') })
  callbacks[#callbacks - 1]({ code = 0, stdout = response('stale result\n') })
  vim.wait(30)
  assert(table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n'):find('fresh result', 1, true))
  assert(not table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n'):find('stale result', 1, true))
  assert(session.generation >= 4)
elseif mode == 'close' then
  launch()
  local session = current()
  local reviewTab = session.tab
  assert(review.closeCurrent())
  waitFor(function() return session.closed and review._sessions[reviewTab] == nil end)
  local ordinaryTab = vim.api.nvim_get_current_tabpage()
  local tabCount = #vim.api.nvim_list_tabpages()
  assert(not review.closeCurrent())
  assert(vim.api.nvim_get_current_tabpage() == ordinaryTab)
  assert(#vim.api.nvim_list_tabpages() == tabCount)
elseif mode == 'windows-paths' then
  vim.cmd('tabnew')
  launch()
  local session = current()
  assert(session.cwd == root)
  assert(session.groups.elements[1].source == vim.fs.joinpath(root, '.xirang', 'changes', 'demo', 'elements/item.md'))
  assert(#session.watchers == 10)
  vim.cmd('tabclose!')
  vim.wait(20)
  assert(session.closed)
  assert(#session.watchers == 0)
else
  error('unknown test mode: ' .. mode)
end
vim.cmd('qa!')
