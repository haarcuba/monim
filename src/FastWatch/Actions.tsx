import * as CommonButtons from '@/CommonButtons';

interface Props {
    isOwner: boolean;
    onShare?: () => void;
    onDelete?: () => void;
    sharedBy?: string;
}

export function Actions({ isOwner, onShare, onDelete, sharedBy }: Props) {
    return (
        <div className="fastwatch-actions">
            {isOwner && CommonButtons.ShareDelete(onShare, onDelete)}
            {sharedBy && (
                <small data-testid="shared-by" className="shared-by">
                    {sharedBy}
                </small>
            )}
        </div>
    );
}
