import { registerEvent } from './registry'

import { nomad } from './room/nomad'
import { beggar } from './room/beggar'
import { noisesOutside } from './room/noisesOutside'
import { noisesInside } from './room/noisesInside'
import { mysteriousWandererWood } from './room/mysteriousWandererWood'
import { mysteriousWandererFur } from './room/mysteriousWandererFur'
import { shadyBuilder } from './room/shadyBuilder'
import { scout } from './room/scout'
import { wanderingMaster } from './room/wanderingMaster'
import { sickMan } from './room/sickMan'
import { ruinedTrap } from './outside/ruinedTrap'
import { hutFire } from './outside/hutFire'
import { sickness } from './outside/sickness'
import { plague } from './outside/plague'
import { beastAttack } from './outside/beastAttack'
import { soldierAttack } from './outside/soldierAttack'
import { boreholeSetpiece } from './world/setpieces/BOREHOLE'
import { battlefieldSetpiece } from './world/setpieces/BATTLEFIELD'
import { swampSetpiece } from './world/setpieces/SWAMP'
import { caveSetpiece } from './world/setpieces/CAVE'
import { townSetpiece } from './world/setpieces/TOWN'
import { citySetpiece } from './world/setpieces/CITY'
import { houseSetpiece } from './world/setpieces/HOUSE'
import { ironMineSetpiece } from './world/setpieces/IRON_MINE'
import { coalMineSetpiece } from './world/setpieces/COAL_MINE'
import { sulphurMineSetpiece } from './world/setpieces/SULPHUR_MINE'
import { shipSetpiece } from './world/setpieces/SHIP'
import { cacheSetpiece } from './world/setpieces/CACHE'
import { villageSetpiece } from './world/setpieces/village'
import { outpostSetpiece } from './world/setpieces/outpost'
import { snarlingBeast, gauntMan, strangeBird } from './world/encounters'
import { executionerEvent } from './world/executioner'

export function registerAll(): void {
  const all = [
    nomad, beggar, noisesOutside, noisesInside,
    mysteriousWandererWood, mysteriousWandererFur,
    shadyBuilder, scout, wanderingMaster, sickMan,
    ruinedTrap, hutFire, sickness, plague, beastAttack, soldierAttack,
    boreholeSetpiece, battlefieldSetpiece, swampSetpiece,
    caveSetpiece, townSetpiece, citySetpiece, houseSetpiece,
    ironMineSetpiece, coalMineSetpiece, sulphurMineSetpiece,
    shipSetpiece, cacheSetpiece, villageSetpiece, outpostSetpiece,
    snarlingBeast, gauntMan, strangeBird,
    executionerEvent,
  ]
  for (const event of all) {
    registerEvent(event)
  }
}
