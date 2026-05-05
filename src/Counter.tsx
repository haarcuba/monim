import React from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { SetButton } from './SetButton';

interface Props {
    onNameChange?: (id: string, name: string) => void;
    debounceMS?: number;
}

export function Counter({ onNameChange, debounceMS = 300 }: Props) {
    const id = React.useRef(crypto.randomUUID());
    const [name, setName] = React.useState('untitled');
    const [inputValue, setInputValue] = React.useState('untitled');
    const [editing, setEditing] = React.useState(false);
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

    function commit() {
        setName(inputValue);
        setEditing(false);
    }

    return (
        <div>
            {!editing && <div onClick={() => setEditing(true)}>{name}</div>}
            <button onClick={() => setCount((c) => c - 1)}>dec</button>
            <div data-testid="counter">{count}</div>
            <button onClick={() => setCount((c) => c + 1)}>inc</button>
            <SetButton onSet={setCount} parse={Number} />
            <input
                style={{ display: editing ? undefined : 'none' }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                }}
            />
        </div>
    );
}
