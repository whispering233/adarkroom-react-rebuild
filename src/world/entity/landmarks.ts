/**
 * World — Landmarks Entity 统一文件
 *
 * 将所有 14 种地标实体集中定义在此文件中。
 * 每个实体由 createUniformEntity 工厂创建，
 * 具有统一的 getDrawCommand 渲染逻辑和可选 onEnter 触发逻辑。
 *
 * 实体类型：
 *   1×1 单格：battlefield / borehole / cache / cave / coalMine / executioner /
 *            house / ironMine / outpost / sulphurMine / swamp / town
 *   2×2 多格：city / ship
 */

import { createUniformEntity } from './factory'

export const battlefieldEntity = createUniformEntity({
  type: 'battlefield',
  char: 'F',
})

export const boreholeEntity = createUniformEntity({
  type: 'borehole',
  char: 'B',
})

export const cacheEntity = createUniformEntity({
  type: 'cache',
  char: 'U',
})

export const caveEntity = createUniformEntity({
  type: 'cave',
  char: 'V',
})

export const cityEntity = createUniformEntity({
  type: 'city',
  char: 'Y',
  footprint: { w: 2, h: 2 },
})

export const coalMineEntity = createUniformEntity({
  type: 'coalMine',
  char: 'C',
})

export const executionerEntity = createUniformEntity({
  type: 'executioner',
  char: 'X',
})

export const houseEntity = createUniformEntity({
  type: 'house',
  char: 'H',
})

export const ironMineEntity = createUniformEntity({
  type: 'ironMine',
  char: 'I',
})

export const outpostEntity = createUniformEntity({
  type: 'outpost',
  char: 'P',
})

export const shipEntity = createUniformEntity({
  type: 'ship',
  char: 'W',
  footprint: { w: 2, h: 2 },
})

export const sulphurMineEntity = createUniformEntity({
  type: 'sulphurMine',
  char: 'S',
})

export const swampEntity = createUniformEntity({
  type: 'swamp',
  char: 'M',
})

export const townEntity = createUniformEntity({
  type: 'town',
  char: 'O',
})
