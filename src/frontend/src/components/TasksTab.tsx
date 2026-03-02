import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Lock,
  Target,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import type { Task } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useCompleteTask,
  useTaskProgress,
} from "../hooks/useQueries";

// ─── Badge Tier System ───────────────────────────────────────────────────────

interface BadgeTier {
  threshold: number;
  name: string;
  color: string; // oklch text color
  glowColor: string; // oklch glow / border
  bgColor: string; // oklch bg
  gradFrom: string;
  gradTo: string;
}

const BADGE_TIERS: BadgeTier[] = [
  {
    threshold: 20000,
    name: "King of the Streets",
    color: "oklch(0.68 0.26 22)",
    glowColor: "oklch(0.68 0.26 22 / 0.5)",
    bgColor: "oklch(0.68 0.26 22 / 0.1)",
    gradFrom: "oklch(0.68 0.26 22 / 0.15)",
    gradTo: "oklch(0.18 0.04 22 / 0.3)",
  },
  {
    threshold: 10000,
    name: "Untouchable",
    color: "oklch(0.82 0.18 195)",
    glowColor: "oklch(0.82 0.18 195 / 0.5)",
    bgColor: "oklch(0.82 0.18 195 / 0.08)",
    gradFrom: "oklch(0.82 0.18 195 / 0.15)",
    gradTo: "oklch(0.18 0.04 195 / 0.3)",
  },
  {
    threshold: 6000,
    name: "Street Legend",
    color: "oklch(0.78 0.18 85)",
    glowColor: "oklch(0.78 0.18 85 / 0.5)",
    bgColor: "oklch(0.78 0.18 85 / 0.08)",
    gradFrom: "oklch(0.78 0.18 85 / 0.12)",
    gradTo: "oklch(0.18 0.04 85 / 0.25)",
  },
  {
    threshold: 3000,
    name: "Known in the Scene",
    color: "oklch(0.72 0.22 290)",
    glowColor: "oklch(0.72 0.22 290 / 0.5)",
    bgColor: "oklch(0.72 0.22 290 / 0.08)",
    gradFrom: "oklch(0.72 0.22 290 / 0.12)",
    gradTo: "oklch(0.18 0.04 290 / 0.25)",
  },
  {
    threshold: 1500,
    name: "Street Racer",
    color: "oklch(0.65 0.2 240)",
    glowColor: "oklch(0.65 0.2 240 / 0.5)",
    bgColor: "oklch(0.65 0.2 240 / 0.08)",
    gradFrom: "oklch(0.65 0.2 240 / 0.12)",
    gradTo: "oklch(0.18 0.04 240 / 0.25)",
  },
  {
    threshold: 500,
    name: "Getting the Hang",
    color: "oklch(0.7 0.18 145)",
    glowColor: "oklch(0.7 0.18 145 / 0.5)",
    bgColor: "oklch(0.7 0.18 145 / 0.08)",
    gradFrom: "oklch(0.7 0.18 145 / 0.12)",
    gradTo: "oklch(0.18 0.04 145 / 0.25)",
  },
  {
    threshold: 0,
    name: "Fresh on the Streets",
    color: "oklch(0.5 0.01 265)",
    glowColor: "oklch(0.5 0.01 265 / 0.3)",
    bgColor: "oklch(0.5 0.01 265 / 0.06)",
    gradFrom: "oklch(0.5 0.01 265 / 0.08)",
    gradTo: "oklch(0.12 0.008 265 / 0.2)",
  },
];

function getBadgeTier(xp: number): BadgeTier {
  for (const tier of BADGE_TIERS) {
    if (xp >= tier.threshold) return tier;
  }
  return BADGE_TIERS[BADGE_TIERS.length - 1];
}

function getNextBadgeTier(xp: number): BadgeTier | null {
  // BADGE_TIERS is sorted descending by threshold
  for (let i = BADGE_TIERS.length - 1; i >= 0; i--) {
    if (BADGE_TIERS[i].threshold > xp) return BADGE_TIERS[i];
  }
  return null;
}

// ─── Badge Card ──────────────────────────────────────────────────────────────

function BadgeCard({ xp, speed }: { xp: number; speed: number }) {
  const tier = getBadgeTier(xp);
  const nextTier = getNextBadgeTier(xp);

  const progressPct = nextTier
    ? Math.min(
        100,
        Math.round(
          ((xp - tier.threshold) / (nextTier.threshold - tier.threshold)) * 100,
        ),
      )
    : 100;

  const xpFormatted = xp.toLocaleString();
  const nextXpFormatted = nextTier ? nextTier.threshold.toLocaleString() : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl border"
      style={{
        borderColor: tier.glowColor,
        background: `linear-gradient(135deg, ${tier.gradFrom}, ${tier.gradTo})`,
        boxShadow: `0 0 30px ${tier.glowColor}, 0 0 0 1px ${tier.glowColor}`,
      }}
    >
      {/* Animated shimmer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${tier.bgColor} 50%, transparent 60%)`,
        }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{
          duration: 2.8,
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 3,
          ease: "easeInOut",
        }}
      />

      {/* Top accent stripe */}
      <div
        className="h-[3px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`,
        }}
      />

      <div className="p-5 relative z-10">
        {/* Badge name */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: tier.bgColor,
              border: `2px solid ${tier.glowColor}`,
              boxShadow: `0 0 16px ${tier.glowColor}`,
            }}
          >
            <Target className="h-6 w-6" style={{ color: tier.color }} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
              Current Rank
            </p>
            <h2
              className="font-display font-black text-xl leading-none"
              style={{
                color: tier.color,
                textShadow: `0 0 12px ${tier.glowColor}, 0 0 30px ${tier.glowColor}`,
              }}
            >
              {tier.name}
            </h2>
          </div>
        </div>

        {/* XP + Speed stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="rounded-lg px-3 py-2"
            style={{ background: "oklch(0.1 0.008 265 / 0.6)" }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
              XP Total
            </p>
            <p
              className="font-display font-black text-2xl"
              style={{ color: tier.color }}
            >
              {xpFormatted}
            </p>
          </div>
          <div
            className="rounded-lg px-3 py-2"
            style={{ background: "oklch(0.1 0.008 265 / 0.6)" }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
              Speed
            </p>
            <p className="font-display font-black text-2xl text-foreground">
              ⚡ {speed}
            </p>
          </div>
        </div>

        {/* Progress to next badge */}
        {nextTier ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-muted-foreground">
                Progress to{" "}
                <span style={{ color: nextTier.color }}>{nextTier.name}</span>
              </span>
              <span
                className="text-[10px] font-mono"
                style={{ color: tier.color }}
              >
                {xpFormatted} / {nextXpFormatted} XP
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "oklch(0.15 0.01 265)" }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                style={{
                  background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                  boxShadow: `0 0 8px ${tier.glowColor}`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-1">
            <span
              className="text-sm font-display font-black"
              style={{
                color: tier.color,
                textShadow: `0 0 12px ${tier.glowColor}`,
              }}
            >
              👑 MAX RANK ACHIEVED
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Task Completion Dots ─────────────────────────────────────────────────────

function CompletionDots({
  current,
  required,
  color,
}: {
  current: number;
  required: number;
  color: string;
}) {
  // If required is large, show a segmented bar instead of individual dots
  if (required > 10) {
    const pct = Math.min(100, Math.round((current / required) * 100));
    return (
      <div className="w-full">
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "oklch(0.15 0.01 265)" }}
        >
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ background: color }}
          />
        </div>
        <p className="text-[10px] font-mono text-muted-foreground mt-1">
          {current} / {required} completions
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: required }, (_, i) => `dot-${i}`).map(
        (dotKey, i) => (
          <motion.div
            key={dotKey}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            className="rounded-full"
            style={{
              width: required <= 5 ? "14px" : "10px",
              height: required <= 5 ? "14px" : "10px",
              background: i < current ? color : "oklch(0.2 0.01 265)",
              border: `1.5px solid ${i < current ? color : "oklch(0.3 0.015 265)"}`,
              boxShadow: i < current ? `0 0 6px ${color}` : "none",
              flexShrink: 0,
            }}
          />
        ),
      )}
      <span className="text-[10px] font-mono text-muted-foreground ml-1">
        {current}/{required}
      </span>
    </div>
  );
}

// ─── Current Task Card ────────────────────────────────────────────────────────

function CurrentTaskCard({
  task,
  completionsOnCurrentTask,
  xp,
}: {
  task: Task;
  completionsOnCurrentTask: number;
  xp: number;
}) {
  const tier = getBadgeTier(xp);
  const { mutateAsync: completeTask, isPending } = useCompleteTask();

  const handleComplete = async () => {
    try {
      const updated = await completeTask();
      const earned = Number(task.xpReward);
      toast.success(`+${earned} XP earned! Keep pushing.`, {
        description: `Total XP: ${Number(updated.xp).toLocaleString()}`,
      });
    } catch (_err) {
      toast.error("Couldn't complete task. Try again.");
    }
  };

  const remaining = Number(task.requiredCompletions) - completionsOnCurrentTask;
  const isLastCompletion = remaining === 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="relative overflow-hidden rounded-xl border-2"
      style={{
        borderColor: tier.glowColor,
        background: `linear-gradient(135deg, ${tier.gradFrom}, oklch(0.13 0.012 265))`,
        boxShadow: `0 0 20px ${tier.glowColor}, inset 0 1px 0 oklch(1 0 0 / 0.04)`,
      }}
    >
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, ${tier.color}, oklch(0.62 0.26 330))`,
        }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: tier.color }}
              >
                Active Task
              </span>
              <Badge
                className="text-[10px] h-4 px-1.5 font-mono border-0"
                style={{
                  background: tier.bgColor,
                  color: tier.color,
                }}
              >
                +{task.xpReward.toString()} XP
              </Badge>
            </div>
            <h3 className="font-display font-black text-xl text-foreground leading-tight">
              {task.title}
            </h3>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: tier.bgColor,
              border: `1px solid ${tier.glowColor}`,
            }}
          >
            <Target className="h-5 w-5" style={{ color: tier.color }} />
          </div>
        </div>

        <p className="text-sm font-body text-muted-foreground mb-4 leading-relaxed">
          {task.description}
        </p>

        {/* Progress dots */}
        <div className="mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Progress
          </p>
          <CompletionDots
            current={completionsOnCurrentTask}
            required={Number(task.requiredCompletions)}
            color={tier.color}
          />
        </div>

        {/* Complete button */}
        <motion.button
          type="button"
          onClick={handleComplete}
          disabled={isPending}
          className="w-full h-14 rounded-lg font-display font-black text-lg tracking-widest uppercase transition-all duration-200 relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${tier.color}, oklch(0.62 0.26 330))`,
            color: "oklch(0.08 0.01 265)",
            boxShadow: isPending
              ? "none"
              : `0 0 24px ${tier.glowColor}, 0 4px 12px oklch(0 0 0 / 0.4)`,
          }}
          whileHover={!isPending ? { scale: 1.02 } : undefined}
          whileTap={!isPending ? { scale: 0.97 } : undefined}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Marking…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5" />
              {isLastCompletion ? "COMPLETE TASK" : "COMPLETE"}
              <ChevronRight className="h-5 w-5" />
            </span>
          )}
        </motion.button>

        {remaining > 0 && !isLastCompletion && (
          <p className="text-center text-[11px] font-mono text-muted-foreground mt-2">
            {remaining} more completion{remaining !== 1 ? "s" : ""} to advance
          </p>
        )}
        {isLastCompletion && (
          <p
            className="text-center text-[11px] font-mono mt-2"
            style={{ color: tier.color }}
          >
            One more to unlock the next task!
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Task Row (list item) ─────────────────────────────────────────────────────

type TaskState = "completed" | "current" | "locked";

function TaskRow({
  task,
  state,
  index,
  xp,
}: {
  task: Task;
  state: TaskState;
  index: number;
  xp: number;
}) {
  const tier = getBadgeTier(xp);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="relative rounded-lg border p-3 flex items-center gap-3 transition-all duration-200"
      style={{
        opacity: state === "locked" ? 0.4 : 1,
        borderColor:
          state === "current"
            ? tier.glowColor
            : state === "completed"
              ? "oklch(0.7 0.18 145 / 0.3)"
              : "oklch(0.22 0.015 265)",
        background:
          state === "current"
            ? tier.bgColor
            : state === "completed"
              ? "oklch(0.7 0.18 145 / 0.05)"
              : "oklch(0.13 0.012 265)",
        boxShadow: state === "current" ? `0 0 12px ${tier.glowColor}` : "none",
      }}
    >
      {/* State icon */}
      <div className="shrink-0 w-8 flex items-center justify-center">
        {state === "completed" ? (
          <CheckCircle2
            className="h-5 w-5"
            style={{ color: "oklch(0.7 0.18 145)" }}
          />
        ) : state === "current" ? (
          <div
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: tier.color }}
          >
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: tier.color }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground/60" />
        )}
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-display font-bold text-sm truncate ${
              state === "completed"
                ? "line-through text-muted-foreground/60"
                : state === "current"
                  ? "text-foreground"
                  : "text-foreground/60"
            }`}
          >
            {task.title}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-muted-foreground">
            {task.requiredCompletions.toString()}x required
          </span>
          <span
            className="text-[10px] font-mono"
            style={{
              color:
                state === "completed"
                  ? "oklch(0.7 0.18 145)"
                  : state === "current"
                    ? tier.color
                    : "oklch(0.4 0.01 265)",
            }}
          >
            +{task.xpReward.toString()} XP
          </span>
        </div>
      </div>

      {/* Status label */}
      <div className="shrink-0">
        {state === "completed" && (
          <span
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: "oklch(0.7 0.18 145)" }}
          >
            Done
          </span>
        )}
        {state === "current" && (
          <span
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: tier.color }}
          >
            Active
          </span>
        )}
        {state === "locked" && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
            Locked
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TaskSkeleton() {
  return (
    <div className="space-y-4">
      {/* Badge card skeleton */}
      <div className="rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full bg-muted" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 bg-muted" />
            <Skeleton className="h-6 w-40 bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14 rounded-lg bg-muted" />
          <Skeleton className="h-14 rounded-lg bg-muted" />
        </div>
        <Skeleton className="h-2 w-full rounded-full bg-muted" />
      </div>
      {/* Task card skeleton */}
      <div className="rounded-xl border border-border p-5 space-y-3">
        <Skeleton className="h-5 w-32 bg-muted" />
        <Skeleton className="h-6 w-48 bg-muted" />
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-3/4 bg-muted" />
        <div className="flex gap-1.5 pt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3.5 w-3.5 rounded-full bg-muted" />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-lg bg-muted" />
      </div>
      {/* List skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-3 flex items-center gap-3"
          >
            <Skeleton className="h-5 w-5 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36 bg-muted" />
              <Skeleton className="h-3 w-24 bg-muted" />
            </div>
            <Skeleton className="h-3 w-12 bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TasksTab() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: taskData, isLoading: tasksLoading } = useTaskProgress();

  const isLoggedIn = !!identity;
  const isLoading = profileLoading || tasksLoading;

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-lg border border-neon-cyan/20 bg-card p-4 card-glow"
        >
          <div className="chassis-stripe h-[2px] w-full absolute top-0 left-0" />
          <div className="flex items-center gap-3">
            <Target
              className="h-6 w-6 neon-cyan"
              style={{
                filter: "drop-shadow(0 0 8px oklch(0.82 0.18 195 / 0.7))",
              }}
            />
            <div>
              <h2 className="font-display text-xl font-black neon-cyan neon-glow-cyan">
                Street Tasks
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">
                Complete tasks · Earn XP · Gain speed
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-8 text-center space-y-4"
        >
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{
              background: "oklch(0.5 0.01 265 / 0.08)",
              border: "2px solid oklch(0.5 0.01 265 / 0.3)",
            }}
          >
            <Lock className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-display font-black text-lg text-foreground/70">
              Login to Start Your Journey
            </p>
            <p className="text-sm font-mono text-muted-foreground mt-1">
              Complete tasks, earn XP, and rise from Fresh on the Streets to
              King of the Streets.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border border-neon-cyan/20 bg-card p-4">
          <div className="chassis-stripe h-[2px] w-full absolute top-0 left-0" />
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 neon-cyan" />
            <div>
              <h2 className="font-display text-xl font-black neon-cyan">
                Street Tasks
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">
                Loading your progress…
              </p>
            </div>
          </div>
        </div>
        <TaskSkeleton />
      </div>
    );
  }

  // No profile yet
  if (!profile) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border border-neon-cyan/20 bg-card p-4">
          <div className="chassis-stripe h-[2px] w-full absolute top-0 left-0" />
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 neon-cyan" />
            <div>
              <h2 className="font-display text-xl font-black neon-cyan">
                Street Tasks
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">
                Complete tasks · Earn XP · Gain speed
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-8 text-center space-y-3">
          <Target className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="font-display font-bold text-foreground/60 text-sm">
            Create a Profile First
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            Set up your racer profile to start tracking task progress.
          </p>
        </div>
      </div>
    );
  }

  const xp = Number(profile.xp ?? 0n);
  const speed = Number(profile.speed ?? 0n);
  const tasks = taskData?.tasks ?? [];
  const currentTaskId = Number(taskData?.currentTaskId ?? 0n);
  const completionsOnCurrentTask = Number(
    taskData?.completionsOnCurrentTask ?? 0n,
  );

  // Sort tasks by id ascending
  const sortedTasks = [...tasks].sort((a, b) => Number(a.id - b.id));

  // Current task
  const currentTask = sortedTasks.find((t) => Number(t.id) === currentTaskId);

  // Determine state for each task
  function getTaskState(task: Task): TaskState {
    const tid = Number(task.id);
    if (tid < currentTaskId) return "completed";
    if (tid === currentTaskId) return "current";
    return "locked";
  }

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
          <Target
            className="h-6 w-6 neon-cyan"
            style={{
              filter: "drop-shadow(0 0 8px oklch(0.82 0.18 195 / 0.7))",
            }}
          />
          <div>
            <h2 className="font-display text-xl font-black neon-cyan neon-glow-cyan">
              Street Tasks
            </h2>
            <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-widest">
              Complete tasks · Earn XP · Gain speed
            </p>
          </div>
        </div>
      </motion.div>

      {/* Badge / Rank Card */}
      <BadgeCard xp={xp} speed={speed} />

      {/* Current Task */}
      <AnimatePresence mode="wait">
        {currentTask ? (
          <CurrentTaskCard
            key={currentTask.id.toString()}
            task={currentTask}
            completionsOnCurrentTask={completionsOnCurrentTask}
            xp={xp}
          />
        ) : tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-xl border border-border p-8 text-center space-y-3"
          >
            <Target className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="font-display font-bold text-foreground/60 text-sm">
              No tasks available yet
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              Check back soon — new tasks drop regularly.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-xl border border-neon-cyan/20 p-8 text-center space-y-3"
            style={{ boxShadow: "0 0 20px oklch(0.78 0.18 85 / 0.2)" }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{
                background: "oklch(0.78 0.18 85 / 0.1)",
                border: "2px solid oklch(0.78 0.18 85 / 0.4)",
                boxShadow: "0 0 20px oklch(0.78 0.18 85 / 0.3)",
              }}
            >
              <CheckCircle2
                className="h-8 w-8"
                style={{ color: "oklch(0.78 0.18 85)" }}
              />
            </div>
            <p
              className="font-display font-black text-xl"
              style={{
                color: "oklch(0.78 0.18 85)",
                textShadow: "0 0 16px oklch(0.78 0.18 85 / 0.6)",
              }}
            >
              All Tasks Complete!
            </p>
            <p className="text-sm font-mono text-muted-foreground">
              You've conquered every challenge. You ARE the King of the Streets.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Tasks List */}
      {sortedTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1">
            All Tasks ({sortedTasks.length})
          </p>
          {sortedTasks.map((task, i) => (
            <TaskRow
              key={task.id.toString()}
              task={task}
              state={getTaskState(task)}
              index={i}
              xp={xp}
            />
          ))}
        </div>
      )}
    </div>
  );
}
