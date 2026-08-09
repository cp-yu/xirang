import { css } from '@likec4/styles/css'

export const svgContainer = css({
  minWidth: 300,
  '& svg': {
    width: '100%',
    height: 'auto',
  },
})

export const cssScrollArea = css({
  height: '100%',
  '& .mantine-ScrollArea-viewport': {
    minHeight: '100%',
  },
  '& .mantine-ScrollArea-viewport > div': {
    minHeight: '100%',
    height: '100%',
  },
})

export const cssCodeBlock = css({
  minHeight: '100%',
})

export const viewWithTopPadding = css({
  height: '100%',
  // Mobile: the floating navigation panel is a full-width bar at the top, so the
  // page controls must clear it. Desktop: the panel floats at the top-right and
  // does not overlap the content.
  paddingTop: '[40px]',
  md: {
    paddingTop: '0',
  },
})
