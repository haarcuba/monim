import { vi } from 'vitest';
import * as reactTesting from '@testing-library/react';
import * as Counter from '../src/Counter';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('Basic functionality', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('initial state', () => {
        const onNameChange = vi.fn<(id: string, name: string) => void>();
        reactTesting.render(<Counter.Counter onNameChange={onNameChange} />);

        expect(onNameChange).toHaveBeenCalledWith(expect.stringMatching(UUID_REGEX), 'untitled');
        expect(onNameChange).toHaveBeenCalledTimes(1);
    });

    it('modify-name', async () => {
        const onNameChange = vi.fn<(id: string, name: string) => void>();
        reactTesting.render(<Counter.Counter onNameChange={onNameChange} />);

        const id = onNameChange.mock.calls[0][0];
        expect(onNameChange).toHaveBeenCalledTimes(1);
        expect(id).toMatch(UUID_REGEX);
        onNameChange.mockClear();

        expect(reactTesting.screen.getByText('untitled')).toBeInTheDocument();

        reactTesting.fireEvent.click(reactTesting.screen.getByText('untitled'));

        const nameInput = reactTesting.screen.getByRole('textbox');
        reactTesting.fireEvent.change(nameInput, { target: { value: 'My Counter' } });
        reactTesting.fireEvent.blur(nameInput);

        expect(reactTesting.screen.getByText('My Counter')).toBeInTheDocument();
        await reactTesting.act(async () => {
            vi.runAllTimers();
        });
        expect(onNameChange).toHaveBeenCalledTimes(1);
        expect(onNameChange).toHaveBeenCalledWith(id, 'My Counter');
        onNameChange.mockClear();

        reactTesting.fireEvent.change(nameInput, { target: { value: 'NamedByEnterKey' } });
        reactTesting.fireEvent.keyDown(nameInput, { key: 'Enter' });
        reactTesting.fireEvent.blur(nameInput);

        expect(reactTesting.screen.getByText('NamedByEnterKey')).toBeInTheDocument();
        await reactTesting.act(async () => {
            vi.runAllTimers();
        });
        expect(onNameChange).toHaveBeenCalledTimes(1);
        expect(onNameChange).toHaveBeenCalledWith(id, 'NamedByEnterKey');
    });
});

describe('Counter value', () => {
    it('starts at 0', () => {
        reactTesting.render(<Counter.Counter />);
        expect(reactTesting.screen.getByTestId('counter')).toHaveTextContent('0');
    });

    it('inc increments counter', () => {
        reactTesting.render(<Counter.Counter />);
        reactTesting.fireEvent.click(reactTesting.screen.getByText('inc'));
        expect(reactTesting.screen.getByTestId('counter')).toHaveTextContent('1');
    });

    it('dec decrements counter', () => {
        reactTesting.render(<Counter.Counter />);
        reactTesting.fireEvent.click(reactTesting.screen.getByText('dec'));
        expect(reactTesting.screen.getByTestId('counter')).toHaveTextContent('-1');
    });

    it('set allows setting an arbitrary value', () => {
        reactTesting.render(<Counter.Counter />);
        expect(reactTesting.screen.getByTestId('counter')).toHaveTextContent('0');

        const value = Math.floor(Math.random() * 100) + 1;

        reactTesting.fireEvent.click(reactTesting.screen.getByText('set'));
        const setInput = reactTesting.screen.getByTestId('set-input');
        reactTesting.fireEvent.change(setInput, { target: { value: String(value) } });
        reactTesting.fireEvent.keyDown(setInput, { key: 'Enter' });

        expect(reactTesting.screen.getByTestId('counter')).toHaveTextContent(String(value));
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
        const onNameChange = vi.fn<(id: string, name: string) => void>();
        reactTesting.render(<Counter.Counter onNameChange={onNameChange} />);

        const id = onNameChange.mock.calls[0][0];
        onNameChange.mockClear();

        reactTesting.fireEvent.click(reactTesting.screen.getByText('untitled'));
        const nameInput = reactTesting.screen.getByRole('textbox');

        reactTesting.fireEvent.change(nameInput, { target: { value: 'First Name' } });
        reactTesting.fireEvent.blur(nameInput);

        reactTesting.fireEvent.change(nameInput, { target: { value: 'Second Name' } });
        reactTesting.fireEvent.keyDown(nameInput, { key: 'Enter' });

        expect(onNameChange).not.toHaveBeenCalled();

        await reactTesting.act(async () => {
            vi.runAllTimers();
        });

        expect(onNameChange).toHaveBeenCalledTimes(1);
        expect(onNameChange).toHaveBeenCalledWith(id, 'Second Name');
    });
});
