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
    model: string;
    make: string;
    mods: Array<string>;
    year: bigint;
}
export type Time = bigint;
export type Principal = Principal;
export interface RacerProfile {
    bio: string;
    name: string;
    wins: bigint;
    losses: bigint;
    reputation: bigint;
    avatarUrl?: string;
}
export interface RaceEvent {
    winner: string;
    timestamp: Time;
    challenged: string;
    challenger: string;
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
    createChallenge(challenged: Principal): Promise<bigint>;
    getActivityFeed(): Promise<Array<RaceEvent>>;
    getCallerUserProfile(): Promise<RacerProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCar(owner: Principal): Promise<Car | null>;
    getLeaderboard(): Promise<Array<RacerProfile>>;
    getUserProfile(user: Principal): Promise<RacerProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    registerCar(make: string, model: string, year: bigint, mods: Array<string>): Promise<void>;
    saveCallerUserProfile(name: string, bio: string, avatarUrl: string | null): Promise<void>;
}
