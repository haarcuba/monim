import React from 'react';

export function Counter() {
    const [name, setName] = React.useState('untitled');
    const [editing, setEditing] = React.useState(false);

    return (
        <div>
            {!editing && <span onClick={() => setEditing(true)}>{name}</span>}
            <input
                style={{ display: editing ? undefined : 'none' }}
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => setEditing(false)}
                onKeyDown={e => { if (e.key === 'Enter') setEditing(false); }}
            />
        </div>
    );
}
