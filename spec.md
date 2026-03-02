# Street Legends Racing

## Current State
Full-stack street racing social app with:
- Racer profiles (name, bio, avatar stored on-chain)
- Car registration and HP calculator
- Race challenges (create, accept, complete)
- Activity feed (real race events)
- Leaderboard sorted by reputation
- On-chain chat rooms (10 default rooms + custom rooms)
- Taco Bell meet spot with live chat

## Requested Changes (Diff)

### Add
- **Task/Progression system** -- A "Tasks" tab showing a list of street racing tasks the player must complete. Each task has a name, description, required completions (e.g. "Complete 5 times"), and XP reward. Tasks are sequential: complete enough times to unlock the next.
- **Task completion tracking** -- Backend stores per-user task progress: which task they are on, how many times they've completed it.
- **Complete button** -- Each task card has a "Complete" button. Pressing it increments that task's completion count for the caller. When count meets required threshold, auto-advances to next task.
- **XP / Speed Points** -- Completing tasks awards XP points stored on the racer profile. XP makes the player "faster" (displayed as a Speed stat on profile and leaderboard).
- **Rank/Badge progression system** -- Badges awarded automatically at XP milestones:
  1. Fresh on the Streets (0 XP)
  2. Getting the Hang (500 XP)
  3. Street Racer (1500 XP)
  4. Known in the Scene (3000 XP)
  5. Street Legend (6000 XP)
  6. Untouchable (10000 XP)
  7. King of the Streets (20000 XP)
- **Progress display** -- Tasks page shows current badge, XP bar to next badge, current task with progress (e.g. 3/5 completions), and list of upcoming tasks.
- **Tasks list** (sequential, each with required completions):
  1. Rev Your Engine (Rev your car in the lot) - 3x
  2. First Burnout (Leave a mark on the asphalt) - 3x
  3. Beat a Newcomer (Win against a fresh racer) - 5x
  4. Hit the Quarter Mile (Run a clean quarter mile) - 5x
  5. Earn Your Stripes (Win 3 races in a row streak) - 3x
  6. Pink Slip Challenge (Race for a pink slip) - 5x
  7. Midnight Run (Race after midnight) - 5x
  8. Beat a Known Racer (Win against someone with rep) - 5x
  9. Drift Master (Pull a clean drift) - 5x
  10. Podium Finisher (Place top 3 on leaderboard) - 3x
  11. Street Dominator (Win 10 races total) - 1x
  12. King's Challenge (Beat the current top racer) - 3x

### Modify
- `RacerProfile` -- Add `xp: Nat` and `speed: Nat` fields (speed derived from XP)
- Leaderboard -- Show XP, speed stat, and badge alongside racer name
- Profile -- Show badge, XP, and speed in profile view

### Remove
- Nothing removed

## Implementation Plan
1. Add `TaskProgress` type and per-user task state to backend
2. Add `TASKS` constant list with all 12 tasks and required completion counts
3. Add `completeTask` endpoint: increments progress, awards XP, auto-advances task, returns updated profile
4. Add `getTaskProgress` query: returns caller's current task index, completion count, and full task list with status
5. Update `RacerProfile` to include `xp` and `speed` fields; migrate existing profiles with 0 defaults
6. Update `saveCallerUserProfile` to preserve xp/speed on edits
7. Add `TasksTab` frontend component: shows badge card, XP progress bar, current task with progress ring and Complete button, upcoming tasks list
8. Add "Tasks" nav tab (using Target or CheckSquare icon) to App.tsx
9. Update `LeaderboardTab` to show badge and speed stat
10. Update `ProfileModal` to display badge, XP, speed
