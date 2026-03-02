import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Loader2,
  Lock,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddXpEvent,
  useCallerProfile,
  useClaimDailyChallenge,
  useCompleteTask,
  useGetDailyProgress,
  useStreak,
  useTaskProgress,
  useXpHistory,
} from "../hooks/useQueries";

// ─── Full 50-Task List ────────────────────────────────────────────────────────

type DifficultyLevel = "bronze" | "silver" | "gold" | "legendary";

interface FrontendTask {
  id: number;
  chapter: number;
  title: string;
  description: string;
  lore: string;
  category: string;
  difficulty: DifficultyLevel;
  requiredCompletions: number;
  xpReward: number;
}

const FULL_TASKS: FrontendTask[] = [
  // Chapter 0: Street Rookie
  {
    id: 0,
    chapter: 0,
    title: "First Ignition",
    description: "Start your engine for the first time",
    lore: "Every legend has a first day. Turn the key.",
    category: "Basics",
    difficulty: "bronze",
    requiredCompletions: 3,
    xpReward: 50,
  },
  {
    id: 1,
    chapter: 0,
    title: "Rev It Up",
    description: "Rev your engine at the lot",
    lore: "Let them know you're here.",
    category: "Basics",
    difficulty: "bronze",
    requiredCompletions: 5,
    xpReward: 60,
  },
  {
    id: 2,
    chapter: 0,
    title: "First Burnout",
    description: "Leave rubber on the asphalt",
    lore: "Smoke means you mean business.",
    category: "Basics",
    difficulty: "bronze",
    requiredCompletions: 5,
    xpReward: 75,
  },
  {
    id: 3,
    chapter: 0,
    title: "Meet the Crew",
    description: "Visit the Taco Bell meet spot",
    lore: "Every racer starts in the parking lot.",
    category: "Social",
    difficulty: "bronze",
    requiredCompletions: 3,
    xpReward: 60,
  },
  {
    id: 4,
    chapter: 0,
    title: "Talk the Talk",
    description: "Send 5 messages in the chat",
    lore: "Build your rep before you hit the strip.",
    category: "Social",
    difficulty: "bronze",
    requiredCompletions: 5,
    xpReward: 50,
  },
  // Chapter 1: Burnout Circuit
  {
    id: 5,
    chapter: 1,
    title: "Smoke Show",
    description: "Pull 3 consecutive burnouts",
    lore: "They call it a smoke show for a reason.",
    category: "Style",
    difficulty: "bronze",
    requiredCompletions: 8,
    xpReward: 100,
  },
  {
    id: 6,
    chapter: 1,
    title: "Tire Slayer",
    description: "Destroy a set of rear tires",
    lore: "Tires are cheap, respect is not.",
    category: "Style",
    difficulty: "bronze",
    requiredCompletions: 10,
    xpReward: 110,
  },
  {
    id: 7,
    chapter: 1,
    title: "First Challenge",
    description: "Accept your first race challenge",
    lore: "When someone calls you out, you answer.",
    category: "Racing",
    difficulty: "bronze",
    requiredCompletions: 1,
    xpReward: 120,
  },
  {
    id: 8,
    chapter: 1,
    title: "Survive the Strip",
    description: "Race and survive without breaking down",
    lore: "Finishing is winning at first.",
    category: "Racing",
    difficulty: "bronze",
    requiredCompletions: 5,
    xpReward: 130,
  },
  {
    id: 9,
    chapter: 1,
    title: "Beat a Rookie",
    description: "Win a race against a fresh face",
    lore: "Everyone starts somewhere.",
    category: "Racing",
    difficulty: "silver",
    requiredCompletions: 5,
    xpReward: 150,
  },
  // Chapter 2: Quarter Mile Club
  {
    id: 10,
    chapter: 2,
    title: "Run the Quarter",
    description: "Complete a quarter mile run",
    lore: "10 seconds or bust.",
    category: "Racing",
    difficulty: "silver",
    requiredCompletions: 5,
    xpReward: 175,
  },
  {
    id: 11,
    chapter: 2,
    title: "Sub-12 Club",
    description: "Run under 12 seconds flat",
    lore: "12 seconds separates the real from the fake.",
    category: "Racing",
    difficulty: "silver",
    requiredCompletions: 8,
    xpReward: 200,
  },
  {
    id: 12,
    chapter: 2,
    title: "Reaction Time",
    description: "Win 3 races off the launch",
    lore: "It starts at the line.",
    category: "Racing",
    difficulty: "silver",
    requiredCompletions: 10,
    xpReward: 200,
  },
  {
    id: 13,
    chapter: 2,
    title: "Upgrade Season",
    description: "Add 3 mods to your car",
    lore: "A bone stock car has limits. Break them.",
    category: "Garage",
    difficulty: "silver",
    requiredCompletions: 3,
    xpReward: 225,
  },
  {
    id: 14,
    chapter: 2,
    title: "Dyno Day",
    description: "Log your HP on the dyno",
    lore: "Numbers don't lie.",
    category: "Garage",
    difficulty: "silver",
    requiredCompletions: 5,
    xpReward: 225,
  },
  // Chapter 3: Night Crawler
  {
    id: 15,
    chapter: 3,
    title: "Midnight Run",
    description: "Race after midnight",
    lore: "The streets belong to those who stay up.",
    category: "Racing",
    difficulty: "silver",
    requiredCompletions: 8,
    xpReward: 250,
  },
  {
    id: 16,
    chapter: 3,
    title: "No Headlights",
    description: "Win a race in the dark",
    lore: "Trust your instincts.",
    category: "Racing",
    difficulty: "silver",
    requiredCompletions: 8,
    xpReward: 275,
  },
  {
    id: 17,
    chapter: 3,
    title: "Street Scanner",
    description: "Scout 10 different racers",
    lore: "Know your competition before they know you.",
    category: "Social",
    difficulty: "silver",
    requiredCompletions: 10,
    xpReward: 250,
  },
  {
    id: 18,
    chapter: 3,
    title: "3AM Regular",
    description: "Attend 5 late night meets",
    lore: "The real action happens when everyone else is asleep.",
    category: "Social",
    difficulty: "gold",
    requiredCompletions: 12,
    xpReward: 300,
  },
  {
    id: 19,
    chapter: 3,
    title: "Ghost Driver",
    description: "Win 5 races without being challenged first",
    lore: "Make them chase you.",
    category: "Racing",
    difficulty: "gold",
    requiredCompletions: 10,
    xpReward: 350,
  },
  // Chapter 4: Reputation Grind
  {
    id: 20,
    chapter: 4,
    title: "Name Recognition",
    description: "Get your name known in 3 rooms",
    lore: "When you walk in, they recognize the name.",
    category: "Social",
    difficulty: "gold",
    requiredCompletions: 15,
    xpReward: 350,
  },
  {
    id: 21,
    chapter: 4,
    title: "Win Streak",
    description: "Win 3 races in a row",
    lore: "Consistency builds legends.",
    category: "Racing",
    difficulty: "gold",
    requiredCompletions: 15,
    xpReward: 375,
  },
  {
    id: 22,
    chapter: 4,
    title: "Double Down",
    description: "Win 5 races in a row",
    lore: "Now they're scared.",
    category: "Racing",
    difficulty: "gold",
    requiredCompletions: 12,
    xpReward: 400,
  },
  {
    id: 23,
    chapter: 4,
    title: "Rep Builder",
    description: "Reach 250 reputation points",
    lore: "Reputation is currency on the streets.",
    category: "Grind",
    difficulty: "gold",
    requiredCompletions: 20,
    xpReward: 400,
  },
  {
    id: 24,
    chapter: 4,
    title: "Regular at the Spot",
    description: "Visit the meet 15 times",
    lore: "Show up. Every time.",
    category: "Social",
    difficulty: "gold",
    requiredCompletions: 18,
    xpReward: 425,
  },
  // Chapter 5: Drift King Circuit
  {
    id: 25,
    chapter: 5,
    title: "First Slide",
    description: "Complete your first drift",
    lore: "Sideways is a lifestyle.",
    category: "Style",
    difficulty: "gold",
    requiredCompletions: 10,
    xpReward: 450,
  },
  {
    id: 26,
    chapter: 5,
    title: "Angle Grinder",
    description: "Hold a drift for 3 seconds",
    lore: "Commitment gets points.",
    category: "Style",
    difficulty: "gold",
    requiredCompletions: 12,
    xpReward: 475,
  },
  {
    id: 27,
    chapter: 5,
    title: "Tandem Terror",
    description: "Drift alongside another racer",
    lore: "Two cars, one line.",
    category: "Style",
    difficulty: "gold",
    requiredCompletions: 15,
    xpReward: 500,
  },
  {
    id: 28,
    chapter: 5,
    title: "Drift Battle",
    description: "Win a drift battle head to head",
    lore: "Style beats horsepower sometimes.",
    category: "Racing",
    difficulty: "gold",
    requiredCompletions: 15,
    xpReward: 525,
  },
  {
    id: 29,
    chapter: 5,
    title: "Drift King",
    description: "Win 10 drift battles total",
    lore: "The crown is yours to claim.",
    category: "Racing",
    difficulty: "gold",
    requiredCompletions: 20,
    xpReward: 600,
  },
  // Chapter 6: Pink Slip Wars
  {
    id: 30,
    chapter: 6,
    title: "Pink Slip Rookie",
    description: "Enter your first pink slip race",
    lore: "You bet the car. You better win.",
    category: "Racing",
    difficulty: "gold",
    requiredCompletions: 15,
    xpReward: 600,
  },
  {
    id: 31,
    chapter: 6,
    title: "First Title",
    description: "Win your first pink slip race",
    lore: "Now you have their keys.",
    category: "Racing",
    difficulty: "gold",
    requiredCompletions: 15,
    xpReward: 650,
  },
  {
    id: 32,
    chapter: 6,
    title: "Fleet Builder",
    description: "Win 5 pink slip races",
    lore: "Your collection grows.",
    category: "Racing",
    difficulty: "legendary",
    requiredCompletions: 20,
    xpReward: 700,
  },
  {
    id: 33,
    chapter: 6,
    title: "Untouchable",
    description: "Win 10 races without a loss",
    lore: "No one can touch you right now.",
    category: "Racing",
    difficulty: "legendary",
    requiredCompletions: 22,
    xpReward: 750,
  },
  {
    id: 34,
    chapter: 6,
    title: "Bounty on Your Head",
    description: "Become a target for the top racers",
    lore: "When everyone wants to race you, you've made it.",
    category: "Grind",
    difficulty: "legendary",
    requiredCompletions: 25,
    xpReward: 750,
  },
  // Chapter 7: Underground Legend
  {
    id: 35,
    chapter: 7,
    title: "Go Underground",
    description: "Race in 5 unsanctioned events",
    lore: "No rules. No refs. Just racing.",
    category: "Racing",
    difficulty: "legendary",
    requiredCompletions: 20,
    xpReward: 800,
  },
  {
    id: 36,
    chapter: 7,
    title: "Beat a Known Racer",
    description: "Defeat someone with 50+ wins",
    lore: "You have to beat the best to be the best.",
    category: "Racing",
    difficulty: "legendary",
    requiredCompletions: 20,
    xpReward: 850,
  },
  {
    id: 37,
    chapter: 7,
    title: "Legend Whisperer",
    description: "Recruit 5 racers into your crew",
    lore: "Kings build kingdoms.",
    category: "Crew",
    difficulty: "legendary",
    requiredCompletions: 25,
    xpReward: 900,
  },
  {
    id: 38,
    chapter: 7,
    title: "Crew War Champion",
    description: "Win a crew war battle",
    lore: "Your crew is your armor.",
    category: "Crew",
    difficulty: "legendary",
    requiredCompletions: 25,
    xpReward: 950,
  },
  {
    id: 39,
    chapter: 7,
    title: "Ghost of the Streets",
    description: "Win 25 races total",
    lore: "They talk about you but few have seen you lose.",
    category: "Racing",
    difficulty: "legendary",
    requiredCompletions: 30,
    xpReward: 1000,
  },
  // Chapter 8: Street Dominator
  {
    id: 40,
    chapter: 8,
    title: "Cross-City Run",
    description: "Challenge racers from 3 different crews",
    lore: "The whole city knows your name now.",
    category: "Racing",
    difficulty: "legendary",
    requiredCompletions: 25,
    xpReward: 1000,
  },
  {
    id: 41,
    chapter: 8,
    title: "Dominator HP",
    description: "Build your car to 500+ HP",
    lore: "Raw power commands respect.",
    category: "Garage",
    difficulty: "legendary",
    requiredCompletions: 30,
    xpReward: 1050,
  },
  {
    id: 42,
    chapter: 8,
    title: "50-Race Club",
    description: "Complete 50 total races",
    lore: "Consistency is the real flex.",
    category: "Grind",
    difficulty: "legendary",
    requiredCompletions: 35,
    xpReward: 1100,
  },
  {
    id: 43,
    chapter: 8,
    title: "Unbeatable Streak",
    description: "Win 15 races in a row",
    lore: "15 straight. Let that sink in.",
    category: "Racing",
    difficulty: "legendary",
    requiredCompletions: 35,
    xpReward: 1150,
  },
  {
    id: 44,
    chapter: 8,
    title: "Dominator Title",
    description: "Hold top 3 on the leaderboard for 5 days",
    lore: "Top 3 means everyone is gunning for you.",
    category: "Grind",
    difficulty: "legendary",
    requiredCompletions: 30,
    xpReward: 1200,
  },
  // Chapter 9: King of the Streets
  {
    id: 45,
    chapter: 9,
    title: "Crown Challenger",
    description: "Challenge the current #1 racer",
    lore: "The throne has one seat.",
    category: "Racing",
    difficulty: "legendary",
    requiredCompletions: 30,
    xpReward: 1500,
  },
  {
    id: 46,
    chapter: 9,
    title: "Dethrone the King",
    description: "Beat the #1 racer on the leaderboard",
    lore: "History remembers who took the crown.",
    category: "Racing",
    difficulty: "legendary",
    requiredCompletions: 35,
    xpReward: 1750,
  },
  {
    id: 47,
    chapter: 9,
    title: "King's Court",
    description: "Build a crew of 10 members",
    lore: "A king rules with a court.",
    category: "Crew",
    difficulty: "legendary",
    requiredCompletions: 40,
    xpReward: 1800,
  },
  {
    id: 48,
    chapter: 9,
    title: "100-Race Legend",
    description: "Complete 100 total races",
    lore: "One hundred. Say it slowly.",
    category: "Grind",
    difficulty: "legendary",
    requiredCompletions: 45,
    xpReward: 1900,
  },
  {
    id: 49,
    chapter: 9,
    title: "King of the Streets",
    description: "Complete all chapters and prove yourself",
    lore: "From a parking lot to the throne. This is your story.",
    category: "Legacy",
    difficulty: "legendary",
    requiredCompletions: 50,
    xpReward: 2000,
  },
];

const CHAPTER_NAMES = [
  "Street Rookie",
  "Burnout Circuit",
  "Quarter Mile Club",
  "Night Crawler",
  "Reputation Grind",
  "Drift King Circuit",
  "Pink Slip Wars",
  "Underground Legend",
  "Street Dominator",
  "King of the Streets",
];

// Tasks grouped by chapter (5 per chapter, 10 chapters)
const TASKS_BY_CHAPTER: FrontendTask[][] = Array.from({ length: 10 }, (_, ch) =>
  FULL_TASKS.filter((t) => t.chapter === ch),
);

// ─── Difficulty Colors ────────────────────────────────────────────────────────

function getDifficultyStyles(difficulty: DifficultyLevel) {
  switch (difficulty) {
    case "bronze":
      return {
        color: "oklch(0.62 0.12 55)",
        glow: "oklch(0.62 0.12 55 / 0.4)",
        bg: "oklch(0.62 0.12 55 / 0.12)",
        label: "Bronze",
      };
    case "silver":
      return {
        color: "oklch(0.72 0.02 265)",
        glow: "oklch(0.72 0.02 265 / 0.3)",
        bg: "oklch(0.72 0.02 265 / 0.1)",
        label: "Silver",
      };
    case "gold":
      return {
        color: "oklch(0.82 0.18 85)",
        glow: "oklch(0.82 0.18 85 / 0.4)",
        bg: "oklch(0.82 0.18 85 / 0.1)",
        label: "Gold",
      };
    case "legendary":
      return {
        color: "oklch(0.72 0.22 290)",
        glow: "oklch(0.72 0.22 290 / 0.5)",
        bg: "oklch(0.72 0.22 290 / 0.1)",
        label: "Legendary",
      };
  }
}

// ─── Rank System ──────────────────────────────────────────────────────────────

interface RankTier {
  threshold: number;
  name: string;
  color: string;
  glowColor: string;
  bgColor: string;
  gradFrom: string;
  gradTo: string;
  emoji: string;
}

const RANK_TIERS: RankTier[] = [
  {
    threshold: 150,
    name: "King of the Streets",
    color: "oklch(0.78 0.24 55)",
    glowColor: "oklch(0.78 0.24 55 / 0.5)",
    bgColor: "oklch(0.78 0.24 55 / 0.1)",
    gradFrom: "oklch(0.78 0.24 55 / 0.15)",
    gradTo: "oklch(0.18 0.04 55 / 0.3)",
    emoji: "👑",
  },
  {
    threshold: 100,
    name: "Underground King",
    color: "oklch(0.72 0.22 290)",
    glowColor: "oklch(0.72 0.22 290 / 0.5)",
    bgColor: "oklch(0.72 0.22 290 / 0.08)",
    gradFrom: "oklch(0.72 0.22 290 / 0.15)",
    gradTo: "oklch(0.18 0.04 290 / 0.3)",
    emoji: "🏴",
  },
  {
    threshold: 75,
    name: "Street Legend",
    color: "oklch(0.82 0.18 195)",
    glowColor: "oklch(0.82 0.18 195 / 0.5)",
    bgColor: "oklch(0.82 0.18 195 / 0.08)",
    gradFrom: "oklch(0.82 0.18 195 / 0.15)",
    gradTo: "oklch(0.18 0.04 195 / 0.3)",
    emoji: "⚡",
  },
  {
    threshold: 50,
    name: "Road Warrior",
    color: "oklch(0.78 0.18 85)",
    glowColor: "oklch(0.78 0.18 85 / 0.5)",
    bgColor: "oklch(0.78 0.18 85 / 0.08)",
    gradFrom: "oklch(0.78 0.18 85 / 0.12)",
    gradTo: "oklch(0.18 0.04 85 / 0.25)",
    emoji: "🛣️",
  },
  {
    threshold: 30,
    name: "Known Face",
    color: "oklch(0.62 0.26 330)",
    glowColor: "oklch(0.62 0.26 330 / 0.5)",
    bgColor: "oklch(0.62 0.26 330 / 0.08)",
    gradFrom: "oklch(0.62 0.26 330 / 0.12)",
    gradTo: "oklch(0.18 0.04 330 / 0.25)",
    emoji: "🔥",
  },
  {
    threshold: 15,
    name: "Street Regular",
    color: "oklch(0.65 0.2 240)",
    glowColor: "oklch(0.65 0.2 240 / 0.5)",
    bgColor: "oklch(0.65 0.2 240 / 0.08)",
    gradFrom: "oklch(0.65 0.2 240 / 0.12)",
    gradTo: "oklch(0.18 0.04 240 / 0.25)",
    emoji: "🚗",
  },
  {
    threshold: 5,
    name: "Getting the Hang",
    color: "oklch(0.7 0.18 145)",
    glowColor: "oklch(0.7 0.18 145 / 0.5)",
    bgColor: "oklch(0.7 0.18 145 / 0.08)",
    gradFrom: "oklch(0.7 0.18 145 / 0.12)",
    gradTo: "oklch(0.18 0.04 145 / 0.25)",
    emoji: "🔧",
  },
  {
    threshold: 0,
    name: "Fresh on the Streets",
    color: "oklch(0.5 0.01 265)",
    glowColor: "oklch(0.5 0.01 265 / 0.3)",
    bgColor: "oklch(0.5 0.01 265 / 0.06)",
    gradFrom: "oklch(0.5 0.01 265 / 0.08)",
    gradTo: "oklch(0.12 0.008 265 / 0.2)",
    emoji: "🌱",
  },
];

function getRankTier(totalTasksCompleted: number): RankTier {
  for (const tier of RANK_TIERS) {
    if (totalTasksCompleted >= tier.threshold) return tier;
  }
  return RANK_TIERS[RANK_TIERS.length - 1];
}

function getNextRankTier(totalTasksCompleted: number): RankTier | null {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (RANK_TIERS[i].threshold > totalTasksCompleted) return RANK_TIERS[i];
  }
  return null;
}

// ─── Time Estimate ────────────────────────────────────────────────────────────

function getTimeEstimate(requiredCompletions: number): string {
  if (requiredCompletions <= 3) return "~1 day";
  if (requiredCompletions <= 10) return "~3-5 days";
  if (requiredCompletions <= 20) return "~1-2 weeks";
  if (requiredCompletions <= 35) return "~2-4 weeks";
  return "~1-2 months";
}

// ─── Local XP display type ────────────────────────────────────────────────────

interface LocalXpEvent {
  label: string;
  amount: number;
  timestamp: number;
  streakBonus?: boolean;
}

// ─── Daily Challenges ─────────────────────────────────────────────────────────

const DAILY_BONUS_POOL = [50, 75, 100, 125, 150];

function getDailyChallenges(): Array<{
  task: FrontendTask;
  bonusXp: number;
  idx: number;
}> {
  const day = new Date().getDay();
  const results: Array<{ task: FrontendTask; bonusXp: number; idx: number }> =
    [];
  for (let offset = 0; offset < 3; offset++) {
    const taskIdx = (day * 7 + offset * 17) % 50;
    const bonusIdx = (day + offset) % DAILY_BONUS_POOL.length;
    results.push({
      task: FULL_TASKS[taskIdx],
      bonusXp: DAILY_BONUS_POOL[bonusIdx],
      idx: offset,
    });
  }
  return results;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  check: (
    wins: number,
    speed: number,
    currentTaskId: number,
    totalTasks: number,
  ) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 0,
    name: "First Win",
    description: "Win your first race",
    icon: "🏁",
    check: (w) => w >= 1,
  },
  {
    id: 1,
    name: "10 Wins",
    description: "Win 10 races",
    icon: "🥈",
    check: (w) => w >= 10,
  },
  {
    id: 2,
    name: "50 Wins",
    description: "Win 50 races",
    icon: "🥇",
    check: (w) => w >= 50,
  },
  {
    id: 3,
    name: "First Task",
    description: "Complete your first task",
    icon: "✅",
    check: (_, __, tid) => tid >= 1,
  },
  {
    id: 4,
    name: "Street Rookie Done",
    description: "Finish Chapter 0",
    icon: "🌱",
    check: (_, __, tid) => tid >= 5,
  },
  {
    id: 5,
    name: "Drift King Done",
    description: "Finish Chapter 5",
    icon: "🔥",
    check: (_, __, tid) => tid >= 30,
  },
  {
    id: 6,
    name: "King Unlocked",
    description: "Reach Chapter 9",
    icon: "👑",
    check: (_, __, tid) => tid >= 45,
  },
  {
    id: 7,
    name: "Speed Demon",
    description: "Reach speed 100",
    icon: "⚡",
    check: (_, spd) => spd >= 100,
  },
  {
    id: 8,
    name: "Chapter 3 Done",
    description: "Finish Night Crawler",
    icon: "🌙",
    check: (_, __, tid) => tid >= 20,
  },
  {
    id: 9,
    name: "Halfway There",
    description: "Complete 25 tasks",
    icon: "🛣️",
    check: (_, __, ___, total) => total >= 25,
  },
];

// ─── Chapter Navigator ────────────────────────────────────────────────────────

function ChapterNavigator({
  currentFrontendTaskId,
  onChapterClick,
}: {
  currentFrontendTaskId: number;
  onChapterClick: (chapter: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentChapter = Math.floor(currentFrontendTaskId / 5);

  // Auto-scroll active chapter into view
  // biome-ignore lint/correctness/useExhaustiveDependencies: currentChapter is derived from currentFrontendTaskId, intentional
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector(
      "[data-active='true']",
    ) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentChapter]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
    >
      {CHAPTER_NAMES.map((name, ch) => {
        const chapterStartTask = ch * 5;
        const isCompleted = currentFrontendTaskId >= chapterStartTask + 5;
        const isActive = ch === currentChapter;
        const isLocked = chapterStartTask > currentFrontendTaskId && !isActive;

        let borderColor = "oklch(0.25 0.015 265)";
        let bgColor = "oklch(0.14 0.012 265)";
        let textColor = "oklch(0.45 0.02 265)";
        let glowShadow = "none";

        if (isCompleted) {
          borderColor = "oklch(0.7 0.18 145 / 0.4)";
          bgColor = "oklch(0.7 0.18 145 / 0.08)";
          textColor = "oklch(0.7 0.18 145)";
        } else if (isActive) {
          borderColor = "oklch(0.82 0.18 195 / 0.6)";
          bgColor = "oklch(0.82 0.18 195 / 0.1)";
          textColor = "oklch(0.82 0.18 195)";
          glowShadow = "0 0 12px oklch(0.82 0.18 195 / 0.3)";
        }

        return (
          <motion.button
            key={name}
            data-active={isActive ? "true" : "false"}
            type="button"
            onClick={() => onChapterClick(ch)}
            disabled={isLocked}
            whileHover={!isLocked ? { scale: 1.05 } : undefined}
            whileTap={!isLocked ? { scale: 0.95 } : undefined}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              border: `1px solid ${borderColor}`,
              background: bgColor,
              color: textColor,
              boxShadow: glowShadow,
            }}
          >
            {isCompleted && <CheckCircle2 className="h-3 w-3" />}
            {isLocked && <Lock className="h-3 w-3" />}
            {isActive && (
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: textColor }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
              />
            )}
            <span className="whitespace-nowrap">
              Ch.{ch} {name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Rank Badge Card ──────────────────────────────────────────────────────────

function RankBadgeCard({
  xp,
  speed,
  totalTasksCompleted,
  streak,
  currentChapter,
}: {
  xp: number;
  speed: number;
  totalTasksCompleted: number;
  streak: number;
  currentChapter: number;
}) {
  const tier = getRankTier(totalTasksCompleted);
  const nextTier = getNextRankTier(totalTasksCompleted);

  const progressPct = nextTier
    ? Math.min(
        100,
        Math.round(
          ((totalTasksCompleted - tier.threshold) /
            (nextTier.threshold - tier.threshold)) *
            100,
        ),
      )
    : 100;

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
      {/* Shimmer */}
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

      <div className="p-5 relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl"
              style={{
                background: tier.bgColor,
                border: `2px solid ${tier.glowColor}`,
                boxShadow: `0 0 16px ${tier.glowColor}`,
              }}
            >
              {tier.emoji}
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
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                Chapter {currentChapter + 1} of 10 · {totalTasksCompleted} tasks
                done
              </p>
            </div>
          </div>
          {streak >= 1 && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-mono font-bold"
              style={{
                background: "oklch(0.68 0.26 55 / 0.15)",
                border: "1px solid oklch(0.68 0.26 55 / 0.4)",
                color: "oklch(0.82 0.2 55)",
              }}
            >
              <Flame className="h-3 w-3" />
              {streak} streak
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {
              label: "XP Total",
              value: xp.toLocaleString(),
              color: tier.color,
            },
            {
              label: "Speed",
              value: `⚡ ${speed}`,
              color: "oklch(0.97 0.01 265)",
            },
            {
              label: "Tasks Done",
              value: `${totalTasksCompleted}/50`,
              color: "oklch(0.7 0.18 145)",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg px-2 py-2"
              style={{ background: "oklch(0.1 0.008 265 / 0.6)" }}
            >
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
                {stat.label}
              </p>
              <p
                className="font-display font-black text-base leading-none"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Progress to next rank */}
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
                {totalTasksCompleted} / {nextTier.threshold} tasks
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

// ─── Daily Challenges Panel ───────────────────────────────────────────────────

function DailyChallengesPanel({
  date,
  claimedIndices,
  onClaim,
}: {
  date: string;
  claimedIndices: bigint[];
  onClaim: (taskTitle: string, bonusXp: number, idx: bigint) => void;
}) {
  const dailyChallenges = getDailyChallenges();
  const [claimedAnim, setClaimedAnim] = useState<number | null>(null);

  // Silence unused date warning (used by parent to key the query)
  void date;

  const handleClaim = (idx: number, title: string, bonusXp: number) => {
    const idxBig = BigInt(idx);
    if (claimedIndices.some((i) => i === idxBig)) return;
    setClaimedAnim(idx);
    onClaim(title, bonusXp, idxBig);
    setTimeout(() => setClaimedAnim(null), 600);
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: "oklch(0.82 0.18 85 / 0.25)",
        background:
          "linear-gradient(135deg, oklch(0.82 0.18 85 / 0.05), oklch(0.13 0.012 265))",
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: "oklch(0.82 0.18 85 / 0.15)" }}
      >
        <Star className="h-4 w-4" style={{ color: "oklch(0.82 0.18 85)" }} />
        <span
          className="font-display font-black text-sm"
          style={{ color: "oklch(0.82 0.18 85)" }}
        >
          Daily Challenges
        </span>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">
          Resets at midnight
        </span>
      </div>
      <div className="p-3 space-y-2">
        {dailyChallenges.map(({ task, bonusXp, idx }) => {
          const done = claimedIndices.some((i) => i === BigInt(idx));
          const diffStyles = getDifficultyStyles(task.difficulty);
          return (
            <motion.div
              key={idx}
              animate={claimedAnim === idx ? { scale: [1, 1.04, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 rounded-lg p-3 transition-all"
              style={{
                background: done
                  ? "oklch(0.7 0.18 145 / 0.06)"
                  : "oklch(0.14 0.012 265)",
                border: `1px solid ${done ? "oklch(0.7 0.18 145 / 0.25)" : "oklch(0.22 0.015 265)"}`,
                opacity: done ? 0.7 : 1,
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`font-display font-bold text-sm ${done ? "line-through text-muted-foreground/50" : "text-foreground"}`}
                  >
                    {task.title}
                  </span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: diffStyles.bg,
                      color: diffStyles.color,
                    }}
                  >
                    {task.difficulty}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground truncate">
                  {task.description}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-[11px] font-mono font-bold"
                  style={{ color: "oklch(0.82 0.18 85)" }}
                >
                  +{bonusXp} XP
                </span>
                {done ? (
                  <CheckCircle2
                    className="h-5 w-5"
                    style={{ color: "oklch(0.7 0.18 145)" }}
                  />
                ) : (
                  <motion.button
                    type="button"
                    onClick={() => handleClaim(idx, task.title, bonusXp)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-[11px] font-mono font-bold px-2 py-1 rounded"
                    style={{
                      background: "oklch(0.82 0.18 85 / 0.15)",
                      border: "1px solid oklch(0.82 0.18 85 / 0.4)",
                      color: "oklch(0.82 0.18 85)",
                    }}
                  >
                    Claim
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Active Task Card ─────────────────────────────────────────────────────────

function ActiveTaskCard({
  frontendTask,
  completionsOnCurrentTask,
  streak,
  onComplete,
  isPending,
}: {
  frontendTask: FrontendTask;
  completionsOnCurrentTask: number;
  streak: number;
  onComplete: () => void;
  isPending: boolean;
}) {
  const diffStyles = getDifficultyStyles(frontendTask.difficulty);
  const streakBonus = streak >= 3;
  const remaining = frontendTask.requiredCompletions - completionsOnCurrentTask;
  const pct = Math.min(
    100,
    Math.round(
      (completionsOnCurrentTask / frontendTask.requiredCompletions) * 100,
    ),
  );
  const timeEst = getTimeEstimate(frontendTask.requiredCompletions);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="relative overflow-hidden rounded-xl border-2"
      style={{
        borderColor: diffStyles.glow,
        background: `linear-gradient(135deg, ${diffStyles.bg}, oklch(0.13 0.012 265))`,
        boxShadow: `0 0 24px ${diffStyles.glow}, inset 0 1px 0 oklch(1 0 0 / 0.04)`,
      }}
    >
      {/* Top accent */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${diffStyles.color}, transparent)`,
        }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: diffStyles.color }}
              >
                Active Task
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase"
                style={{
                  background: diffStyles.bg,
                  color: diffStyles.color,
                  border: `1px solid ${diffStyles.glow}`,
                }}
              >
                {diffStyles.label}
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: "oklch(0.62 0.26 330 / 0.12)",
                  color: "oklch(0.62 0.26 330)",
                  border: "1px solid oklch(0.62 0.26 330 / 0.3)",
                }}
              >
                {frontendTask.category}
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: "oklch(0.82 0.18 195 / 0.1)",
                  color: "oklch(0.82 0.18 195)",
                  border: "1px solid oklch(0.82 0.18 195 / 0.25)",
                }}
              >
                Ch.{frontendTask.chapter} {CHAPTER_NAMES[frontendTask.chapter]}
              </span>
            </div>
            <h3 className="font-display font-black text-xl text-foreground leading-tight mb-1">
              {frontendTask.title}
            </h3>
            <p className="text-sm font-body text-muted-foreground leading-relaxed">
              {frontendTask.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div
              className="px-2 py-1 rounded text-[11px] font-mono font-bold"
              style={{ background: diffStyles.bg, color: diffStyles.color }}
            >
              +{frontendTask.xpReward} XP
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeEst}
            </div>
          </div>
        </div>

        {/* Lore */}
        <p
          className="text-xs font-body italic mb-4 px-3 py-2 rounded-lg border-l-2 leading-relaxed"
          style={{
            color: "oklch(0.65 0.04 265)",
            borderLeftColor: diffStyles.color,
            background: "oklch(0.1 0.008 265 / 0.5)",
          }}
        >
          "{frontendTask.lore}"
        </p>

        {/* Streak bonus */}
        <AnimatePresence>
          {streakBonus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-[11px] font-mono font-bold"
              style={{
                background: "oklch(0.68 0.26 55 / 0.12)",
                border: "1px solid oklch(0.68 0.26 55 / 0.3)",
                color: "oklch(0.82 0.2 55)",
              }}
            >
              <Flame className="h-3 w-3" />🔥 Streak bonus active! +50% XP
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Progress
            </p>
            <span
              className="text-[10px] font-mono"
              style={{ color: diffStyles.color }}
            >
              {completionsOnCurrentTask} / {frontendTask.requiredCompletions}
            </span>
          </div>
          <div
            className="h-2.5 rounded-full overflow-hidden"
            style={{ background: "oklch(0.15 0.01 265)" }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                background: `linear-gradient(90deg, ${diffStyles.color}, oklch(0.82 0.18 195))`,
                boxShadow: `0 0 8px ${diffStyles.glow}`,
              }}
            />
          </div>
        </div>

        {/* Complete button */}
        <motion.button
          type="button"
          onClick={onComplete}
          disabled={isPending}
          className="w-full h-14 rounded-lg font-display font-black text-lg tracking-widest uppercase transition-all duration-200 relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${diffStyles.color}, oklch(0.62 0.26 330))`,
            color: "oklch(0.08 0.01 265)",
            boxShadow: isPending
              ? "none"
              : `0 0 24px ${diffStyles.glow}, 0 4px 12px oklch(0 0 0 / 0.4)`,
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
              {remaining === 1 ? "COMPLETE TASK" : "COMPLETE"}
              <ChevronRight className="h-5 w-5" />
            </span>
          )}
        </motion.button>

        {remaining > 0 && (
          <p className="text-center text-[11px] font-mono text-muted-foreground mt-2">
            {remaining} more completion{remaining !== 1 ? "s" : ""} to advance
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Chapter Accordion ────────────────────────────────────────────────────────

function FrontendTaskRow({
  task,
  state,
}: { task: FrontendTask; state: "completed" | "current" | "locked" }) {
  const diffStyles = getDifficultyStyles(task.difficulty);

  return (
    <div
      className="flex items-center gap-3 rounded-lg p-3 transition-all"
      style={{
        opacity: state === "locked" ? 0.4 : 1,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor:
          state === "current"
            ? diffStyles.glow
            : state === "completed"
              ? "oklch(0.7 0.18 145 / 0.2)"
              : "oklch(0.2 0.012 265)",
        background:
          state === "current"
            ? diffStyles.bg
            : state === "completed"
              ? "oklch(0.7 0.18 145 / 0.04)"
              : "oklch(0.12 0.01 265)",
        boxShadow: state === "current" ? `0 0 10px ${diffStyles.glow}` : "none",
      }}
    >
      <div className="shrink-0">
        {state === "completed" ? (
          <CheckCircle2
            className="h-4 w-4"
            style={{ color: "oklch(0.7 0.18 145)" }}
          />
        ) : state === "current" ? (
          <motion.div
            className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: diffStyles.color }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: diffStyles.color }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
            />
          </motion.div>
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground/40" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-display font-bold text-sm truncate ${state === "completed" ? "line-through text-muted-foreground/50" : state === "current" ? "text-foreground" : "text-foreground/50"}`}
          >
            {task.title}
          </span>
          <span
            className="text-[9px] font-mono px-1 py-0.5 rounded shrink-0"
            style={{ background: diffStyles.bg, color: diffStyles.color }}
          >
            {diffStyles.label}
          </span>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground truncate">
          {task.description}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        <span
          className="text-[10px] font-mono"
          style={{
            color:
              state === "completed"
                ? "oklch(0.7 0.18 145)"
                : state === "current"
                  ? diffStyles.color
                  : "oklch(0.35 0.01 265)",
          }}
        >
          +{task.xpReward} XP
        </span>
        <span className="text-[9px] font-mono text-muted-foreground/50">
          {task.requiredCompletions}x
        </span>
      </div>
    </div>
  );
}

function ChapterAccordion({
  currentFrontendTaskId,
  chapterRefs,
}: {
  currentFrontendTaskId: number;
  chapterRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}) {
  const currentChapter = Math.floor(currentFrontendTaskId / 5);
  const defaultOpen = [`chapter-${currentChapter}`];

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-1 mb-2">
        All Chapters (50 Tasks · 10 Chapters)
      </p>
      <Accordion
        type="multiple"
        defaultValue={defaultOpen}
        className="space-y-1"
      >
        {CHAPTER_NAMES.map((chapterName, ch) => {
          const chapterTasks = TASKS_BY_CHAPTER[ch];
          const chapterStart = ch * 5;
          const tasksCompleted = Math.min(
            5,
            Math.max(0, currentFrontendTaskId - chapterStart),
          );
          const isChapterComplete = currentFrontendTaskId >= chapterStart + 5;
          const isChapterLocked = chapterStart > currentFrontendTaskId;
          const isCurrentChapter = ch === currentChapter;

          let headerBorder = "oklch(0.22 0.015 265)";
          let headerBg = "oklch(0.13 0.012 265)";
          let titleColor = "oklch(0.55 0.02 265)";

          if (isChapterComplete) {
            headerBorder = "oklch(0.7 0.18 145 / 0.3)";
            headerBg = "oklch(0.7 0.18 145 / 0.05)";
            titleColor = "oklch(0.7 0.18 145)";
          } else if (isCurrentChapter) {
            headerBorder = "oklch(0.82 0.18 195 / 0.4)";
            headerBg = "oklch(0.82 0.18 195 / 0.07)";
            titleColor = "oklch(0.82 0.18 195)";
          }

          return (
            <div
              key={chapterName}
              ref={(el) => {
                chapterRefs.current[ch] = el;
              }}
            >
              <AccordionItem
                value={`chapter-${ch}`}
                className="rounded-xl overflow-hidden border"
                style={{ borderColor: headerBorder }}
              >
                <AccordionTrigger
                  className="px-4 py-3 hover:no-underline"
                  style={{ background: headerBg }}
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    {isChapterComplete ? (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0"
                        style={{ color: "oklch(0.7 0.18 145)" }}
                      />
                    ) : isChapterLocked ? (
                      <Lock className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    ) : (
                      <div
                        className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                        style={{ border: `2px solid ${titleColor}` }}
                      >
                        <span
                          className="text-[8px] font-mono font-bold"
                          style={{ color: titleColor }}
                        >
                          {ch}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span
                        className="font-display font-bold text-sm"
                        style={{ color: titleColor }}
                      >
                        {chapterName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 mr-2">
                      {tasksCompleted}/5 done
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div
                    className="px-3 pb-3 pt-1 space-y-1.5"
                    style={{ background: "oklch(0.11 0.01 265)" }}
                  >
                    {chapterTasks.map((task) => {
                      let state: "completed" | "current" | "locked" = "locked";
                      if (task.id < currentFrontendTaskId) state = "completed";
                      else if (task.id === currentFrontendTaskId)
                        state = "current";
                      return (
                        <FrontendTaskRow
                          key={task.id}
                          task={task}
                          state={state}
                        />
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </div>
          );
        })}
      </Accordion>
    </div>
  );
}

// ─── XP History Feed ──────────────────────────────────────────────────────────

function XpHistoryFeed({ log }: { log: LocalXpEvent[] }) {
  const [open, setOpen] = useState(false);

  if (log.length === 0) return null;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "oklch(0.22 0.015 265)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <Zap className="h-4 w-4" style={{ color: "oklch(0.82 0.18 85)" }} />
        <span className="font-display font-bold text-sm text-foreground/80">
          Recent XP
        </span>
        <span className="text-[10px] font-mono text-muted-foreground ml-1">
          ({log.length} events)
        </span>
        <ChevronRight
          className="h-4 w-4 text-muted-foreground ml-auto transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-3 space-y-1.5 border-t"
              style={{
                borderColor: "oklch(0.22 0.015 265)",
                background: "oklch(0.11 0.01 265)",
              }}
            >
              {log.slice(0, 10).map((event, i) => (
                <div
                  key={`${event.timestamp}-${i}`}
                  className="flex items-center justify-between py-1.5 border-b last:border-b-0"
                  style={{ borderColor: "oklch(0.18 0.012 265)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-mono font-bold"
                      style={{ color: "oklch(0.7 0.18 145)" }}
                    >
                      +{event.amount} XP
                    </span>
                    {event.streakBonus && (
                      <span className="text-[10px]">🔥</span>
                    )}
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {event.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    {new Date(event.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Achievements Wall ────────────────────────────────────────────────────────

function AchievementsWall({
  wins,
  speed,
  currentFrontendTaskId,
  totalTasksCompleted,
}: {
  wins: number;
  speed: number;
  currentFrontendTaskId: number;
  totalTasksCompleted: number;
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "oklch(0.22 0.015 265)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: "oklch(0.22 0.015 265)" }}
      >
        <Trophy className="h-4 w-4" style={{ color: "oklch(0.82 0.18 85)" }} />
        <span className="font-display font-bold text-sm text-foreground/80">
          Achievements
        </span>
        <span className="text-[10px] font-mono text-muted-foreground ml-1">
          (
          {
            ACHIEVEMENTS.filter((a) =>
              a.check(wins, speed, currentFrontendTaskId, totalTasksCompleted),
            ).length
          }
          /{ACHIEVEMENTS.length} unlocked)
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto p-3 scrollbar-none">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = achievement.check(
            wins,
            speed,
            currentFrontendTaskId,
            totalTasksCompleted,
          );
          return (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl cursor-default select-none"
              style={{
                width: 80,
                border: `1px solid ${unlocked ? "oklch(0.82 0.18 85 / 0.4)" : "oklch(0.22 0.015 265)"}`,
                background: unlocked
                  ? "oklch(0.82 0.18 85 / 0.07)"
                  : "oklch(0.12 0.01 265)",
                filter: unlocked ? "none" : "grayscale(1) opacity(0.4)",
                boxShadow: unlocked
                  ? "0 0 12px oklch(0.82 0.18 85 / 0.2)"
                  : "none",
              }}
            >
              <span className="text-2xl">{achievement.icon}</span>
              <span
                className="text-[10px] font-mono font-bold text-center leading-tight"
                style={{
                  color: unlocked
                    ? "oklch(0.82 0.18 85)"
                    : "oklch(0.4 0.01 265)",
                }}
              >
                {achievement.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TaskSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton
            key={i}
            className="h-8 w-28 rounded-full flex-shrink-0 bg-muted"
          />
        ))}
      </div>
      <div className="rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-20 bg-muted" />
            <Skeleton className="h-6 w-40 bg-muted" />
            <Skeleton className="h-3 w-32 bg-muted" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-muted" />
          ))}
        </div>
        <Skeleton className="h-2 w-full rounded-full bg-muted" />
      </div>
      <div className="rounded-xl border border-border p-5 space-y-3">
        <Skeleton className="h-5 w-32 bg-muted" />
        <Skeleton className="h-6 w-48 bg-muted" />
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-2.5 w-full rounded-full bg-muted" />
        <Skeleton className="h-14 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TasksTab() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: taskData, isLoading: tasksLoading } = useTaskProgress();
  const { mutateAsync: completeTask, isPending } = useCompleteTask();
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  const todayDate = new Date().toISOString().split("T")[0];

  // On-chain data
  const { data: xpHistoryData } = useXpHistory();
  const { data: streakData } = useStreak();
  const { data: dailyProgressData } = useGetDailyProgress(todayDate);
  const addXpEventMutation = useAddXpEvent();
  const claimDailyMutation = useClaimDailyChallenge();

  const isLoggedIn = !!identity;
  const isLoading = profileLoading || tasksLoading;

  // Derived from on-chain data
  const streak = Number(streakData ?? 0n);
  const xpLog: LocalXpEvent[] = (xpHistoryData ?? []).map((event) => ({
    label: event.raceLabel,
    amount: Number(event.amount),
    timestamp: Number(event.timestamp / 1_000_000n),
    streakBonus: event.streakBonus,
  }));

  const handleChapterClick = useCallback((ch: number) => {
    const el = chapterRefs.current[ch];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleDailyClaim = useCallback(
    (taskTitle: string, bonusXp: number, idx: bigint) => {
      claimDailyMutation.mutate({ date: todayDate, idx });
      addXpEventMutation.mutate({
        raceLabel: `Daily: ${taskTitle}`,
        amount: BigInt(bonusXp),
        streakBonus: false,
      });
      toast.success(`+${bonusXp} XP from daily challenge!`, {
        description: taskTitle,
      });
    },
    [claimDailyMutation, addXpEventMutation, todayDate],
  );

  const handleComplete = useCallback(
    async (frontendTask: FrontendTask, streakCount: number) => {
      try {
        const updated = await completeTask();
        const earned = frontendTask.xpReward;
        const streakBonus = streakCount >= 3;
        toast.success(
          `+${earned} XP earned!${streakBonus ? " 🔥 Streak bonus!" : ""}`,
          {
            description: `Total XP: ${Number(updated.xp).toLocaleString()}`,
          },
        );
      } catch {
        toast.error("Couldn't complete task. Try again.");
      }
    },
    [completeTask],
  );

  // ── Not logged in
  if (!isLoggedIn) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border border-neon-cyan/20 bg-card p-4 card-glow">
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
                50 tasks · 10 chapters · weeks of grind
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-8 text-center space-y-4">
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
              50 tasks across 10 chapters. From Fresh on the Streets to King of
              the Streets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading
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

  // ── No profile
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
  const wins = Number(profile.wins ?? 0n);

  const backendCurrentTaskId = Number(taskData?.currentTaskId ?? 0n);
  const completionsOnCurrentTask = Number(
    taskData?.completionsOnCurrentTask ?? 0n,
  );

  // Map backend task id (0-11) → frontend task id (0-11 direct, 12-49 locked)
  const currentFrontendTaskId = Math.min(49, backendCurrentTaskId);
  const currentChapter = Math.floor(currentFrontendTaskId / 5);

  // Approximate total tasks completed from backend data
  const totalTasksCompleted =
    backendCurrentTaskId * 4 + completionsOnCurrentTask;

  const currentFrontendTask = FULL_TASKS[currentFrontendTaskId];

  // All tasks completed on backend side
  const allBackendTasksDone =
    taskData?.tasks && backendCurrentTaskId >= (taskData.tasks.length ?? 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg border border-neon-cyan/20 bg-card p-4 card-glow"
      >
        <div className="chassis-stripe h-[2px] w-full absolute top-0 left-0" />
        <div className="flex items-center justify-between gap-3">
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
                50 tasks · 10 chapters · weeks of grind
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 text-[11px] font-mono"
            style={{ color: "oklch(0.72 0.22 290)" }}
          >
            <span>{currentFrontendTaskId}/49 tasks</span>
          </div>
        </div>
      </motion.div>

      {/* Chapter Navigator */}
      <ChapterNavigator
        currentFrontendTaskId={currentFrontendTaskId}
        onChapterClick={handleChapterClick}
      />

      {/* Rank Badge Card */}
      <RankBadgeCard
        xp={xp}
        speed={speed}
        totalTasksCompleted={totalTasksCompleted}
        streak={streak}
        currentChapter={currentChapter}
      />

      {/* Daily Challenges */}
      <DailyChallengesPanel
        date={todayDate}
        claimedIndices={dailyProgressData ?? []}
        onClaim={handleDailyClaim}
      />

      {/* Active Task / All Done */}
      <AnimatePresence mode="wait">
        {allBackendTasksDone ? (
          <motion.div
            key="all-done"
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
        ) : currentFrontendTask ? (
          <ActiveTaskCard
            key={currentFrontendTaskId}
            frontendTask={currentFrontendTask}
            completionsOnCurrentTask={completionsOnCurrentTask}
            streak={streak}
            onComplete={() => handleComplete(currentFrontendTask, streak)}
            isPending={isPending}
          />
        ) : null}
      </AnimatePresence>

      {/* Achievements Wall */}
      <AchievementsWall
        wins={wins}
        speed={speed}
        currentFrontendTaskId={currentFrontendTaskId}
        totalTasksCompleted={totalTasksCompleted}
      />

      {/* Chapter Accordion */}
      <ChapterAccordion
        currentFrontendTaskId={currentFrontendTaskId}
        chapterRefs={chapterRefs}
      />

      {/* XP History Feed */}
      <XpHistoryFeed log={xpLog} />
    </div>
  );
}
