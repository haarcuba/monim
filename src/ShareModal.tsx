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
        <div className="share-modal">
            <div className="share-modal-header">
                <span className="share-modal-title">Sharing</span>
                <button data-testid="close-button" className="btn-ghost" onClick={onClose}>
                    ✕
                </button>
            </div>
            <div className="share-modal-row">
                <input
                    data-testid="share-email-input"
                    className="share-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                />
                <button data-testid="share-submit" className="btn-ghost" onClick={handleShare}>
                    Share
                </button>
            </div>
            <ul className="share-list">
                {sharedWith.map((email_) => (
                    <li key={email_} className="share-list-item">
                        <span>{email_}</span>
                        <button className="btn-danger" onClick={() => onUnshare(email_)}>
                            Revoke
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
