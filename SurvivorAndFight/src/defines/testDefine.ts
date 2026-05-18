/**
 * 性能/弹幕测试关卡与测试法杖静态配置。
 */

/** 测试法杖技能 id（装备栏前三格）。 */
export const TEST_WAND_SKILL_IDS = [
    'wand_test_burst_10',
    'wand_test_burst_100',
    'wand_test_burst_1000',
] as const;

/** 测试法杖绑定的 Effect id。 */
export const TEST_WAND_EFFECT_IDS = [
    'fx_test_burst_10',
    'fx_test_burst_100',
    'fx_test_burst_1000',
] as const;

/**
 * 测试关六波同屏怪物数：1–3 波规模曲线；4–6 波与第 3 波同为 1000，仅消融池/Worker。
 */
export const TEST_WAVE_MONSTER_COUNTS: readonly number[] = [10, 100, 1000, 1000, 1000, 1000];

/** 测试关卡总波数（含消融段）。 */
export const TEST_WAVE_COUNT = TEST_WAVE_MONSTER_COUNTS.length;

/** 第 4–6 波起始下标（0-based，对应波次 4/5/6）。 */
export const TEST_ABLATION_WAVE_START_INDEX = 3;

/** 每波自动采样时长（秒），不依赖击杀。 */
export const TEST_WAVE_DURATION_SEC = 10;

/** 进入测试关（选关 Level3）：自动跑满 6 波。 */
export const TEST_LEVEL_DIFFICULTY = 3 as const;

export type TestAblationPresetId = 'baseline' | 'pool_only' | 'pool_worker';

export interface TestAblationPreset {
    readonly id: TestAblationPresetId;
    readonly label: string;
    readonly usePool: boolean;
    readonly useWorker: boolean;
    readonly thesisNote: string;
}

/** 论文表 7.2：第 4/5/6 波对应配置（顺序固定）。 */
export const TEST_ABLATION_PRESETS: readonly TestAblationPreset[] = [
    {
        id: 'baseline',
        label: '基线',
        usePool: false,
        useWorker: false,
        thesisNote: '无池、无 Worker',
    },
    {
        id: 'pool_only',
        label: '仅对象池',
        usePool: true,
        useWorker: false,
        thesisNote: 'BulletPool + MonsterPool',
    },
    {
        id: 'pool_worker',
        label: '池 + Worker',
        usePool: true,
        useWorker: true,
        thesisNote: '池化且实体数达标启用 Worker',
    },
] as const;

export const TEST_ABLATION_WAVE_COUNT = TEST_ABLATION_PRESETS.length;

/** 是否为消融波（第 4–6 波）。 */
export function isAblationTestWave(waveIndex: number): boolean {
    return waveIndex >= TEST_ABLATION_WAVE_START_INDEX
        && waveIndex < TEST_ABLATION_WAVE_START_INDEX + TEST_ABLATION_WAVE_COUNT;
}

/** 消融波下标 → 预设下标（0..2）。 */
export function getAblationPresetIndex(waveIndex: number): number {
    return waveIndex - TEST_ABLATION_WAVE_START_INDEX;
}
