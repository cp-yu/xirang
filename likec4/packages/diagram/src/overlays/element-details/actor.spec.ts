import { scalar, type DiagramView } from '@likec4/core/types'
import { createActor } from 'xstate'
import { describe, expect, it } from 'vitest'
import { elementDetailsLogic } from './actor'

describe('Contract details navigation', () => {
  it('rebinds Relationships to the target even before its browser is initialized', () => {
    const details = createActor(elementDetailsLogic, {
      input: { subject: scalar.Fqn('root.source'), currentView: { id: scalar.ViewId('full-model') } as DiagramView },
    }).start()
    try {
      const child = () => details.getSnapshot().children[`${details.id}-relationships`]!
      expect(child().getSnapshot().context.subject).toBe('root.source')
      const originalChild = child()
      details.send({ type: 'open.contract', subject: scalar.Fqn('root'), identity: 'project.root', revision: 'v1' })
      expect(details.getSnapshot().context.identity).toBe('project.root')
      expect(child().getSnapshot().context.subject).toBe('root')
      expect(originalChild.getSnapshot().status).toBe('stopped')
      details.send({ type: 'open.contract', subject: scalar.Fqn('root.other'), identity: 'other.id', revision: 'v1' })
      expect(child().getSnapshot().context.subject).toBe('root.other')
      details.send({ type: 'open.contract', subject: null, identity: 'projection.only', revision: 'v1' })
      expect(details.getSnapshot().context.identity).toBe('projection.only')
      expect(child()).toBeUndefined()
      details.send({ type: 'open.contract', subject: scalar.Fqn('root'), identity: 'project.root', revision: 'v2' })
      expect(child().getSnapshot().context.subject).toBe('root')
    } finally {
      details.stop()
    }
  })
})
