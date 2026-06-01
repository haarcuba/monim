import { useState } from 'react';
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

function _CountersTab(
    counters: ReturnType<typeof useCounters>,
    currentlySharing: { get: () => string | null; set: (id: string | null) => void },
    setHistoryTarget: (target: HistoryTarget | null) => void,
    user: User
) {
    return (
        <>
            <section id="center">
                {counters.own.map((c) => (
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
                        {currentlySharing.get() === c.id && (
                            <ShareModal.ShareModal
                                sharedWith={c.sharedWith ?? []}
                                onShare={(email) => {
                                    counters.share(c.id, email);
                                    currentlySharing.set(null);
                                }}
                                onUnshare={(email) => {
                                    counters.unshare(c.id, email);
                                    currentlySharing.set(null);
                                }}
                                onClose={() => currentlySharing.set(null)}
                            />
                        )}
                    </div>
                ))}
                <button className="add-counter-btn" onClick={counters.create}>
                    + counter
                </button>
            </section>
            {counters.shared.length > 0 && (
                <section id="shared">
                    <p className="shared-section-label">Shared with you</p>
                    {counters.shared.map((c) => (
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
                    ))}
                </section>
            )}
        </>
    );
}

function _FastWatchesTab(
    fastwatches: ReturnType<typeof useFastWatches>,
    currentlySharingFwId: string | null,
    setCurrentlySharingFw: (id: string | null) => void
) {
    return (
        <>
            <section id="center">
                {fastwatches.own.map((fw) => (
                    <div key={fw.id} className="counter-item">
                        <FastWatch
                            id={fw.id}
                            targetSeconds={fw.targetSeconds}
                            elapsedSeconds={fw.elapsedSeconds}
                            startedAt={fw.startedAt}
                            onStart={() => fastwatches.start(fw.id)}
                            onStop={() => {
                                const elapsed =
                                    fw.elapsedSeconds +
                                    (fw.startedAt
                                        ? (Date.now() - fw.startedAt.toMillis()) / 1000
                                        : 0);
                                fastwatches.stop(fw.id, elapsed);
                            }}
                            onReset={() => fastwatches.reset(fw.id)}
                            onDelete={() => fastwatches.destroy(fw.id)}
                            onShare={() => setCurrentlySharingFw(fw.id)}
                            onSetTarget={(s) => fastwatches.setTarget(fw.id, s)}
                        />
                        {currentlySharingFwId === fw.id && (
                            <ShareModal.ShareModal
                                sharedWith={fw.sharedWith ?? []}
                                onShare={(email) => {
                                    fastwatches.share(fw.id, email);
                                    setCurrentlySharingFw(null);
                                }}
                                onUnshare={(email) => {
                                    fastwatches.unshare(fw.id, email);
                                    setCurrentlySharingFw(null);
                                }}
                                onClose={() => setCurrentlySharingFw(null)}
                            />
                        )}
                    </div>
                ))}
                <button className="add-counter-btn" onClick={fastwatches.create}>
                    + fastwatch
                </button>
            </section>
            {fastwatches.shared.length > 0 && (
                <section id="shared">
                    <p className="shared-section-label">Shared with you</p>
                    {fastwatches.shared.map((fw) => (
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
                    ))}
                </section>
            )}
        </>
    );
}

export default App;
