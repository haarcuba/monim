import { useState, useEffect } from 'react';
import * as firestore from 'firebase/firestore';
import { db } from './firebase';
import * as Counter from './Counter';

interface CounterData extends Pick<Counter.Props, 'id' | 'name' | 'count'> {
    createdAt: firestore.Timestamp | null;
    sharedWith?: string[];
}

function _counterData(doc: firestore.DocumentSnapshot): CounterData {
    return {
        id: doc.id,
        ...doc.data(),
    } as CounterData;
}

export function useCounters(userId: string) {
    const [counters, setCounters] = useState<CounterData[]>([]);

    useEffect(() => {
        const counters_collection = firestore.collection(db, 'users', userId, 'counters');
        const query = firestore.query(counters_collection, firestore.orderBy('createdAt'));
        return firestore.onSnapshot(query, (snap) => {
            setCounters(snap.docs.map(_counterData));
        });
    }, [userId]);

    async function create() {
        const counters_collection = firestore.collection(db, 'users', userId, 'counters');
        await firestore.addDoc(counters_collection, {
            name: '',
            count: 0,
            createdAt: firestore.serverTimestamp(),
        });
    }

    async function update(id: string, changes: Counter.Changes) {
        const ref = firestore.doc(db, 'users', userId, 'counters', id);
        await firestore.updateDoc(ref, { ...changes });
    }

    async function share(counterId: string, email: string) {
        await firestore.updateDoc(firestore.doc(db, 'users', userId, 'counters', counterId), {
            sharedWith: firestore.arrayUnion(email),
        });
        await firestore.setDoc(firestore.doc(db, 'shares', email, 'counters', counterId), {
            ownerUid: userId,
        });
    }

    async function unshare(counterId: string, email: string) {
        await firestore.updateDoc(firestore.doc(db, 'users', userId, 'counters', counterId), {
            sharedWith: firestore.arrayRemove(email),
        });
        await firestore.deleteDoc(firestore.doc(db, 'shares', email, 'counters', counterId));
    }

    return { counters, create, update, share, unshare };
}
