import type { User } from 'firebase/auth';
import { useAuth } from '@/AuthContext';

export function UserAvatar({ user }: { user: User }) {
    const { signOut } = useAuth();

    return (
        <div className="user-avatar">
            <img
                src={user.photoURL ?? undefined}
                alt={user.displayName ?? 'User'}
                referrerPolicy="no-referrer"
            />
            <div className="user-name">{user.displayName}</div>
            <div className="user-email">{user.email}</div>
            <button className="btn-ghost" onClick={signOut}>
                Sign out
            </button>
        </div>
    );
}
