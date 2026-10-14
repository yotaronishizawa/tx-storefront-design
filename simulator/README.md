# In-page simulator

Fakes both hubs the app talks to — OPM (`/signalr/rpc`) and the stock shelf hub
(`/stockshelf`) — **inside the app's own browser tab**. There is no server.
It behaves as OPM _should_: `txoperationmanager`'s shapes, enums and error
messages. Any non-empty agent ID signs in; the password is ignored.

## How it works

`app/entry.client.tsx` imports `src/browser/install.mjs` first. That module:

- replaces `WebSocket` so a URL on `sim.invalid` (see `.env.mock`) opens a
  `FakeWebSocket` (`src/browser/fake-websocket.mjs`) instead of the network.
  The app's real SignalR client speaks its normal JSON protocol over it, and
  `src/browser/session.mjs` answers each call;
- answers SignalR's negotiate request for those URLs;
- listens on a `BroadcastChannel`, so the control panel in another tab of the
  same browser (`public/sim-controls/`) can run the `/sim/*` scenarios;
- exposes `sim(method, path, params)` in the console.

**Reloading the app tab restarts the simulator from its seed.** The app stays
signed in; tasks, stock changes and errors go back to the start.

| Path                       | Holds                                                                    |
| -------------------------- | ------------------------------------------------------------------------ |
| `src/config.mjs`, `state.mjs` | Hub paths; the one mutable `state` and `resetState()`                 |
| `src/seed/`                | Initial store, drinks, display and stock locations                       |
| `src/rpc/`                 | OPM methods reached through `Call`, one `{ Method: handler }` table per area |
| `src/hubs/`                | Direct hub methods for each hub                                          |
| `src/sim/`                 | The `/sim/*` scenarios                                                   |
| `src/model/`               | Lane, robot, request and start-check logic shared by `rpc/` and `sim/`  |
| `src/events.mjs`, `faults.mjs` | Everything pushed to the app; per-method faults and latency          |
| `src/browser/`             | The in-page transport described above                                    |

## Seed data

- Stock lanes hold 1–3 drinks, each with a `skuEntries[].addedAt` 0–12 days old. Every seventh lane's back drink has `addedAt: null` (unknown date).
- The store has `config.stockExpiryWarning` on at 7 days, so some lanes show as aged.
- `RemoveSkusFromStock` refuses as OPM's `CheckIfCanRemoveSku` does: `6` RestockingInProgress while a restock is in progress, `5` PnpInProgress unless the operation mode allows removal, `7` RobotMoving unless the work status is `5` RestPosition, `1` NotStartedYet or `12` FailureToStartRobotSw. The seed starts in `ProcessingPnpJob`, so stop the robot first (or `POST /sim/robot/op-mode`). `8` JobQueueNotEmpty comes from the study queued-job state or `POST /sim/faults?method=RemoveSkusFromStock&error=8`. Each removal reads as `{ Item1, Item2 }` or `{ skuIndex, skuId }`.
- `SIM-GRAPE` sits in stock lane `S1-R3-L04` but on no display-shelf location, so it shows as a misplaced drink.
- Every OPM task is one list, `requests`: restocking, manual replenishment, layout changes (`StartShelfLayoutChangeRequest`, one open at a time, kept open through RS/MR switching; capture begins on robot restart) and whatever `/sim/request` opens.
- Restocking and manual replenishment run OPM's start checks, in `GetHomepageActions` and again when started: an open manual replenishment blocks restocking and the reverse; a robot in teleoperation (`9`, `10`), in 3D capture (`6`, restocking only) or not started (`1`) blocks both; an oversized drink in any lane or a disconnected shelf blocks manual replenishment. Lane errors do not block restocking, as OPM does not block it for a client that is not the Unity store app.
- Every lane starts clean. Put an error on one with the lane-error scenarios below; while any lane is in error the app skips counting placements.

## Scenarios

There is no HTTP server: call a scenario from the app tab's browser console with
`sim(method, path, params)`, or use the control panel (`/sim-controls/index.html`):

```js
sim("POST", "/sim/scenario/constraint-error", { reason: 2 })
```

`GET /sim/catalog` lists every route, method and error code; `GET /sim/state`
shows the current state; `POST /sim/reset` restores the seed. Bad parameters
answer `400 { ok: false, error }`. Changes to lanes, the scanner and connections are
pushed to the app at once; everything else shows up on its next poll or call.

| Area            | Endpoint                                                    | Parameters                                                                                                                     |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| State           | `POST /sim/stores/clear`                                    | — (empty store list)                                                                                                           |
|                 | `POST /sim/store/shelf-client`                              | `enabled` (`false` makes a V2 store; validation then warns `SmartShelfClientNotEnabled`)                                       |
|                 | `POST /sim/recommendations`                                 | `answer` = `list` \| `null` \| `null-list`                                                                                     |
| Robot           | `POST /sim/robot/rest-position`, `/sim/robot/auto-pnp`      | —                                                                                                                              |
|                 | `POST /sim/robot/status`                                    | `value` (work status, default `5`), `teleopCode` (`TeleopErrorCode` while requesting teleoperation, default `10`)              |
|                 | `POST /sim/robot/op-mode`                                   | `value` (operation mode, default `31`; `4 11 30 31` allow removal)                                                             |
| Scanner / shelf | `POST /sim/scanner/scan`                                    | `code` (JAN), `accepted`, `validated` (default: the hub's own check), `applied`, `restockingError`                             |
|                 | `POST /sim/shelf/connection`                                | `connected`, `scanner` (`false` \| `absent`)                                                                                   |
| Lanes           | `POST /sim/lane/add`                                        | `lane`, `sku`, `scanned=false` (unscanned placement)                                                                           |
|                 | `POST /sim/lane/remove`                                     | `lane`, `count`                                                                                                                |
|                 | `POST /sim/scenario/stock-error`                            | `lane`, `cause` (`DiscrepancyCause`)                                                                                           |
|                 | `POST /sim/scenario/constraint-error`                       | `lane`, `reason` (`InvalidSkuReason`)                                                                                          |
|                 | `POST /sim/scenario/clear-errors`                           | —                                                                                                                              |
|                 | `POST /sim/lane/unfixable`                                  | `lane`, `value` (survives `ForceDiscrepancyResolution`)                                                                        |
|                 | `POST /sim/lane/stuck`                                      | `lane`, `hiccup` (default `30` NearStuck; the lane turns unavailable, so a reservation of its drink offers the stuck-lane fix) |
| Faults          | `GET /sim/faults`, `POST /sim/faults/clear`                 | `method` (omit to clear all)                                                                                                   |
|                 | `POST /sim/faults`                                          | `method`, `mode` = `error` (+ `error=<n>`) \| `throw` \| `hang` \| `unreadable` \| `robot` \| `detail`                         |
| Manual PnP      | `POST /sim/manual-job/warnings`                             | `values` (comma-separated `PnpJobContextWarning`)                                                                              |
|                 | `POST /sim/manual-job/result`                               | `job`, `status`, `errorCode`                                                                                                   |
| Requests        | `POST /sim/request`                                         | `type` (`10` store, `4` layout check, `3` annotation), `status`, `title`, `description`                                        |
|                 | `POST /sim/notification`, `/sim/store-task`                 | `type` / `status`, `title`, `description`                                                                                      |
| Connection      | `POST /sim/latency`                                         | `ms` (`0` off)                                                                                                                 |
|                 | `POST /sim/opm-hub/drop`                                    | — (forces a reconnect)                                                                                                         |
|                 | `POST /sim/opm-hub/connection`, `/sim/shelf-hub/connection` | `up=false` takes the hub down                                                                                                  |
|                 | `POST /sim/auth/expire`                                     | — (next call is `Unauthorized`)                                                                                                |

| Method | Path                | Parameters | Effect                                                                                | Reaches the app               | Response                                           |
| ------ | ------------------- | ---------- | ------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------- |
| `GET`  | `/sim/state`        | —          | Nothing; a summary of the current state                                               | —                             | snapshot¹                                          |
| `GET`  | `/sim/catalog`      | —          | Nothing; the routes, methods with their error codes, lanes and drinks a client needs  | —                             | `{ routes, methods, pnpJobWarnings, lanes, skus }` |
| `POST` | `/sim/reset`        | —          | Rebuilds the seed state, faults and delay included                                    | on reload — nothing is pushed | snapshot¹                                          |
| `POST` | `/sim/stores/clear` | —          | Empties the store list, for the no-stores sign-in path                                | next `GetStores`              | `{ ok, stores }`                                   |

¹ `{ stores, skus, displayLocations, stockLocations, requests, robot, currentRestockingId, currentRestockingSku, faults, latencyMs, pnpJobWarnings, notifications, storeTasks, operatorTasks, unfixableLaneIds, shelfConnected, scannerPresent, scannerConnected, opmHubUp, shelfHubUp }`

### Robot

| Method | Path                       | Parameters                             | Effect                                                                                                                                              | Reaches the app | Response        |
| ------ | -------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------------- |
| `POST` | `/sim/robot/rest-position` | —                                      | Status `5` RestPosition, mode `0` ProcessingPnpJob                                                                                                  | next poll       | snapshot¹       |
| `POST` | `/sim/robot/auto-pnp`      | —                                      | Status `3` AutomationPnpWorking, mode `0` ProcessingPnpJob                                                                                          | next poll       | snapshot¹       |
| `POST` | `/sim/robot/status`        | `value` — work status, default `5`     | Any work status, including `0` Offline, `2` Standby and `-1` Error, which no other helper reaches. Values are listed in `app/api/opm/schemas/robot.ts` | next poll       | `{ ok, robot }` |
| `POST` | `/sim/robot/detection` | `cause` — `human`, `obstacle`, `fallenDrink` or `clear`; `stopped=0` reports the detection without stopping the robot | Sets what camera 1 detects and, unless `stopped=0`, the matching `StoppedDueTo…` | next `GetRobotLiveData*` | `{ ok, robot }` |
| `POST` | `/sim/robot/e-stop` | `value` — `RobotEStopStatus`: `0` Released, `1` Pressed (default), `2` NeedsReset | Sets `eStopStatus` (and the older `eStopTriggered`) | next `GetRobotLiveData*` | `{ ok, robot }` |
| `POST` | `/sim/robot/op-mode`       | `value` — operation mode, default `31` | Any operation mode. `4`, `11`, `30` and `31` (StoppedByStore) allow drink removal; the seed's `0` does not                                          | next poll       | `{ ok, robot }` |

### Scanner and shelf

| Method | Path                    | Parameters                                                                                                                                                                                                                 | Effect                                                                                                                                                                                                                                                                                 | Reaches the app | Response                                                   |
| ------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------- |
| `POST` | `/sim/scanner/scan`     | `code` — JAN, default the first SKU's; `accepted`, `validated` — `false` rejects the scan (`isAccepted`, `validationPassed`); `applied` — `true` sets `restockingSkuApplied`; `restockingError` — the scanner's error text | Reports a scan on both channels: `skuScanned` and `scannerScanProcessed` on the stock shelf hub, and `GetSmartShelvesStatus` for the OPM fallback. Nothing is placed: during a restock the app then calls `SetCurrentRestockingSku`, and the drink goes on a lane with `/sim/lane/add` | pushed          | `{ ok, scan }`                                             |
| `POST` | `/sim/shelf/connection` | `connected` — `false` takes the shelf offline; `scanner` — `false` disconnects the scanner, `absent` drops its status block as OPM does for a store without one. Either may be omitted                                     | Changes the smart shelves status, pushed on the smart shelves topic and read by `GetSmartShelvesStatus`                                                                                                                                                                                | pushed          | `{ ok, shelfConnected, scannerPresent, scannerConnected }` |

### Lanes

Every lane endpoint takes `lane`, a stock location id such as `S1-R2-L05`
(`S<cabinet>-R<row>-L<lane>`; row 1 has 11 lanes, rows 2–5 have 15). An
unknown lane answers `400` `{ ok: false, error }`. They all push the change on
both hubs and answer `{ ok, update }`, the OPM stock-SKU change sent.

| Method | Path                             | Parameters                                                                                                                                                                       | Effect                                                                                                                                                                                     |
| ------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST` | `/sim/lane/add`                  | `lane` — default `S1-R1-L01`; `sku` — default the drink scanned for the current restock, else the lane's front drink; `scanned` — `false` sends the add without naming the drink | A drink placed on the lane. With `scanned=false` and nothing scanned in the app, the app plays the no-scanned-item cue and flags an unscanned drink                                        |
| `POST` | `/sim/lane/remove`               | `lane` — default `S1-R1-L01`; `count` — default `1`, capped at what the lane holds                                                                                               | Drinks taken off the front of the lane by hand, with no scan and no removal request                                                                                                        |
| `POST` | `/sim/scenario/stock-error`      | `lane` — default `S1-R1-L09`; `cause` — OPM `DiscrepancyCause`, default `1`                                                                                                      | A weight the shelf cannot explain: a `DiscrepancyError`, shown as a red lane with the reason and support code in the lane drawer                                                           |
| `POST` | `/sim/scenario/constraint-error` | `lane` — default `S1-R1-L04`; `reason` — OPM `InvalidSkuReason`, default `1`                                                                                                     | Puts a drink too big for it into the lane: an `InvalidSkuError`, shown as a red lane and a "can't go in this lane" drink. The drink goes in once; repeating the call only swaps the reason |
| `POST` | `/sim/scenario/clear-errors`     | —                                                                                                                                                                                | Clears every lane error, so the board returns to clean without a reset. Answers `{ ok, cleared }`                                                                                          |
| `POST` | `/sim/lane/unfixable`            | `lane` — default `S1-R1-L09`; `value` — `false` makes it fixable again                                                                                                           | Whether the lane's discrepancy survives `ForceDiscrepancyResolution` (the app's "check lane"). Unfixable disables the lane. Pushes nothing itself; answers `{ ok, unfixableLaneIds }`      |

What each value shows in the lane drawer:

| Parameter | Value                       | Meaning                      | Code      |
| --------- | --------------------------- | ---------------------------- | --------- |
| `reason`  | `1`                         | Too wide                     | `S000602` |
| `reason`  | `2`                         | Too tall                     | `S000601` |
| `cause`   | `0`                         | Placed without scanning      | `S000603` |
| `cause`   | `1`                         | Removed without scanning     | `S000604` |
| `cause`   | `2`                         | Removed from another session | `S000605` |
| `cause`   | `3`                         | Restocking discrepancy       | `S000606` |
| `cause`   | `4`                         | Robot operation discrepancy  | `S000607` |
| `cause`   | any other integer, e.g. `9` | Unknown                      | `S000699` |

A lane change reaches both hubs. On the stock shelf hub its `laneEventType`
follows the change — `Add` or `Remove` by `skuCountDiff`, else `Error` while the
lane has errors, else `SnapShot` — so an error scenario never reads as an
unscanned drink.

### Faults

A fault makes one OPM method fail on every call, from any connection, until
cleared or reset. `method` is any direct hub method but `Call` (`SignInWithID`,
`Subscribe`, …) or any RPC; `GET /sim/catalog` lists them with their codes.

| Method | Path                | Parameters                                                                                                                                                                                                                                             | Effect                                       | Reaches the app | Response         |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | --------------- | ---------------- |
| `GET`  | `/sim/faults`       | —                                                                                                                                                                                                                                                      | Nothing; the faults set                      | —               | `{ ok, faults }` |
| `POST` | `/sim/faults`       | `method`; `mode` — `error` (default: answer with the method's own OPM code, `error=<n>`; only methods that report errors in their answer), `throw` (a HubException, `message` optional), `hang` (never answer), `unreadable` (a shape no schema reads), `robot` (the robot stop or restart inside the command fails with `error=<n>`, a robot enum value), `detail` (`error` None with only `errorDetail` set) | Sets the fault, replacing any on that method | next call       | `{ ok, faults }` |
| `POST` | `/sim/faults/clear` | `method` — omit to clear every fault                                                                                                                                                                                                                   | Clears it                                    | next call       | `{ ok, faults }` |

Methods with error codes: `SignInWithID`, `StartRestocking2`, `EndRestocking`, `EndRestocking2`,
`PauseRestocking`, `StartRobotOperation2`, `StopRobotOperation2`,
`StartManualReplenishment`, `EndManualReplenishment`,
`SubscribeToStockSkuChanges`, `SetCurrentRestockingSku`,
`GetSmartShelvesStatus`, `PrepareManualPnpJobSimple`,
`ValidatePnpJobWithWarnings`, `StartShelfLayoutChangeRequest(V2)`,
`GetHomepageActions`, `SkipRestocking`, `ForceDiscrepancyResolution`. The codes are
in `src/rpc/errors.mjs`.

`mode=robot` fails the robot step inside a command, with a
`StopRobotOperationErrors` value for the starts and a
`StartRobotOperationErrors` value for the ends, answered as OPM does:
`StartRestocking2` 13 and `StartManualReplenishment` 11 with
`stopRobotOperationError`, starting nothing; `EndRestocking` ends the restock
and sets only `startRobotOperationError`; `EndManualReplenishment` closes the
task and answers 10 with `startRobotOperationError`. `mode=detail` is for
`SetCurrentRestockingSku` only: the SKU is not applied, and the answer is
`error` None with an empty `errorDetail`, as when OPM fails to publish it to
the shelf.

### Manual PnP

| Method | Path                       | Parameters                                                                                                                             | Effect                                                                                                              | Reaches the app | Response                 |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------ |
| `POST` | `/sim/manual-job/warnings` | `values` — comma-separated `PnpJobContextWarning` numbers, empty clears                                                                | What `ValidatePnpJobWithWarnings` warns about; any warning makes the app ask the operator to confirm the manual job | next call       | `{ ok, pnpJobWarnings }` |
| `POST` | `/sim/manual-job/result`   | `job` — default the last published; `status` — `JobResult.Status`, default `3` Completed; `errorCode` — `TeleopErrorCode`, default `0` | Moves the job's `PnpJobResult` on, as `GetJobResult` then reports it                                                | next poll       | `{ ok, result }`         |

### Requests and tasks

What the operations centre sends a store. Nothing in the store creates these,
so they come from here; the store app polls them.

| Method | Path                | Parameters                                                                                                                                            | Effect                                                                                                               | Reaches the app | Response                 |
| ------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------ |
| `POST` | `/sim/request`      | `type` — `10` Store (default), `4` LayoutCheck, `3` Annotation; `status` — `RequestStatus`, default `0`; `title`, `description` — store requests only | Opens a request. A layout check in progress or pending, or any annotation, blocks `CancelShelfLayoutChangeRequestV2` | next poll       | snapshot¹ with `request` |
| `POST` | `/sim/notification` | `type` — `NotiType`, default `0`; `title`, `description`                                                                                              | An unread `StoreNotification`, returned by `GetNotifications`                                                        | next poll       | `{ ok, notification }`   |
| `POST` | `/sim/store-task`   | `status` — `UserTaskStatus`, default `0`; `title`, `description`                                                                                      | A `StoreTask`, returned by `GetRequestedTasks` and updated with `SetUserTask`                                        | next poll       | `{ ok, task }`           |

### Connection

| Method | Path                        | Parameters                                                                   | Effect                                                                                                                                                                                                      | Reaches the app            | Response             |
| ------ | --------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------- |
| `POST` | `/sim/latency`              | `ms` — default `0`, which turns it off                                       | Waits that long before answering every OPM hub method, `Call` included. The app gives up on a connection after 10 s                                                                                         | next call                  | `{ ok, latencyMs }`  |
| `POST` | `/sim/opm-hub/drop`         | —                                                                            | Closes every `/signalr/rpc` connection but keeps accepting new ones, so the app reconnects and must re-subscribe                                                                                            | pushed (the socket closes) | `{ ok, dropped }`    |
| `POST` | `/sim/opm-hub/connection`   | `up` — `false` takes the hub down, anything else (or nothing) brings it back | Down closes every `/signalr/rpc` connection, answers negotiate `503` and refuses new sockets, as an OPM outage would                                                                                        | pushed (the socket closes) | `{ ok, opmHubUp }`   |
| `POST` | `/sim/shelf-hub/connection` | `up` — `false` takes the hub down, anything else (or nothing) brings it back | Down closes every `/stockshelf` connection and refuses new ones, so scans reach the app only through OPM polling. The reported shelf and scanner status is untouched — use `/sim/shelf/connection` for that | pushed (the socket closes) | `{ ok, shelfHubUp }` |
| `POST` | `/sim/auth/expire`          | —                                                                            | Revokes every token, so the next hub call answers `Unauthorized` and the app re-signs in                                                                                                                    | next call                  | `{ ok }`             |

## Continuous-workflow fixture (2026-09-29)

The workflow contract targets OPM develop `42444d5ca289e5cf70987e8c9fa05b05af42439d`.
`EndRestocking2` closes RS without restart or capture. `EndManualReplenishment`
obeys `startRobotOperationAfter`: false allows the next RS; true runs the same
restart gate as `EndRestocking` and `StartRobotOperation2`. An unfinished layout
request causes simulated capture (robot status 6), not automatic PNP (status 3).
This fixture always requires capture for an open layout request; real OPM decides
from the pending change and cabinet/annotation state. No hardware is simulated.

| Method | Path                          | Parameters / purpose                                                                     |
| ------ | ----------------------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/sim/layout`                 | Read registered display locations                                                        |
| POST   | `/sim/layout/outcome`         | `value=apply`, `reject`, `unreadable`, `defer`, `allocation-error`, `apply-warning`      |
| POST   | `/sim/layout/apply-pending`   | Register the delayed layout snapshot                                                     |
| POST   | `/sim/manual/end-outcome`     | `value=success`, `unstable` (task stays active), `curtain-failure` (task already closed) |
| POST   | `/sim/workflow/request-status` | `type=12 or 13&status=-1,0,1,10,20,200`; changes an existing RS/MR task with the same ID (no robot movement) |
| POST   | `/sim/workflow/restart-error` | `value=0..13`, an OPM StartRobotOperationErrors value                                    |
| POST   | `/sim/capture/complete`       | Explicitly close the simulated annotation and leave the robot parked                     |

`/sim/faults?method=EndRestocking2&mode=after-apply-throw` applies the operation
then loses its response. Re-read `GetRequestById` instead of resending. The same
mode works with other RPCs. `/sim/state` includes a bounded `commandLog` for
checking call ordering and absence of duplicate starts/restarts.

Scanning only declares the SKU; use `/sim/lane/add` for a separate physical
placement event. The old inline simulator's delayed automatic placement is not
retained. Stock correction checks operation mode, robot status and pending jobs
again at submit; this is a DB correction, not MR physical-removal detection.

`tests/workflow-contracts.spec.ts` exercises these state boundaries with the
existing Playwright runner, without a server. End-to-end specs separately drive
the React app. Neither test suite establishes real-store deployment or safety.

`PauseRestocking` moves the same open RS task from InProgress to Pending. `StartRestocking2` resumes that ID and clears its current SKU. Starting an existing MR task also resumes the same ID as InProgress. These are protocol fixtures, not proof of hardware timing.
