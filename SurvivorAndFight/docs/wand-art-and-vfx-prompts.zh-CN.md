# 魔杖图标、特效与 UI 提示词（中文）

对应配置表：`docs/config/wand_table.json`、`docs/config/wand_effect_table.json`。  
本文件所有提示词均可直接用于 AI 出图与切图。

---

## 1. 强制导出规则

- 图标与特效贴图必须导出 `PNG` 透明底，主体外像素 `alpha=0`。
- UI 面板底图若用于全屏背景，必须导出不透明整图；若用于叠层，必须透明底。
- 同批次资产必须使用统一光源方向（左上 35 度）与统一描边宽度（2~3px）。
- 所有图标必须留足切图安全边距，四周至少 24px 空白。

---

## 2. 法杖 icon 提示词（15 根）

统一前缀（每条可拼接）：  
`暗黑奇幻、俯视角游戏道具图标、居中构图、精细金属与符文细节、可读性强、无文字、transparent PNG、纯透明背景`

### 2.1 近战环绕法杖（melee_orbit）

- `wand_melee_bronze_orbit`：铜色短杖，顶部双层旋转圆环，旧铜氧化纹理，微弱橙色魔力流。
- `wand_melee_ash_guard`：灰白骨质杖身，炽红灰烬环，防御感厚重，边缘有碎焰粒子。
- `wand_melee_storm_ring`：青蓝电纹法杖，三段同心环，环面有闪电雕刻。
- `wand_melee_void_reaper`：黑曜石杖核，紫黑虚空裂隙光带，尖端镰刃感符文。
- `wand_melee_celestial_halo`：金白圣环法杖，天使风轮廓，中心高亮神圣水晶。

### 2.2 远程射击法杖（ranged_shot）

- `wand_ranged_ember_spike`：细长火晶杖，前端针状红橙结晶，直线射击视觉。
- `wand_ranged_fork_branch`：分叉木杖，枝杈末端三枚发光晶体，强调分裂特征。
- `wand_ranged_frost_lancer`：冰蓝长枪杖，矛头形符文片，寒气尾迹。
- `wand_ranged_bombard_core`：重型机械法杖，中心球形核心，高能警示黄黑纹。
- `wand_ranged_prism_cannon`：棱镜炮形杖身，多面体晶体簇，彩色折射高光。

### 2.3 远程随机法杖（ranged_random）

- `wand_random_wild_seed`：木质与藤蔓混合杖，随机生长晶芽，绿色流光。
- `wand_random_chaos_fan`：扇骨结构法杖，多方向小尖晶，混沌符号浮雕。
- `wand_random_echo_orb`：悬浮双球核心，球间电弧跳动，轨迹不规则。
- `wand_random_starlight_lottery`：星骰元素法杖，镶嵌骰面符号，紫蓝星辉颗粒。
- `wand_random_entropy_oracle`：高科技占卜杖，环形天体仪结构，彩噪熵流光。

---

## 3. 效果 icon 提示词（30 个）

统一前缀（每条可拼接）：  
`技能符文图标、中心构图、强对比、边缘清晰、无文字、transparent PNG、纯透明背景`

### 3.1 近战环绕效果（10）

- `fx_melee_orbit_blade`：旋转单刃符文，金属弧光。
- `fx_melee_dual_ring`：双同心环符号，青色残影。
- `fx_melee_thorn_burst`：刺环向外爆开，红橙冲击波。
- `fx_melee_vampiric_spin`：血色旋涡与吸收粒子。
- `fx_melee_chain_orbit`：环形闪电链，节点发光。
- `fx_melee_anchor_spike`：中心锚钉与定向尖刺。
- `fx_melee_ember_trail`：余烬拖尾弧线，火星散射。
- `fx_melee_execution_mark`：处决十字印记，暗金与深红。
- `fx_melee_holy_barrier`：圣光护环，半透明护盾纹。
- `fx_melee_singularity_orbit`：微型黑洞环，吸附扭曲线。

### 3.2 远程射击效果（10）

- `fx_shot_pierce_round`：细长穿透箭头符文。
- `fx_shot_split_two`：一分二分叉弹道图形。
- `fx_shot_rebound`：折线反弹轨迹与墙面反射点。
- `fx_shot_delay_burst`：倒计时核心与外扩爆环。
- `fx_shot_chain_arc`：电弧跳链节点图标。
- `fx_shot_sticky_bomb`：黏附凝胶核心与警示环。
- `fx_shot_triple_fan`：三向扇形齐射轮廓。
- `fx_shot_prism_overload`：棱镜分光多箭束。
- `fx_shot_meteor_fall`：坠落陨石尾焰。
- `fx_shot_blackhole_seed`：黑洞核心与引力环线。

### 3.3 远程随机效果（10）

- `fx_rand_wild_arc`：高随机偏折弹道弧线。
- `fx_rand_hop_target`：目标间跳转锁定标记。
- `fx_rand_lucky_split`：概率分叉幸运符。
- `fx_rand_roulette_bomb`：轮盘与冲击波图案叠加。
- `fx_rand_pinball`：弹珠多次反弹路径。
- `fx_rand_sniper_focus`：随机狙击准星与概率刻度。
- `fx_rand_mirror_shot`：镜像双弹体对称图形。
- `fx_rand_quantum_pick`：量子叠加目标圈层。
- `fx_rand_entropy_storm`：混沌风暴螺旋与噪声粒子。
- `fx_rand_destiny_reset`：重投骰子与回环箭头。

---

## 4. 技能特效提示词（VFX）

统一前缀：  
`2D 游戏特效序列帧风格、透明背景、强发光边缘、可循环、便于拆分图集`

- 近战环绕：`角色周围持续旋转的能量环，含切割火花与弧形残影，8~12 帧循环，transparent PNG 序列`
- 反弹：`投射体命中墙体后折返，出现锐利折线光与反射闪点，6~8 帧`
- 分裂：`主弹在中段分裂为多弹，先收缩后绽放，中心白闪 + 彩色子弹尾迹`
- 冲击扩散：`半径清晰的圆形冲击波，中心高亮、外圈烟尘，支持叠加混合`
- 随机弹道：`每帧轨迹轻微抖动，带概率偏折火花，强调不可预测感`
- 随机索敌：`目标间跳线电弧，带短暂停顿闪烁，突出目标切换`
- 黑洞吸附：`中心扭曲漩涡，外围吸入粒子，持续 1.5 秒循环`

---

## 5. 法杖空位更新 Panel 提示词（UI）

## 5.1 面板底图（Panel Base）
- 提示词：`暗黑奇幻 HUD 面板底图，横向长条结构，中央留空显示法杖槽位，金属边框+符文刻线，低饱和紫灰配色，无文字，transparent PNG`

## 5.2 槽位（Slot）
- 空槽：`六边形法杖槽位，内发暗，边框弱发光，中心空白占位符，transparent PNG`
- 已占用槽：`六边形槽位内含能量核，亮度中等，边框高亮一圈，transparent PNG`
- 锁定槽：`带锁扣符号的槽位，冷灰色，低透明锁链纹理，transparent PNG`

## 5.3 高亮层（Highlight）
- 提示词：`槽位选中高亮叠层，流动光边，脉冲节奏感，纯叠层透明背景，禁止底板`

## 5.4 Value 层（数值层）
- 提示词：`法杖数值条组件：攻速、耗蓝、蓝量上限三列图形化条，图标+短条形底，留白用于后期文字，transparent PNG`

---

## 6. 切图与命名规则

- 图标命名必须与配置 `id` 一致，后缀 `_icon`，例如：`wand_melee_bronze_orbit_icon.png`。
- 特效命名使用 `id` + `_vfx_序号`，例如：`fx_shot_split_two_vfx_01.png`。
- UI 面板命名采用：`wand_panel_base`、`wand_panel_slot_empty`、`wand_panel_slot_filled`、`wand_panel_highlight`、`wand_panel_value_layer`。
- 禁止提交含底色遮罩的伪透明图；透明区域必须真实 alpha 通道。

---

## 7. 16 Icon 拼版提示词（可直接出整图后切图）

统一要求（每张都拼接）：
`暗黑奇幻图标风格、俯视角、统一光源左上35度、统一描边2~3px、透明背景、无文字、仅图标本体、4x4 网格、每格居中、格间距一致、整图除图标外完全透明`

整图规格建议（固定，便于自动切图）：
- 尺寸：`4096x4096`
- 网格：`4x4`
- 单格：`1024x1024`
- 每格四周安全留白：`>= 80px`

### 7.1 拼版 A：15 根法杖 + 1 占位

提示词：
```text
生成一张 4096x4096 的透明底法杖 icon 拼版图，4x4 网格，共 16 格。风格：暗黑奇幻、俯视角、统一光源左上35度、描边2~3px、可读性强。每格仅放1个独立图标，图标居中，不得越界，不得重叠，不得有文字，不得有面板底图。**硬性间距要求**：相邻两根法杖图标“可见像素外接框”之间的最小边缘距离必须 >= 160px；推荐同一行相邻图标中心点水平距离约 1024px、同一列相邻图标中心点垂直距离约 1024px；单根法杖图标的最长边控制在 700~760px，确保留白稳定。按从左到右、从上到下顺序填充，并严格按以下外观绘制：1 铜棕色短杖，杖头为双层旋转圆环，圆环内有橙色能量核；2 灰白骨质杖身，杖头是暗红灰烬环和碎焰颗粒；3 深青色杖身带电纹，杖头为三段同心金属环并有蓝白电弧；4 黑曜石杖身，杖头为紫黑裂隙晶体+小镰刃装饰；5 金白杖身，杖头为圣环和六角神圣水晶；6 深铁色细长杖身，杖头为红橙针状火晶尖锥；7 深褐木杖身分叉，杖头为三枚绿色发光晶体（三叉结构）；8 冰蓝长杖，杖头为矛头形冰晶片与寒霜边缘；9 重型深灰机械杖，杖头为球形核心并带黄黑警示环；10 银黑炮形杖身，杖头为多面棱镜晶簇和彩色折射高光；11 深木色藤蔓杖，杖头为不规则绿色晶芽团；12 黑铁扇骨杖身，杖头呈展开扇骨并嵌多颗小紫晶；13 深蓝杖身，杖头为双悬浮能量球并有电弧连接；14 紫银杖身，杖头为发光星骰和星形金属托架；15 暗银高科技杖身，杖头为环形天体仪与彩噪流光；16 留空占位，不绘制任何元素。整图除图标外必须完全透明。
```

### 7.2 拼版 B：效果 icon（前 16 个）

提示词：
```text
生成一张 4096x4096 的透明底技能效果 icon 拼版图，4x4 网格，共 16 格。风格统一为高对比符文图标、中心构图、边缘清晰、暗黑奇幻。每格仅放1个独立图标，不得有文字，不得有面板底图。**硬性间距要求**：相邻两枚图标可见像素外接框最小边缘距离 >= 160px；推荐相邻中心点水平/垂直距离约 1024px；单个图标最长边控制在 620~700px。按从左到右、从上到下顺序填充，并严格按以下外观绘制：1 金属弧光单刃在圆环中旋转的符文图标（近战旋刃）；2 两个青色同心环并带残影拖尾；3 红橙色刺环向外爆开的冲击图形；4 血红旋涡核心并带吸收粒子点；5 环状闪电链，多个发光节点首尾相连；6 中心锚钉符号+四向短尖刺；7 余烬弧线拖尾与飞散火星；8 暗金十字处决印记，背景深红晕光；9 圣光护环与半透明护盾纹理；10 微型黑洞中心+扭曲引力环线；11 细长穿透箭头符文（直线穿透感）；12 一分二分叉弹道符号（主干+双支路）；13 折线反弹轨迹并带反射落点；14 倒计时核心+外扩冲击环（延迟触发）；15 电弧跳链图标（多目标串联）；16 黏附凝胶核心符号（凝胶外轮廓+警示环）。整图除图标外必须完全透明。
```

### 7.3 拼版 C：效果 icon（后 14 个）+ 2 占位

提示词：
```text
生成一张 4096x4096 的透明底技能效果 icon 拼版图，4x4 网格，共 16 格。风格统一为高对比符文图标、中心构图、边缘清晰、暗黑奇幻。每格仅放1个独立图标，不得有文字，不得有面板底图。**硬性间距要求**：相邻两枚图标可见像素外接框最小边缘距离 >= 160px；推荐相邻中心点水平/垂直距离约 1024px；单个图标最长边控制在 620~700px。按从左到右、从上到下顺序填充，并严格按以下外观绘制：1 三向扇形齐射轮廓（中心向外三箭束）；2 棱镜分光图标（多色折射箭束）；3 陨石下坠符号（陨核+火焰尾迹）；4 黑洞种子图标（暗核+吸附环）；5 高随机偏折弧线（不规则曲线轨迹）；6 目标跳转锁定标记（两个目标圈+连接跳线）；7 幸运分叉符号（分叉弹道+小幸运符）；8 轮盘与冲击波叠加图形；9 弹珠反弹路径图（多次折返轨迹）；10 狙击准星+概率刻度环；11 镜像双弹体对称图标；12 量子叠加圈层（多层同心不稳定光环）；13 混沌风暴螺旋+噪声粒子；14 重投骰子+回环箭头符号；15 留空占位，不绘制任何元素；16 留空占位，不绘制任何元素。整图除图标外必须完全透明。
```

### 7.4 自动切图命名清单（按格序）

- 拼版 A：`wand_melee_bronze_orbit_icon`, `wand_melee_ash_guard_icon`, `wand_melee_storm_ring_icon`, `wand_melee_void_reaper_icon`, `wand_melee_celestial_halo_icon`, `wand_ranged_ember_spike_icon`, `wand_ranged_fork_branch_icon`, `wand_ranged_frost_lancer_icon`, `wand_ranged_bombard_core_icon`, `wand_ranged_prism_cannon_icon`, `wand_random_wild_seed_icon`, `wand_random_chaos_fan_icon`, `wand_random_echo_orb_icon`, `wand_random_starlight_lottery_icon`, `wand_random_entropy_oracle_icon`, `reserved_empty_16`
- 拼版 B：`fx_melee_orbit_blade_icon`, `fx_melee_dual_ring_icon`, `fx_melee_thorn_burst_icon`, `fx_melee_vampiric_spin_icon`, `fx_melee_chain_orbit_icon`, `fx_melee_anchor_spike_icon`, `fx_melee_ember_trail_icon`, `fx_melee_execution_mark_icon`, `fx_melee_holy_barrier_icon`, `fx_melee_singularity_orbit_icon`, `fx_shot_pierce_round_icon`, `fx_shot_split_two_icon`, `fx_shot_rebound_icon`, `fx_shot_delay_burst_icon`, `fx_shot_chain_arc_icon`, `fx_shot_sticky_bomb_icon`
- 拼版 C：`fx_shot_triple_fan_icon`, `fx_shot_prism_overload_icon`, `fx_shot_meteor_fall_icon`, `fx_shot_blackhole_seed_icon`, `fx_rand_wild_arc_icon`, `fx_rand_hop_target_icon`, `fx_rand_lucky_split_icon`, `fx_rand_roulette_bomb_icon`, `fx_rand_pinball_icon`, `fx_rand_sniper_focus_icon`, `fx_rand_mirror_shot_icon`, `fx_rand_quantum_pick_icon`, `fx_rand_entropy_storm_icon`, `fx_rand_destiny_reset_icon`, `reserved_empty_15`, `reserved_empty_16`
