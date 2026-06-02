import type { ReactElement } from 'react';
import * as ShareModal from '@/ShareModal';
import { FastWatch } from '@/FastWatch';
import { useFastWatches } from '@/useFastWatches';

export function Item(
    fw: ReturnType<typeof useFastWatches>['own'][number],
    fastwatches: ReturnType<typeof useFastWatches>,
    currentlySharingFwId: string | null,
    setCurrentlySharingFw: (id: string | null) => void
): ReactElement {
    function onStop() {
        const elapsed =
            fw.elapsedSeconds + (fw.startedAt ? (Date.now() - fw.startedAt.toMillis()) / 1000 : 0);
        fastwatches.stop(fw.id, elapsed);
    }
    function onShare(email: string) {
        fastwatches.share(fw.id, email);
        setCurrentlySharingFw(null);
    }
    function onUnshare(email: string) {
        fastwatches.unshare(fw.id, email);
        setCurrentlySharingFw(null);
    }
    function onClose() {
        setCurrentlySharingFw(null);
    }
    return (
        <div key={fw.id} className="counter-item">
            <FastWatch
                id={fw.id}
                targetSeconds={fw.targetSeconds}
                elapsedSeconds={fw.elapsedSeconds}
                startedAt={fw.startedAt}
                onStart={() => fastwatches.start(fw.id)}
                onStop={onStop}
                onReset={() => fastwatches.reset(fw.id)}
                onDelete={() => fastwatches.destroy(fw.id)}
                onShare={() => setCurrentlySharingFw(fw.id)}
                onSetTarget={(s) => fastwatches.setTarget(fw.id, s)}
            />
            {_ShareModal(
                fw.id,
                fw.sharedWith ?? [],
                currentlySharingFwId,
                onShare,
                onUnshare,
                onClose
            )}
        </div>
    );
}

export function SharedItem(fw: ReturnType<typeof useFastWatches>['shared'][number]): ReactElement {
    return (
        <div key={fw.id} className="counter-item">
            <FastWatch
                id={fw.id}
                targetSeconds={fw.targetSeconds}
                elapsedSeconds={fw.elapsedSeconds}
                startedAt={fw.startedAt}
                isOwner={false}
                sharedBy={fw.ownerEmail}
            />
        </div>
    );
}

function _ShareModal(
    id: string,
    sharedWith: string[],
    currentlySharingId: string | null,
    onShare: (email: string) => void,
    onUnshare: (email: string) => void,
    onClose: () => void
) {
    if (currentlySharingId !== id) return null;
    return (
        <ShareModal.ShareModal
            sharedWith={sharedWith}
            onShare={onShare}
            onUnshare={onUnshare}
            onClose={onClose}
        />
    );
}
