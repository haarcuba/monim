import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import * as firestore from 'firebase/firestore';
import { db } from './firebase';
import * as Counter from './Counter';

interface CounterData extends Pick<Counter.Props, 'id' | 'name' | 'count'> {
    createdAt: firestore.Timestamp | null;
    sharedWith?: string[];
    ownerUid?: string;
    ownerEmail?: string;
}

type SetCounters = Dispatch<SetStateAction<CounterData[]>>;

function _counterData(doc: firestore.DocumentSnapshot): CounterData {
    return {
        id: doc.id,
        ...doc.data(),
    } as CounterData;
}

function _upsertSharedCounter(id: string, data: CounterData, set: SetCounters) {
    set(prev => [...prev.filter(c => c.id !== id), data]);
}

function _subscribeToSharedCounter(
    shareDoc: firestore.DocumentSnapshot,
    set: SetCounters
): () => void {
    const { ownerUid, ownerEmail } = shareDoc.data() as { ownerUid: string; ownerEmail?: string };
    const ref = firestore.doc(db, 'users', ownerUid, 'counters', shareDoc.id);
    return firestore.onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        _upsertSharedCounter(shareDoc.id, { ..._counterData(snap), ownerUid, ownerEmail }, set);
    });
}

function _subscribeToShares(email: string, set: SetCounters): () => void {
    const counterUnsubs = new Map<string, () => void>();
    const sharesCol = firestore.collection(db, 'shares', email, 'counters');

    const unsubShares = firestore.onSnapshot(sharesCol, (snap) => {
        for (const change of snap.docChanges()) {
            if (change.type === 'added') {
                if (counterUnsubs.has(change.doc.id)) continue;
                counterUnsubs.set(change.doc.id, _subscribeToSharedCounter(change.doc, set));
            } else if (change.type === 'removed') {
                counterUnsubs.get(change.doc.id)?.();
                counterUnsubs.delete(change.doc.id);
                set(prev => prev.filter(c => c.id !== change.doc.id));
            }
        }
    });

    return () => { unsubShares(); counterUnsubs.forEach(u => u()); };
}

export function useCounters(user: User) {
    const [ownCounters, setOwnCounters] = useState<CounterData[]>([]);
    const [sharedCounters, setSharedCounters] = useState<CounterData[]>([]);

    useEffect(() => {
        const counters_collection = firestore.collection(db, 'users', user.uid, 'counters');
        const query = firestore.query(counters_collection, firestore.orderBy('createdAt'));
        return firestore.onSnapshot(query, (snap) => {
            setOwnCounters(snap.docs.map(_counterData));
        });
    }, [user.uid]);

    useEffect(() => {
        if (!user.email) return;
        return _subscribeToShares(user.email, setSharedCounters);
    }, [user.uid, user.email]);

    async function create() {
        const counters_collection = firestore.collection(db, 'users', user.uid, 'counters');
        await firestore.addDoc(counters_collection, {
            name: '',
            count: 0,
            createdAt: firestore.serverTimestamp(),
        });
    }

    async function update(id: string, changes: Counter.Changes) {
        const ref = firestore.doc(db, 'users', user.uid, 'counters', id);
        await firestore.updateDoc(ref, { ...changes });
    }

    async function share(counterId: string, email: string) {
        await firestore.updateDoc(firestore.doc(db, 'users', user.uid, 'counters', counterId), {
            sharedWith: firestore.arrayUnion(email),
        });
        await firestore.setDoc(firestore.doc(db, 'shares', email, 'counters', counterId), {
            ownerUid: user.uid,
            ownerEmail: user.email,
        });
    }

    async function unshare(counterId: string, email: string) {
        await firestore.updateDoc(firestore.doc(db, 'users', user.uid, 'counters', counterId), {
            sharedWith: firestore.arrayRemove(email),
        });
        await firestore.deleteDoc(firestore.doc(db, 'shares', email, 'counters', counterId));
    }

    return { own: ownCounters, shared: sharedCounters, create, update, share, unshare };
}
