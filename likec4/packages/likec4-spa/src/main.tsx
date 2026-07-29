import { XirangContractLoaderProvider } from '@likec4/diagram'
import { likec4hot } from 'likec4:rpc'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HttpContractLoader } from './xirang/HttpContractLoader'
import { Routes } from './router'

const contractLoader = new HttpContractLoader(fetch, likec4hot)

createRoot(document.getElementById('likec4-root')!).render(
  <StrictMode>
    <XirangContractLoaderProvider loader={contractLoader}>
      <Routes />
    </XirangContractLoaderProvider>
  </StrictMode>,
)
