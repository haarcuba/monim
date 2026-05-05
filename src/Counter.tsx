import React from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { SetButton } from './SetButton';
import { EditableName } from './EditableName';

interface Props {
    onNameChange?: (id: string, name: string) => void;
    debounceMS?: number;
}

export function Counter({ onNameChange, debounceMS = 300 }: Props) {
    const id = React.useRef(crypto.randomUUID());
    const [name, setName] = React.useState('untitled');
    const [count, setCount] = React.useState(0);
    const firstRender = React.useRef(true);

    const debouncedOnNameChange = useDebouncedCallback(
        (newName: string) => onNameChange?.(id.current, newName),
        debounceMS
    );

    React.useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            onNameChange?.(id.current, name);
            return;
        }
        debouncedOnNameChange(name);
    }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            <EditableName name={name} onChange={setName} />
            <button onClick={() => setCount((c) => c - 1)}>dec</button>
            <div data-testid="counter">{count}</div>
            <button onClick={() => setCount((c) => c + 1)}>inc</button>
            <SetButton onSet={setCount} parse={Number} />
        </div>
    );
}
