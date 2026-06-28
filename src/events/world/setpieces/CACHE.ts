/**
 * World Setpiece — Cache
 *
 * 废墟村庄（藏匿处）地标事件。
 * 进入时自动收集上局遗留的 prestige 资源。
 */
import type { EventDef } from '../../types'

const cacheSetpiece: EventDef = {
  id: 'setpiece.cache',
  title: 'events.setpiece.cache',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.cache.text'],
      onLoad: (dispatch) => {
        dispatch({
          type: 'APPLY_RECIPE',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recipe: (draft: any) => {
            const prev = draft.previous as Record<string, unknown> | undefined
            if (!prev) return
            const stores = prev.stores as number[] | undefined
            if (!Array.isArray(stores) || stores.length === 0) return
            const names = [
              'wood', 'fur', 'meat', 'iron', 'coal', 'sulphur', 'steel', 'cured meat',
              'scales', 'teeth', 'leather', 'bait', 'torch', 'cloth',
              'bone spear', 'iron sword', 'steel sword', 'bayonet', 'rifle', 'laser rifle',
              'bullets', 'energy cell', 'grenade', 'bolas',
            ]
            for (let i = 0; i < Math.min(stores.length, names.length); i++) {
              if (stores[i] > 0) {
                const k = names[i]
                draft.stores[k] = ((draft.stores as Record<string, number>)[k] ?? 0) + stores[i]
              }
            }
            prev.stores = []
          },
        })
      },
      notification: 'events.setpiece.cache.found',
      buttons: {
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
export { cacheSetpiece }
