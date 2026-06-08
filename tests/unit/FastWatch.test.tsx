import { vi } from 'vitest';
import * as reactTesting from '@testing-library/react';
import { Timestamp } from 'firebase/firestore';
import { FastWatch } from '@/FastWatch';

function makeStartedAt(secondsAgo: number): Timestamp {
    return Timestamp.fromMillis(Date.now() - secondsAgo * 1000);
}

const confirmMethods = [
    {
        label: 'Enter key',
        confirm: (input: HTMLElement) => {
            reactTesting.fireEvent.keyDown(input, { key: 'Enter' });
        },
    },
    {
        label: 'blur',
        confirm: (input: HTMLElement) => {
            reactTesting.fireEvent.blur(input);
        },
    },
];

describe('FastWatch running state', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('elapsed ticks up each second while running', async () => {
        const startedAt = makeStartedAt(5);
        reactTesting.render(
            <FastWatch id="fw1" name="Test Fast" targetSeconds={57600} startedAt={startedAt} />
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
            <FastWatch id="fw1" name="Test Fast" targetSeconds={57600} startedAt={startedAt} />
        );
        expect(container.firstChild).toHaveClass('fastwatch-card');
        expect(container.firstChild).not.toHaveClass('fastwatch-reached');
    });

    it('has green color class after target reached', async () => {
        const startedAt = makeStartedAt(57599);
        const { container } = reactTesting.render(
            <FastWatch id="fw1" name="Test Fast" targetSeconds={57600} startedAt={startedAt} />
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
                name="Test Fast"
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
                name="Test Fast"
                targetSeconds={57600}
                startedAt={makeStartedAt(0)}
                onDelete={onDelete}
            />
        );
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('delete-button'));
        expect(onDelete).toHaveBeenCalledOnce();
    });

    it.each(confirmMethods)(
        'calls onSetTarget with seconds when target is updated via input ($label)',
        ({ confirm }) => {
            const onSetTarget = vi.fn();
            reactTesting.render(
                <FastWatch
                    id="fw1"
                    name="Test Fast"
                    targetSeconds={57600}
                    startedAt={makeStartedAt(0)}
                    onSetTarget={onSetTarget}
                />
            );
            reactTesting.fireEvent.click(reactTesting.screen.getByTestId('set-target-button'));
            const input = reactTesting.screen.getByTestId('set-target-input');
            reactTesting.fireEvent.change(input, { target: { value: '18' } });
            confirm(input);
            expect(onSetTarget).toHaveBeenCalledOnce();
            expect(onSetTarget).toHaveBeenCalledWith(18 * 3600);
        }
    );
});

describe('FastWatch view-only mode (isOwner=false)', () => {
    it('hides reset and delete buttons', () => {
        reactTesting.render(
            <FastWatch
                id="fw1"
                name="Test Fast"
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
                name="Test Fast"
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
                name="Test Fast"
                targetSeconds={57600}
                startedAt={makeStartedAt(3600)}
                isOwner={false}
                sharedBy="owner@example.com"
            />
        );
        expect(reactTesting.screen.getByTestId('elapsed-display')).toHaveTextContent('01:00:00');
        expect(reactTesting.screen.getByTestId('target-display')).toHaveTextContent('16:00:00');
    });

    it('hides the set-target-button and set-start-button', () => {
        reactTesting.render(
            <FastWatch
                id="fw1"
                name="Test Fast"
                targetSeconds={57600}
                startedAt={makeStartedAt(0)}
                isOwner={false}
                sharedBy="owner@example.com"
            />
        );
        expect(reactTesting.screen.queryByTestId('set-target-button')).not.toBeInTheDocument();
        expect(reactTesting.screen.queryByTestId('set-start-button')).not.toBeInTheDocument();
    });
});

describe('FastWatch set start time', () => {
    it('initializes the input with the current startedAt value', () => {
        const startMs = new Date(2026, 5, 8, 8, 0, 0).getTime();
        const startedAt = Timestamp.fromMillis(startMs);
        reactTesting.render(
            <FastWatch id="fw1" name="Test Fast" targetSeconds={57600} startedAt={startedAt} />
        );
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('set-start-button'));
        const input = reactTesting.screen.getByTestId('set-start-input') as HTMLInputElement;
        expect(input.value).toBe('2026-06-08T08:00');
    });

    it.each(confirmMethods)(
        'calls onSetStart with a Timestamp when start is committed via dialog ($label)',
        ({ confirm }) => {
            const onSetStart = vi.fn();
            reactTesting.render(
                <FastWatch
                    id="fw1"
                    name="Test Fast"
                    targetSeconds={57600}
                    startedAt={makeStartedAt(0)}
                    onSetStart={onSetStart}
                />
            );
            reactTesting.fireEvent.click(reactTesting.screen.getByTestId('set-start-button'));
            const input = reactTesting.screen.getByTestId('set-start-input');
            reactTesting.fireEvent.change(input, { target: { value: '2026-06-08T08:00' } });
            confirm(input);
            expect(onSetStart).toHaveBeenCalledOnce();
            const timestamp = onSetStart.mock.calls[0][0] as Timestamp;
            expect(timestamp.toMillis()).toBe(new Date('2026-06-08T08:00').getTime());
        }
    );
});

describe('FastWatch name', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it.each([
        { label: 'owner', isOwner: true },
        { label: 'viewer', isOwner: false, sharedBy: 'owner@example.com' },
    ])('displays the name ($label)', ({ isOwner, sharedBy }) => {
        reactTesting.render(
            <FastWatch
                id="fw1"
                name="My Fast"
                targetSeconds={57600}
                startedAt={makeStartedAt(0)}
                isOwner={isOwner}
                sharedBy={sharedBy}
            />
        );
        expect(reactTesting.screen.getByText('My Fast')).toBeInTheDocument();
    });

    it.each(confirmMethods)(
        'calls onRename when name is committed ($label)',
        async ({ confirm }) => {
            const onRename = vi.fn();
            reactTesting.render(
                <FastWatch
                    id="fw1"
                    name="My Fast"
                    targetSeconds={57600}
                    startedAt={null}
                    onRename={onRename}
                />
            );
            reactTesting.fireEvent.click(reactTesting.screen.getByText('My Fast'));
            const input = reactTesting.screen.getByTestId('name-input');
            reactTesting.fireEvent.change(input, { target: { value: 'New Name' } });
            confirm(input);
            await reactTesting.act(async () => {
                vi.runAllTimers();
            });
            expect(onRename).toHaveBeenCalledOnce();
            expect(onRename).toHaveBeenCalledWith('New Name');
        }
    );
});
