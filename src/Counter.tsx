import { useDebouncedCallback } from 'use-debounce';
import { SetButton } from '@/SetButton';
import { EditableName } from '@/EditableName';

export interface Changes {
    name?: string;
    count?: number;
    operation: 'inc' | 'dec' | 'set' | 'name';
}

type OnChange = (changes: { id: string } & Changes) => void;

export interface Props {
    id: string;
    name: string;
    count: number;
    isOwner?: boolean;
    sharedBy?: string;
    onChange?: OnChange;
    onShare?: () => void;
    onDelete?: () => void;
    onViewHistory?: () => void;
    debounceMS?: number;
}

export function Counter({
    id,
    name,
    count,
    isOwner = true,
    sharedBy,
    onChange,
    onShare,
    onDelete,
    onViewHistory,
    debounceMS = 300,
}: Props) {
    const debouncedOnChange = useDebouncedCallback(
        (changes: Changes) => onChange?.({ id, ...changes }),
        debounceMS
    );

    return (
        <div>
            <EditableName
                name={name}
                onChange={(newName) => debouncedOnChange({ name: newName, operation: 'name' })}
            />
            {name !== '' && (
                <>
                    {isOwner && _OwnerControls1(id, count, onChange)}
                    <div data-testid="counter">{count}</div>
                    {isOwner && _OwnerControls2(id, count, onChange, onShare, onDelete)}
                    {sharedBy && <small data-testid="shared-by">{sharedBy}</small>}
                    <button data-testid="view-history-button" onClick={onViewHistory}>
                        View History
                    </button>
                </>
            )}
        </div>
    );
}

function _OwnerControls1(id: string, count: number, onChange?: OnChange) {
    return (
        <>
            <button onClick={() => onChange?.({ id, count: count - 1, operation: 'dec' })}>
                dec
            </button>
        </>
    );
}

function _OwnerControls2(
    id: string,
    count: number,
    onChange?: OnChange,
    onShare?: () => void,
    onDelete?: () => void
) {
    return (
        <>
            <button onClick={() => onChange?.({ id, count: count + 1, operation: 'inc' })}>
                inc
            </button>
            <SetButton
                onSet={(v) => onChange?.({ id, count: v, operation: 'set' })}
                parse={Number}
                value={count}
            />
            <button data-testid="share-button" onClick={onShare}>
                sharing...
            </button>
            <button data-testid="delete-button" onClick={onDelete}>
                delete
            </button>
        </>
    );
}
