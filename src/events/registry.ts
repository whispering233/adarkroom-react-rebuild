import type { EventDef, EventId } from './types'

const _events = new Map<EventId, EventDef>()

export function registerEvent(event: EventDef): void {
  if (_events.has(event.id)) {
    console.warn(`[Events] Duplicate registration: "${event.id}"`)
  }
  _events.set(event.id, event)
}

export function getEventById(id: EventId): EventDef | undefined {
  return _events.get(id)
}

export function getAllEvents(): EventDef[] {
  return Array.from(_events.values())
}
