import { vi } from 'vitest';
import * as reactTesting from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { FastWatch } from '@/FastWatch';

function makeStartedAt(secondsAgo: number): Timestamp {
    return Timestamp.fromMillis(Date.now() - secondsAgo * 1000);
}

describe('FastWatch running state', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('elapsed ticks up each second while running', async () => {
        const startedAt = makeStartedAt(5);
        reactTesting.render(<FastWatch id="fw1" targetSeconds={57600} startedAt={startedAt} />);
        const before = reactTesting.screen.getByTestId('elapsed-display').textContent;

        await reactTesting.act(async () => {
            vi.advanceTimersByTime(1000);
        });

        const after = reactTesting.screen.getByTestId('elapsed-display').textContent;
        expect(after).not.toBe(before);
    });

    it('has orange color class before target reached', () => {
        const startedAt = makeStartedAt(10);
        const { container } = reactTesting.render(
            <FastWatch id="fw1" targetSeconds={57600} startedAt={startedAt} />
        );
        expect(container.firstChild).toHaveClass('fastwatch-card');
        expect(container.firstChild).not.toHaveClass('fastwatch-reached');
    });

    it('has green color class after target reached', async () => {
        const startedAt = makeStartedAt(57599);
        const { container } = reactTesting.render(
            <FastWatch id="fw1" targetSeconds={57600} startedAt={startedAt} />
        );
        expect(container.firstChild).not.toHaveClass('fastwatch-reached');

        await reactTesting.act(async () => {
            vi.advanceTimersByTime(1500);
        });

        expect(container.firstChild).toHaveClass('fastwatch-reached');
    });
});

describe('FastWatch controls', () => {
    it('calls onReset when reset button is clicked', () => {
        const onReset = vi.fn();
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                startedAt={makeStartedAt(3600)}
                onReset={onReset}
            />
        );
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('reset-button'));
        expect(onReset).toHaveBeenCalledOnce();
    });

    it('calls onDelete when delete button is clicked', () => {
        const onDelete = vi.fn();
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                startedAt={makeStartedAt(0)}
                onDelete={onDelete}
            />
        );
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('delete-button'));
        expect(onDelete).toHaveBeenCalledOnce();
    });

    it('calls onSetTarget with seconds when target is updated via input (Enter)', () => {
        const onSetTarget = vi.fn();
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                startedAt={makeStartedAt(0)}
                onSetTarget={onSetTarget}
            />
        );
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('set-target-button'));
        const input = reactTesting.screen.getByTestId('set-target-input');
        reactTesting.fireEvent.change(input, { target: { value: '18' } });
        reactTesting.fireEvent.keyDown(input, { key: 'Enter' });
        expect(onSetTarget).toHaveBeenCalledOnce();
        expect(onSetTarget).toHaveBeenCalledWith(18 * 3600);
    });

    it('calls onSetTarget with seconds when target is updated via input (blur)', () => {
        const onSetTarget = vi.fn();
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                startedAt={makeStartedAt(0)}
                onSetTarget={onSetTarget}
            />
        );
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('set-target-button'));
        const input = reactTesting.screen.getByTestId('set-target-input');
        reactTesting.fireEvent.change(input, { target: { value: '20' } });
        reactTesting.fireEvent.blur(input);
        expect(onSetTarget).toHaveBeenCalledWith(20 * 3600);
    });
});

describe('FastWatch view-only mode (isOwner=false)', () => {
    it('hides reset and delete buttons', () => {
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                startedAt={makeStartedAt(0)}
                isOwner={false}
                sharedBy="owner@example.com"
            />
        );
        expect(reactTesting.screen.queryByTestId('reset-button')).not.toBeInTheDocument();
        expect(reactTesting.screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });

    it('shows shared-by with owner email', () => {
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                startedAt={makeStartedAt(0)}
                isOwner={false}
                sharedBy="owner@example.com"
            />
        );
        expect(reactTesting.screen.getByTestId('shared-by')).toHaveTextContent('owner@example.com');
    });

    it('still displays elapsed and target', () => {
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                startedAt={makeStartedAt(3600)}
                isOwner={false}
                sharedBy="owner@example.com"
            />
        );
        expect(reactTesting.screen.getByTestId('elapsed-display')).toHaveTextContent('01:00:00');
        expect(reactTesting.screen.getByTestId('target-display')).toHaveTextContent('16:00:00');
    });

    it('hides the set-target-button', () => {
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                startedAt={makeStartedAt(0)}
                isOwner={false}
                sharedBy="owner@example.com"
            />
        );
        expect(reactTesting.screen.queryByTestId('set-target-button')).not.toBeInTheDocument();
    });
});
