/**
 * Trade goods — trading post 解锁后的资源兑换配置
 *
 * 纯数据定义：成本 + 奖励。交易通过 applyRecipe 执行，不需新 reducer action。
 */

export interface TradeDef {
  /** 交易品唯一标识 */
  id: string
  /** 交易成本 */
  cost: Record<string, number>
  /** 交易获得 */
  reward: Record<string, number>
}

export const TRADES: Record<string, TradeDef> = {
  scales: {
    id: 'scales',
    cost: { fur: 150 },
    reward: { scales: 1 },
  },
  teeth: {
    id: 'teeth',
    cost: { fur: 300 },
    reward: { teeth: 1 },
  },
  iron: {
    id: 'iron',
    cost: { fur: 200, coal: 100 },
    reward: { iron: 1 },
  },
  coal: {
    id: 'coal',
    cost: { fur: 300 },
    reward: { coal: 1 },
  },
  steel: {
    id: 'steel',
    cost: { fur: 300, coal: 100, iron: 100 },
    reward: { steel: 1 },
  },
  medicine: {
    id: 'medicine',
    cost: { fur: 500, scales: 100, teeth: 50 },
    reward: { medicine: 1 },
  },
  bullets: {
    id: 'bullets',
    cost: { scales: 500 },
    reward: { bullets: 1 },
  },
  compass: {
    id: 'compass',
    cost: { fur: 400, scales: 100, teeth: 20 },
    reward: { compass: 1 },
  },
  'energy cell': {
    id: 'energy cell',
    cost: { fur: 1000, scales: 500, teeth: 200 },
    reward: { 'energy cell': 1 },
  },
  bolas: {
    id: 'bolas',
    cost: { fur: 500 },
    reward: { bolas: 1 },
  },
  grenade: {
    id: 'grenade',
    cost: { fur: 1000, scales: 500 },
    reward: { grenade: 1 },
  },
  bayonet: {
    id: 'bayonet',
    cost: { scales: 500, teeth: 200, iron: 100 },
    reward: { bayonet: 1 },
  },
  'alien alloy': {
    id: 'alien alloy',
    cost: { fur: 1500, scales: 750, teeth: 300 },
    reward: { 'alien alloy': 1 },
  },
}
