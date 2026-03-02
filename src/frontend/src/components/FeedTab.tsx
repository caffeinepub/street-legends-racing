import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, Trophy, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { RaceEvent } from "../backend.d";
import { useActivityFeed } from "../hooks/useQueries";

function timeAgo(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncatePrincipal(p: string): string {
  if (p.length <= 12) return p;
  return `${p.slice(0, 6)}…${p.slice(-4)}`;
}

function RaceCard({ event, index }: { event: RaceEvent; index: number }) {
  const challenger = truncatePrincipal(event.challenger);
  const challenged = truncatePrincipal(event.challenged);
  const winner = truncatePrincipal(event.winner);
  const isChallenger = event.winner === event.challenger;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="group relative"
    >
      <div className="card-glow bg-card rounded-lg p-4 border border-border hover:border-neon-cyan/30 transition-all duration-300">
        {/* Speed lines on hover */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="absolute h-[1px] w-1/3 bg-gradient-to-r from-transparent via-primary/20 to-transparent top-1/3 animate-speed-line"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute h-[1px] w-1/4 bg-gradient-to-r from-transparent via-secondary/20 to-transparent top-2/3 animate-speed-line"
            style={{ animationDelay: "0.3s" }}
          />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Challenger */}
              <span
                className={`font-display font-bold text-sm ${isChallenger ? "neon-cyan neon-glow-cyan" : "text-foreground"}`}
              >
                {isChallenger && (
                  <Trophy className="inline h-3 w-3 mr-0.5 mb-0.5" />
                )}
                {challenger}
              </span>
              <span className="text-muted-foreground text-xs font-mono">
                vs
              </span>
              {/* Challenged */}
              <span
                className={`font-display font-bold text-sm ${!isChallenger ? "neon-magenta" : "text-foreground"}`}
                style={
                  !isChallenger
                    ? { textShadow: "0 0 10px oklch(0.62 0.26 330 / 0.8)" }
                    : undefined
                }
              >
                {!isChallenger && (
                  <Trophy className="inline h-3 w-3 mr-0.5 mb-0.5" />
                )}
                {challenged}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Winner:{" "}
              <span
                className="neon-lime"
                style={{ textShadow: "0 0 8px oklch(0.88 0.22 120 / 0.7)" }}
              >
                {winner}
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge
              variant="outline"
              className="text-[10px] border-neon-cyan/30 text-primary bg-primary/5 font-mono"
            >
              RACE
            </Badge>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              <Clock className="h-2.5 w-2.5" />
              {timeAgo(event.timestamp)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TacoBellBanner() {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <div
        className="w-full h-48 flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.14 0.025 265) 0%, oklch(0.18 0.04 330 / 0.6) 60%, oklch(0.14 0.025 265) 100%)",
        }}
      >
        <div className="text-center">
          <p
            className="font-display font-black text-3xl uppercase tracking-widest text-secondary"
            style={{ textShadow: "0 0 20px oklch(0.62 0.26 330 / 0.9)" }}
          >
            TACO BELL
          </p>
          <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground mt-1">
            The Meet Spot
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src="/assets/generated/taco-bell-meet.dim_800x400.jpg"
      alt="Taco Bell Meet Spot"
      className="w-full h-48 object-cover object-center"
      loading="lazy"
      onError={() => setImgFailed(true)}
    />
  );
}

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4"];

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {SKELETON_KEYS.map((k) => (
        <div key={k} className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 bg-muted" />
              <Skeleton className="h-3 w-32 bg-muted" />
            </div>
            <Skeleton className="h-5 w-12 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeedTab() {
  const { data: feedData, isLoading } = useActivityFeed();
  const events = feedData ?? [];

  return (
    <div className="space-y-4">
      {/* Meet Spot Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-xl border border-neon-magenta/40"
        style={{ boxShadow: "0 0 40px oklch(0.62 0.26 330 / 0.25)" }}
      >
        {/* Image with fallback */}
        <TacoBellBanner />
        {/* Gradient overlay — lighter to show more image */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent pointer-events-none" />
        {/* Meet Spot label */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin
                className="h-5 w-5 text-secondary"
                style={{
                  filter: "drop-shadow(0 0 8px oklch(0.62 0.26 330 / 0.9))",
                }}
              />
              <span
                className="font-display font-black text-xl uppercase tracking-widest text-secondary"
                style={{ textShadow: "0 0 18px oklch(0.62 0.26 330 / 0.9)" }}
              >
                THE MEET SPOT
              </span>
            </div>
            <p
              className="font-mono text-xs tracking-widest uppercase"
              style={{
                color: "oklch(0.88 0.22 120)",
                textShadow: "0 0 8px oklch(0.88 0.22 120 / 0.8)",
              }}
            >
              Taco Bell Parking Lot
            </p>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full bg-neon-lime animate-neon-pulse"
              style={{ boxShadow: "0 0 8px oklch(0.88 0.22 120)" }}
            />
            <span className="font-mono text-xs text-white/70 uppercase tracking-wide">
              Live
            </span>
          </div>
        </div>
      </motion.div>

      {/* Feed Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 neon-cyan" />
        <h2 className="font-display font-black text-sm uppercase tracking-widest text-foreground/70">
          Live Race Feed
        </h2>
      </div>

      {/* Events */}
      <AnimatePresence>
        {isLoading ? (
          <FeedSkeleton />
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 space-y-3"
          >
            <p className="font-display text-2xl font-black text-muted-foreground">
              No races yet
            </p>
            <p className="text-sm text-muted-foreground font-body">
              Be the first to throw down
            </p>
            <div className="chassis-stripe h-[2px] w-24 mx-auto rounded" />
          </motion.div>
        ) : (
          <div className="space-y-3">
            {events.map((event, i) => (
              <RaceCard
                key={`${event.challenger}-${event.timestamp}`}
                event={event}
                index={i}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
