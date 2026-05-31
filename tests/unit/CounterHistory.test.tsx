import { vi } from 'vitest';
import * as reactTesting from '@testing-library/react';
import { CounterHistory } from '@/CounterHistory';
import type { HistoryEntry } from '@/useCounterHistory';
import { Timestamp } from 'firebase/firestore';

vi.mock('@/useCounterHistory', () => ({
    useCounterHistory: vi.fn(),
}));

import { useCounterHistory } from '@/useCounterHistory';
const mockUseCounterHistory = vi.mocked(useCounterHistory);

function makeEntry(
    id: string,
    operation: HistoryEntry['operation'],
    value: number,
    secondsAgo: number
): HistoryEntry {
    const ms = Date.now() - secondsAgo * 1000;
    return {
        id,
        operation,
        value,
        timestamp: Timestamp.fromMillis(ms),
    };
}

describe('CounterHistory', () => {
    it('renders the Back button and counter name heading', () => {
        mockUseCounterHistory.mockReturnValue([]);
        reactTesting.render(
            <CounterHistory counterId="cid" ownerUid="uid" counterName="Apples" onBack={vi.fn()} />
        );
        expect(reactTesting.screen.getByTestId('back-button')).toBeInTheDocument();
        expect(reactTesting.screen.getByText(/Apples/)).toBeInTheDocument();
    });

    it('calls onBack when the Back button is clicked', () => {
        mockUseCounterHistory.mockReturnValue([]);
        const onBack = vi.fn();
        reactTesting.render(
            <CounterHistory counterId="cid" ownerUid="uid" counterName="Apples" onBack={onBack} />
        );
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('back-button'));
        expect(onBack).toHaveBeenCalledOnce();
    });

    it('renders an empty table when there are no history entries', () => {
        mockUseCounterHistory.mockReturnValue([]);
        reactTesting.render(
            <CounterHistory counterId="cid" ownerUid="uid" counterName="Apples" onBack={vi.fn()} />
        );
        expect(reactTesting.screen.queryAllByTestId('history-op')).toHaveLength(0);
    });

    it('renders a row for each history entry with correct op and value', () => {
        const entries: HistoryEntry[] = [
            makeEntry('e1', 'inc', 5, 60),
            makeEntry('e2', 'dec', 4, 3600),
            makeEntry('e3', 'set', 10, 86400),
        ];
        mockUseCounterHistory.mockReturnValue(entries);
        reactTesting.render(
            <CounterHistory counterId="cid" ownerUid="uid" counterName="Apples" onBack={vi.fn()} />
        );

        const ops = reactTesting.screen.getAllByTestId('history-op');
        const values = reactTesting.screen.getAllByTestId('history-value');

        expect(ops).toHaveLength(3);
        expect(ops[0]).toHaveTextContent('inc');
        expect(ops[1]).toHaveTextContent('dec');
        expect(ops[2]).toHaveTextContent('set');

        expect(values[0]).toHaveTextContent('5');
        expect(values[1]).toHaveTextContent('4');
        expect(values[2]).toHaveTextContent('10');
    });

    it('renders relative and full timestamps for each entry', () => {
        const entries: HistoryEntry[] = [makeEntry('e1', 'inc', 1, 120)];
        mockUseCounterHistory.mockReturnValue(entries);
        reactTesting.render(
            <CounterHistory counterId="cid" ownerUid="uid" counterName="Apples" onBack={vi.fn()} />
        );

        const relative = reactTesting.screen.getByTestId('history-relative');
        const full = reactTesting.screen.getByTestId('history-full');

        // 120 seconds ago → should contain "minute" in relative format
        expect(relative.textContent).toMatch(/minute/i);
        // Full timestamp should be a non-empty date string
        expect(full.textContent).not.toBe('—');
        expect(full.textContent!.length).toBeGreaterThan(5);
    });

    it('renders — for null timestamps', () => {
        const entry: HistoryEntry = { id: 'e1', operation: 'set', value: 0, timestamp: null };
        mockUseCounterHistory.mockReturnValue([entry]);
        reactTesting.render(
            <CounterHistory counterId="cid" ownerUid="uid" counterName="Apples" onBack={vi.fn()} />
        );

        expect(reactTesting.screen.getByTestId('history-relative')).toHaveTextContent('—');
        expect(reactTesting.screen.getByTestId('history-full')).toHaveTextContent('—');
    });
});
