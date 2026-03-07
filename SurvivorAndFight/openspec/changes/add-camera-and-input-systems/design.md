# Design: 相机控制与输入封装

## Context
- 引擎：LayaAir 3.x，已有 3D 场景与 ECS Demo；场景中存在 Camera 节点。
- 目标：在不改动 ECS 核心的前提下，增加相机控制与输入抽象，并实现 WASD 平移、滚轮缩放的相机行为。
- 约束：先实现单相机、单套键位；输入层与 Laya 键盘/鼠标 API 绑定，但通过抽象接口暴露，便于后续替换。

## Goals / Non-Goals
- Goals:
  - 提供相机控制接口（位置、朝向、缩放/距离的读写与增量移动、缩放）。
  - 提供输入封装接口（键盘按键是否按下、滚轮增量等），便于相机等模块使用。
  - 实现“WASD 平移 + 滚轮缩放”的相机控制逻辑，键位与灵敏度可配置。
- Non-Goals:
  - 不实现多相机切换、相机动画或复杂跟随逻辑。
  - 不实现触摸/手柄的完整抽象（可预留接口）。
  - 不强制将相机纳入 ECS（可与现有 Scene 中的 Camera 直接绑定）。

## Decisions
- **相机控制**：提供 `CameraController`（或等价命名）类，持有对 Laya Camera 节点的引用，提供 `setPosition`/`move`、`setZoom`/`zoom`（或距离）等接口；具体坐标系与 Laya.Transform3D 一致。
- **输入封装**：提供 `InputService`（或等价命名），封装 Laya 的键盘与鼠标事件，暴露如 `isKeyDown(keyCode)`、`getMouseWheelDelta()` 等接口；键位使用常量或枚举（如 W/A/S/D、MouseWheel）。
- **相机移动逻辑**：单独模块或类（如 `CameraMoveByInput`），每帧读取 Input 状态，调用 CameraController 的 move/zoom，WASD 对应水平面平移，滚轮对应沿视线方向前后移动或 FOV/距离缩放；速度与灵敏度可配置。
- **挂接方式**：在 Main 或 Demo 入口创建 CameraController 与 InputService，在帧循环中先更新 Input（若有“本帧增量”），再执行 CameraMoveByInput.update(dt)。

## Risks / Trade-offs
- 输入与 Laya 强绑定：通过接口抽象，后续可替换为其他输入源或测试 mock。
- 相机仅支持一种控制模式：先满足观察者/编辑相机需求，跟随、过肩等留待后续变更。

## Migration Plan
- 无迁移；纯新增模块。若后续将相机纳入 ECS，可将 CameraController 改为读写 ECS 组件或与 Entity 绑定。

## Open Questions
- 缩放语义：优先“沿视线前后移动”还是“改变 FOV/距离”？建议先实现“沿视线前后移动”（与 WASD 同一套平移模型）。
