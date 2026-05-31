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
                className="user-avatar-photo"
            />
            <div className="user-avatar-info">
                <span className="user-name">{user.displayName}</span>
                <span className="user-email">{user.email}</span>
            </div>
            <button className="btn-ghost user-signout" onClick={signOut}>
                Sign out
            </button>
        </div>
    );
}
