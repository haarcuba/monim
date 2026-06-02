import { useState, useEffect, type ReactElement } from 'react';
import './App.css';
import type { User } from 'firebase/auth';
import { useAuth } from '@/AuthContext';
import { SignInPage } from '@/SignInPage';
import { AppHeader } from '@/AppHeader';
import { useCounters } from '@/useCounters';
import { useFastWatches } from '@/useFastWatches';
import { CounterHistory } from '@/CounterHistory';
import * as Counters from '@/Counters';
import * as FastWatches from '@/FastWatches';

function App() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <SignInPage />;

    return <AppContent user={user} />;
}

type Tab = 'counters' | 'fastwatches';

function useHistoryBack(active: boolean, onBack: () => void) {
    useEffect(() => {
        if (active) history.pushState({ historyView: true }, '');
    }, [active]);

    useEffect(() => {
        window.addEventListener('popstate', onBack);
        return () => window.removeEventListener('popstate', onBack);
    }, [onBack]);
}

function AppContent({ user }: { user: User }) {
    const counters = useCounters(user);
    const fastwatches = useFastWatches(user);
    const [activeTab, setActiveTab] = useState<Tab>('counters');
    const [currentlySharingId, setCurrentlySharing] = useState<string | null>(null);
    const currentlySharing = { get: () => currentlySharingId, set: setCurrentlySharing };
    const [historyTarget, setHistoryTarget] = useState<Counters.HistoryTarget | null>(null);
    const [currentlySharingFwId, setCurrentlySharingFw] = useState<string | null>(null);

    useHistoryBack(historyTarget !== null, () => setHistoryTarget(null));

    if (historyTarget) {
        return (
            <>
                <AppHeader user={user} />
                <CounterHistory
                    counterId={historyTarget.counterId}
                    ownerUid={historyTarget.ownerUid}
                    counterName={historyTarget.counterName}
                    onBack={() => history.back()}
                />
            </>
        );
    }

    return (
        <>
            <AppHeader user={user} />
            {_TabBar(activeTab, setActiveTab)}
            {activeTab === 'counters' &&
                _CountersTab(counters, currentlySharing, setHistoryTarget, user)}
            {activeTab === 'fastwatches' &&
                _FastWatchesTab(fastwatches, currentlySharingFwId, setCurrentlySharingFw)}
        </>
    );
}

function _TabBar(activeTab: Tab, setActiveTab: (tab: Tab) => void) {
    return (
        <div className="tab-bar">
            <button
                className={`tab-button${activeTab === 'counters' ? ' active' : ''}`}
                onClick={() => setActiveTab('counters')}
            >
                Counters
            </button>
            <button
                className={`tab-button${activeTab === 'fastwatches' ? ' active' : ''}`}
                onClick={() => setActiveTab('fastwatches')}
            >
                FastWatch
            </button>
        </div>
    );
}

function _Tab<T extends { id: string }>(
    own: T[],
    shared: T[],
    renderOwnItem: (item: T) => ReactElement,
    renderSharedItem: (item: T) => ReactElement,
    addLabel: string,
    onCreate: () => void
) {
    return (
        <>
            <section id="center">
                {own.map(renderOwnItem)}
                <button className="add-counter-btn" onClick={onCreate}>
                    {addLabel}
                </button>
            </section>
            {shared.length > 0 && (
                <section id="shared">
                    <p className="shared-section-label">Shared with you</p>
                    {shared.map(renderSharedItem)}
                </section>
            )}
        </>
    );
}

function _CountersTab(
    counters: ReturnType<typeof useCounters>,
    currentlySharing: { get: () => string | null; set: (id: string | null) => void },
    setHistoryTarget: (target: Counters.HistoryTarget | null) => void,
    user: User
) {
    return _Tab(
        counters.own,
        counters.shared,
        (c) => Counters.Item(c, counters, currentlySharing, setHistoryTarget, user),
        (c) => Counters.SharedItem(c, setHistoryTarget),
        '+ counter',
        counters.create
    );
}

function _FastWatchesTab(
    fastwatches: ReturnType<typeof useFastWatches>,
    currentlySharingFwId: string | null,
    setCurrentlySharingFw: (id: string | null) => void
) {
    return _Tab(
        fastwatches.own,
        fastwatches.shared,
        (fw) => FastWatches.Item(fw, fastwatches, currentlySharingFwId, setCurrentlySharingFw),
        (fw) => FastWatches.SharedItem(fw),
        '+ fastwatch',
        fastwatches.create
    );
}

export default App;
