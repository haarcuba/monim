import React from 'react';

interface Props {
    name: string;
    onChange: (name: string) => void;
}

export function EditableName({ name, onChange }: Props) {
    const [inputValue, setInputValue] = React.useState(name);
    const named = name !== '';
    const [editing, setEditing] = React.useState(!named);

    function commit() {
        onChange(inputValue);
        setEditing(false);
    }

    return (
        <>
            {!editing && <div onClick={() => setEditing(true)}>{name}</div>}
            <input
                data-testid="name-input"
                style={{ display: editing ? undefined : 'none' }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                }}
            />
        </>
    );
}
