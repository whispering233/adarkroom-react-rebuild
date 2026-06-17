/**
 * Events — 注册表
 *
 * 事件定义注册中心。各事件文件导入 EventDef 后通过 registerEvent() 注册，
 * 其他模块通过 getEventById() 按 ID 查找。
 *
 * Phase 4：Room 事件（9 个）
 */

import type { EventDef } from './types'
import { nomad } from './room/nomad'
import { beggar } from './room/beggar'
import { noisesOutside } from './room/noisesOutside'
import { noisesInside } from './room/noisesInside'
import { mysteriousWandererWood } from './room/mysteriousWandererWood'
import { mysteriousWandererFur } from './room/mysteriousWandererFur'
import { shadyBuilder } from './room/shadyBuilder'
import { scout } from './room/scout'
import { wanderingMaster } from './room/wanderingMaster'
import { sickMan } from './room/sickMan'

const _events = new Map<string, EventDef>()

export function registerEvent(event: EventDef): void {
  if (_events.has(event.id)) {
    console.warn(`[Events] Duplicate registration: "${event.id}"`)
  }
  _events.set(event.id, event)
}

// ── 注册 Room 事件 ──
registerEvent(nomad)
registerEvent(beggar)
registerEvent(noisesOutside)
registerEvent(noisesInside)
registerEvent(mysteriousWandererWood)
registerEvent(mysteriousWandererFur)
registerEvent(shadyBuilder)
registerEvent(scout)
registerEvent(wanderingMaster)
registerEvent(sickMan)

export function getEventById(id: string): EventDef | undefined {
  return _events.get(id)
}

export function getAllEvents(): EventDef[] {
  return Array.from(_events.values())
}
