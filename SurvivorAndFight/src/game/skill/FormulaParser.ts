import { ALLOWED_PATTERN } from '../../defines';

/** 公式树节点：配表伤害表达式解析后的 AST，求值时不经过 eval/Function。 */
export type FormulaNode =
    | { kind: 'number'; value: number }
    | { kind: 'ident'; name: string }
    | { kind: 'unary'; op: '-'; child: FormulaNode }
    | { kind: 'binary'; op: '+' | '-' | '*' | '/'; left: FormulaNode; right: FormulaNode };

type BinaryOp = '+' | '-' | '*' | '/';

type Token =
    | { type: 'number'; value: number }
    | { type: 'ident'; name: string }
    | { type: 'op'; value: BinaryOp }
    | { type: 'lparen' }
    | { type: 'rparen' };

/**
 * 将配表字符串解析为公式树。仅允许数字、标识符、括号与四则运算符。
 */
export function parseFormula(formula: string): FormulaNode {
    const trimmed = formula.trim();
    if (!trimmed) {
        return { kind: 'number', value: 0 };
    }
    if (!ALLOWED_PATTERN.test(trimmed)) {
        throw new Error(`FormulaParser: disallowed characters in "${formula}"`);
    }
    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens);
    const node = parser.parseExpression();
    if (!parser.isAtEnd()) {
        throw new Error(`FormulaParser: unexpected token in "${formula}"`);
    }
    return node;
}

/**
 * 对公式树求值。标识符必须在 context 中，否则抛错。
 */
export function evaluateFormula(node: FormulaNode, context: Record<string, number>): number {
    switch (node.kind) {
        case 'number':
            return node.value;
        case 'ident': {
            if (!(node.name in context)) {
                throw new Error(`FormulaParser: unknown identifier "${node.name}"`);
            }
            const v = context[node.name];
            return typeof v === 'number' && Number.isFinite(v) ? v : 0;
        }
        case 'unary': {
            const v = evaluateFormula(node.child, context);
            return -v;
        }
        case 'binary': {
            const left = evaluateFormula(node.left, context);
            const right = evaluateFormula(node.right, context);
            switch (node.op) {
                case '+':
                    return left + right;
                case '-':
                    return left - right;
                case '*':
                    return left * right;
                case '/':
                    if (right === 0) return 0;
                    return left / right;
            }
        }
    }
}

/**
 * 解析并求值（对外主入口，与 EffectExecutor 直伤逻辑对接）。
 */
export function evaluate(formula: string, context: Record<string, number>): number {
    try {
        const tree = parseFormula(formula);
        const result = evaluateFormula(tree, context);
        return typeof result === 'number' && Number.isFinite(result) ? result : 0;
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`FormulaParser: failed to evaluate "${formula}": ${msg}`);
    }
}

function tokenize(src: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < src.length) {
        const ch = src[i];
        if (/\s/.test(ch)) {
            i += 1;
            continue;
        }
        if (ch === '(') {
            tokens.push({ type: 'lparen' });
            i += 1;
            continue;
        }
        if (ch === ')') {
            tokens.push({ type: 'rparen' });
            i += 1;
            continue;
        }
        if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
            tokens.push({ type: 'op', value: ch });
            i += 1;
            continue;
        }
        if (/\d/.test(ch) || (ch === '.' && i + 1 < src.length && /\d/.test(src[i + 1]))) {
            let j = i;
            while (j < src.length && /[\d.]/.test(src[j])) j += 1;
            const num = Number(src.slice(i, j));
            if (!Number.isFinite(num)) {
                throw new Error(`FormulaParser: invalid number near "${src.slice(i, j)}"`);
            }
            tokens.push({ type: 'number', value: num });
            i = j;
            continue;
        }
        if (/[a-zA-Z_]/.test(ch)) {
            let j = i + 1;
            while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j += 1;
            tokens.push({ type: 'ident', name: src.slice(i, j) });
            i = j;
            continue;
        }
        throw new Error(`FormulaParser: unexpected character "${ch}"`);
    }
    return tokens;
}

class Parser {
    private index = 0;

    constructor(private readonly tokens: Token[]) {}

    isAtEnd(): boolean {
        return this.index >= this.tokens.length;
    }

    parseExpression(): FormulaNode {
        return this.parseAddSub();
    }

    private parseAddSub(): FormulaNode {
        let node = this.parseMulDiv();
        while (this.matchOp('+', '-')) {
            const op = this.previousOp()!;
            const right = this.parseMulDiv();
            node = { kind: 'binary', op, left: node, right };
        }
        return node;
    }

    private parseMulDiv(): FormulaNode {
        let node = this.parseUnary();
        while (this.matchOp('*', '/')) {
            const op = this.previousOp()!;
            const right = this.parseUnary();
            node = { kind: 'binary', op, left: node, right };
        }
        return node;
    }

    private parseUnary(): FormulaNode {
        if (this.matchOp('-')) {
            return { kind: 'unary', op: '-', child: this.parseUnary() };
        }
        return this.parsePrimary();
    }

    private parsePrimary(): FormulaNode {
        if (this.match('number')) {
            return { kind: 'number', value: (this.previous() as { type: 'number'; value: number }).value };
        }
        if (this.match('ident')) {
            return { kind: 'ident', name: (this.previous() as { type: 'ident'; name: string }).name };
        }
        if (this.match('lparen')) {
            const expr = this.parseExpression();
            this.consume('rparen', 'expected ")" after expression');
            return expr;
        }
        throw new Error('FormulaParser: expected number, identifier or "("');
    }

    private match(type: Token['type']): boolean {
        if (this.isAtEnd()) return false;
        if (this.tokens[this.index].type !== type) return false;
        this.index += 1;
        return true;
    }

    private matchOp(...ops: BinaryOp[]): boolean {
        if (this.isAtEnd()) return false;
        const t = this.tokens[this.index];
        if (t.type !== 'op' || !ops.includes(t.value)) return false;
        this.index += 1;
        return true;
    }

    private consume(type: Token['type'], message: string): void {
        if (this.match(type)) return;
        throw new Error(`FormulaParser: ${message}`);
    }

    private previous(): Token {
        return this.tokens[this.index - 1];
    }

    private previousOp(): BinaryOp | null {
        const t = this.previous();
        return t.type === 'op' ? t.value : null;
    }
}
