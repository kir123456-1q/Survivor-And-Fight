## ADDED Requirements

### Requirement: 技能由多 Effect 组成且可配表驱动
系统 SHALL 提供技能与 Effect 的数据模型与配表约定：一个技能由多个 Effect 组成，每个 Effect 包含执行者、效果、目标三部分，可由配表驱动。

#### Scenario: Effect 包含执行者、效果、目标三部分
- **WHEN** 配置一个技能的单个 Effect
- **THEN** 该 Effect 配置 SHALL 包含：执行者（如 player）、效果类型（如 damage）、效果参数、目标类型（如 auto / simple）
- **AND** 技能表或 effect 子表 SHALL 能通过读表 API 加载，并与 Data/表注册方式兼容

#### Scenario: 效果参数支持公式与属性别名解析
- **WHEN** Effect 参数为公式字符串（如 atk*1.2）
- **THEN** 系统 SHALL 在结算时解析该公式，并将其中属性别名（如 atk、hp）解析为执行者或目标实体的对应属性最终值
- **AND** 公式解析 SHALL 支持常用运算符与属性别名白名单，解析失败时 SHALL 有明确降级或报错行为

#### Scenario: 目标类型 auto 与 simple
- **WHEN** 目标类型为 auto
- **THEN** 系统 SHALL 根据威胁度与血量进行加权索敌，优先选择“低血量、高威胁度”的目标
- **AND** 索敌范围或权重规则 SHALL 可配置或与现有筛选器/实体集对接
- **WHEN** 目标类型为 simple
- **THEN** 系统 SHALL 以鼠标位置（或输入抽象提供的目标位置）为索敌目标，进行简单索敌
- **AND** 与 input-abstraction 或相机/屏幕坐标转换解耦接口，便于测试与替换

#### Scenario: 技能表含特效栏位与子弹栏位
- **WHEN** 配置技能或 Effect
- **THEN** 技能/effect 配表 SHALL 包含特效栏位、子弹栏位等字段，用于填写资源 id 或预制体路径
- **AND** 本阶段仅约定表结构与读取方式，具体特效播放与子弹实例化由后续系统根据栏位读取并执行

### Requirement: 技能组件与技能系统
系统 SHALL 提供 Skill 组件与 SkillSystem，用于驱动技能释放、冷却与 Effect 执行。

#### Scenario: Skill 组件持有当前技能与冷却等状态
- **WHEN** 实体具有释放技能能力
- **THEN** 该实体 SHALL 拥有 Skill 组件，组件 SHALL 至少包含：当前技能 id（或待释放技能）、冷却状态（或剩余 CD 时间）
- **AND** 组件数据 SHALL 可由 SkillSystem 读取并更新

#### Scenario: SkillSystem 按配置执行 Effect 列表
- **WHEN** 某实体触发技能释放且满足冷却等条件
- **THEN** SkillSystem SHALL 根据技能 id 从配表取得该技能的 Effect 列表
- **AND** 对每个 Effect SHALL 按执行者解析执行实体、按目标类型执行索敌、按效果类型与公式结算效果并应用到目标
- **AND** 执行顺序与配表顺序一致，且与 Attribute、Movement 等系统兼容（如伤害扣血写入目标 Attribute）
