import React from 'react';

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
                onClick={() => {
                    setInput(String(value));
                    setActive(true);
                }}
            >
                set
            </button>
            {active && (
                <input
                    data-testid="set-input"
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
