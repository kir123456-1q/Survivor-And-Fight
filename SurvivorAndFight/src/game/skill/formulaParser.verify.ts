/**
 * FormulaParser（公式树）最小验证。
 * 运行：npx ts-node --project tsconfig.json src/game/skill/formulaParser.verify.ts
 */
import { evaluate, evaluateFormula, parseFormula } from './FormulaParser';

function assertClose(actual: number, expected: number, label: string): void {
    if (Math.abs(actual - expected) > 0.01) {
        throw new Error(`${label}: expected ${expected}, got ${actual}`);
    }
}

function assertThrows(fn: () => void, label: string): void {
    try {
        fn();
        throw new Error(`${label}: expected throw`);
    } catch (e) {
        if (e instanceof Error && e.message.includes('expected throw')) throw e;
    }
}

function main(): void {
    const ctx = { atk: 10, hp: 100, maxHp: 100 };

    assertClose(evaluate('atk*1.2', ctx), 12, 'mul');
    assertClose(evaluate('atk + hp * 0.01', ctx), 11, 'add-mul');
    assertClose(evaluate('(atk + 5) * 2', ctx), 30, 'paren');

    const tree = parseFormula('hp - atk');
    if (tree.kind !== 'binary' || tree.op !== '-') {
        throw new Error('parseFormula: expected binary -');
    }
    assertClose(evaluateFormula(tree, ctx), 90, 'tree eval');

    const same = parseFormula('atk*2');
    assertClose(evaluateFormula(same, ctx), 20, 'reuse tree');

    assertThrows(() => evaluate('atk;drop', ctx), 'illegal char');
    assertThrows(() => evaluate('unknown_stat * 2', ctx), 'unknown ident');

    console.log('FormulaParser.verify OK (formula tree)');
}

main();
