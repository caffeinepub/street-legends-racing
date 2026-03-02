import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface ChatMessage {
    id: bigint;
    text: string;
    timestamp: Time;
    senderName: string;
    roomId: string;
    senderId: string;
}
export interface Car {
    model: string;
    make: string;
    mods: Array<string>;
    year: bigint;
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
    acceptChallenge(challengeId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeChallenge(challengeId: bigint, winner: Principal): Promise<void>;
    completeTask(): Promise<RacerProfile>;
    createChallenge(challenged: Principal): Promise<bigint>;
    createChatRoom(name: string): Promise<void>;
    getActivityFeed(): Promise<Array<RaceEvent>>;
    getAllRacerProfiles(): Promise<Array<{
        principal: string;
        profile: RacerProfile;
    }>>;
    getCallerUserProfile(): Promise<RacerProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCar(owner: Principal): Promise<Car | null>;
    getChatMessages(roomId: string): Promise<Array<ChatMessage>>;
    getChatRooms(): Promise<Array<ChatRoom>>;
    getIncomingChallenges(): Promise<Array<RaceChallenge>>;
    getLeaderboard(): Promise<Array<RacerProfile>>;
    getOutgoingChallenges(): Promise<Array<RaceChallenge>>;
    getTaskProgress(): Promise<{
        tasks: Array<Task>;
        completionsOnCurrentTask: bigint;
        currentTaskId: bigint;
    }>;
    getUserProfile(user: Principal): Promise<RacerProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    migrateDefaultRooms(): Promise<void>;
    registerCar(make: string, model: string, year: bigint, mods: Array<string>): Promise<void>;
    saveCallerUserProfile(profileData: RacerProfile): Promise<void>;
    sendChatMessage(roomId: string, text: string): Promise<void>;
}
