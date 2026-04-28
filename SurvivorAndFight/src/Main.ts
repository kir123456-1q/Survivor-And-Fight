const { regClass } = Laya;

import { CONFIG_BASE, DESIGN_WIDTH, DESIGN_HEIGHT } from './defines';
import { SimpleEcsDemo } from './game/demo/SimpleEcsDemo';
import { InputService } from './input/InputService';
import { ControlInputAdapter } from './input/ControlInputAdapter';
import { Data, initData } from './config/Data';
import type { TablesRegistryJson } from './config/TablesRegistry';

/** 参考 LayaProject2：脚本挂在 Area2D 子节点上，不挂在场景根，避免 3D 管线（_addRenderObject / cullInfoCamera）。 */
@regClass()
export class Main extends Laya.Script {
    declare owner: Laya.Area2D;

    private demo: SimpleEcsDemo | null = null;
    private input: InputService | null = null;
    private controlInput: ControlInputAdapter | null = null;
    /** 2D 相机跟随：平滑系数 0~1，越大跟得越紧；0 表示不跟随。 */
    private cameraFollowSmooth = 0.12;

    onStart() {
        // 2D：this.owner 为场景中的 Area2D（GameRoot），用作游戏根容器
        const container = this.owner && (this.owner as any).addChild ? this.owner : null;
        this.input = new InputService();
        this.controlInput = new ControlInputAdapter(this.input);
        this.demo = new SimpleEcsDemo(container, null, this.controlInput);

        Laya.timer.frameLoop(1, this, this.onFrameLoop);
        this.loadConfigAndInitDemo();
    }

    /** 加载配表（Character 等）后按预制体生成玩家与怪物。配表需在 CONFIG_BASE 下；若返回 HTML(404) 会尝试 config/。 */
    private async loadConfigAndInitDemo(): Promise<void> {
        const bases = ['config/', CONFIG_BASE];
        for (const base of bases) {
            try {
                const r = await fetch(base + 'tables.registry.json');
                if (!r.ok) continue;
                const ct = r.headers.get('content-type') ?? '';
                if (ct.indexOf('json') === -1) continue;
                const registry = await r.json() as TablesRegistryJson;
                await initData(registry, async (path: string) => {
                    const res = await fetch(base + path);
                    if (!res.ok) throw new Error(path + ' ' + res.status);
                    const text = await res.text();
                    try { return JSON.parse(text); } catch { throw new Error(path + ' not JSON'); }
                });
                console.log('[Config] loaded base', base, {
                    tables: Object.keys(Data),
                    hasSkill: !!Data.Skill,
                    hasSkillEffect: !!Data.SkillEffect,
                    hasBullet: !!Data.Bullet,
                    playerAutoSkillRow: Data.Skill?.GetByID?.('player_auto_shot'),
                });
                break;
            } catch (e) {
                if (base === bases[bases.length - 1]) console.warn('Main: config load failed (tried ' + bases.join(', ') + ')', e);
            }
        }
        if (this.demo) await this.demo.init();
    }

    private onFrameLoop(): void {
        const deltaTimeSeconds = Laya.timer.delta / 1000;
        if (this.input) this.input.update();
        if (this.demo) this.demo.update(deltaTimeSeconds);
        this.updateCameraFollow(deltaTimeSeconds);
    }

    /** 2D 相机跟随：移动游戏根容器使玩家保持在屏幕中心。 */
    private updateCameraFollow(deltaTime: number): void {
        const container = this.owner as any;
        if (!container || !this.demo) return;
        const pos = this.demo.getPlayerPosition();
        if (!pos) return;
        const centerX = (typeof Laya.stage.designWidth === 'number' ? Laya.stage.designWidth : DESIGN_WIDTH) * 0.5;
        const centerY = (typeof Laya.stage.designHeight === 'number' ? Laya.stage.designHeight : DESIGN_HEIGHT) * 0.5;
        const targetX = centerX - pos.x;
        const targetY = centerY - pos.y;
        if (this.cameraFollowSmooth <= 0) {
            container.x = targetX;
            container.y = targetY;
        } else {
            const t = 1 - Math.pow(1 - this.cameraFollowSmooth, deltaTime * 60);
            container.x += (targetX - container.x) * t;
            container.y += (targetY - container.y) * t;
        }
    }
}