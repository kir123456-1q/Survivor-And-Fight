## 1. 出生点系统（monster-spawn-system）
- [ ] 1.1 新增出生点配置结构，定义四个角点坐标（左上/右上/左下/右下）
- [ ] 1.2 实现 MonsterSpawnSystem 的随机选点逻辑，保证每次刷怪出生点来自四角集合
- [ ] 1.3 将出生点写入怪物 Position，并在怪物创建当帧完成初始化
- [ ] 1.4 将出生点系统接入现有刷怪流程，确保兼容现有 Monster 创建逻辑

## 2. 移动模式系统（monster-movement-pattern）
- [ ] 2.1 新增 MonsterBehavior 组件，支持 `ranged`、`melee`、`boss` 三种模式与参数
- [ ] 2.2 实现近战小怪逻辑：持续朝玩家位置移动
- [ ] 2.3 实现远程小怪逻辑：保持目标距离并围绕玩家画圆
- [ ] 2.4 实现 Boss 状态机：`rangedAttack -> approach -> retreat -> rangedAttack` 循环
- [ ] 2.5 将 MonsterMovementSystem 接入系统更新链并确认执行顺序

## 3. 配表与装配
- [ ] 3.1 新增 `monster_behavior_table` 配表，定义模式与关键参数字段
- [ ] 3.2 对接读表流程，怪物生成时按配置装配 MonsterBehavior

## 4. 验证
- [ ] 4.1 验证刷怪点仅来自四个角，且随机分布正常
- [ ] 4.2 验证三类怪物行为：远程绕圈、近战追击、Boss 攻近退循环
- [ ] 4.3 补充最小验证用例或录屏脚本，覆盖 Boss 阶段切换
