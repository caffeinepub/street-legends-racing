# Street Legends Racing

## Current State

- Single Motoko actor holds all data in-memory: profiles, cars, challenges, chat messages, rooms, task progress, XP history, daily progress, streaks
- `getLeaderboard` returns all profiles sorted in one call — O(N) over all users
- `getAllRacerProfiles` returns the entire user set in one call — unbounded size
- `getIncomingChallenges` / `getOutgoingChallenges` scan the full challenges map — O(N) over all challenges
- Chat rooms keep up to 100 messages per room; no pagination — fetches grow linearly
- Activity feed keeps 20 events globally; no pagination
- XP history capped at 20 events per user
- `findRandomOpponent` converts the whole profiles map to an array on every call
- Chat messages and room members held in unbounded Lists
- Frontend polls challenges every 10 s and room members every 5 s — all users hit the same canister simultaneously
- No query caching differentiation between read-heavy and write-heavy paths
- No pagination on any list endpoint
- Room member tracking is per-session only (20-person hard cap for slots but no real eviction)

## Requested Changes (Diff)

### Add
- Pagination to all list endpoints: leaderboard, racer profiles, chat messages, activity feed — accept `offset: Nat` and `limit: Nat` parameters, return `{ items: [...], total: Nat }`
- Indexed challenge lookups: maintain separate per-user sets (`incomingByUser`, `outgoingByUser`) so challenge queries are O(1) per user instead of O(all challenges)
- Indexed search: maintain a name-index map (lowercased first character bucket) to avoid full-scan searches
- Activity feed with pagination: keep last 200 events globally, expose paginated endpoint
- Chat message pagination: `getChatMessagesPaged(roomId, offset, limit)` returning newest-first slices
- Completed/expired challenge pruning: challenges older than 7 days with non-pending status are eligible for cleanup via an admin `pruneOldChallenges` call
- `getLeaderboardPaged(offset, limit)` returning sorted slice + total count
- `searchRacerByNamePaged(name, offset, limit)` 
- `getAllRacerProfilesPaged(offset, limit)`
- `getActivityFeedPaged(offset, limit)`

### Modify
- `getLeaderboard` — keep existing signature but cap return at top 100 to prevent unbounded responses
- `getAllRacerProfiles` — keep existing signature but cap return at 100 entries
- `findRandomOpponent` — use modulo on profiles map size without materializing the full array when possible; add a size check guard
- Chat room member cap raised from 20 to 50 (soft limit, graceful error message)
- XP history cap raised from 20 to 50 events per user
- Activity feed size raised from 20 to 200 global events
- Chat messages per room raised from 100 to 500 (oldest pruned automatically)
- Frontend `useIncomingChallenges` refetch interval increased from 10 s to 15 s
- Frontend `useOutgoingChallenges` refetch interval increased from 10 s to 15 s
- Frontend `useGetRoomMembers` refetch interval increased from 5 s to 10 s
- Frontend all list queries: add `staleTime: 30_000` to reduce redundant network calls
- Frontend `useLeaderboard`: add `staleTime: 60_000` (leaderboard doesn't need real-time precision)
- Frontend `useAllRacerProfiles`: add `staleTime: 60_000`
- Frontend `useActivityFeed`: add `staleTime: 20_000`

### Remove
- Nothing removed — all existing API surface preserved for backward compatibility

## Implementation Plan

1. **Backend — indexed challenge maps**: add `incomingChallenges: Map<Principal, List<Nat>>` and `outgoingChallenges: Map<Principal, List<Nat>>` updated on every `createChallenge`, `acceptChallenge`, `acceptAndRaceChallenge` call. Rewrite `getIncomingChallenges` / `getOutgoingChallenges` to use index instead of full scan.
2. **Backend — pagination helpers**: add `getLeaderboardPaged`, `getAllRacerProfilesPaged`, `searchRacerByNamePaged`, `getActivityFeedPaged`, `getChatMessagesPaged` with offset+limit signatures.
3. **Backend — cap adjustments**: raise chat message cap (100→500), activity feed cap (20→200), XP history cap (20→50), room member cap (20→50).
4. **Backend — prune endpoint**: add `pruneOldChallenges()` admin function that removes completed/declined challenges older than 7 days from the main challenges map and cleans up indexes.
5. **Frontend — polling intervals**: increase all polling intervals as specified.
6. **Frontend — staleTime**: add staleTime to all list queries to reduce redundant fetches.
7. **Frontend — virtual list for leaderboard**: if the leaderboard exceeds 50 entries, render only visible rows (simple windowed slice, no extra library needed).
8. **Validate**: typecheck + build.
