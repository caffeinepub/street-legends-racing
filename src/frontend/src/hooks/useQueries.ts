import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Car,
  RaceChallenge,
  RaceEvent,
  RacerProfile,
  Task,
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
    }: {
      make: string;
      model: string;
      year: bigint;
      mods: string[];
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.registerCar(make, model, year, mods);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerCar"] });
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
    refetchInterval: 10_000,
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
    refetchInterval: 10_000,
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
