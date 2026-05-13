import './App.css';
import * as Counter from './Counter';
import { useAuth } from './AuthContext';
import { SignInPage } from './SignInPage';
import { UserAvatar } from './UserAvatar';

function App() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <SignInPage />;

    function onChange(changes: { id: string; name?: string; count?: number }) {
        const id = changes.id;
        const name = changes.name as string;
        console.log(`Counter ${id} is now named ${name}`);
    }

    return (
        <>
            <UserAvatar user={user} />
            <section id="center">
                <Counter.Counter onChange={onChange} id="jaki" name="Jaki" count={0} />
                <Counter.Counter onChange={onChange} id="yosi" name="Yosi" count={0} />
            </section>
        </>
    );
}

export default App;
