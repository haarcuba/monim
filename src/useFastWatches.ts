import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import * as Firestore from 'firebase/firestore';
import { db } from '@/firebase';

export interface FastWatchData {
    id: string;
    targetSeconds: number;
    elapsedSeconds: number;
    startedAt: Firestore.Timestamp | null;
    sharedWith?: string[];
    ownerUid?: string;
    ownerEmail?: string;
}

type SetFastWatches = Dispatch<SetStateAction<FastWatchData[]>>;

function _fastWatchData(doc: Firestore.DocumentSnapshot): FastWatchData {
    return { id: doc.id, ...doc.data() } as FastWatchData;
}

function _upsertShared(id: string, data: FastWatchData, set: SetFastWatches) {
    set((prev) => [...prev.filter((fw) => fw.id !== id), data]);
}

function _subscribeToSharedFastWatch(
    shareDoc: Firestore.DocumentSnapshot,
    set: SetFastWatches
): () => void {
    const { ownerUid, ownerEmail } = shareDoc.data() as { ownerUid: string; ownerEmail?: string };
    const ref = Firestore.doc(db, 'users', ownerUid, 'fastwatches', shareDoc.id);
    return Firestore.onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        _upsertShared(shareDoc.id, { ..._fastWatchData(snap), ownerUid, ownerEmail }, set);
    });
}

function _subscribeToShares(email: string, set: SetFastWatches): () => void {
    const unsubs = new Map<string, () => void>();
    const sharesCol = Firestore.collection(db, 'shares', email, 'fastwatches');

    const unsubShares = Firestore.onSnapshot(sharesCol, (snap) => {
        for (const change of snap.docChanges()) {
            if (change.type === 'added') {
                if (unsubs.has(change.doc.id)) continue;
                unsubs.set(change.doc.id, _subscribeToSharedFastWatch(change.doc, set));
            } else if (change.type === 'removed') {
                unsubs.get(change.doc.id)?.();
                unsubs.delete(change.doc.id);
                set((prev) => prev.filter((fw) => fw.id !== change.doc.id));
            }
        }
    });

    return () => {
        unsubShares();
        unsubs.forEach((u) => u());
    };
}

export function useFastWatches(user: User) {
    const [ownFastWatches, setOwnFastWatches] = useState<FastWatchData[]>([]);
    const [sharedFastWatches, setSharedFastWatches] = useState<FastWatchData[]>([]);

    useEffect(() => {
        const col = Firestore.collection(db, 'users', user.uid, 'fastwatches');
        const q = Firestore.query(col, Firestore.orderBy('createdAt'));
        return Firestore.onSnapshot(q, (snap) => {
            setOwnFastWatches(snap.docs.map(_fastWatchData));
        });
    }, [user.uid]);

    useEffect(() => {
        if (!user.email) return;
        return _subscribeToShares(user.email, setSharedFastWatches);
    }, [user.uid, user.email]);

    async function create() {
        const col = Firestore.collection(db, 'users', user.uid, 'fastwatches');
        await Firestore.addDoc(col, {
            targetSeconds: 57600,
            elapsedSeconds: 0,
            startedAt: null,
            createdAt: Firestore.serverTimestamp(),
            sharedWith: [],
        });
    }

    async function start(id: string) {
        const ref = Firestore.doc(db, 'users', user.uid, 'fastwatches', id);
        await Firestore.updateDoc(ref, { startedAt: Firestore.serverTimestamp() });
    }

    async function stop(id: string, currentElapsed: number) {
        const ref = Firestore.doc(db, 'users', user.uid, 'fastwatches', id);
        await Firestore.updateDoc(ref, {
            elapsedSeconds: Math.floor(currentElapsed),
            startedAt: null,
        });
    }

    async function reset(id: string) {
        const ref = Firestore.doc(db, 'users', user.uid, 'fastwatches', id);
        await Firestore.updateDoc(ref, { elapsedSeconds: 0, startedAt: null });
    }

    async function setTarget(id: string, seconds: number) {
        const ref = Firestore.doc(db, 'users', user.uid, 'fastwatches', id);
        await Firestore.updateDoc(ref, { targetSeconds: seconds });
    }

    async function share(id: string, email: string) {
        await Firestore.updateDoc(Firestore.doc(db, 'users', user.uid, 'fastwatches', id), {
            sharedWith: Firestore.arrayUnion(email),
        });
        await Firestore.setDoc(Firestore.doc(db, 'shares', email, 'fastwatches', id), {
            ownerUid: user.uid,
            ownerEmail: user.email,
        });
    }

    async function unshare(id: string, email: string) {
        await Firestore.updateDoc(Firestore.doc(db, 'users', user.uid, 'fastwatches', id), {
            sharedWith: Firestore.arrayRemove(email),
        });
        await Firestore.deleteDoc(Firestore.doc(db, 'shares', email, 'fastwatches', id));
    }

    async function destroy(id: string) {
        const fw = ownFastWatches.find((f) => f.id === id);
        const batch = Firestore.writeBatch(db);
        for (const email of fw?.sharedWith ?? []) {
            batch.delete(Firestore.doc(db, 'shares', email, 'fastwatches', id));
        }
        batch.delete(Firestore.doc(db, 'users', user.uid, 'fastwatches', id));
        await batch.commit();
    }

    return {
        own: ownFastWatches,
        shared: sharedFastWatches,
        create,
        start,
        stop,
        reset,
        setTarget,
        share,
        unshare,
        destroy,
    };
}
