import { TrashIcon, ShareIcon } from '@/Icons';

export function ShareDelete(onShare?: () => void, onDelete?: () => void) {
    return (
        <>
            <button
                data-testid="share-button"
                className="btn-ghost btn-icon"
                aria-label="Sharing options"
                onClick={onShare}
            >
                <ShareIcon />
            </button>
            <button
                data-testid="delete-button"
                className="btn-danger btn-icon"
                aria-label="Delete"
                onClick={onDelete}
            >
                <TrashIcon />
            </button>
        </>
    );
}
