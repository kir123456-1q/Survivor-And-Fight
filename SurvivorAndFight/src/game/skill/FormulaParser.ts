import { ALLOWED_PATTERN, IDENT_PATTERN } from '../../defines';

/**
 * 公式解析器。属性别名从 context 提供，仅支持白名单内的标识符与四则运算。
 * 解析失败时抛出错误。
 */
export function evaluate(formula: string, context: Record<string, number>): number {
    const trimmed = formula.trim();
    if (!trimmed) return 0;
    if (!ALLOWED_PATTERN.test(trimmed)) {
        throw new Error(`FormulaParser: disallowed characters in "${formula}"`);
    }
    let expr = trimmed;
    const idents = trimmed.match(IDENT_PATTERN) ?? [];
    for (const name of idents) {
        if (name in context) {
            const val = context[name];
            const re = new RegExp(`\\b${escapeRegex(name)}\\b`, 'g');
            expr = expr.replace(re, String(Number(val)));
        }
    }
    try {
        const fn = new Function(`return (${expr});`);
        const result = fn();
        return typeof result === 'number' && Number.isFinite(result) ? result : 0;
    } catch (e) {
        throw new Error(`FormulaParser: failed to evaluate "${formula}": ${e}`);
    }
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
