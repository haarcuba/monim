import type { User } from 'firebase/auth';
import { useAuth } from '@/AuthContext';

export function UserAvatar({ user }: { user: User }) {
    const { signOut } = useAuth();

    return (
        <div
            style={{
                position: 'fixed',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
            }}
        >
            <img
                src={user.photoURL ?? undefined}
                alt={user.displayName ?? 'User'}
                referrerPolicy="no-referrer"
                style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                }}
            />
            <div>{user.displayName}</div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>{user.email}</div>
            <button onClick={signOut}>Sign out</button>
        </div>
    );
}
