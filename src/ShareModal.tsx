import { useState } from 'react';

interface Props {
    sharedWith: string[];
    onShare: (email: string) => void;
    onUnshare: (email: string) => void;
    onClose?: () => void;
}

export function ShareModal({ sharedWith, onShare, onUnshare, onClose }: Props) {
    const [email, setEmail] = useState('');

    function handleShare() {
        onShare(email);
        setEmail('');
    }

    return (
        <>
            <button data-testid="close-button" onClick={onClose}>❌</button>
            {_Share(email, setEmail, handleShare)}
            {_Unshare(sharedWith, onUnshare)}
        </>
    );
}

function _Share(email: string, setEmail: (v: string) => void, onShare: () => void) {
    return (
        <>
            <input
                data-testid="share-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
            />
            <button data-testid="share-submit" onClick={onShare}>
                Share
            </button>
        </>
    );
}

function _Unshare(sharedWith: string[], onUnshare: (email: string) => void) {
    return (
        <ul>
            {sharedWith.map((email_) => (
                <li key={email_}>
                    <span>{email_}</span>
                    <button onClick={() => onUnshare(email_)}>Revoke</button>
                </li>
            ))}
        </ul>
    );
}
