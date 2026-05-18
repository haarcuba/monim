import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

interface CounterData {
    id: string;
    name: string;
    count: number;
}

export function useCounters(userId: string) {
    const [counters, setCounters] = useState<CounterData[]>([]);

    useEffect(() => {
        const col = collection(db, 'users', userId, 'counters');
        const q = query(col, orderBy('createdAt'));
        return onSnapshot(q, (snap) => {
            setCounters(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CounterData));
        });
    }, [userId]);

    async function createCounter() {
        const col = collection(db, 'users', userId, 'counters');
        await addDoc(col, { name: '', count: 0, createdAt: serverTimestamp() });
    }

    async function updateCounter(id: string, changes: Partial<Pick<CounterData, 'name' | 'count'>>) {
        const ref = doc(db, 'users', userId, 'counters', id);
        await updateDoc(ref, changes);
    }

    return { counters, createCounter, updateCounter };
}
