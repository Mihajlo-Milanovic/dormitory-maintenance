# Proposal: stop random notifications and restore real-time delivery

Status: implementation steps 2–4 completed. The runtime mock fallback is also
absent from the current service. Frontend production build and 31 focused
notification tests pass. Live verification through the development and Nginx
proxies remains outstanding.

Implementation notes:

- HTTP and live events share a mapper for persisted notifications. Actual
  producers store reports, jobs with nested reports, and supply requests;
  display messages are derived from those payloads.
- Lists merge by persisted ID, sort by creation time, and preserve confirmed read
  state. Every successful connection refreshes the HTTP list; pending refreshes
  are canceled and refresh results merge with events received in the meantime.
- The backend has no bulk read endpoint. The frontend marks unread notifications
  through the existing per-ID endpoint and refreshes after a partial failure.
- Focused coverage includes mapping, malformed/domain event rejection, reconnect
  signals, deduplication, refresh races, read state, logout, and user changes.

## Problem and evidence

`dormitory-maintenance-frontend/src/app/core/services/websocket.service.ts`
starts `startMockEventSimulation()` whenever the connection errors, closes, or
throws during construction. That method emits one of three hardcoded events at
random every 25 seconds. `app.ts` subscribes to these events and displays them as
unread notifications. A connection failure therefore looks like real activity.

The mock timer also has a lifecycle bug: `disconnect()` closes the socket and
clears the timer, but the asynchronous `onclose` callback can start it again.
This can leave fabricated events running after logout.

There is a separate connection mismatch that removing the timer will not fix:

- The frontend uses the browser's native `WebSocket` protocol at `/ws` and sends
  the token as a query parameter.
- `notifications.gateway.ts` uses Socket.IO with namespace `/ws` and reads the
  token from `handshake.auth.token` or the authorization header.
- Socket.IO namespaces are distinct from transport paths. The gateway currently
  uses the default `/socket.io/` transport path, while the development and Nginx
  proxies expose `/ws`.

These contracts are incompatible as written. This finding is based on source
inspection; a live connection has not been tested for this proposal.

## Recommended implementation

### 1. Remove fabricated runtime events

Delete `mockTimer`, `startMockEventSimulation()`, and every call to that method.
Connection failures must update connection state or produce a diagnostic, never
emit a notification. Keep any future demo events in an explicitly enabled test
or demo provider, disabled in normal application use.

This can be delivered first as a small fix. Existing notifications fetched by
HTTP remain available, but live delivery requires the next step.

### 2. Match the Socket.IO backend

Add `socket.io-client` to the frontend using a version compatible with the
backend's Socket.IO 4.x server. Replace native `WebSocket` handling with a
Socket.IO client while retaining the service's `connect()`, `disconnect()`, and
`onMessage()` interface.

Use namespace `/ws`, send credentials through `auth: { token }`, and explicitly
configure the transport path as `/ws/socket.io` on both client and gateway.
This keeps transport requests beneath the existing `/ws` proxy route. Verify
that both proxies preserve that path and support polling as well as upgrade
requests. Do not confuse the namespace with the transport path.

Register explicit listeners for supported notification event names
(`report.created`, `report.updated`, `supply.updated`, `job.reassigned`). Forward
validated notification payloads to the observable. Connection and transport
events must never enter that stream.

### 3. Make connection ownership explicit

- Make `connect()` idempotent, including while connecting or reconnecting.
- Do not connect without an access token. Refresh the handshake credentials
  before reconnecting after a token change.
- Use Socket.IO's bounded reconnection settings for transient failures. On
  rejected authentication, stop retries until credentials change.
- In `disconnect()`, remove registered listeners, disconnect the client, and
  clear the stored reference. Intentional disconnect must cancel reconnection.
- In `app.ts`, retain and dispose of the authentication subscription, and keep
  only one notification subscription. Clear notifications and close the
  dropdown on logout to avoid showing the previous user's data.

### 4. Normalize persisted notifications consistently

The backend currently returns `{ id, userId, type, payload, readAt, createdAt }`;
the frontend expects top-level `title`, `message`, and `isRead`. Define one
mapping for HTTP results and persisted real-time events, deriving `isRead` from
`readAt` and validating display fields inside `payload`. Confirm actual payload
shapes at notification producers before implementing that mapping.

Use persisted notification IDs to deduplicate live events and HTTP refreshes.
Do not manufacture IDs for malformed events. After reconnection, refresh the
persisted list to recover notifications missed while offline. Coordinate that
refresh with arriving events so it cannot overwrite a newly received item.
Role/category broadcasts may contain different payloads; keep those as domain
updates unless they meet the persisted notification contract.

## Verification and acceptance criteria

1. With the backend unavailable, advance fake time beyond several 25-second
   intervals: no notification events are emitted and no mock timer exists.
2. Connect repeatedly: only one active client and one set of event listeners
   exists. Delivering one persisted notification displays it once.
3. Disconnect or log out while connecting, connected, and reconnecting: no
   later event or retry updates the signed-out UI. Signing in as another user
   shows only that user's notifications.
4. Exercise a valid and invalid token against the actual gateway through the
   development proxy and Nginx. Verify namespace, transport path, authentication,
   event delivery, and intentional disconnect behavior.
5. Verify the HTTP and live mappings display the same title, message, timestamp,
   and read state. Reconnection recovers missed persisted notifications without
   duplicates or losing an event received during refresh.
6. Run the frontend build and focused service/lifecycle tests; run gateway tests
   if its transport configuration changes.

The immediate fix is complete when connection failures can no longer create
notifications. The full fix is complete when authenticated backend notifications
arrive once, survive reconnects through HTTP recovery, and stop on logout.
