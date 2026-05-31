import type { User } from 'firebase/auth';
import foxLogo from '@/assets/fox-hourglass-transparent.png';
import { UserAvatar } from '@/UserAvatar';

export function AppHeader({ user }: { user: User }) {
    return (
        <header className="app-header">
            <div className="app-header-brand">
                <img src={foxLogo} alt="Monim logo" className="app-header-logo" />
                <span className="app-header-title">Monim</span>
            </div>
            <UserAvatar user={user} />
        </header>
    );
}
