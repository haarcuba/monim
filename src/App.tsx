import { useState } from 'react';
import './App.css';
import type { User } from 'firebase/auth';
import * as Counter from '@/Counter';
import { useAuth } from '@/AuthContext';
import { SignInPage } from '@/SignInPage';
import { UserAvatar } from '@/UserAvatar';
import { useCounters } from '@/useCounters';
import * as ShareModal from '@/ShareModal';
import { CounterHistory } from '@/CounterHistory';

function App() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <SignInPage />;

    return <AppContent user={user} />;
}

interface HistoryTarget {
    counterId: string;
    ownerUid: string;
    counterName: string;
}

function AppContent({ user }: { user: User }) {
    const counters = useCounters(user);
    const [currentlySharingId, setCurrentlySharing] = useState<string | null>(null);
    const currentlySharing = { get: () => currentlySharingId, set: setCurrentlySharing };
    const [historyTarget, setHistoryTarget] = useState<HistoryTarget | null>(null);

    if (historyTarget) {
        return (
            <>
                <UserAvatar user={user} />
                <CounterHistory
                    counterId={historyTarget.counterId}
                    ownerUid={historyTarget.ownerUid}
                    counterName={historyTarget.counterName}
                    onBack={() => setHistoryTarget(null)}
                />
            </>
        );
    }

    return (
        <>
            <UserAvatar user={user} />
            <section id="center">
                {counters.own.map((c) => (
                    <div key={c.id}>
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
                        {currentlySharing.get() === c.id && (
                            <ShareModal.ShareModal
                                sharedWith={c.sharedWith ?? []}
                                onShare={(email) => {
                                    counters.share(c.id, email);
                                    currentlySharing.set(null);
                                }}
                                onUnshare={(email) => {
                                    counters.unshare(c.id, email);
                                    currentlySharing.set(null);
                                }}
                                onClose={() => currentlySharing.set(null)}
                            />
                        )}
                    </div>
                ))}
                <button onClick={counters.create}>+ counter</button>
            </section>
            {counters.shared.length > 0 && (
                <section id="shared">
                    {counters.shared.map((c) => (
                        <Counter.Counter
                            key={c.id}
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
                    ))}
                </section>
            )}
        </>
    );
}

export default App;
