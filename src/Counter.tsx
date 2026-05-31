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
        <div className="counter-card">
            <EditableName
                name={name}
                onChange={(newName) => debouncedOnChange({ name: newName, operation: 'name' })}
            />
            {name !== '' && (
                <>
                    <div className="counter-row">
                        {isOwner && (
                            <button
                                className="btn-primary"
                                onClick={() => onChange?.({ id, count: count - 1, operation: 'dec' })}
                            >
                                dec
                            </button>
                        )}
                        <div data-testid="counter" className="counter-value">
                            {count}
                        </div>
                        {isOwner && (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={() =>
                                        onChange?.({ id, count: count + 1, operation: 'inc' })
                                    }
                                >
                                    inc
                                </button>
                                <SetButton
                                    onSet={(v) => onChange?.({ id, count: v, operation: 'set' })}
                                    parse={Number}
                                    value={count}
                                />
                            </>
                        )}
                    </div>
                    <div className="counter-actions">
                        {isOwner && (
                            <>
                                <button
                                    data-testid="share-button"
                                    className="btn-ghost"
                                    onClick={onShare}
                                >
                                    sharing…
                                </button>
                                <button
                                    data-testid="delete-button"
                                    className="btn-danger"
                                    onClick={onDelete}
                                >
                                    delete
                                </button>
                            </>
                        )}
                        {sharedBy && (
                            <small data-testid="shared-by" className="shared-by">
                                {sharedBy}
                            </small>
                        )}
                        <button
                            data-testid="view-history-button"
                            className="btn-ghost"
                            onClick={onViewHistory}
                        >
                            View History
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
