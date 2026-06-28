/**
 * World Setpiece — Swamp
 *
 * 沼泽地标事件。
 */
import type { EventDef } from '../../types'

const swampSetpiece: EventDef = {
  id: 'setpiece.swamp',
  title: 'events.setpiece.swamp',
  isAvailable: () => true,
  scenes: {
    start: {
      text: ['events.setpiece.swamp.text'],
      buttons: {
        explore: {
          text: 'events.setpiece.swamp.explore',
          available: (state) => !state.character.perks['gastronome'],
          nextScene: 'end',
          onChoose: (dispatch) => {
            dispatch({ type: 'APPLY_RECIPE', recipe: (d: any) => { d.character.perks['gastronome'] = true } } as any)
          },
        },
        leave: {
          text: 'actions.leave',
          nextScene: 'end',
        },
      },
    },
  },
}
export { swampSetpiece }
