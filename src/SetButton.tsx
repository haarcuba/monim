import React from 'react';
import { PencilIcon } from '@/Icons';

interface Props<T> {
    onSet: (value: T) => void;
    parse: (input: string) => T;
    value: T;
}

export function SetButton<T>({ onSet, parse, value }: Props<T>) {
    const [active, setActive] = React.useState(false);
    const [input, setInput] = React.useState('');

    function commit() {
        onSet(parse(input));
        setActive(false);
    }

    return (
        <>
            <button
                data-testid="set-button"
                className="btn-ghost btn-icon"
                aria-label="Set value"
                onClick={() => {
                    setInput(String(value));
                    setActive(true);
                }}
            >
                <PencilIcon />
            </button>
            {active && (
                <input
                    data-testid="set-input"
                    className="counter-name-input"
                    style={{ width: '64px', textAlign: 'center' }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') commit();
                    }}
                />
            )}
        </>
    );
}
