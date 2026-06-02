import type { ReactElement } from 'react';
import type { User } from 'firebase/auth';
import * as Counter from '@/Counter';
import * as ShareModal from '@/ShareModal';
import { useCounters } from '@/useCounters';

export interface HistoryTarget {
    counterId: string;
    ownerUid: string;
    counterName: string;
}

export function Item(
    c: ReturnType<typeof useCounters>['own'][number],
    counters: ReturnType<typeof useCounters>,
    currentlySharing: { get: () => string | null; set: (id: string | null) => void },
    setHistoryTarget: (target: HistoryTarget | null) => void,
    user: User
): ReactElement {
    function onShare(email: string) {
        counters.share(c.id, email);
        currentlySharing.set(null);
    }
    function onUnshare(email: string) {
        counters.unshare(c.id, email);
        currentlySharing.set(null);
    }
    function onClose() {
        currentlySharing.set(null);
    }
    return (
        <div key={c.id} className="counter-item">
            <Counter.Counter
                id={c.id}
                name={c.name}
                count={c.count}
                onChange={(changes) => counters.update(c.id, changes)}
                onShare={() => currentlySharing.set(c.id)}
                onDelete={() => counters.destroy(c.id)}
                onViewHistory={() =>
                    setHistoryTarget({
                        counterId: c.id,
                        ownerUid: user.uid,
                        counterName: c.name,
                    })
                }
            />
            {_ShareModal(
                c.id,
                c.sharedWith ?? [],
                currentlySharing.get(),
                onShare,
                onUnshare,
                onClose
            )}
        </div>
    );
}

export function SharedItem(
    c: ReturnType<typeof useCounters>['shared'][number],
    setHistoryTarget: (target: HistoryTarget | null) => void
): ReactElement {
    return (
        <div key={c.id} className="counter-item">
            <Counter.Counter
                id={c.id}
                name={c.name}
                count={c.count}
                isOwner={false}
                sharedBy={c.ownerEmail}
                onViewHistory={() =>
                    setHistoryTarget({
                        counterId: c.id,
                        ownerUid: c.ownerUid!,
                        counterName: c.name,
                    })
                }
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
