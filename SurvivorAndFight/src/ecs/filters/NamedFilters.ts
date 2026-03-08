import type { FilterRegistry } from './FilterRegistry';
import { PlayerTag } from '../components/PlayerTag';
import { MonsterTag } from '../components/MonsterTag';
import { Control } from '../components/Control';
import { Position, Velocity } from '../components/TransformComponents';

/**
 * 注册命名筛选器：Players、Monsters、Controllable、Movable。
 * 在创建 FilterRegistry 后调用一次即可。
 */
export function registerNamedFilters(registry: FilterRegistry): void {
    registry.registerNamedFilter('Players', [PlayerTag]);
    registry.registerNamedFilter('Monsters', [MonsterTag]);
    registry.registerNamedFilter('Controllable', [Control]);
    registry.registerNamedFilter('Movable', [Position, Velocity]);
}
