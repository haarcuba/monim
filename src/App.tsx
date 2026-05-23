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
    const { counters, createCounter, updateCounter, shareCounter, unshareCounter } =
        useCounters(userId);
    const [sharingCounterId, setSharingCounterId] = useState<string | null>(null);

    return (
        <>
            <UserAvatar user={user} />
            <section id="center">
                {counters.map((c) => (
                    <div key={c.id}>
                        <Counter.Counter
                            id={c.id}
                            name={c.name}
                            count={c.count}
                            onChange={(changes) => updateCounter(c.id, changes)}
                            onShare={() => setSharingCounterId(c.id)}
                        />
                        {sharingCounterId === c.id && (
                            <ShareModal.ShareModal
                                sharedWith={c.sharedWith ?? []}
                                onShare={(email) => {
                                    shareCounter(c.id, email);
                                    setSharingCounterId(null);
                                }}
                                onUnshare={(email) => {
                                    unshareCounter(c.id, email);
                                    setSharingCounterId(null);
                                }}
                                onClose={() => setSharingCounterId(null)}
                            />
                        )}
                    </div>
                ))}
                <button onClick={createCounter}>+ counter</button>
            </section>
        </>
    );
}

export default App;
