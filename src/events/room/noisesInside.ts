/**
 * Room 事件 — Noises Inside（储藏室异响：用 wood 换 scales/teeth/cloth）
 */
import type { EventDef } from '../types'
import type { GameState } from '../../state/types'

export const noisesInside: EventDef = {
  id: 'noises_inside',
  title: 'events.noises_in.title',
  isAvailable: (state: GameState) =>
    state.currentRoom === 'room' && (state.stores['wood'] ?? 0) > 0,
  scenes: {
    start: {
      text: [
        'events.noises_in.text.0',
        'events.noises_in.text.1',
      ],
      notification: 'events.noises_in.arrived',
      blink: true,
      buttons: {
        investigate: {
          text: 'events.noises_in.investigate',
          nextScene: { 0.5: 'scales', 0.8: 'teeth', 1: 'cloth' },
        },
        ignore: {
          text: 'events.noises_in.ignore',
          nextScene: 'end',
        },
      },
    },
    scales: {
      text: [
        'events.noises_in.result.0',
        'events.noises_in.scales.0',
      ],
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (draft: { stores: Record<string, number> }) => {
            const wood = draft.stores['wood'] ?? 0
            const take = Math.max(1, Math.floor(wood * 0.1))
            const scales = Math.max(1, Math.floor(take / 5))
            draft.stores['wood'] = Math.max(0, (draft.stores['wood'] ?? 0) - take)
            draft.stores['scales'] = (draft.stores['scales'] ?? 0) + scales
          },
        })
      },
      buttons: {
        leave: { text: 'events.noises_in.leave', nextScene: 'end' },
      },
    },
    teeth: {
      text: [
        'events.noises_in.result.0',
        'events.noises_in.teeth.0',
      ],
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (draft: { stores: Record<string, number> }) => {
            const wood = draft.stores['wood'] ?? 0
            const take = Math.max(1, Math.floor(wood * 0.1))
            const teeth = Math.max(1, Math.floor(take / 5))
            draft.stores['wood'] = Math.max(0, (draft.stores['wood'] ?? 0) - take)
            draft.stores['teeth'] = (draft.stores['teeth'] ?? 0) + teeth
          },
        })
      },
      buttons: {
        leave: { text: 'events.noises_in.leave', nextScene: 'end' },
      },
    },
    cloth: {
      text: [
        'events.noises_in.result.0',
        'events.noises_in.cloth.0',
      ],
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          recipe: (draft: { stores: Record<string, number> }) => {
            const wood = draft.stores['wood'] ?? 0
            const take = Math.max(1, Math.floor(wood * 0.1))
            const cloth = Math.max(1, Math.floor(take / 5))
            draft.stores['wood'] = Math.max(0, (draft.stores['wood'] ?? 0) - take)
            draft.stores['cloth'] = (draft.stores['cloth'] ?? 0) + cloth
          },
        })
      },
      buttons: {
        leave: { text: 'events.noises_in.leave', nextScene: 'end' },
      },
    },
  },
}
