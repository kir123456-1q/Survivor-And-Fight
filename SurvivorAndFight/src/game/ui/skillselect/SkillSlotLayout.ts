export interface SlotPosition {
    x: number;
    y: number;
}

/**
 * 横向槽位坐标：x_i = i * (slotWidth + gap)，y = 0。
 */
export function layoutHorizontal(
    count: number,
    slotWidth: number,
    _slotHeight: number,
    gap: number,
): SlotPosition[] {
    const positions: SlotPosition[] = [];
    for (let i = 0; i < count; i++) {
        positions.push({ x: i * (slotWidth + gap), y: 0 });
    }
    return positions;
}
