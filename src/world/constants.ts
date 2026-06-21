/**
 * World — 游戏常量与地形/地标配置表
 *
 * 新增地形或地标只需在此文件追加数组元素。
 */
import type { TerrainDef, LandmarkDef } from './types'

// ─── 世界常量 ─────────────────────────────────────────

export const WORLD = {
  RADIUS: 30,
  VIEWPORT_RADIUS: 31,
  LIGHT_RADIUS: 2,
  STICKINESS: 0.5,
  FIGHT_CHANCE: 0.20,
  FIGHT_DELAY: 3,
  BASE_WATER: 10,
  MOVES_PER_FOOD: 2,
  MOVES_PER_WATER: 1,
  DEATH_COOLDOWN: 120,
  BASE_HEALTH: 10,
  BASE_HIT_CHANCE: 0.8,
  MEAT_HEAL: 8,
  MEDS_HEAL: 20,
  HYPO_HEAL: 30,
  NORTH: [0, -1] as const,
  SOUTH: [0, 1] as const,
  WEST: [-1, 0] as const,
  EAST: [1, 0] as const,
  /** 背包基础容量 */
  BASE_BAG_SPACE: 10,
} as const

// ─── 地形配置 ─────────────────────────────────────────

export const TERRAINS: TerrainDef[] = [
  {
    type: 'forest',
    weight: 0.15,
    char: '▓',
    cssClass: 'forest',
    narrateOnEnter: {
      field: 'world.narrate.forest_to_field',
      barrens: 'world.narrate.forest_to_barrens',
    },
  },
  {
    type: 'field',
    weight: 0.35,
    char: '▒',
    cssClass: 'field',
    narrateOnEnter: {
      forest: 'world.narrate.field_to_forest',
      barrens: 'world.narrate.field_to_barrens',
    },
  },
  {
    type: 'barrens',
    weight: 0.5,
    char: '░',
    cssClass: 'barrens',
    narrateOnEnter: {
      field: 'world.narrate.barrens_to_field',
      forest: 'world.narrate.barrens_to_forest',
    },
  },
  {
    type: 'road',
    weight: 0,
    char: '#',
    cssClass: 'road',
  },
]

// ─── 地标配置 ─────────────────────────────────────────

export const LANDMARKS: LandmarkDef[] = [
  {
    type: 'village',
    labelKey: 'world.landmark.village',
    char: 'A',
    count: 1,
    minRadius: 0,
    maxRadius: 0,
    sceneId: 'setpiece.village',
  },
  {
    type: 'ironMine',
    labelKey: 'world.landmark.ironMine',
    char: 'I',
    count: 1,
    minRadius: 5,
    maxRadius: 5,
    sceneId: 'setpiece.ironMine',
  },
  {
    type: 'coalMine',
    labelKey: 'world.landmark.coalMine',
    char: 'C',
    count: 1,
    minRadius: 10,
    maxRadius: 10,
    sceneId: 'setpiece.coalMine',
  },
  {
    type: 'sulphurMine',
    labelKey: 'world.landmark.sulphurMine',
    char: 'S',
    count: 1,
    minRadius: 20,
    maxRadius: 20,
    sceneId: 'setpiece.sulphurMine',
  },
  {
    type: 'house',
    labelKey: 'world.landmark.house',
    char: 'H',
    count: 10,
    minRadius: 0,
    maxRadius: 45,
    sceneId: 'setpiece.house',
  },
  {
    type: 'cave',
    labelKey: 'world.landmark.cave',
    char: 'V',
    count: 5,
    minRadius: 3,
    maxRadius: 10,
    sceneId: 'setpiece.cave',
  },
  {
    type: 'town',
    labelKey: 'world.landmark.town',
    char: 'O',
    count: 10,
    minRadius: 10,
    maxRadius: 20,
    sceneId: 'setpiece.town',
  },
  {
    type: 'city',
    labelKey: 'world.landmark.city',
    char: 'Y',
    count: 20,
    minRadius: 20,
    maxRadius: 45,
    sceneId: 'setpiece.city',
  },
  {
    type: 'outpost',
    labelKey: 'world.landmark.outpost',
    char: 'P',
    count: 0,
    minRadius: 0,
    maxRadius: 0,
    sceneId: 'setpiece.outpost',
  },
  {
    type: 'ship',
    labelKey: 'world.landmark.ship',
    char: 'W',
    count: 1,
    minRadius: 28,
    maxRadius: 28,
    sceneId: 'setpiece.ship',
  },
  {
    type: 'borehole',
    labelKey: 'world.landmark.borehole',
    char: 'B',
    count: 10,
    minRadius: 15,
    maxRadius: 45,
    sceneId: 'setpiece.borehole',
  },
  {
    type: 'battlefield',
    labelKey: 'world.landmark.battlefield',
    char: 'F',
    count: 5,
    minRadius: 18,
    maxRadius: 45,
    sceneId: 'setpiece.battlefield',
  },
  {
    type: 'swamp',
    labelKey: 'world.landmark.swamp',
    char: 'M',
    count: 1,
    minRadius: 15,
    maxRadius: 45,
    sceneId: 'setpiece.swamp',
  },
  {
    type: 'cache',
    labelKey: 'world.landmark.cache',
    char: 'U',
    count: 1,
    minRadius: 10,
    maxRadius: 45,
    sceneId: 'setpiece.cache',
  },
  {
    type: 'executioner',
    labelKey: 'world.landmark.executioner',
    char: 'X',
    count: 1,
    minRadius: 28,
    maxRadius: 28,
    sceneId: 'setpiece.executioner',
  },
]
