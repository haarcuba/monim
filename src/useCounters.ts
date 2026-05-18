import { useState, useEffect } from 'react';
import * as firestore from 'firebase/firestore';
import { db } from './firebase';
import * as Counter from './Counter';

interface CounterData extends Pick<Counter.Props, 'id' | 'name' | 'count'> {
    createdAt: firestore.Timestamp | null;
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
        const col = firestore.collection(db, 'users', userId, 'counters');
        const query = firestore.query(col, firestore.orderBy('createdAt'));
        return firestore.onSnapshot(query, (snap) => {
            setCounters(snap.docs.map(_counterData));
        });
    }, [userId]);

    async function createCounter() {
        const col = firestore.collection(db, 'users', userId, 'counters');
        await firestore.addDoc(col, { name: '', count: 0, createdAt: firestore.serverTimestamp() });
    }

    async function updateCounter(id: string, changes: Counter.Changes) {
        const ref = firestore.doc(db, 'users', userId, 'counters', id);
        await firestore.updateDoc(ref, { ...changes });
    }

    return { counters, createCounter, updateCounter };
}
