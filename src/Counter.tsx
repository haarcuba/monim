import { useDebouncedCallback } from 'use-debounce';
import { SetButton } from '@/SetButton';
import { EditableName } from '@/EditableName';
import { MinusIcon, PlusIcon, ClockIcon } from '@/Icons';
import * as CommonButtons from '@/CommonButtons';

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
        <div className="counter-card">
            <EditableName
                name={name}
                onChange={(newName) => debouncedOnChange({ name: newName, operation: 'name' })}
            />
            {name !== '' && (
                <>
                    <div className="counter-row">
                        {isOwner && _OwnerControls1(id, count, onChange)}
                        <div data-testid="counter" className="counter-value">
                            {count}
                        </div>
                        {isOwner && _OwnerControls2(id, count, onChange)}
                    </div>
                    <div className="counter-actions">
                        {isOwner && CommonButtons.ShareDelete(onShare, onDelete)}
                        {sharedBy && (
                            <small data-testid="shared-by" className="shared-by">
                                {sharedBy}
                            </small>
                        )}
                        <button
                            data-testid="view-history-button"
                            className="btn-ghost btn-icon"
                            aria-label="View history"
                            onClick={onViewHistory}
                        >
                            <ClockIcon />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function _OwnerControls1(id: string, count: number, onChange?: OnChange) {
    return (
        <button
            data-testid="dec-button"
            className="btn-primary btn-icon"
            aria-label="Decrement"
            onClick={() => onChange?.({ id, count: count - 1, operation: 'dec' })}
        >
            <MinusIcon />
        </button>
    );
}

function _OwnerControls2(id: string, count: number, onChange?: OnChange) {
    return (
        <>
            <button
                data-testid="inc-button"
                className="btn-primary btn-icon"
                aria-label="Increment"
                onClick={() => onChange?.({ id, count: count + 1, operation: 'inc' })}
            >
                <PlusIcon />
            </button>
            <SetButton
                onSet={(v) => onChange?.({ id, count: v, operation: 'set' })}
                parse={Number}
                value={count}
            />
        </>
    );
}
