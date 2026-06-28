import type { EventId } from '../events/types'

export interface TriggerRule {
  entityType: string
  trigger: 'on_enter' | 'on_enter_once'
  effects: Array<{
    type: 'return_home' | 'start_event' | 'clear_outpost' | 'flag' | 'narration'
    eventId?: EventId
    flagKey?: string
    narrationKey?: string
  }>
}

export const TRIGGER_CONFIG: TriggerRule[] = [
  {
    entityType: 'village',
    trigger: 'on_enter',
    effects: [{ type: 'return_home' }],
  },
  {
    entityType: 'outpost',
    trigger: 'on_enter_once',
    effects: [
      { type: 'start_event', eventId: 'setpiece.outpost' },
      { type: 'clear_outpost' },
    ],
  },
  {
    entityType: 'ship',
    trigger: 'on_enter_once',
    effects: [
      { type: 'start_event', eventId: 'setpiece.ship' },
      { type: 'flag', flagKey: 'shipFound' },
    ],
  },
  {
    entityType: 'executioner',
    trigger: 'on_enter_once',
    effects: [
      { type: 'start_event', eventId: 'executioner' },
      { type: 'flag', flagKey: 'executionerFound' },
    ],
  },
  {
    entityType: 'battlefield',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.battlefield' }],
  },
  {
    entityType: 'borehole',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.borehole' }],
  },
  {
    entityType: 'cache',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.cache' }],
  },
  {
    entityType: 'cave',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.cave' }],
  },
  {
    entityType: 'city',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.city' }],
  },
  {
    entityType: 'coalMine',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.coalMine' }],
  },
  {
    entityType: 'house',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.house' }],
  },
  {
    entityType: 'ironMine',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.ironMine' }],
  },
  {
    entityType: 'sulphurMine',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.sulphurMine' }],
  },
  {
    entityType: 'swamp',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.swamp' }],
  },
  {
    entityType: 'town',
    trigger: 'on_enter_once',
    effects: [{ type: 'start_event', eventId: 'setpiece.town' }],
  },
]
