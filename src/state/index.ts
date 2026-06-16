/**
 * src/state — 统一导出（Immer 精简版）
 */

export { GameProvider } from './GameContext'
export { useGameContext, useGameState, useGameDispatch } from './hooks'
export {
  gameReducer,
  modifyResource,
  getNumGatherers,
  lightFire,
  stokeFire,
  fireCool,
  tempIncrease,
  tempDecrease,
  builderAdvance,
  unlockFeature,
  incomeTick,
  loadSave,
  registerIncome,
  pushNarrative,
  startCooldown,
  assignWorker,
  unassignWorker,
  increasePopulation,
  killVillagers,
  applyRecipe,
  MAX_STORE,
} from './reducer'
export type { GameAction } from './reducer'
export {
  INITIAL_STATE,
  FireLevel,
  TempLevel,
  RoomName,
} from './types'
export type {
  GameState,
  Stores,
  CharacterState,
  IncomeConfig,
  ResourceTickLog,
  DeltaSource,
  NarrativeEntry,
  PendingReward,
  GameData,
  ConfigData,
} from './types'
