import { createContext, type PropsWithChildren, useContext } from 'react'

export interface OpsxSpecContent {
  path: string
  md: string
}

export interface OpsxSpecLoader {
  list(project: string, element: string, signal: AbortSignal): Promise<readonly string[]>
  load(project: string, element: string, path: string, signal: AbortSignal): Promise<OpsxSpecContent>
  subscribe?(listener: (path: string) => void): () => void
}

const OpsxSpecLoaderContext = createContext<OpsxSpecLoader | null>(null)

export function OpsxSpecLoaderProvider({
  loader,
  children,
}: PropsWithChildren<{ loader: OpsxSpecLoader }>) {
  return (
    <OpsxSpecLoaderContext.Provider value={loader}>
      {children}
    </OpsxSpecLoaderContext.Provider>
  )
}

export function useOpsxSpecLoader(): OpsxSpecLoader | null {
  return useContext(OpsxSpecLoaderContext)
}
