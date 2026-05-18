import { useDebouncedCallback } from 'use-debounce';
import { SetButton } from './SetButton';
import { EditableName } from './EditableName';

export interface Changes {
    name?: string;
    count?: number;
}

export interface Props {
    id: string;
    name: string;
    count: number;
    onChange?: (changes: { id: string } & Changes) => void;
    debounceMS?: number;
}

export function Counter({ id, name, count, onChange, debounceMS = 300 }: Props) {
    const debouncedOnChange = useDebouncedCallback(
        (changes: { name?: string; count?: number }) => onChange?.({ id, ...changes }),
        debounceMS
    );

    return (
        <div>
            <EditableName
                name={name}
                onChange={(newName) => debouncedOnChange({ name: newName })}
            />
            {name !== '' && (
                <>
                    <button onClick={() => onChange?.({ id, count: count - 1 })}>dec</button>
                    <div data-testid="counter">{count}</div>
                    <button onClick={() => onChange?.({ id, count: count + 1 })}>inc</button>
                    <SetButton
                        onSet={(v) => onChange?.({ id, count: v })}
                        parse={Number}
                        value={count}
                    />
                </>
            )}
        </div>
    );
}
