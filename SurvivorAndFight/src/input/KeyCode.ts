/**
 * 常用键位常量，便于相机等模块使用。
 * 直接使用 Laya.Keyboard 的键码，保持与引擎一致。
 */
export const KeyCode = {
    W: 87,
    A: 65,
    S: 83,
    D: 68,
} as const;

export type KeyCodeType = (typeof KeyCode)[keyof typeof KeyCode];
