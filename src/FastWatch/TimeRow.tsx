import { formatTime } from './utils';

interface Props {
    currentElapsed: number;
    targetSeconds: number;
    isOwner: boolean;
    targetEditing: boolean;
    targetInput: string;
    setTargetInput: (v: string) => void;
    setTargetEditing: (v: boolean) => void;
    commitTarget: () => void;
}

export function TimeRow({
    currentElapsed,
    targetSeconds,
    isOwner,
    targetEditing,
    targetInput,
    setTargetInput,
    setTargetEditing,
    commitTarget,
}: Props) {
    return (
        <div className="fastwatch-time-row">
            <span data-testid="elapsed-display" className="fastwatch-time">
                {formatTime(currentElapsed)}
            </span>
            <span className="fastwatch-separator">/</span>
            <span data-testid="target-display" className="fastwatch-target">
                {formatTime(targetSeconds)}
            </span>
            {isOwner && !targetEditing && (
                <button
                    data-testid="set-target-button"
                    className="btn-ghost btn-icon"
                    aria-label="Set target"
                    onClick={() => {
                        setTargetInput(String(targetSeconds / 3600));
                        setTargetEditing(true);
                    }}
                >
                    ✎
                </button>
            )}
            {targetEditing && (
                <input
                    data-testid="set-target-input"
                    className="fastwatch-target-input"
                    value={targetInput}
                    autoFocus
                    onChange={(e) => setTargetInput(e.target.value)}
                    onBlur={commitTarget}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') commitTarget();
                    }}
                />
            )}
        </div>
    );
}
