import React from 'react';

interface Props {
    onNameChange?: (id: string, name: string) => void;
}

export function Counter({ onNameChange }: Props) {
    const id = React.useRef(crypto.randomUUID());
    const [name, setName] = React.useState('untitled');
    const [editing, setEditing] = React.useState(false);

    React.useEffect(() => {
        onNameChange?.(id.current, name);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function nameChanged(newName: string) {
        setEditing(false);
        onNameChange?.(id.current, newName);
    }

    return (
        <div>
            {!editing && <span onClick={() => setEditing(true)}>{name}</span>}
            <input
                style={{ display: editing ? undefined : 'none' }}
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => { nameChanged(name); }}
                onKeyDown={e => { if (e.key === 'Enter') { nameChanged(name) } }}
            />
        </div>
    );
}
