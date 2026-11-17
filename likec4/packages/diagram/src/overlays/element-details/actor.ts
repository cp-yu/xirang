import type { DiagramView, Fqn, NodeId } from '@likec4/core/types'
import type { Rect } from '@xyflow/system'
import {
  type ActorRef,
  type SnapshotFrom,
  type StateMachine,
  assign,
  enqueueActions,
  setup,
  stopChild,
} from 'xstate'
import { type RelationshipsBrowserActorRef, relationshipsBrowserLogic } from '../relationships-browser/actor'

export type ElementDetailsInput = {
  subject: Fqn
  currentView: DiagramView
  identity?: string | undefined
  contract?: { fragment?: string; revision: string } | undefined
  initiatedFrom?: {
    node?: NodeId
    clientRect?: Rect
  }
}

export type Context = {
  subject: Fqn | null
  currentView: DiagramView
  identity: string | null
  contract: { fragment?: string; revision: string } | null
  initiatedFrom: {
    node: NodeId | null
    clientRect: Rect | null
  }
}

export type Events =
  | { type: 'change.subject'; subject: Fqn }
  | { type: 'open.contract'; subject: Fqn | null; identity: string; fragment?: string; revision: string }
  | { type: 'close' }

const _elementDetailsLogic = setup({
  types: {
    context: {} as Context,
    input: {} as ElementDetailsInput,
    events: {} as Events,
    children: {} as {
      [key: `${string}-relationships`]: 'relationshipsBrowserLogic'
    },
  },
  actors: {
    relationshipsBrowserLogic,
  },
}).createMachine({
  id: 'element-details',
  context: ({ input }) => ({
    ...input,
    identity: input.identity ?? null,
    contract: input.contract ?? null,
    initiatedFrom: {
      node: input.initiatedFrom?.node ?? null,
      clientRect: input.initiatedFrom?.clientRect ?? null,
    },
  }),
  initial: 'active',
  states: {
    'active': {
      entry: enqueueActions(({ context, self, enqueue }) => {
        if (context.subject === null) return
        enqueue.spawnChild('relationshipsBrowserLogic', {
          id: `${self.id}-relationships`,
          input: {
            subject: context.subject,
            viewId: context.currentView.id,
            scope: 'view',
            enableSelectSubject: false,
            enableChangeScope: true,
            closeable: false,
          },
        })
      }),
      exit: stopChild(({ self }) => `${self.id}-relationships`),
      on: {
        'open.contract': {
          target: 'active',
          reenter: true,
          actions: assign({
            subject: ({ event }) => event.subject,
            identity: ({ event }) => event.identity,
            contract: ({ event }) => ({ revision: event.revision, ...(event.fragment ? { fragment: event.fragment } : {}) }),
            initiatedFrom: () => ({ node: null, clientRect: null }),
          }),
        },
        'change.subject': {
          actions: assign({
            subject: ({ event }) => event.subject,
          }),
        },
        'close': 'closed',
      },
    },
    closed: {
      id: 'closed',
      type: 'final',
    },
  },
})

export interface ElementDetailsLogic extends
  StateMachine<
    Context,
    Events,
    {
      [key: `${string}-relationships`]: RelationshipsBrowserActorRef | undefined
    },
    any,
    any,
    any,
    any,
    any,
    never,
    ElementDetailsInput,
    any,
    any,
    any,
    any
  >
{
}
export const elementDetailsLogic: ElementDetailsLogic = _elementDetailsLogic as any

export type ElementDetailsSnapshot = SnapshotFrom<ElementDetailsLogic>
export interface ElementDetailsActorRef extends ActorRef<ElementDetailsSnapshot, Events> {
}
