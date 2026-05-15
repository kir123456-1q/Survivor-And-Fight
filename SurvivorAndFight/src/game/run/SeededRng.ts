/** 由 RunSeed.value 派生的确定性 PRNG（mulberry32）。 */
export class SeededRng {
    private state: number;

    constructor(seedText: string) {
        let h = 0;
        for (let i = 0; i < seedText.length; i++) {
            h = Math.imul(31, h) + seedText.charCodeAt(i);
            h |= 0;
        }
        this.state = h >>> 0;
    }

    next(): number {
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    int(min: number, max: number): number {
        return min + Math.floor(this.next() * (max - min + 1));
    }

    pick<T>(items: T[]): T {
        return items[this.int(0, items.length - 1)];
    }
}
