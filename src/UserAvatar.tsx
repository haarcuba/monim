import type { User } from 'firebase/auth';
import { useAuth } from './AuthContext';

export function UserAvatar({ user }: { user: User }) {
    const { signOut } = useAuth();

    return (
        <img
            src={user.photoURL ?? undefined}
            alt={user.displayName ?? 'User'}
            title={`Signed in as ${user.displayName ?? user.email}\nClick to sign out`}
            referrerPolicy="no-referrer"
            onClick={signOut}
            style={{
                position: 'fixed',
                top: '1rem',
                right: '1rem',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                cursor: 'pointer',
            }}
        />
    );
}
