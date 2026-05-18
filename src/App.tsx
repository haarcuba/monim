import './App.css';
import type { User } from 'firebase/auth';
import * as Counter from './Counter';
import { useAuth } from './AuthContext';
import { SignInPage } from './SignInPage';
import { UserAvatar } from './UserAvatar';
import { useCounters } from './useCounters';

function App() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <SignInPage />;

    return <AppContent userId={user.uid} user={user} />;
}

function AppContent({ userId, user }: { userId: string; user: User }) {
    const { counters, createCounter, updateCounter } = useCounters(userId);

    return (
        <>
            <UserAvatar user={user} />
            <section id="center">
                {counters.map((c) => (
                    <Counter.Counter
                        key={c.id}
                        id={c.id}
                        name={c.name}
                        count={c.count}
                        onChange={(changes) => updateCounter(c.id, changes)}
                    />
                ))}
                <button onClick={createCounter}>+ counter</button>
            </section>
        </>
    );
}

export default App;
