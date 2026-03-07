## 1. 输入封装系统（input-abstraction）
- [x] 1.1 创建输入抽象模块目录与入口（如 `src/input/`）
- [x] 1.2 实现键盘按键状态查询（如 isKeyDown(keyCode)），基于 Laya 键盘 API 封装
- [x] 1.3 实现鼠标滚轮增量查询（如 getMouseWheelDelta()），每帧可读后清零或按帧累计
- [x] 1.4 定义常用键位常量或枚举（W/A/S/D 等），便于相机等模块使用

## 2. 相机控制系统（camera-control）
- [x] 2.1 创建相机控制模块目录与入口（如 `src/camera/` 或 `src/game/camera/`）
- [x] 2.2 实现相机控制接口：绑定 Laya Camera 节点，提供位置/朝向的读写及 move、zoom（或沿视线前后移动）接口
- [x] 2.3 实现基于输入的相机移动逻辑：读取 Input 的 WASD 与滚轮，每帧调用相机 move/zoom，支持配置移动速度与滚轮灵敏度
- [x] 2.4 在 Main 或 Demo 中创建 CameraController 与 InputService，在帧循环中先更新输入再更新相机移动逻辑

## 3. 验证
- [x] 3.1 在 3D 场景中验证：WASD 可平移相机，滚轮可缩放（或前后移动）相机，无控制冲突
