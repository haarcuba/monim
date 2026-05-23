import { useState } from 'react';
import './App.css';
import type { User } from 'firebase/auth';
import * as Counter from './Counter';
import { useAuth } from './AuthContext';
import { SignInPage } from './SignInPage';
import { UserAvatar } from './UserAvatar';
import { useCounters } from './useCounters';
import * as ShareModal from './ShareModal';

function App() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <SignInPage />;

    return <AppContent userId={user.uid} user={user} />;
}

function AppContent({ userId, user }: { userId: string; user: User }) {
    const counters = useCounters(userId);
    const [currentlySharingId, setCurrentlySharing] = useState<string | null>(null);
    const currentlySharing = { get: () => currentlySharingId, set: setCurrentlySharing };

    return (
        <>
            <UserAvatar user={user} />
            <section id="center">
                {counters.counters.map((c) => (
                    <div key={c.id}>
                        <Counter.Counter
                            id={c.id}
                            name={c.name}
                            count={c.count}
                            onChange={(changes) => counters.update(c.id, changes)}
                            onShare={() => currentlySharing.set(c.id)}
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
        </>
    );
}

export default App;
