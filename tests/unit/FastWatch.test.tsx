import { vi } from 'vitest';
import * as reactTesting from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { FastWatch } from '@/FastWatch';

function makeStartedAt(secondsAgo: number): Timestamp {
    return Timestamp.fromMillis(Date.now() - secondsAgo * 1000);
}

describe('FastWatch idle state', () => {
    it('renders elapsed as 00:00:00 and target as 16:00:00 when freshly created', () => {
        reactTesting.render(
            <FastWatch id="fw1" targetSeconds={57600} elapsedSeconds={0} startedAt={null} />
        );
        expect(reactTesting.screen.getByTestId('elapsed-display')).toHaveTextContent('00:00:00');
        expect(reactTesting.screen.getByTestId('target-display')).toHaveTextContent('16:00:00');
    });

    it('shows start-button but not stop-button or reset-button in idle state', () => {
        reactTesting.render(
            <FastWatch id="fw1" targetSeconds={57600} elapsedSeconds={0} startedAt={null} />
        );
        expect(reactTesting.screen.getByTestId('start-button')).toBeInTheDocument();
        expect(reactTesting.screen.queryByTestId('stop-button')).not.toBeInTheDocument();
        expect(reactTesting.screen.queryByTestId('reset-button')).not.toBeInTheDocument();
    });
});

describe('FastWatch running state', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows stop-button and reset-button but not start-button when running', () => {
        const startedAt = makeStartedAt(10);
        reactTesting.render(
            <FastWatch id="fw1" targetSeconds={57600} elapsedSeconds={0} startedAt={startedAt} />
        );
        expect(reactTesting.screen.queryByTestId('start-button')).not.toBeInTheDocument();
        expect(reactTesting.screen.getByTestId('stop-button')).toBeInTheDocument();
        expect(reactTesting.screen.getByTestId('reset-button')).toBeInTheDocument();
    });

    it('elapsed ticks up each second while running', async () => {
        const startedAt = makeStartedAt(5);
        reactTesting.render(
            <FastWatch id="fw1" targetSeconds={57600} elapsedSeconds={0} startedAt={startedAt} />
        );
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
            <FastWatch id="fw1" targetSeconds={57600} elapsedSeconds={0} startedAt={startedAt} />
        );
        expect(container.firstChild).toHaveClass('fastwatch-card');
        expect(container.firstChild).not.toHaveClass('fastwatch-reached');
    });

    it('has green color class after target reached', async () => {
        // 1 second before target
        const startedAt = makeStartedAt(57599);
        const { container } = reactTesting.render(
            <FastWatch id="fw1" targetSeconds={57600} elapsedSeconds={0} startedAt={startedAt} />
        );
        expect(container.firstChild).not.toHaveClass('fastwatch-reached');

        await reactTesting.act(async () => {
            vi.advanceTimersByTime(1500);
        });

        expect(container.firstChild).toHaveClass('fastwatch-reached');
    });
});

describe('FastWatch paused state', () => {
    it('shows start-button and reset-button but not stop-button when paused', () => {
        reactTesting.render(
            <FastWatch id="fw1" targetSeconds={57600} elapsedSeconds={3600} startedAt={null} />
        );
        expect(reactTesting.screen.getByTestId('start-button')).toBeInTheDocument();
        expect(reactTesting.screen.getByTestId('reset-button')).toBeInTheDocument();
        expect(reactTesting.screen.queryByTestId('stop-button')).not.toBeInTheDocument();
    });

    it('displays accumulated elapsed time correctly', () => {
        reactTesting.render(
            <FastWatch id="fw1" targetSeconds={57600} elapsedSeconds={3661} startedAt={null} />
        );
        expect(reactTesting.screen.getByTestId('elapsed-display')).toHaveTextContent('01:01:01');
    });
});

describe('FastWatch controls', () => {
    it('calls onStart when start button is clicked', () => {
        const onStart = vi.fn();
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                elapsedSeconds={0}
                startedAt={null}
                onStart={onStart}
            />
        );
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('start-button'));
        expect(onStart).toHaveBeenCalledOnce();
    });

    it('calls onStop when stop button is clicked', () => {
        const onStop = vi.fn();
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                elapsedSeconds={0}
                startedAt={makeStartedAt(10)}
                onStop={onStop}
            />
        );
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('stop-button'));
        expect(onStop).toHaveBeenCalledOnce();
    });

    it('calls onReset when reset button is clicked', () => {
        const onReset = vi.fn();
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                elapsedSeconds={3600}
                startedAt={null}
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
                elapsedSeconds={0}
                startedAt={null}
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
                elapsedSeconds={0}
                startedAt={null}
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
                elapsedSeconds={0}
                startedAt={null}
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
    it('hides start, stop, reset, and delete buttons', () => {
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                elapsedSeconds={0}
                startedAt={null}
                isOwner={false}
                sharedBy="owner@example.com"
            />
        );
        expect(reactTesting.screen.queryByTestId('start-button')).not.toBeInTheDocument();
        expect(reactTesting.screen.queryByTestId('stop-button')).not.toBeInTheDocument();
        expect(reactTesting.screen.queryByTestId('reset-button')).not.toBeInTheDocument();
        expect(reactTesting.screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    });

    it('shows shared-by with owner email', () => {
        reactTesting.render(
            <FastWatch
                id="fw1"
                targetSeconds={57600}
                elapsedSeconds={0}
                startedAt={null}
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
                elapsedSeconds={3600}
                startedAt={null}
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
                elapsedSeconds={0}
                startedAt={null}
                isOwner={false}
                sharedBy="owner@example.com"
            />
        );
        expect(reactTesting.screen.queryByTestId('set-target-button')).not.toBeInTheDocument();
    });
});
