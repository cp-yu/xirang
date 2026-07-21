import { OpsxSpecLoaderProvider } from '@likec4/diagram'
import { likec4hot } from 'likec4:rpc'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HttpSpecLoader } from './opsx/HttpSpecLoader'
import { Routes } from './router'

const specLoader = new HttpSpecLoader(fetch, likec4hot)

createRoot(document.getElementById('likec4-root')!).render(
  <StrictMode>
    <OpsxSpecLoaderProvider loader={specLoader}>
      <Routes />
    </OpsxSpecLoaderProvider>
  </StrictMode>,
)
