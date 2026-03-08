/**
 * 最小验证：FormulaParser 与属性合并逻辑。
 * 运行方式：npx ts-node --project tsconfig.json src/game/skill/formulaParser.verify.ts
 * 或由后续单元测试框架替代。
 */
import { evaluate } from './FormulaParser';

function main(): void {
    const ctx = { atk: 10, hp: 100 };
    const v1 = evaluate('atk*1.2', ctx);
    if (Math.abs(v1 - 12) > 0.01) throw new Error(`Expected 12, got ${v1}`);
    const v2 = evaluate('atk + hp * 0.01', ctx);
    if (Math.abs(v2 - 11) > 0.01) throw new Error(`Expected 11, got ${v2}`);
    console.log('FormulaParser.verify OK');
}

main();
