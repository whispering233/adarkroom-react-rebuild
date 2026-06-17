/**
 * Events — 工具函数
 *
 * 概率映射解析：支持权重格式 { scene_a: 3, scene_b: 7 }
 * 和累积概率格式（兼容原版）{ 0.3: 'scene_a', 1: 'scene_b' } 两种输入。
 */

import type { ProbabilityMap, WeightMap, CumulativeMap, SceneId } from './types'

/** 判断是否为权重格式（key 不是纯数字字符串） */
export function isWeightMap(map: ProbabilityMap): map is WeightMap {
  const key = Object.keys(map)[0]
  if (!key) return true // 空映射
  return Number.isNaN(Number(key))
}

/** 累积概率 → 权重映射 */
function cumulativeToWeight(map: CumulativeMap): WeightMap {
  const weightMap: WeightMap = {}
  let prev = 0
  for (const [thresholdStr, sceneId] of Object.entries(map)) {
    const threshold = Number(thresholdStr)
    if (Number.isNaN(threshold)) continue
    weightMap[sceneId] = threshold - prev
    prev = threshold
  }
  return weightMap
}

/**
 * 从概率映射中随机选中一个 sceneId。
 * 若映射为空或权重和为零，返回第一个 entry 的 sceneId。
 */
export function rollProbability(map: ProbabilityMap): SceneId | undefined {
  const entries = Object.entries(map) as [SceneId, number][]
  if (entries.length === 0) return undefined

  const weights = isWeightMap(map)
    ? (map as WeightMap)
    : cumulativeToWeight(map as CumulativeMap)

  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  if (total <= 0) return entries[0][0]

  let roll = Math.random() * total
  for (const [sceneId, weight] of Object.entries(weights)) {
    roll -= weight
    if (roll <= 0) return sceneId
  }
  return entries[entries.length - 1][0]
}

/**
 * 解析 nextScene 字段：
 *   - 'end'          → 'end'
 *   - 'scene_name'   → 直接返回
 *   - ProbabilityMap → rollProbability(map)
 */
export function resolveNextScene(
  nextScene: SceneId | ProbabilityMap,
): SceneId {
  if (typeof nextScene === 'string') return nextScene
  return rollProbability(nextScene) ?? 'end'
}
