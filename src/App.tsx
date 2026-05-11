import './App.css';
import * as Counter from './Counter';
import { useAuth } from './AuthContext';
import { SignInPage } from './SignInPage';
import { UserAvatar } from './UserAvatar';

function App() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <SignInPage />;

    function onNameChange(id: string, name: string) {
        console.log(`Counter ${id} is now named ${name}`);
    }

    return (
        <>
            <UserAvatar user={user} />
            <section id="center">
                <Counter.Counter onNameChange={onNameChange} />
                <Counter.Counter onNameChange={onNameChange} />
            </section>
        </>
    );
}

export default App;
