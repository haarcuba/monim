import { useState } from 'react';

interface Props {
    sharedWith: string[];
    onShare: (email: string) => void;
    onUnshare: (email: string) => void;
}

export function ShareModal({ sharedWith, onShare, onUnshare }: Props) {
    const [email, setEmail] = useState('');

    function handleShare() {
        onShare(email);
        setEmail('');
    }

    return (
        <>
            <input
                data-testid="share-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
            />
            <button data-testid="share-submit" onClick={handleShare}>
                Share
            </button>
            <ul>
                {sharedWith.map((email_) => (
                    <li key={email_}>
                        <span>{email_}</span>
                        <button onClick={() => onUnshare(email_)}>Revoke</button>
                    </li>
                ))}
            </ul>
        </>
    );
}
