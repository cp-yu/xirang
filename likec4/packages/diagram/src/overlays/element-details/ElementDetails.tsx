import type { Fqn } from '@likec4/core/types'
import { useSelector } from '@xstate/react'
import { shallowEqual } from 'fast-equals'
import type { ElementDetailsActorRef, ElementDetailsSnapshot } from './actor'
import { ElementDetailsActorContext } from './actorContext'
import { ElementDetailsCard } from './ElementDetailsCard'
import { useXirangViewSources, xirangViewSourceRevision } from '../../xirang/ContractLoaderContext'

export type ElementDetailsProps = {
  actorRef: ElementDetailsActorRef
  onClose: () => void
}

const selector = (s: ElementDetailsSnapshot) => ({
  viewId: s.context.currentView.id,
  fromNode: s.context.initiatedFrom.node,
  rectFromNode: s.context.initiatedFrom.clientRect,
  fqn: s.context.subject,
  identity: s.context.identity,
  contract: s.context.contract,
})

export function ElementDetails({
  actorRef,
  onClose,
}: ElementDetailsProps) {
  const props = useSelector(
    actorRef,
    selector,
    shallowEqual,
  )
  const { selected } = useXirangViewSources()
  const revision = `${selected.id}:${xirangViewSourceRevision(selected)}`
  return (
    <ElementDetailsActorContext.Provider value={actorRef}>
      <ElementDetailsCard
        onClose={onClose}
        onContractNavigate={(identity, fragment) => actorRef.send({ type: 'open.contract', subject: identity as Fqn, identity, revision, ...(fragment ? { fragment } : {}) })}
        {...props} />
    </ElementDetailsActorContext.Provider>
  )
}
