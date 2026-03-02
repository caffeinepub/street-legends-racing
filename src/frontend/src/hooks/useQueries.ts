import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Car, RaceEvent, RacerProfile } from "../backend.d";
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

export function useCallerCar() {
  const { actor, isFetching } = useActor();
  const { data: profile } = useCallerProfile();
  return useQuery<Car | null>({
    queryKey: ["callerCar"],
    queryFn: async () => {
      if (!actor) return null;
      // We need to get the caller's principal - use a workaround
      return null;
    },
    enabled: !!actor && !isFetching && !!profile,
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
    }: {
      name: string;
      bio: string;
      avatarUrl: string | null;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.saveCallerUserProfile(name, bio, avatarUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useIncomingChallenges() {
  const { actor, isFetching } = useActor();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery<any[]>({
    queryKey: ["incomingChallenges"],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-expect-error - method added in backend but not yet reflected in generated types
      if (typeof actor.getIncomingChallenges === "function") {
        // @ts-expect-error
        return actor.getIncomingChallenges();
      }
      return [];
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useOutgoingChallenges() {
  const { actor, isFetching } = useActor();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery<any[]>({
    queryKey: ["outgoingChallenges"],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-expect-error - method added in backend but not yet reflected in generated types
      if (typeof actor.getOutgoingChallenges === "function") {
        // @ts-expect-error
        return actor.getOutgoingChallenges();
      }
      return [];
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
