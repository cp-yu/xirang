import { XirangSpecLoaderProvider } from '@likec4/diagram'
import { likec4hot } from 'likec4:rpc'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HttpSpecLoader } from './xirang/HttpSpecLoader'
import { Routes } from './router'

const specLoader = new HttpSpecLoader(fetch, likec4hot)
const initialManifest = await specLoader.variants(new AbortController().signal).catch(() => undefined)

createRoot(document.getElementById('likec4-root')!).render(
  <StrictMode>
    <XirangSpecLoaderProvider loader={specLoader} {...(initialManifest ? { initialManifest } : {})}>
      <Routes />
    </XirangSpecLoaderProvider>
  </StrictMode>,
)
