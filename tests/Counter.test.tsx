import * as reactTesting from '@testing-library/react';
import * as Counter from '../src/Counter';

describe('Counter', () => {
    it('renders without crashing', () => {
        reactTesting.render(<Counter.Counter />);
    });

    it('add-name', () => {
        reactTesting.render(<Counter.Counter />);

        expect(reactTesting.screen.getByText('untitled')).toBeInTheDocument();

        reactTesting.fireEvent.click(reactTesting.screen.getByText('untitled'));

        const nameInput = reactTesting.screen.getByRole('textbox');
        reactTesting.fireEvent.change(nameInput, { target: { value: 'My Counter' } });
        reactTesting.fireEvent.blur(nameInput);

        expect(reactTesting.screen.getByText('My Counter')).toBeInTheDocument();

        reactTesting.fireEvent.change(nameInput, { target: { value: 'NamedByEnterKey' } });
        reactTesting.fireEvent.keyDown(nameInput, { key: 'Enter' });

        expect(reactTesting.screen.getByText('NamedByEnterKey')).toBeInTheDocument();

    });

});
