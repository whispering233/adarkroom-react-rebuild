/**
 * 状态路径工具 —— 替代原项目的 eval() 路径访问
 *
 * 支持两种路径格式：
 *   1. dot notation:  'stores.wood'
 *   2. bracket notation: 'features["location.room"]', 'stores["cured meat"]'
 */

const BRACKET_RE = /^(.*?)\["([^"]+)"\](.*)$/

/**
 * 解析状态路径为字符串数组
 *
 * @example
 *   parsePath('stores.wood')          // → ['stores', 'wood']
 *   parsePath('features["location.room"]') // → ['features', 'location.room']
 *   parsePath('stores["cured meat"]') // → ['stores', 'cured meat']
 */
export function parsePath(path: string): string[] {
  const segments: string[] = []

  for (const part of path.split('.')) {
    let remaining = part
    // 处理连续 bracket notation: foo["bar"]["baz"]
    while (remaining.length > 0) {
      const match = remaining.match(BRACKET_RE)
      if (match) {
        if (match[1]) segments.push(match[1])
        segments.push(match[2])
        remaining = match[3].replace(/^\./, '')
      } else {
        segments.push(remaining)
        remaining = ''
      }
    }
  }

  return segments.filter((s) => s.length > 0)
}

/**
 * 从对象中按路径取值
 *
 * @returns 值或 undefined
 */
export function getPath(obj: Record<string, unknown>, path: string): unknown {
  const segments = parsePath(path)
  let current: unknown = obj
  for (const key of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * 在对象中按路径设值（浅不可变——沿路径创建新对象）
 *
 * @param obj  源对象
 * @param path 目标路径
 * @param value 新值
 * @returns 新的根对象
 */
export function setPath<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown,
): T {
  const segments = parsePath(path)
  if (segments.length === 0) return obj

  // 递归从根开始浅拷贝路径上的每一层
  function set(idx: number, current: Record<string, unknown>): Record<string, unknown> {
    const key = segments[idx]
    if (idx === segments.length - 1) {
      return { ...current, [key]: value }
    }
    const child = (current[key] as Record<string, unknown>) ?? {}
    return { ...current, [key]: set(idx + 1, child) }
  }

  return set(0, obj) as T
}

/**
 * 获取路径的顶层分类名（第一段）
 * @example getCategory('stores.wood') → 'stores'
 */
export function getCategory(path: string): string {
  const firstDot = path.indexOf('.')
  const firstBracket = path.indexOf('[')
  let cutoff: number
  if (firstDot === -1 && firstBracket === -1) return path
  if (firstDot === -1) cutoff = firstBracket
  else if (firstBracket === -1) cutoff = firstDot
  else cutoff = firstDot < firstBracket ? firstDot : firstBracket
  return path.slice(0, cutoff)
}
