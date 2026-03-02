import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Car,
  RaceChallenge,
  RaceEvent,
  RaceResult,
  RacerProfile,
  Task,
  XpEvent,
} from "../backend.d";
import { useActor } from "./useActor";

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<RacerProfile | null>({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery<RacerProfile[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useAllRacerProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<{ principal: string; profile: RacerProfile }>>({
    queryKey: ["allRacerProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRacerProfiles();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useActivityFeed() {
  const { actor, isFetching } = useActor();
  return useQuery<RaceEvent[]>({
    queryKey: ["activityFeed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActivityFeed();
    },
    enabled: !!actor && !isFetching,
    staleTime: 20_000,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      bio,
      avatarUrl,
      existingProfile,
    }: {
      name: string;
      bio: string;
      avatarUrl: string | null;
      existingProfile?: RacerProfile;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      const profileData: RacerProfile = {
        name,
        bio,
        avatarUrl: avatarUrl ?? undefined,
        wins: existingProfile?.wins ?? 0n,
        losses: existingProfile?.losses ?? 0n,
        reputation: existingProfile?.reputation ?? 100n,
        xp: existingProfile?.xp ?? 0n,
        speed: existingProfile?.speed ?? 0n,
      };
      await actor.saveCallerUserProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useTaskProgress() {
  const { actor, isFetching } = useActor();
  return useQuery<{
    tasks: Array<Task>;
    completionsOnCurrentTask: bigint;
    currentTaskId: bigint;
  } | null>({
    queryKey: ["taskProgress"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTaskProgress();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useCompleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.completeTask();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskProgress"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["xpHistory"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
    },
  });
}

export function useRegisterCar() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      make,
      model,
      year,
      mods,
      hp,
    }: {
      make: string;
      model: string;
      year: bigint;
      mods: string[];
      hp?: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.registerCar(make, model, year, mods, hp ?? 0n);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerCar"] });
      queryClient.invalidateQueries({ queryKey: ["myCar"] });
    },
  });
}

export function useCreateChallenge() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (challenged: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createChallenge(challenged);
    },
  });
}

export function useGetCar(owner: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Car | null>({
    queryKey: ["car", owner?.toString()],
    queryFn: async () => {
      if (!actor || !owner) return null;
      return actor.getCar(owner);
    },
    enabled: !!actor && !isFetching && !!owner,
    staleTime: 60_000,
  });
}

export function useIncomingChallenges() {
  const { actor, isFetching } = useActor();
  return useQuery<RaceChallenge[]>({
    queryKey: ["incomingChallenges"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getIncomingChallenges();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useOutgoingChallenges() {
  const { actor, isFetching } = useActor();
  return useQuery<RaceChallenge[]>({
    queryKey: ["outgoingChallenges"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOutgoingChallenges();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useAcceptChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (challengeId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.acceptChallenge(challengeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomingChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingChallenges"] });
    },
  });
}

export function useAcceptAndRaceChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<RaceResult, Error, bigint>({
    mutationFn: async (challengeId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.acceptAndRaceChallenge(challengeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomingChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingChallenges"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
      queryClient.invalidateQueries({ queryKey: ["xpHistory"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
    },
  });
}

export function useFindRandomOpponent() {
  const { actor } = useActor();
  return useMutation<
    { principal: string; profile: RacerProfile } | null,
    Error,
    void
  >({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.findRandomOpponent();
    },
  });
}

export function useSearchRacerByName() {
  const { actor } = useActor();
  return useMutation<
    Array<{ principal: string; profile: RacerProfile }>,
    Error,
    string
  >({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.searchRacerByName(name);
    },
  });
}

export function useJoinRoom() {
  const { actor } = useActor();
  return useMutation<void, Error, string>({
    mutationFn: async (roomId: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.joinRoom(roomId);
    },
  });
}

export function useLeaveRoom() {
  const { actor } = useActor();
  return useMutation<void, Error, string>({
    mutationFn: async (roomId: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.leaveRoom(roomId);
    },
  });
}

export function useGetRoomMembers(roomId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["roomMembers", roomId],
    queryFn: async () => {
      if (!actor || !roomId) return 0n;
      return actor.getRoomMembers(roomId);
    },
    enabled: !!actor && !isFetching && !!roomId,
    refetchInterval: 10_000,
  });
}

export function useXpHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<XpEvent[]>({
    queryKey: ["xpHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getXpHistory();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useStreak() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["streak"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getStreak();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useAddXpEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      raceLabel,
      amount,
      streakBonus,
    }: {
      raceLabel: string;
      amount: bigint;
      streakBonus: boolean;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.addXpEvent(raceLabel, amount, streakBonus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xpHistory"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
    },
  });
}

export function useGetDailyProgress(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint[]>({
    queryKey: ["dailyProgress", date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDailyProgress(date);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useClaimDailyChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, idx }: { date: string; idx: bigint }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.claimDailyChallenge(date, idx);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["dailyProgress", variables.date],
      });
    },
  });
}
