import { useAuth } from './AuthContext';

export function SignInPage() {
    const { signIn } = useAuth();

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <button onClick={signIn}>Sign in with Google</button>
        </div>
    );
}
