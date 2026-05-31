import { useState, useEffect } from 'react';
import * as firestore from 'firebase/firestore';
import { db } from '@/firebase';

export interface HistoryEntry {
    id: string;
    value: number;
    operation: 'inc' | 'dec' | 'set';
    timestamp: firestore.Timestamp | null;
}

export function useCounterHistory(ownerUid: string, counterId: string): HistoryEntry[] {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        const col = firestore.collection(db, 'users', ownerUid, 'counters', counterId, 'history');
        const q = firestore.query(col, firestore.orderBy('timestamp', 'desc'));
        return firestore.onSnapshot(q, (snap) => {
            setEntries(
                snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<HistoryEntry, 'id'>),
                }))
            );
        });
    }, [ownerUid, counterId]);

    return entries;
}
