import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Car {
    hp: bigint;
    model: string;
    make: string;
    mods: Array<string>;
    year: bigint;
}
export type Time = bigint;
export interface Task {
    id: bigint;
    title: string;
    xpReward: bigint;
    requiredCompletions: bigint;
    description: string;
}
export type Principal = Principal;
export interface ChatRoom {
    id: string;
    name: string;
    createdBy: string;
    isCustom: boolean;
}
export interface RaceChallenge {
    id: bigint;
    status: ChallengeStatus;
    winner?: Principal;
    timestamp: Time;
    challenged: Principal;
    challenger: Principal;
}
export interface RaceEvent {
    winner: string;
    timestamp: Time;
    challenged: string;
    challenger: string;
}
export interface RacerProfile {
    xp: bigint;
    bio: string;
    name: string;
    wins: bigint;
    losses: bigint;
    reputation: bigint;
    speed: bigint;
    avatarUrl?: string;
}
export interface ChatMessage {
    id: bigint;
    text: string;
    timestamp: Time;
    senderName: string;
    roomId: string;
    senderId: string;
}
export interface XpEvent {
    raceLabel: string;
    streakBonus: boolean;
    timestamp: Time;
    amount: bigint;
}
export interface RaceResult {
    winnerHp: bigint;
    winnerXp: bigint;
    winner: Principal;
    loserHp: bigint;
    loserXp: bigint;
    loser: Principal;
    challengeId: bigint;
    winnerName: string;
    loserName: string;
}
export enum ChallengeStatus {
    pending = "pending",
    completed = "completed",
    accepted = "accepted",
    declined = "declined"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptAndRaceChallenge(challengeId: bigint): Promise<RaceResult>;
    acceptChallenge(challengeId: bigint): Promise<void>;
    addXpEvent(raceLabel: string, amount: bigint, streakBonus: boolean): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimDailyChallenge(date: string, idx: bigint): Promise<void>;
    completeChallenge(challengeId: bigint, winner: Principal): Promise<void>;
    completeTask(): Promise<RacerProfile>;
    createChallenge(challenged: Principal): Promise<bigint>;
    createChatRoom(name: string): Promise<void>;
    deleteChatRoom(roomId: string): Promise<void>;
    findRandomOpponent(): Promise<{
        principal: string;
        profile: RacerProfile;
    } | null>;
    getActivityFeed(): Promise<Array<RaceEvent>>;
    getAllRacerProfiles(): Promise<Array<{
        principal: string;
        profile: RacerProfile;
    }>>;
    getCallerUserProfile(): Promise<RacerProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCar(owner: Principal): Promise<Car | null>;
    getCarHp(owner: Principal): Promise<bigint>;
    getChatMessages(roomId: string): Promise<Array<ChatMessage>>;
    getChatRooms(): Promise<Array<ChatRoom>>;
    getDailyProgress(date: string): Promise<Array<bigint>>;
    getIncomingChallenges(): Promise<Array<RaceChallenge>>;
    getLeaderboard(): Promise<Array<RacerProfile>>;
    getOutgoingChallenges(): Promise<Array<RaceChallenge>>;
    getRoomMembers(roomId: string): Promise<bigint>;
    getStreak(): Promise<bigint>;
    getTaskProgress(): Promise<{
        tasks: Array<Task>;
        completionsOnCurrentTask: bigint;
        currentTaskId: bigint;
    }>;
    getUserProfile(user: Principal): Promise<RacerProfile | null>;
    getXpHistory(): Promise<Array<XpEvent>>;
    isCallerAdmin(): Promise<boolean>;
    joinRoom(roomId: string): Promise<void>;
    leaveRoom(roomId: string): Promise<void>;
    migrateDefaultRooms(): Promise<void>;
    registerCar(make: string, model: string, year: bigint, mods: Array<string>, hp: bigint): Promise<void>;
    saveCallerUserProfile(profileData: RacerProfile): Promise<void>;
    searchRacerByName(name: string): Promise<Array<{
        principal: string;
        profile: RacerProfile;
    }>>;
    sendChatMessage(roomId: string, text: string): Promise<void>;
}
