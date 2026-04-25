import React from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface Props {
    onNameChange?: (id: string, name: string) => void;
    debounceMS?: number;
}

export function Counter({ onNameChange, debounceMS = 300 }: Props) {
    const id = React.useRef(crypto.randomUUID());
    const [name, setName] = React.useState('untitled');
    const [inputValue, setInputValue] = React.useState('untitled');
    const [editing, setEditing] = React.useState(false);
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
            {!editing && <span onClick={() => setEditing(true)}>{name}</span>}
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
