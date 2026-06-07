# FastCount — Product Requirements Document

## Overview

**FastCount** is a personal productivity web app that lets users manage two
types of widgets: **Counters** and **FastWatches**. 

Your task is to develop the FastCount web app as a frontend, TypeScript+React (use Vite as your build tool).

Users sign in with Google. Each user owns their own widgets and can optionally share any widget with other users, which are identified by their email address.
Users see their own widgets and also shared widgets update in real time or near-real-time.

---

## Authentication

- Users sign in via their **Google Account**.
- The app displays a sign-in page to unauthenticated users; authenticated users see the main app.
- The signed-in user's avatar is shown in the app header.
- All data access is gated on authentication; unauthenticated requests are rejected data layer level.
- Using Firebase Authentication and Firestore for storage is recommended.

---

## Navigation

- The main app has a **tab bar** with two tabs: **Counters** and **FastWatch**.
- Each tab shows the user's own widgets, followed by a "Shared with you" section (if any widgets have been shared with them).
- A Counter can be navigated into a **history view** (replacing the main view), with a back button that uses the browser's history API.

---

## Counters

A Counter tracks a named numeric value.

### Counter Features

| Feature | Description |
|---|---|
| **Create** | A "+ counter" button adds a new counter with an empty name and count of 0. |
| **Name** | The counter starts unnamed. The user types a name and confirms it (Enter or blur). Clicking the name later opens it for editing again. |
| **Increment** | A `+` button increases the count by 1. |
| **Decrement** | A `−` button decreases the count by 1. |
| **Set directly** | A pencil (edit) button opens an inline input to set the count to any arbitrary number. |
| **Delete** | A delete button removes the counter (and cleans up any sharing records). |
| **Share** | A share button opens a sharing modal (see Sharing section). |
| **View history** | A clock button navigates to the counter's operation history. |
| **Persistence** | Counter state is persisted in Firestore and synced in real time. |

### Counter Operation History

Every mutation to a counter is recorded as a history entry. The history view shows a table with:

- **Op** — the operation type: `inc`, `dec`, `set`, or `name`
- **Value** — the numeric value (or new name) after the operation
- **When** — a human-readable relative timestamp (e.g., "2 hours ago")
- **Date / Time** — the full ISO-style timestamp (YYYY-MM-DD HH:MM:SS)

History entries are ordered newest-first. The user can navigate back from the history view using the Back button (which also supports the browser's back button).

---

## FastWatches

A FastWatch is an intermittent-fasting timer. It tracks how long a fast has been running and compares it to a configurable target duration.

### FastWatch Features

| Feature | Description |
|---|---|
| **Create** | A "+ fastwatch" button creates a new FastWatch with a random name, a default 16-hour target, and a start time of now. |
| **Name** | The FastWatch has an editable name (inline edit, same UX as Counter names). |
| **Live elapsed timer** | While running, the elapsed time is displayed in `HH:MM:SS` format and ticks every second. |
| **Target duration** | The target fasting duration is shown next to the elapsed time. The owner can edit the target by clicking the edit button and entering a value in hours. |
| **Target reached indicator** | When elapsed time reaches or exceeds the target, the card is visually highlighted. |
| **Reset** | A "Reset" button restarts the fast from the current moment. |
| **Delete** | A delete button removes the FastWatch (and cleans up any sharing records). |
| **Share** | A share button opens a sharing modal (see Sharing section). |
| **Persistence** | FastWatch state (name, target, start time) is persisted in Firestore and synced in real time. |

---

## Sharing

Both Counters and FastWatches support sharing between users.

### Sharing Features

| Feature | Description |
|---|---|
| **Share by email** | The owner opens the sharing modal and enters the recipient's email address to grant them read access. |
| **View current shares** | The sharing modal lists all users the widget is currently shared with. |
| **Revoke sharing** | The owner can revoke access for any recipient from the sharing modal. |
| **Shared section** | Widgets shared with the current user appear in a dedicated "Shared with you" section below their own widgets. |
| **Read-only for recipients** | A recipient can view a shared widget (including its current value or timer state) but cannot modify it. Controls like increment, decrement, set, reset, and rename are hidden for shared viewers. |
| **Shared-by label** | Shared widgets display the email of the owner. |

### Security Rules

security rules enforce these access controls at the database level:

- Only the **owner** can read or write their own counter/FastWatch data and history.
- A user can read a counter/FastWatch shared with them, but cannot modify it or access its history.
- Users must be authenticated to have any access to widget data. Unauthenticated requests are always denied.
