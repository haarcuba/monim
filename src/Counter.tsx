import React from 'react';

export function Counter() {
    const [name, setName] = React.useState('untitled');
    const [editing, setEditing] = React.useState(false);

    return (
        <div>
            {editing ? (
                <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onBlur={() => setEditing(false)}
                />
            ) : (
                <span onClick={() => setEditing(true)}>{name}</span>
            )}
        </div>
    );
}
