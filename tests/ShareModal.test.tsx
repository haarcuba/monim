import { vi } from 'vitest';
import * as reactTesting from '@testing-library/react';
import { ShareModal } from '../src/ShareModal';

describe('ShareModal', () => {
    it('renders an email input and a Share button', () => {
        reactTesting.render(
            <ShareModal sharedWith={[]} onShare={vi.fn()} onUnshare={vi.fn()} />
        );
        expect(reactTesting.screen.getByTestId('share-email-input')).toBeInTheDocument();
        expect(reactTesting.screen.getByTestId('share-submit')).toBeInTheDocument();
    });

    it('calls onShare with the entered email on submit', () => {
        const onShare = vi.fn();
        reactTesting.render(
            <ShareModal sharedWith={[]} onShare={onShare} onUnshare={vi.fn()} />
        );

        const input = reactTesting.screen.getByTestId('share-email-input');
        reactTesting.fireEvent.change(input, { target: { value: 'alice@example.com' } });
        reactTesting.fireEvent.click(reactTesting.screen.getByTestId('share-submit'));

        expect(onShare).toHaveBeenCalledOnce();
        expect(onShare).toHaveBeenCalledWith('alice@example.com');
        expect(input).toHaveValue('');
    });


    it('lists current sharedWith emails', () => {
        reactTesting.render(
            <ShareModal
                sharedWith={['alice@example.com', 'bob@example.com']}
                onShare={vi.fn()}
                onUnshare={vi.fn()}
            />
        );
        expect(reactTesting.screen.getByText('alice@example.com')).toBeInTheDocument();
        expect(reactTesting.screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('calls onUnshare with the email when Revoke is clicked', () => {
        const onUnshare = vi.fn();
        reactTesting.render(
            <ShareModal
                sharedWith={['alice@example.com', 'bob@example.com']}
                onShare={vi.fn()}
                onUnshare={onUnshare}
            />
        );

        const revokeButtons = reactTesting.screen.getAllByText('Revoke');
        expect(revokeButtons).toHaveLength(2);

        reactTesting.fireEvent.click(revokeButtons[0]);
        expect(onUnshare).toHaveBeenCalledOnce();
        expect(onUnshare).toHaveBeenCalledWith('alice@example.com');
    });
});
