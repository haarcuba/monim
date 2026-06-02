import { useState, type ReactElement } from 'react';
import './App.css';
import type { User } from 'firebase/auth';
import * as Counter from '@/Counter';
import { useAuth } from '@/AuthContext';
import { SignInPage } from '@/SignInPage';
import { AppHeader } from '@/AppHeader';
import { useCounters } from '@/useCounters';
import { useFastWatches } from '@/useFastWatches';
import * as ShareModal from '@/ShareModal';
import { CounterHistory } from '@/CounterHistory';
import { FastWatch } from '@/FastWatch';

function App() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <SignInPage />;

    return <AppContent user={user} />;
}

interface HistoryTarget {
    counterId: string;
    ownerUid: string;
    counterName: string;
}

type Tab = 'counters' | 'fastwatches';

function AppContent({ user }: { user: User }) {
    const counters = useCounters(user);
    const fastwatches = useFastWatches(user);
    const [activeTab, setActiveTab] = useState<Tab>('counters');
    const [currentlySharingId, setCurrentlySharing] = useState<string | null>(null);
    const currentlySharing = { get: () => currentlySharingId, set: setCurrentlySharing };
    const [historyTarget, setHistoryTarget] = useState<HistoryTarget | null>(null);
    const [currentlySharingFwId, setCurrentlySharingFw] = useState<string | null>(null);

    if (historyTarget) {
        return (
            <>
                <AppHeader user={user} />
                <CounterHistory
                    counterId={historyTarget.counterId}
                    ownerUid={historyTarget.ownerUid}
                    counterName={historyTarget.counterName}
                    onBack={() => setHistoryTarget(null)}
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
    setHistoryTarget: (target: HistoryTarget | null) => void,
    user: User
) {
    return _Tab(
        counters.own,
        counters.shared,
        (c) => _CounterItem(c, counters, currentlySharing, setHistoryTarget, user),
        (c) => _SharedCounterItem(c, setHistoryTarget),
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
        (fw) => _FastWatchItem(fw, fastwatches, currentlySharingFwId, setCurrentlySharingFw),
        (fw) => _SharedFastWatchItem(fw),
        '+ fastwatch',
        fastwatches.create
    );
}

function _CounterItem(
    c: ReturnType<typeof useCounters>['own'][number],
    counters: ReturnType<typeof useCounters>,
    currentlySharing: { get: () => string | null; set: (id: string | null) => void },
    setHistoryTarget: (target: HistoryTarget | null) => void,
    user: User
) {
    function onShare(email: string) { counters.share(c.id, email); currentlySharing.set(null); }
    function onUnshare(email: string) { counters.unshare(c.id, email); currentlySharing.set(null); }
    function onClose() { currentlySharing.set(null); }
    return (
        <div key={c.id} className="counter-item">
            <Counter.Counter
                id={c.id}
                name={c.name}
                count={c.count}
                onChange={(changes) => counters.update(c.id, changes)}
                onShare={() => currentlySharing.set(c.id)}
                onDelete={() => counters.destroy(c.id)}
                onViewHistory={() =>
                    setHistoryTarget({
                        counterId: c.id,
                        ownerUid: user.uid,
                        counterName: c.name,
                    })
                }
            />
            {_ShareModal(c.id, c.sharedWith ?? [], currentlySharing.get(), onShare, onUnshare, onClose)}
        </div>
    );
}

function _FastWatchItem(
    fw: ReturnType<typeof useFastWatches>['own'][number],
    fastwatches: ReturnType<typeof useFastWatches>,
    currentlySharingFwId: string | null,
    setCurrentlySharingFw: (id: string | null) => void
) {
    function onStop() {
        const elapsed =
            fw.elapsedSeconds +
            (fw.startedAt ? (Date.now() - fw.startedAt.toMillis()) / 1000 : 0);
        fastwatches.stop(fw.id, elapsed);
    }
    function onShare(email: string) { fastwatches.share(fw.id, email); setCurrentlySharingFw(null); }
    function onUnshare(email: string) { fastwatches.unshare(fw.id, email); setCurrentlySharingFw(null); }
    function onClose() { setCurrentlySharingFw(null); }
    return (
        <div key={fw.id} className="counter-item">
            <FastWatch
                id={fw.id}
                targetSeconds={fw.targetSeconds}
                elapsedSeconds={fw.elapsedSeconds}
                startedAt={fw.startedAt}
                onStart={() => fastwatches.start(fw.id)}
                onStop={onStop}
                onReset={() => fastwatches.reset(fw.id)}
                onDelete={() => fastwatches.destroy(fw.id)}
                onShare={() => setCurrentlySharingFw(fw.id)}
                onSetTarget={(s) => fastwatches.setTarget(fw.id, s)}
            />
            {_ShareModal(fw.id, fw.sharedWith ?? [], currentlySharingFwId, onShare, onUnshare, onClose)}
        </div>
    );
}

function _ShareModal(
    id: string,
    sharedWith: string[],
    currentlySharingId: string | null,
    onShare: (email: string) => void,
    onUnshare: (email: string) => void,
    onClose: () => void
) {
    if (currentlySharingId !== id) return null;
    return (
        <ShareModal.ShareModal
            sharedWith={sharedWith}
            onShare={onShare}
            onUnshare={onUnshare}
            onClose={onClose}
        />
    );
}

function _SharedCounterItem(
    c: ReturnType<typeof useCounters>['shared'][number],
    setHistoryTarget: (target: HistoryTarget | null) => void
) {
    return (
        <div key={c.id} className="counter-item">
            <Counter.Counter
                id={c.id}
                name={c.name}
                count={c.count}
                isOwner={false}
                sharedBy={c.ownerEmail}
                onViewHistory={() =>
                    setHistoryTarget({
                        counterId: c.id,
                        ownerUid: c.ownerUid!,
                        counterName: c.name,
                    })
                }
            />
        </div>
    );
}

function _SharedFastWatchItem(fw: ReturnType<typeof useFastWatches>['shared'][number]) {
    return (
        <div key={fw.id} className="counter-item">
            <FastWatch
                id={fw.id}
                targetSeconds={fw.targetSeconds}
                elapsedSeconds={fw.elapsedSeconds}
                startedAt={fw.startedAt}
                isOwner={false}
                sharedBy={fw.ownerEmail}
            />
        </div>
    );
}

export default App;
