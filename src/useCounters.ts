import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import * as Firestore from 'firebase/firestore';
import { db } from '@/firebase';
import * as Counter from '@/Counter';

interface CounterData extends Pick<Counter.Props, 'id' | 'name' | 'count'> {
    createdAt: Firestore.Timestamp | null;
    sharedWith?: string[];
    ownerUid?: string;
    ownerEmail?: string;
}

type SetCounters = Dispatch<SetStateAction<CounterData[]>>;

function _counterData(doc: Firestore.DocumentSnapshot): CounterData {
    return {
        id: doc.id,
        ...doc.data(),
    } as CounterData;
}

function _upsertSharedCounter(id: string, data: CounterData, set: SetCounters) {
    set((prev) => [...prev.filter((c) => c.id !== id), data]);
}

function _subscribeToSharedCounter(
    shareDoc: Firestore.DocumentSnapshot,
    set: SetCounters
): () => void {
    const { ownerUid, ownerEmail } = shareDoc.data() as { ownerUid: string; ownerEmail?: string };
    const ref = Firestore.doc(db, 'users', ownerUid, 'counters', shareDoc.id);
    return Firestore.onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        _upsertSharedCounter(shareDoc.id, { ..._counterData(snap), ownerUid, ownerEmail }, set);
    });
}

function _subscribeToShares(email: string, set: SetCounters): () => void {
    const counterUnsubs = new Map<string, () => void>();
    const sharesCol = Firestore.collection(db, 'shares', email, 'counters');

    const unsubShares = Firestore.onSnapshot(sharesCol, (snap) => {
        for (const change of snap.docChanges()) {
            if (change.type === 'added') {
                if (counterUnsubs.has(change.doc.id)) continue;
                counterUnsubs.set(change.doc.id, _subscribeToSharedCounter(change.doc, set));
            } else if (change.type === 'removed') {
                counterUnsubs.get(change.doc.id)?.();
                counterUnsubs.delete(change.doc.id);
                set((prev) => prev.filter((c) => c.id !== change.doc.id));
            }
        }
    });

    return () => {
        unsubShares();
        counterUnsubs.forEach((u) => u());
    };
}

export function useCounters(user: User) {
    const [ownCounters, setOwnCounters] = useState<CounterData[]>([]);
    const [sharedCounters, setSharedCounters] = useState<CounterData[]>([]);

    useEffect(() => {
        const counters_collection = Firestore.collection(db, 'users', user.uid, 'counters');
        const query = Firestore.query(counters_collection, Firestore.orderBy('createdAt'));
        return Firestore.onSnapshot(query, (snap) => {
            setOwnCounters(snap.docs.map(_counterData));
        });
    }, [user.uid]);

    useEffect(() => {
        if (!user.email) return;
        return _subscribeToShares(user.email, setSharedCounters);
    }, [user.uid, user.email]);

    async function create() {
        const counters_collection = Firestore.collection(db, 'users', user.uid, 'counters');
        await Firestore.addDoc(counters_collection, {
            name: '',
            count: 0,
            createdAt: Firestore.serverTimestamp(),
        });
    }

    async function update(id: string, changes: Counter.Changes) {
        const { operation, ...firestoreChanges } = changes;
        const counterRef = Firestore.doc(db, 'users', user.uid, 'counters', id);
        const batch = Firestore.writeBatch(db);
        batch.update(counterRef, firestoreChanges);
        const historyRef = Firestore.doc(
            Firestore.collection(db, 'users', user.uid, 'counters', id, 'history')
        );
        const currentValue =
            firestoreChanges.count ?? ownCounters.find((c) => c.id === id)?.count ?? 0;
        batch.set(historyRef, {
            value: currentValue,
            ...(firestoreChanges.name !== undefined ? { name: firestoreChanges.name } : {}),
            operation,
            timestamp: Firestore.serverTimestamp(),
        });
        await batch.commit();
    }

    async function share(counterId: string, email: string) {
        await Firestore.updateDoc(Firestore.doc(db, 'users', user.uid, 'counters', counterId), {
            sharedWith: Firestore.arrayUnion(email),
        });
        await Firestore.setDoc(Firestore.doc(db, 'shares', email, 'counters', counterId), {
            ownerUid: user.uid,
            ownerEmail: user.email,
        });
    }

    async function unshare(counterId: string, email: string) {
        await Firestore.updateDoc(Firestore.doc(db, 'users', user.uid, 'counters', counterId), {
            sharedWith: Firestore.arrayRemove(email),
        });
        await Firestore.deleteDoc(Firestore.doc(db, 'shares', email, 'counters', counterId));
    }

    return { own: ownCounters, shared: sharedCounters, create, update, share, unshare };
}
