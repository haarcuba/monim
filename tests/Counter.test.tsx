import { vi } from 'vitest';
import * as reactTesting from '@testing-library/react';
import * as Counter from '../src/Counter';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('Counter', () => {
    it('initial state', () => {
        const onNameChange = vi.fn<(id: string, name: string) => void>();
        reactTesting.render(<Counter.Counter onNameChange={onNameChange} />);

        expect(onNameChange).toHaveBeenCalledWith(expect.stringMatching(UUID_REGEX), 'untitled');
        expect(onNameChange).toHaveBeenCalledTimes(1);
    });

    it('modify-name', () => {
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
        expect(onNameChange).toHaveBeenCalledTimes(1);
        expect(onNameChange).toHaveBeenCalledWith(id, 'My Counter');
        onNameChange.mockClear();

        reactTesting.fireEvent.change(nameInput, { target: { value: 'NamedByEnterKey' } });
        reactTesting.fireEvent.keyDown(nameInput, { key: 'Enter' });
        reactTesting.fireEvent.blur(nameInput);

        expect(reactTesting.screen.getByText('NamedByEnterKey')).toBeInTheDocument();
        expect(onNameChange).toHaveBeenCalledTimes(1);
        expect(onNameChange).toHaveBeenCalledWith(id, 'NamedByEnterKey');
    });

});
