/**
 * src/state — 统一导出
 */

export {
  GameProvider,
  useGameContext,
  useGameState,
  useGameDispatch,
  useGameValue,
  useOnStateChange,
} from './GameContext'
export type { StateChangeHandler } from './GameContext'
export {
  gameReducer,
  getUpdateMeta,
  set,
  add,
  setM,
  addM,
  remove,
  load,
  setIncome,
  MAX_STORE,
} from './reducer'
export type { GameAction, UpdateMeta } from './reducer'
export { parsePath, getPath, setPath, getCategory } from './path'
export { INITIAL_STATE, FireLevel, TempLevel, FIRE_TEXT, TEMP_TEXT, RoomName } from './types'
export type {
  GameState,
  Stores,
  CharacterState,
  IncomeConfig,
  GameData,
  ConfigData,
  StatePath,
  CategoryName,
} from './types'
