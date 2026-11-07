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
    { path = 'elements/other.md', before = '', after = 'other target\nline two\nline three\n', entries = {
      { entity = 'element-declaration', identity = 'other', operation = 'ADDED' },
    } },
    { path = 'elements/item.md', before = 'current\nsecond\nthird\n', after = state.after, entries = {
      { entity = 'element-declaration', identity = 'item', operation = 'MODIFIED' },
      { entity = 'section', identity = 'item#Contract', operation = 'MODIFIED' },
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
  assert(#session.items == 3)
  assert(#session.groups.elements == 2)
  local info = {}
  for _, win in ipairs(vim.fn.getwininfo()) do info[win.winid] = win.wincol end
  assert(info[session.listWin] < info[session.leftWin] and info[session.leftWin] < info[session.rightWin])
  assert(vim.wo[session.leftWin].winbar:find('NOW', 1, true))
  assert(vim.wo[session.rightWin].winbar:find('TARGET', 1, true))
  local listWidth = vim.api.nvim_win_get_width(session.listWin)
  local markerRows = vim.api.nvim_buf_get_lines(session.list, 0, -1, false)
  assert(markerRows[2] == ' + other.md')
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
  assert(vim.wo[session.leftWin].wrap and vim.wo[session.rightWin].wrap)
  assert(vim.bo[session.right].modifiable)
  assert(not vim.bo[session.left].modifiable)
  assert(table.concat(vim.api.nvim_buf_get_lines(session.left, 0, -1, false), '\n') == '')
  vim.api.nvim_win_set_cursor(session.rightWin, { 3, 0 })
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes('<Tab>', true, false, true), 'xt', false)
  assert(session.cursor == 2)
  assert(vim.api.nvim_win_get_cursor(session.rightWin)[1] == 1)
  assert(table.concat(vim.api.nvim_buf_get_lines(session.left, 0, -1, false), '\n') == 'current\nsecond\nthird\n')
  assert(not vim.bo[session.left].modifiable)
  vim.api.nvim_buf_set_lines(session.right, 0, -1, false, { 'edited target' })
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes('<Tab>', true, false, true), 'xt', false)
  assert(session.cursor == 3)
  assert(vim.api.nvim_win_get_cursor(session.rightWin)[1] == 1)
  vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes('<S-Tab>', true, false, true), 'xt', false)
  assert(session.cursor == 2)
  assert(table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n') == 'edited target')
  assert(vim.api.nvim_win_get_cursor(session.rightWin)[1] == 1)
  session.cursor = 3
  local item = session.items[3]
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
  assert(table.concat(vim.api.nvim_buf_get_lines(session.left, 0, -1, false), '\n') == '')
  assert(not vim.bo[session.left].modifiable)
  session.cursor = 2
  review._sourceJump(session)
  assert(vim.api.nvim_buf_get_name(vim.api.nvim_get_current_buf()) == source)
elseif mode == 'save' then
  launch()
  local session = current()
  session.cursor = 2
  review._showSelected(session)
  vim.api.nvim_set_current_win(session.rightWin)
  local originalTab = session.tab
  local originalRight = session.rightWin
  local width = vim.api.nvim_win_get_width(session.listWin)
  session.expanded.views = false
  vim.api.nvim_buf_set_lines(session.right, 0, -1, false, { 'edited target', 'second', 'third' })
  vim.api.nvim_win_set_cursor(session.rightWin, { 2, 3 })
  local submitted
  review.setup({ cwd = root, runner = function(argv, _, callback, input)
    if argv[2] == 'delta' then
      submitted = input
      assert(argv[3] == 'writeback' and argv[4] == 'demo')
      assert(argv[5] == '--source' and argv[6] == 'elements/item.md')
      state.after = input
      callback({ code = 0, stdout = vim.json.encode({ ok = true, ignoredChanges = { 'identity' } }) })
    else callback({ code = 0, stdout = payload() }) end
  end })
  vim.cmd('write')
  waitFor(function() return submitted and not vim.bo[session.right].modified end)
  assert(submitted == 'edited target\nsecond\nthird')
  assert(session.tab == originalTab and session.rightWin == originalRight)
  assert(session.items[session.cursor].path == 'elements/item.md')
  assert(vim.api.nvim_get_current_win() == originalRight)
  assert(vim.api.nvim_win_get_cursor(originalRight)[1] == 2)
  assert(vim.api.nvim_win_get_cursor(originalRight)[2] == 3)
  assert(vim.api.nvim_win_get_width(session.listWin) == width)
  assert(session.expanded.views == false)
  assert(vim.wo[originalRight].statusline:find('identity', 1, true))
  assert(not vim.bo[session.left].modifiable and vim.bo[session.right].modifiable)
  vim.api.nvim_buf_set_lines(session.right, 0, -1, false, { 'invalid draft' })
  review.setup({ cwd = root, runner = function(_, _, callback)
    callback({ code = 1, stdout = vim.json.encode({ ok = false, message = 'invalid target' }) })
  end })
  vim.cmd('write')
  waitFor(function() return session.saveError ~= nil end)
  assert(table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n') == 'invalid draft')
  assert(vim.bo[session.right].modified)
elseif mode == 'save-race' then
  launch()
  local session = current()
  session.cursor = 2
  review._showSelected(session)
  vim.api.nvim_set_current_win(session.rightWin)
  local saves = {}
  review.setup({ cwd = root, runner = function(argv, _, callback, input)
    if argv[2] == 'delta' then saves[#saves + 1] = { callback = callback, input = input }
    else callback({ code = 0, stdout = payload() }) end
  end })
  vim.api.nvim_buf_set_lines(session.right, 0, -1, false, { 'first save' })
  vim.cmd('write')
  assert(#saves == 1)
  vim.api.nvim_buf_set_lines(session.right, 0, -1, false, { 'newer draft' })
  state.after = saves[1].input
  saves[1].callback({ code = 0, stdout = vim.json.encode({ ok = true }) })
  waitFor(function() return not session.saving and session.items[session.cursor].after == 'first save' end)
  assert(table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n') == 'newer draft')
  assert(vim.bo[session.right].modified)
  vim.cmd('write')
  vim.api.nvim_buf_set_lines(session.right, 0, -1, false, { 'last save' })
  vim.cmd('write')
  saves[2].callback({ code = 0, stdout = vim.json.encode({ ok = true }) })
  waitFor(function() return #saves == 3 end)
  assert(saves[3].input == 'last save')
  state.after = saves[3].input
  saves[3].callback({ code = 0, stdout = vim.json.encode({ ok = true }) })
  waitFor(function() return not session.saving and not vim.bo[session.right].modified end)
  assert(table.concat(vim.api.nvim_buf_get_lines(session.right, 0, -1, false), '\n') == 'last save')
elseif mode == 'context' then
  state.after = string.rep('target line\n', 100)
  launch()
  local session = current()
  session.cursor = 2
  review._showSelected(session)
  vim.api.nvim_set_current_win(session.rightWin)
  vim.wo[session.rightWin].scrollbind = false
  vim.wo[session.rightWin].cursorbind = false
  vim.api.nvim_win_set_cursor(session.rightWin, { 70, 4 })
  vim.fn.winrestview({ lnum = 70, col = 4, topline = 65 })
  local before = vim.fn.winsaveview()
  local focus = vim.api.nvim_get_current_win()
  session.expanded.relationships = false
  local calls = state.calls
  vim.api.nvim_exec_autocmds('BufWritePost', { buffer = vim.fn.bufadd(source) })
  waitFor(function() return state.calls > calls and session.generation >= 2 end)
  vim.wait(50)
  local after = vim.fn.winsaveview()
  assert(vim.api.nvim_get_current_win() == focus)
  assert(after.lnum == before.lnum and after.col == before.col and after.topline == before.topline)
  assert(session.expanded.relationships == false)
  state.after = 'short'
  local pending
  review.setup({ cwd = root, runner = function(_, _, callback) pending = callback end })
  vim.api.nvim_exec_autocmds('BufWritePost', { buffer = vim.fn.bufadd(source) })
  pending({ code = 0, stdout = payload() })
  waitFor(function() return session.items[session.cursor].after == 'short' end)
  assert(vim.api.nvim_win_get_cursor(session.rightWin)[1] == 1)
  assert(vim.api.nvim_win_get_cursor(session.rightWin)[2] <= 4)
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
  session.cursor = 2
  review._showSelected(session)
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
      { path = 'elements/item.md', before = 'current\n', after = value, entries = {{ entity = 'element-declaration', identity = 'item' }} },
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
  assert(session.groups.elements[2].source == vim.fs.joinpath(root, '.xirang', 'changes', 'demo', 'elements/item.md'))
  assert(#session.watchers == 10)
  vim.cmd('tabclose!')
  vim.wait(20)
  assert(session.closed)
  assert(#session.watchers == 0)
else
  error('unknown test mode: ' .. mode)
end
vim.cmd('qa!')
