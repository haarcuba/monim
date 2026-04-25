import * as reactTesting from '@testing-library/react';
import * as Counter from '../src/Counter';

describe('Counter', () => {
    it('renders without crashing', () => {
        reactTesting.render(<Counter.Counter />);
    });
});
