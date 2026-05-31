// @vitest-environment node
import { readFileSync } from 'fs';
import { spawn, type ChildProcess } from 'child_process';
import { createConnection } from 'net';
import {
    initializeTestEnvironment,
    assertFails,
    assertSucceeds,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;
let emulatorProcess: ChildProcess;

function waitForEmulator(port: number, timeoutMs = 30_000): Promise<void> {
    return new Promise((resolve, reject) => {
        const deadline = Date.now() + timeoutMs;
        function probe() {
            const socket = createConnection(port, 'localhost');
            socket.on('connect', () => {
                socket.destroy();
                resolve();
            });
            socket.on('error', () => {
                if (Date.now() >= deadline) reject(new Error(`Emulator not ready on port ${port}`));
                else setTimeout(probe, 500);
            });
        }
        probe();
    });
}

beforeAll(async () => {
    const EMULATOR_PORT = 8080;
    emulatorProcess = spawn('firebase', ['emulators:start', '--only', 'firestore'], {
        stdio: 'pipe',
    });
    await waitForEmulator(EMULATOR_PORT);
    testEnv = await initializeTestEnvironment({
        projectId: 'test-project',
        firestore: {
            rules: readFileSync('firestore.rules', 'utf8'),
            host: 'localhost',
            port: EMULATOR_PORT,
        },
    });
}, 40_000);

afterAll(async () => {
    await testEnv.cleanup();
    emulatorProcess?.kill();
});

afterEach(async () => {
    await testEnv.clearFirestore();
});

function ownerDb() {
    return testEnv.authenticatedContext('owner-uid', { email: 'owner@example.com' }).firestore();
}

function sharedUserDb() {
    return testEnv.authenticatedContext('shared-uid', { email: 'shared@example.com' }).firestore();
}

function otherUserDb() {
    return testEnv.authenticatedContext('other-uid', { email: 'other@example.com' }).firestore();
}

function unauthDb() {
    return testEnv.unauthenticatedContext().firestore();
}

function counterRef(db: ReturnType<typeof ownerDb>) {
    return doc(db, 'users', 'owner-uid', 'counters', 'counter-1');
}

function shareRef(db: ReturnType<typeof ownerDb>, email: string) {
    return doc(db, 'shares', email, 'counters', 'counter-1');
}

async function seedCounter(sharedWith: string[]) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'users', 'owner-uid', 'counters', 'counter-1'), {
            name: 'My Counter',
            count: 0,
            createdAt: null,
            sharedWith,
        });
    });
}

describe('/users/{userId}/counters/{counterId}', () => {
    describe('owner', () => {
        it('can read their own counter', async () => {
            await seedCounter([]);
            await assertSucceeds(getDoc(counterRef(ownerDb())));
        });

        it('can write their own counter', async () => {
            await seedCounter([]);
            await assertSucceeds(updateDoc(counterRef(ownerDb()), { count: 1 }));
        });
    });

    describe('shared user (email in sharedWith)', () => {
        beforeEach(() => seedCounter(['shared@example.com']));

        it('can read the counter', async () => {
            await assertSucceeds(getDoc(counterRef(sharedUserDb())));
        });

        it('cannot write the counter', async () => {
            await assertFails(updateDoc(counterRef(sharedUserDb()), { count: 1 }));
        });
    });

    describe('non-shared authenticated user', () => {
        beforeEach(() => seedCounter(['shared@example.com']));

        it('cannot read the counter', async () => {
            await assertFails(getDoc(counterRef(otherUserDb())));
        });

        it('cannot write the counter', async () => {
            await assertFails(updateDoc(counterRef(otherUserDb()), { count: 1 }));
        });
    });

    describe('unauthenticated user', () => {
        beforeEach(() => seedCounter([]));

        it('cannot read the counter', async () => {
            await assertFails(getDoc(counterRef(unauthDb())));
        });

        it('cannot write the counter', async () => {
            await assertFails(updateDoc(counterRef(unauthDb()), { count: 1 }));
        });
    });
});

describe('/users/{userId}/counters/{counterId}/history/{historyId}', () => {
    function historyRef(db: ReturnType<typeof ownerDb>) {
        return doc(db, 'users', 'owner-uid', 'counters', 'counter-1', 'history', 'entry-1');
    }

    async function seedHistory() {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(
                doc(
                    ctx.firestore(),
                    'users',
                    'owner-uid',
                    'counters',
                    'counter-1',
                    'history',
                    'entry-1'
                ),
                { value: 5, operation: 'inc', timestamp: null }
            );
        });
    }

    describe('owner', () => {
        it('can read their own history entries', async () => {
            await seedCounter(['shared@example.com']);
            await seedHistory();
            await assertSucceeds(getDoc(historyRef(ownerDb())));
        });

        it('can write history entries', async () => {
            await seedCounter([]);
            await assertSucceeds(
                setDoc(historyRef(ownerDb()), { value: 1, operation: 'inc', timestamp: null })
            );
        });
    });

    describe('shared user (email in sharedWith)', () => {
        beforeEach(async () => {
            await seedCounter(['shared@example.com']);
            await seedHistory();
        });

        it('can read history entries', async () => {
            await assertSucceeds(getDoc(historyRef(sharedUserDb())));
        });

        it('cannot write history entries', async () => {
            await assertFails(
                setDoc(historyRef(sharedUserDb()), { value: 2, operation: 'inc', timestamp: null })
            );
        });
    });

    describe('non-shared authenticated user', () => {
        beforeEach(async () => {
            await seedCounter(['shared@example.com']);
            await seedHistory();
        });

        it('cannot read history entries', async () => {
            await assertFails(getDoc(historyRef(otherUserDb())));
        });

        it('cannot write history entries', async () => {
            await assertFails(
                setDoc(historyRef(otherUserDb()), { value: 3, operation: 'inc', timestamp: null })
            );
        });
    });

    describe('unauthenticated user', () => {
        beforeEach(async () => {
            await seedCounter([]);
            await seedHistory();
        });

        it('cannot read history entries', async () => {
            await assertFails(getDoc(historyRef(unauthDb())));
        });

        it('cannot write history entries', async () => {
            await assertFails(
                setDoc(historyRef(unauthDb()), { value: 4, operation: 'inc', timestamp: null })
            );
        });
    });
});

describe('/shares/{email}/counters/{counterId}', () => {
    it('owner can create a share reference', async () => {
        await assertSucceeds(
            setDoc(shareRef(ownerDb(), 'shared@example.com'), { ownerUid: 'owner-uid' })
        );
    });

    it('non-owner cannot create a share reference', async () => {
        await assertFails(
            setDoc(shareRef(otherUserDb(), 'shared@example.com'), { ownerUid: 'owner-uid' })
        );
    });

    it('owner can delete a share reference', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(
                doc(ctx.firestore(), 'shares', 'shared@example.com', 'counters', 'counter-1'),
                {
                    ownerUid: 'owner-uid',
                }
            );
        });
        await assertSucceeds(deleteDoc(shareRef(ownerDb(), 'shared@example.com')));
    });

    it('recipient can read their own share references', async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(
                doc(ctx.firestore(), 'shares', 'shared@example.com', 'counters', 'counter-1'),
                {
                    ownerUid: 'owner-uid',
                }
            );
        });
        await assertSucceeds(getDoc(shareRef(sharedUserDb(), 'shared@example.com')));
    });

    it("recipient cannot read another user's share references", async () => {
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(
                doc(ctx.firestore(), 'shares', 'other@example.com', 'counters', 'counter-1'),
                {
                    ownerUid: 'owner-uid',
                }
            );
        });
        await assertFails(
            getDoc(doc(sharedUserDb(), 'shares', 'other@example.com', 'counters', 'counter-1'))
        );
    });
});
