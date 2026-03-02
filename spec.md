# Street Legends Racing

## Current State
- Racers can register a profile (name, bio, avatar photo stored on-chain)
- Cars can be registered with make/model/year/mods list
- Race challenges can be created, accepted, and completed (admin completes)
- Feed shows completed race events; leaderboard shows racers by reputation
- Authorization (user/admin/guest roles) and blob-storage (avatar images) components are installed

## Requested Changes (Diff)

### Add
1. **Race List** -- A tab/section showing all pending and active race challenges for the logged-in user (incoming + outgoing) with status tags and quick-action buttons.
2. **Horsepower Calculator** -- A UI tool where a user inputs their car mods (checkboxes + freeform) and receives an estimated power number. Logic is frontend-only with a configurable mod-to-HP lookup table. Results can be saved to their car profile.
3. **Taco Bell Parking Lot (Chat Rooms)** -- A live-chat "meet spot" with:
   - Pre-created rooms named after popular street racing themes (e.g. "Pink Slip Alley", "Quarter Mile", "Midnight Runners", "No Mercy Lane", "Street Kings", "Dyno Room", "Roll Racing", "Import Invaders", "Muscle Row", "Underground")
   - Each room holds max 10 active members
   - Users can create custom rooms
   - Real-time-style polling chat: messages stored on-chain per room, frontend polls every 2-3 seconds
   - Messages show racer name + avatar

### Modify
- **Backend**: Add chat room types and functions: `createRoom`, `getRooms`, `joinRoom`, `leaveRoom`, `sendMessage`, `getRoomMessages`, `getRoomMembers`
- **Backend**: Add `getAllRacers` function returning principal + profile so the race list can resolve names
- **Garage tab**: Add HP Calculator section alongside car registration
- **App navigation**: Add "Meet" tab for Taco Bell Parking Lot chat

### Remove
- Nothing removed

## Implementation Plan
1. Update `main.mo` to add chat room state (rooms, messages, members) and all room/message functions; also add `getAllRacers` returning `[(Principal, RacerProfile)]`
2. Regenerate `backend.d.ts`
3. Create `HpCalculatorTab` component with mod checklist + custom mod input and estimated HP output
4. Create `MeetTab` component with room list, room capacity badges, join/leave, message feed, and send message input
5. Update `RaceTab` to use the new `getAllRacers` endpoint to show a named race list
6. Add "Meet" and update navigation tabs in `App.tsx`
7. Wire polling (setInterval 2.5s) for chat messages when a room is joined
