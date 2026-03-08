/**
 * 最小验证：属性合并顺序（先加算后乘算）与溯源。
 * 运行方式：npx ts-node 或由后续单元测试框架替代。
 */
import { EcsWorld } from './core/World';
import { Attribute, type AttributeModifier } from './components/Attribute';
import { AttributeSystem } from './systems/AttributeSystem';

function main(): void {
    const world = new EcsWorld();
    const e = world.createEntity();
    world.addComponent(e, Attribute, new Attribute({ atk: 10 }, []));
    const attrSystem = new AttributeSystem(world);

    if (attrSystem.getFinalValue(e, 'atk') !== 10) throw new Error('base atk');

    attrSystem.addModifier(e, { sourceId: 'buff1', type: 'add', key: 'atk', value: 5 });
    attrSystem.addModifier(e, { sourceId: 'buff2', type: 'multiply', key: 'atk', value: 2 });
    const finalAtk = attrSystem.getFinalValue(e, 'atk');
    if (finalAtk !== 30) throw new Error(`Expected (10+5)*2=30, got ${finalAtk}`);

    attrSystem.removeModifiersBySource(e, 'buff1');
    if (attrSystem.getFinalValue(e, 'atk') !== 20) throw new Error('After remove: 10*2=20');

    console.log('attributeModifier.verify OK');
}

main();
