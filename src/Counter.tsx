import React from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { SetButton } from './SetButton';
import { EditableName } from './EditableName';

interface Props {
    id: string;
    name: string;
    count: number;
    onChange?: (changes: { name?: string; count?: number }) => void;
    debounceMS?: number;
}

export function Counter({
    id: idProp,
    name: nameProp,
    count: countProp,
    onChange,
    debounceMS = 300,
}: Props) {
    const id = React.useRef(idProp ?? crypto.randomUUID());
    const [name, setName] = React.useState(nameProp ?? 'untitled');
    const [count, setCount] = React.useState(countProp ?? 0);
    const [named, setNamed] = React.useState(nameProp !== '');
    const firstRender = React.useRef(true);

    React.useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
    }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleNameChange(newName: string) {
        setName(newName);
        if (!named && newName) {
            setNamed(true);
        }
        onChange?.({ name: newName });
    }

    return (
        <div>
            <EditableName name={name} onChange={handleNameChange} />
            {named && (
                <>
                    <button onClick={() => setCount((c) => c - 1)}>dec</button>
                    <div data-testid="counter">{count}</div>
                    <button onClick={() => setCount((c) => c + 1)}>inc</button>
                    <SetButton onSet={setCount} parse={Number} value={count} />
                </>
            )}
        </div>
    );
}
