/**
 * Events — 注册表
 *
 * 事件定义注册中心。各事件文件导入 EventDef 后通过 registerEvent() 注册，
 * 其他模块通过 getEventById() 按 ID 查找。
 *
 * 当前 Phase 2 为空壳（无实际事件），在 Phase 4~5 中添加。
 */

import type { EventDef } from './types'

const _events = new Map<string, EventDef>()

export function registerEvent(event: EventDef): void {
  if (_events.has(event.id)) {
    console.warn(`[Events] Duplicate registration: "${event.id}"`)
  }
  _events.set(event.id, event)
}

export function getEventById(id: string): EventDef | undefined {
  return _events.get(id)
}

export function getAllEvents(): EventDef[] {
  return Array.from(_events.values())
}
