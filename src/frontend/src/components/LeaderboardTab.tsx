import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { RacerProfile } from "../backend.d";
import { useLeaderboard } from "../hooks/useQueries";

// Badge thresholds matching TasksTab
const BADGE_TIERS = [
  { threshold: 20000, name: "King of the Streets" },
  { threshold: 10000, name: "Untouchable" },
  { threshold: 6000, name: "Street Legend" },
  { threshold: 3000, name: "Known in the Scene" },
  { threshold: 1500, name: "Street Racer" },
  { threshold: 500, name: "Getting the Hang" },
  { threshold: 0, name: "Fresh on the Streets" },
] as const;

function getBadgeName(xp: bigint): string {
  const xpNum = Number(xp);
  for (const tier of BADGE_TIERS) {
    if (xpNum >= tier.threshold) return tier.name;
  }
  return "Fresh on the Streets";
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full"
        style={{
          background: "oklch(0.78 0.18 85 / 0.15)",
          boxShadow: "0 0 12px oklch(0.78 0.18 85 / 0.4)",
        }}
      >
        <Trophy className="h-4 w-4" style={{ color: "oklch(0.78 0.18 85)" }} />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full"
        style={{
          background: "oklch(0.65 0.01 265 / 0.15)",
          boxShadow: "0 0 10px oklch(0.65 0.01 265 / 0.3)",
        }}
      >
        <Star className="h-4 w-4" style={{ color: "oklch(0.65 0.01 265)" }} />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full"
        style={{
          background: "oklch(0.62 0.12 55 / 0.15)",
          boxShadow: "0 0 10px oklch(0.62 0.12 55 / 0.3)",
        }}
      >
        <Zap className="h-4 w-4" style={{ color: "oklch(0.62 0.12 55)" }} />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8">
      <span className="font-mono text-sm text-muted-foreground">{rank}</span>
    </div>
  );
}

function LeaderRow({
  racer,
  rank,
  index,
}: { racer: RacerProfile; rank: number; index: number }) {
  const isTop3 = rank <= 3;
  const winRate =
    racer.wins + racer.losses > 0
      ? Math.round(
          (Number(racer.wins) / Number(racer.wins + racer.losses)) * 100,
        )
      : 0;

  const borderColor =
    rank === 1
      ? "oklch(0.78 0.18 85 / 0.3)"
      : rank === 2
        ? "oklch(0.65 0.01 265 / 0.2)"
        : rank === 3
          ? "oklch(0.62 0.12 55 / 0.2)"
          : "transparent";

  const glowColor =
    rank === 1
      ? "oklch(0.78 0.18 85 / 0.08)"
      : rank === 2
        ? "oklch(0.65 0.01 265 / 0.06)"
        : rank === 3
          ? "oklch(0.62 0.12 55 / 0.06)"
          : "transparent";

  const initials = racer.name
    ? racer.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative"
    >
      <div
        className={`bg-card rounded-lg p-3 flex items-center gap-3 transition-all duration-200 hover:bg-muted/30 ${isTop3 ? "border" : "border border-border"}`}
        style={
          isTop3
            ? {
                borderColor,
                background: `linear-gradient(135deg, ${glowColor}, transparent)`,
              }
            : undefined
        }
      >
        <RankBadge rank={rank} />

        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0">
          {racer.avatarUrl && (
            <AvatarImage
              src={racer.avatarUrl}
              alt={racer.name}
              className="object-cover"
            />
          )}
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-mono">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-display font-bold text-sm truncate ${rank === 1 ? "text-gold" : rank === 2 ? "text-silver" : rank === 3 ? "text-bronze" : "text-foreground"}`}
              style={
                rank <= 3 ? { textShadow: `0 0 8px ${borderColor}` } : undefined
              }
            >
              {racer.name}
            </span>
            {rank === 1 && (
              <Badge
                className="text-[10px] h-4 px-1.5 font-mono"
                style={{
                  background: "oklch(0.78 0.18 85 / 0.15)",
                  color: "oklch(0.78 0.18 85)",
                  border: "1px solid oklch(0.78 0.18 85 / 0.3)",
                }}
              >
                #1
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] font-mono text-muted-foreground">
              {racer.wins.toString()}W – {racer.losses.toString()}L
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              ({winRate}%)
            </span>
            {racer.xp > 0n && (
              <span
                className="text-[10px] font-mono"
                style={{ color: "oklch(0.82 0.18 195)" }}
              >
                ⚡ {Number(racer.speed)} spd
              </span>
            )}
          </div>
          {racer.xp >= 500n && (
            <div className="mt-0.5">
              <span className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-wider">
                {getBadgeName(racer.xp)}
              </span>
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <p
            className="font-display font-black text-lg"
            style={{
              color:
                rank === 1
                  ? "oklch(0.78 0.18 85)"
                  : rank === 2
                    ? "oklch(0.65 0.01 265)"
                    : rank === 3
                      ? "oklch(0.62 0.12 55)"
                      : "oklch(var(--neon-cyan))",
              textShadow:
                rank <= 3
                  ? `0 0 10px ${borderColor}`
                  : "0 0 8px oklch(0.82 0.18 195 / 0.4)",
            }}
          >
            {racer.reputation.toString()}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
            REP
          </p>
        </div>
      </div>
    </motion.div>
  );
}

const LB_SKELETON_KEYS = ["lsk1", "lsk2", "lsk3", "lsk4", "lsk5", "lsk6"];

function LeaderSkeleton() {
  return (
    <div className="space-y-2">
      {LB_SKELETON_KEYS.map((k) => (
        <div
          key={k}
          className="bg-card rounded-lg p-3 flex items-center gap-3 border border-border"
        >
          <Skeleton className="h-8 w-8 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32 bg-muted" />
            <Skeleton className="h-3 w-24 bg-muted" />
          </div>
          <Skeleton className="h-7 w-12 bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function LeaderboardTab() {
  const { data: lbData, isLoading } = useLeaderboard();
  const racers = lbData ?? [];

  // Sort by reputation descending
  const sorted = [...racers].sort((a, b) =>
    Number(b.reputation - a.reputation),
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg border border-neon-cyan/20 bg-card p-4 card-glow"
      >
        <div className="chassis-stripe h-[2px] w-full absolute top-0 left-0" />
        <div className="flex items-center gap-3">
          <Trophy
            className="h-6 w-6 neon-cyan"
            style={{
              filter: "drop-shadow(0 0 8px oklch(0.82 0.18 195 / 0.7))",
            }}
          />
          <div>
            <h2 className="font-display text-xl font-black neon-cyan neon-glow-cyan">
              Street Legends
            </h2>
            <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">
              Ranked by Reputation
            </p>
          </div>
        </div>
      </motion.div>

      {/* Top 3 podium labels */}
      {!isLoading && sorted.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[1, 0, 2].map((adjustedIndex, displayIndex) => {
            const racer = sorted[adjustedIndex];
            const rank = adjustedIndex + 1;
            const heights = ["h-16", "h-20", "h-14"];
            const labels = ["2nd", "1st", "3rd"];
            const podiumColors = [
              "oklch(0.65 0.01 265 / 0.2)",
              "oklch(0.78 0.18 85 / 0.2)",
              "oklch(0.62 0.12 55 / 0.2)",
            ];
            return (
              <div key={rank} className="space-y-1">
                <p className="text-[10px] font-mono text-muted-foreground truncate px-1">
                  {racer.name}
                </p>
                <div
                  className={`${heights[displayIndex]} rounded-t flex items-end justify-center pb-1`}
                  style={{
                    background: podiumColors[displayIndex],
                    border: `1px solid ${podiumColors[displayIndex].replace("0.2)", "0.4)")}`,
                  }}
                >
                  <span
                    className="font-display font-black text-xs"
                    style={{
                      color: podiumColors[displayIndex].replace("0.2)", "1)"),
                    }}
                  >
                    {labels[displayIndex]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rankings */}
      {isLoading ? (
        <LeaderSkeleton />
      ) : sorted.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-display font-bold text-foreground/60 text-sm">
            No racers yet
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Be the first to create a profile and claim the top spot.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((racer, i) => (
            <LeaderRow key={racer.name} racer={racer} rank={i + 1} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
