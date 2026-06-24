# 开发计划

## 架构设计
- 世界地图
  - (done) 格子不存放具体信息，格子改为存放Entity引用和Entity参数；
    - Entity 暴露统一的纯函数接口，返回canvas绘图信息
    - 逻辑计算渲染时，根据Entity引用，找到对应Entity，传入Entity参数，纯函数式计算返回
    - 逻辑计算封装所有canvas绘图信息，传给canvas渲染
  - (done) Entity 派生
    - 城市派生出具体城市表现和行为

---

## Phase 1 — 现有系统扩展（🟡 10 项）

> 目标：在现有架构上补数据/补配置/补逻辑，无需新建子系统。

### 建造品扩展（15+ 工具/武器/升级）

- [ ] torch（火把）— 增加视野半径
- [ ] waterskin（水袋）— 增加水容量
- [ ] cask（水桶）— 水袋升级
- [ ] water tank（水罐）— 终极水容器
- [ ] rucksack（背包）— 增加背包容量（已有 BAG_UPGRADES 定义: `src/config.ts:223`）
- [ ] wagon（马车）— 背包升级
- [ ] convoy（车队）— 终极背包
- [ ] leather armour（皮甲 / i armour）— 基础护甲
- [ ] iron armour（铁甲 / s armour）— 中级护甲
- [ ] steel armour（钢甲 / l armour）— 终极护甲
- [ ] bone spear（骨矛）— 作为建造品
- [ ] iron sword（铁剑）— 作为建造品
- [ ] steel sword（钢剑）— 作为建造品
- [ ] rifle（步枪）— 作为建造品

### 交易系统

- [ ] 新增 `craftables/trades.ts` 交易品配置表
- [ ] 12+ 交易品：scales, teeth, iron, coal, steel, medicine, bullets, compass, energy cell, bolas, grenades, bayonet, alien alloy
- [ ] trading post 解锁后渲染交易按钮组

### 战斗武器补全（4 把）

- [ ] bayonet（刺刀）— 近战 8 伤
- [ ] plasma rifle（等离子步枪）— 远程 12 伤 + 消耗 energy cell
- [ ] energy blade（能量刃）— 近战 10 伤
- [ ] disruptor（干扰器）— 远程眩晕

### 命中率 + Stun 机制

- [ ] `CombatManager.ts`: 加 BASE_HIT_CHANCE + 命中率骰子
- [ ] `CombatState`: 加 `enemyStunned` 字段
- [ ] bolas 改为眩晕（跳过敌人下一回合）

### World Danger 系统

- [ ] 基于距离 + 护甲判断危险状态
- [ ] 危险状态切换时 pushNarrative 通知

### World 动态 Road 绘制

- [ ] outpost 清理后，从当前位置画路回 village
- [ ] 修改 terrainMap + 触发地图重绘

### 地标事件场景（12 个）

- [ ] borehole（钻孔）— 地标事件
- [ ] battlefield（战场）— 地标事件
- [ ] swamp（沼泽）— 地标事件（含 gastronome perk 获取）
- [ ] cave（洞穴）— 地标事件
- [ ] town（城镇）— 地标事件
- [ ] city（城市）— 地标事件
- [ ] house（房屋）— 地标事件
- [ ] ironMine（铁矿）— 地标事件
- [ ] coalMine（煤矿）— 地标事件
- [ ] sulphurMine（硫磺矿）— 地标事件
- [ ] ship（坠毁星舰）— 地标事件（触发 Ship 解锁）
- [ ] cache（废墟村庄）— 地标事件（触发 Prestige.collectStores）

### Executioner 大型战斗事件

- [ ] executioner 地标的 intro/antechamber 多场景
- [ ] boss 战斗
- [ ] fleet beacon 掉落

### Starvation/Dehydration 累积 + Death Cooldown

- [ ] 饥饿累积状态机：首次饥饿 → starvation=true → 再次饥饿 → die()
- [ ] 口渴累积状态机：首次口渴 → thirst=true → 再次口渴 → die()
- [ ] `character.starved`/`character.dehydrated` 计数
- [ ] 计数≥10 → 获取对应 Perk（需 Perk 系统就位）
- [ ] 死亡冷却 DEATH_COOLDOWN（120 步）

### Compass 系统

- [ ] Path 场景：持有 compass 时显示飞船方向提示

---

## Phase 2 — 需新建模块（🔴 6 项）

> 目标：从零设计全新子系统，部分依赖 Phase 1 产物。

### Ship（飞船）

- [ ] 场景路由 `SCENES` 表注册 `ship`
- [ ] Ship 面板 UI：hull/thrusters 数值 + 加固/升级/起飞 3 按钮
- [ ] alien alloy 资源（`RESOURCES` 表 + stores）
- [ ] 解锁条件：World ship 地标 → `features.location.spaceShip`
- [ ] lift-off → 进入 Space

### Space（太空终局）

- [ ] SpaceCanvas 独立渲染组件（rAF + Canvas）
- [ ] 星空视差背景（200 星点 2 层滚动）
- [ ] @ 飞船 WASD/方向键移动
- [ ] 小行星随机下落 + 碰撞检测
- [ ] hull 递减 → 坠毁回 Ship
- [ ] 60 秒生存 → 通关结局
- [ ] 终局 Score 显示 + Prestige 保存
- [ ] 背景 60 秒渐黑动画

### Fabricator（制造工坊）

- [ ] `craftables/fabricator.ts` 配置表（8 件终局装备）
- [ ] 场景路由注册 `fabricator`
- [ ] 解锁条件：executioner 地标 → `features.location.fabricator`
- [ ] 消耗 alien alloy

### Perk 系统（11 项特性）

- [ ] `state/reducer.ts`: `ADD_PERK` action
- [ ] `state/hooks.ts`: `usePerk()` hook（查询 perk 状态）
- [ ] `CombatManager.ts`: 注入 perk 查询，生效 boxer/martial artist/unarmed master/barbarian/evasive/precise
- [ ] World.tsx: 注入 perk 查询，生效 scout/stealthy/gastronome/slow metabolism/desert rat
- [ ] 事件授予：流浪大师(barbarian/evasive/precise)、侦察兵(scout)、盗贼(stealthy)、沼泽(gastronome)
- [ ] 战斗里程碑：50/150/300 次徒手攻击 → boxer/martial artist/unarmed master
- [ ] 生存磨难：饿死≥10 次 → slow metabolism，脱水≥10 次 → desert rat

### Prestige / Scoring（声望/计分）

- [ ] `state/types.ts`: `previous` 字段（stores + score）
- [ ] `state/reducer.ts`: `SAVE_PRESTIGE` / `COLLECT_STORES` action
- [ ] Score 计算函数（24 资源 × weight）
- [ ] 通关后保存 Prestige snapshot
- [ ] 新游戏 Cache 地标条件生成（需 previous.stores 存在）
- [ ] Space 终局计分展示

### 音频系统

- [ ] Web Audio API Context 初始化（含 autoplay policy 处理）
- [ ] 三通道架构：BGM + 事件音乐 + SFX
- [ ] 交叉淡入淡出（BGM 1s、事件 2s + duck BGM 至 20%）
- [ ] 场景驱动 BGM：火堆 5 级 + 村庄人口 6 级 + Path/World/Ship/Space
- [ ] 操作音效注册表
- [ ] on/off 切换（localStorage 持久化）
- [ ] 音频文件按需逐步引入