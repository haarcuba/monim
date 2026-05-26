import { vi } from 'vitest';
import * as fs from 'fs';
import ChildProcess from 'child_process';
import Net from 'net';
import {
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as FireStore from 'firebase/firestore';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';

let testEnv: RulesTestEnvironment;
let emulatorProcess: ChildProcess.ChildProcess;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let userBDb: any;

function waitForEmulator(port: number, timeoutMs = 30_000): Promise<void> {
    return new Promise((resolve, reject) => {
        const deadline = Date.now() + timeoutMs;
        function probe() {
            const socket = Net.createConnection(port, 'localhost');
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

vi.mock('../src/firebase', () => ({
    get db() {
        return userBDb;
    },
    auth: {},
    googleProvider: {},
}));

vi.mock('../src/AuthContext', () => ({
    useAuth: vi.fn().mockReturnValue({
        user: {
            uid: 'user-b-uid',
            email: 'user-b@example.com',
            displayName: 'User B',
            photoURL: null,
        },
        loading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
    }),
}));

const EMULATOR_PORT = 8080;
const USER_A_UID = 'user-a-uid';
const USER_A_EMAIL = 'user-a@example.com';
const USER_B_EMAIL = 'user-b@example.com';
const COUNTER_ID = 'shared-counter-1';

beforeAll(async () => {
    emulatorProcess = ChildProcess.spawn('firebase', ['emulators:start', '--only', 'firestore'], {
        stdio: 'pipe',
    });
    await waitForEmulator(EMULATOR_PORT);
    testEnv = await initializeTestEnvironment({
        projectId: 'test-project',
        firestore: {
            rules: fs.readFileSync('firestore.rules', 'utf8'),
            host: 'localhost',
            port: EMULATOR_PORT,
        },
    });
    userBDb = testEnv.authenticatedContext('user-b-uid', { email: USER_B_EMAIL }).firestore();
}, 40_000);

afterAll(async () => {
    await testEnv?.cleanup();
    emulatorProcess?.kill();
});

beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
        const adminDb = ctx.firestore();
        await FireStore.setDoc(FireStore.doc(adminDb, 'users', USER_A_UID, 'counters', COUNTER_ID), {
            name: 'Apples',
            count: 0,
            createdAt: null,
            sharedWith: [USER_B_EMAIL],
        });
        await FireStore.setDoc(FireStore.doc(adminDb, 'shares', USER_B_EMAIL, 'counters', COUNTER_ID), {
            ownerUid: USER_A_UID,
            ownerEmail: USER_A_EMAIL,
        });
    });
});

afterEach(async () => {
    await testEnv.clearFirestore();
});

describe('counter sharing', () => {
    it('user B sees a counter shared by user A', async () => {
        render(<App />);

        expect(await screen.findByText('Apples')).toBeInTheDocument();
        expect(await screen.findByTestId('shared-by')).toHaveTextContent(USER_A_EMAIL);
        expect(await screen.findByTestId('counter')).toHaveTextContent('0');
    });

    it('user B sees the count update when user A increments', async () => {
        render(<App />);
        expect(await screen.findByText('Apples')).toBeInTheDocument();

        const aDb = testEnv.authenticatedContext(USER_A_UID, { email: USER_A_EMAIL }).firestore();
        await FireStore.updateDoc(FireStore.doc(aDb, 'users', USER_A_UID, 'counters', COUNTER_ID), { count: 1 });

        await waitFor(() => {
            expect(screen.getByTestId('counter')).toHaveTextContent('1');
        });
    });

    it('user B no longer sees the counter after user A removes the share', async () => {
        render(<App />);
        expect(await screen.findByText('Apples')).toBeInTheDocument();

        const aDb = testEnv.authenticatedContext(USER_A_UID, { email: USER_A_EMAIL }).firestore();
        await FireStore.deleteDoc(FireStore.doc(aDb, 'shares', USER_B_EMAIL, 'counters', COUNTER_ID));
        await FireStore.updateDoc(FireStore.doc(aDb, 'users', USER_A_UID, 'counters', COUNTER_ID), {
            sharedWith: FireStore.arrayRemove(USER_B_EMAIL),
        });

        await waitFor(() => {
            expect(screen.queryByText('Apples')).not.toBeInTheDocument();
        });
    });
});
