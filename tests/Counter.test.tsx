import { vi } from 'vitest';
import { useState } from 'react';
import * as reactTesting from '@testing-library/react';
import * as Counter from '../src/Counter';

function ControlledCounter(props: Counter.Props) {
    const [count, setCount] = useState(props.count);
    return (
        <Counter.Counter
            {...props}
            count={count}
            onChange={(changes) => {
                if (changes.count !== undefined) setCount(changes.count);
            }}
        />
    );
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

describe('Basic functionality', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it.each(confirmMethods)('initial state requires name ($label)', async ({ confirm }) => {
        const onChange = vi.fn<(changes: { id: string; name?: string; count?: number }) => void>();
        reactTesting.render(
            <Counter.Counter id="mycounter-id" name="" count={0} onChange={onChange} />
        );

        expect(reactTesting.screen.getByTestId('name-input')).toBeVisible();
        expect(reactTesting.screen.queryByText('inc')).not.toBeInTheDocument();
        expect(reactTesting.screen.queryByText('dec')).not.toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();

        const nameInput = reactTesting.screen.getByTestId('name-input');
        reactTesting.fireEvent.change(nameInput, { target: { value: 'My Counter' } });
        confirm(nameInput);
        await reactTesting.act(async () => {
            vi.runAllTimers();
        });

        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledWith({ id: 'mycounter-id', name: 'My Counter' });
        expect(reactTesting.screen.queryByTestId('name-input')).not.toBeVisible();
    });

    it.each(confirmMethods)('modify-name ($label)', async ({ confirm }) => {
        const onChange = vi.fn<(changes: { id: string; name?: string; count?: number }) => void>();
        reactTesting.render(
            <Counter.Counter id="mycounter-id" name="My Counter" count={0} onChange={onChange} />
        );

        expect(reactTesting.screen.getByText('My Counter')).toBeInTheDocument();
        expect(reactTesting.screen.getByTestId('name-input')).not.toBeVisible();
        expect(onChange).not.toHaveBeenCalled();

        reactTesting.fireEvent.click(reactTesting.screen.getByText('My Counter'));

        let nameInput = reactTesting.screen.getByTestId('name-input');
        expect(nameInput).toHaveValue('My Counter');
        expect(nameInput).toBeVisible();
        reactTesting.fireEvent.change(nameInput, { target: { value: 'Renamed Counter' } });
        confirm(nameInput);
        await reactTesting.act(async () => {
            vi.runAllTimers();
        });

        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledWith({ id: 'mycounter-id', name: 'Renamed Counter' });
        nameInput = reactTesting.screen.getByTestId('name-input');
        expect(nameInput).not.toBeVisible();
    });
});

describe('Counter value', () => {
    it('starts at 0', () => {
        reactTesting.render(<Counter.Counter id="mycounter-id" name="My Counter" count={0} />);
        expect(reactTesting.screen.getByTestId('counter')).toHaveTextContent('0');
    });

    it('inc increments counter', () => {
        reactTesting.render(<ControlledCounter id="mycounter-id" name="My Counter" count={55} />);
        reactTesting.fireEvent.click(reactTesting.screen.getByText('inc'));
        expect(reactTesting.screen.getByTestId('counter')).toHaveTextContent('56');
    });

    it('dec decrements counter', () => {
        reactTesting.render(<ControlledCounter id="mycounter-id" name="My Counter" count={45} />);
        reactTesting.fireEvent.click(reactTesting.screen.getByText('dec'));
        expect(reactTesting.screen.getByTestId('counter')).toHaveTextContent('44');
    });

    it.each(confirmMethods)('set allows setting an arbitrary value ($label)', ({ confirm }) => {
        reactTesting.render(<ControlledCounter id="mycounter-id" name="My Counter" count={0} />);
        expect(reactTesting.screen.getByTestId('counter')).toHaveTextContent('0');

        const value = Math.floor(Math.random() * 100) + 1;

        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('set-button'));
        const setInput = reactTesting.screen.getByTestId('set-input');
        expect(setInput).toHaveValue('0');
        reactTesting.fireEvent.change(setInput, { target: { value: String(value) } });
        confirm(setInput);

        expect(reactTesting.screen.getByTestId('counter')).toHaveTextContent(String(value));
    });
});

describe('View-only mode (isOwner=false)', () => {
    it('hides inc, dec, and set buttons', () => {
        reactTesting.render(
            <Counter.Counter id="mycounter-id" name="My Counter" count={5} isOwner={false} sharedBy="owner@example.com" />
        );
        expect(reactTesting.screen.queryByText('inc')).not.toBeInTheDocument();
        expect(reactTesting.screen.queryByText('dec')).not.toBeInTheDocument();
        expect(reactTesting.screen.queryByTestId('set-button')).not.toBeInTheDocument();
        expect(reactTesting.screen.getByTestId('shared-by')).toHaveTextContent('owner@example.com');
    });

    it('hides the share button', () => {
        reactTesting.render(
            <Counter.Counter id="mycounter-id" name="My Counter" count={5} isOwner={false} sharedBy="owner@example.com" />
        );
        expect(reactTesting.screen.queryByTestId('share-button')).not.toBeInTheDocument();
        expect(reactTesting.screen.getByTestId('shared-by')).toHaveTextContent('owner@example.com');
    });

    it('shows the share button when isOwner is true', () => {
        reactTesting.render(
            <Counter.Counter id="mycounter-id" name="My Counter" count={5} isOwner={true} />
        );
        expect(reactTesting.screen.getByTestId('share-button')).toBeInTheDocument();
        expect(reactTesting.screen.queryByTestId('shared-by')).not.toBeInTheDocument();
    });

    it('calls onShare when the share button is clicked', () => {
        const onShare = vi.fn();
        reactTesting.render(
            <Counter.Counter
                id="mycounter-id"
                name="My Counter"
                count={5}
                isOwner={true}
                onShare={onShare}
            />
        );
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('share-button'));
        expect(onShare).toHaveBeenCalledOnce();
        expect(reactTesting.screen.queryByTestId('shared-by')).not.toBeInTheDocument();
    });
});

describe('Counter debouncing', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('debounce-name-change', async () => {
        const onChange = vi.fn<(changes: { id: string; name?: string; count?: number }) => void>();
        reactTesting.render(
            <Counter.Counter id="mycounter-id" name="Zeroth Name" count={0} onChange={onChange} />
        );

        reactTesting.fireEvent.click(reactTesting.screen.getByText('Zeroth Name'));
        const nameInput = reactTesting.screen.getByTestId('name-input');

        reactTesting.fireEvent.change(nameInput, { target: { value: 'First Name' } });
        reactTesting.fireEvent.blur(nameInput);

        reactTesting.fireEvent.change(nameInput, { target: { value: 'Second Name' } });
        reactTesting.fireEvent.keyDown(nameInput, { key: 'Enter' });

        expect(onChange).not.toHaveBeenCalled();

        await reactTesting.act(async () => {
            vi.runAllTimers();
        });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ id: 'mycounter-id', name: 'Second Name' });
    });
});
