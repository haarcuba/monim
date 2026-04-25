import React from 'react';

interface Props {
    onNameChange?: (id: string, name: string) => void;
}

export function Counter({ onNameChange }: Props) {
    const id = React.useRef(crypto.randomUUID());
    const [name, setName] = React.useState('untitled');
    const [inputValue, setInputValue] = React.useState('untitled');
    const [editing, setEditing] = React.useState(false);

    React.useEffect(() => {
        onNameChange?.(id.current, name);
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
                onChange={e => setInputValue(e.target.value)}
                onBlur={commit}
                onKeyDown={e => { if (e.key === 'Enter') commit(); }}
            />
        </div>
    );
}
