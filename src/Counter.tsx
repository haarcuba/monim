import { useDebouncedCallback } from 'use-debounce';
import { SetButton } from './SetButton';
import { EditableName } from './EditableName';

export interface Changes {
    name?: string;
    count?: number;
}

type OnChange = (changes: { id: string } & Changes) => void;

export interface Props {
    id: string;
    name: string;
    count: number;
    isOwner?: boolean;
    onChange?: OnChange;
    onShare?: () => void;
    debounceMS?: number;
}

export function Counter({
    id,
    name,
    count,
    isOwner = true,
    onChange,
    onShare,
    debounceMS = 300,
}: Props) {
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
                    {isOwner && _OwnerControls1(id, count, onChange)}
                    <div data-testid="counter">{count}</div>
                    {isOwner && _OwnerControls2(id, count, onChange, onShare)}
                </>
            )}
        </div>
    );
}

function _OwnerControls1(id: string, count: number, onChange?: OnChange) {
    return (
        <>
            <button onClick={() => onChange?.({ id, count: count - 1 })}>dec</button>
        </>
    );
}

function _OwnerControls2(id: string, count: number, onChange?: OnChange, onShare?: () => void) {
    return (
        <>
            <button onClick={() => onChange?.({ id, count: count + 1 })}>inc</button>
            <SetButton onSet={(v) => onChange?.({ id, count: v })} parse={Number} value={count} />
            <button data-testid="share-button" onClick={onShare}>
                sharing...
            </button>
        </>
    );
}
