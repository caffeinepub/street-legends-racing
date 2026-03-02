import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Principal } from "@icp-sdk/core/principal";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Flag,
  Info,
  List,
  Loader2,
  Search,
  Swords,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { RacerProfile } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAcceptChallenge,
  useCallerProfile,
  useCreateChallenge,
  useIncomingChallenges,
  useLeaderboard,
  useOutgoingChallenges,
} from "../hooks/useQueries";

// ── Prompts ──────────────────────────────────────────────────────────────────

function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 space-y-6"
    >
      <div className="space-y-2">
        <Flag
          className="h-12 w-12 mx-auto neon-cyan"
          style={{ filter: "drop-shadow(0 0 12px oklch(0.82 0.18 195 / 0.7))" }}
        />
        <h2 className="font-display text-2xl font-black neon-cyan neon-glow-cyan">
          Street Access Required
        </h2>
        <p className="text-muted-foreground text-sm font-body max-w-xs mx-auto">
          You need to authenticate before you can challenge other racers on the
          streets.
        </p>
      </div>
      <Button
        onClick={onLogin}
        className="bg-primary text-primary-foreground font-display font-bold tracking-wider hover:opacity-90 btn-neon"
      >
        <Zap className="mr-2 h-4 w-4" />
        Login to Race
      </Button>
    </motion.div>
  );
}

function ProfilePrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 space-y-4"
    >
      <AlertCircle
        className="h-10 w-10 mx-auto text-secondary"
        style={{ filter: "drop-shadow(0 0 10px oklch(0.62 0.26 330 / 0.6))" }}
      />
      <h2 className="font-display text-xl font-black text-foreground">
        Create Your Racer Profile First
      </h2>
      <p className="text-muted-foreground text-sm font-body max-w-xs mx-auto">
        You need a racer profile before you can challenge anyone. Check the
        Garage tab to get set up.
      </p>
    </motion.div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function RacerSkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      <Skeleton className="h-9 w-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28 bg-muted" />
        <Skeleton className="h-3 w-20 bg-muted" />
      </div>
      <Skeleton className="h-7 w-20 bg-muted rounded-md" />
    </div>
  );
}

const SKELETON_KEYS = ["rs1", "rs2", "rs3", "rs4", "rs5"];

// ── Browse Racers Panel ───────────────────────────────────────────────────────

function BrowseRacersPanel({
  myProfileName,
  onSelectRacer,
}: {
  myProfileName: string | undefined;
  onSelectRacer: (racer: RacerProfile) => void;
}) {
  const { data: lbData, isLoading } = useLeaderboard();
  const [search, setSearch] = useState("");

  const racers = lbData ?? [];
  const sorted = [...racers].sort((a, b) =>
    Number(b.reputation - a.reputation),
  );
  const filtered = search.trim()
    ? sorted.filter((r) =>
        r.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : sorted;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
        <Users
          className="h-4 w-4 neon-cyan"
          style={{ filter: "drop-shadow(0 0 6px oklch(0.82 0.18 195 / 0.6))" }}
        />
        <h3 className="font-display font-bold text-sm neon-cyan uppercase tracking-widest">
          Browse Racers
        </h3>
        <Badge
          variant="outline"
          className="ml-auto font-mono text-[10px] border-neon-cyan/30"
          style={{ color: "oklch(0.82 0.18 195)" }}
        >
          {racers.length} on street
        </Badge>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search racers by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-input border-border focus:border-neon-cyan/50 font-mono text-sm h-9"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="h-64">
        <div className="px-3 pb-3 space-y-1.5">
          {isLoading ? (
            SKELETON_KEYS.map((k) => <RacerSkeletonRow key={k} />)
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm font-display font-bold text-muted-foreground">
                {search.trim() ? "No racers found" : "No racers yet"}
              </p>
              {search.trim() && (
                <p className="text-xs font-mono text-muted-foreground/60 mt-0.5">
                  Try a different name
                </p>
              )}
            </div>
          ) : (
            filtered.map((racer, i) => {
              const isMe =
                myProfileName !== undefined && racer.name === myProfileName;
              const winRate =
                racer.wins + racer.losses > 0
                  ? Math.round(
                      (Number(racer.wins) / Number(racer.wins + racer.losses)) *
                        100,
                    )
                  : 0;
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
                  key={racer.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-150 ${
                    isMe
                      ? "border-neon-cyan/20 bg-primary/5"
                      : "border-border bg-card hover:bg-muted/30 hover:border-border/80"
                  }`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
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
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold text-sm truncate text-foreground">
                        {racer.name}
                      </span>
                      {isMe && (
                        <Badge
                          className="text-[9px] h-4 px-1 font-mono shrink-0"
                          style={{
                            background: "oklch(0.82 0.18 195 / 0.15)",
                            color: "oklch(0.82 0.18 195)",
                            border: "1px solid oklch(0.82 0.18 195 / 0.3)",
                          }}
                        >
                          YOU
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {racer.wins.toString()}W – {racer.losses.toString()}L
                        <span className="ml-1 opacity-60">({winRate}%)</span>
                      </span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "oklch(0.82 0.18 195)" }}
                      >
                        {racer.reputation.toString()} REP
                      </span>
                    </div>
                  </div>

                  {!isMe ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs font-display font-bold tracking-wide border-secondary/40 hover:border-secondary hover:bg-secondary/10 shrink-0"
                      style={{ color: "oklch(0.62 0.26 330)" }}
                      onClick={() => onSelectRacer(racer)}
                    >
                      <Swords className="h-3 w-3 mr-1" />
                      Challenge
                    </Button>
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground/40 shrink-0 pr-1">
                      That&apos;s you
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Race List (Incoming / Outgoing) ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function statusLabel(status: any): { label: string; color: string } {
  if (!status || typeof status !== "object")
    return { label: "Unknown", color: "text-muted-foreground" };
  if ("pending" in status)
    return { label: "Pending", color: "text-neon-amber" };
  if ("accepted" in status) return { label: "Accepted", color: "neon-lime" };
  if ("declined" in status)
    return { label: "Declined", color: "text-destructive" };
  if ("completed" in status) return { label: "Completed", color: "neon-cyan" };
  return { label: JSON.stringify(status), color: "text-muted-foreground" };
}

function RaceList() {
  const { data: incoming = [], isLoading: inLoading } = useIncomingChallenges();
  const { data: outgoing = [], isLoading: outLoading } =
    useOutgoingChallenges();
  const acceptChallenge = useAcceptChallenge();

  const handleAccept = async (id: bigint) => {
    try {
      await acceptChallenge.mutateAsync(id);
      toast.success("Challenge accepted! Time to race.");
    } catch {
      toast.error("Failed to accept challenge.");
    }
  };

  const isLoading = inLoading || outLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Incoming Challenges */}
      <div className="rounded-lg border border-secondary/30 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
          <Flag
            className="h-4 w-4 text-secondary"
            style={{
              filter: "drop-shadow(0 0 6px oklch(0.62 0.26 330 / 0.6))",
            }}
          />
          <h3
            className="font-display font-bold text-sm uppercase tracking-widest text-secondary"
            style={{ textShadow: "0 0 8px oklch(0.62 0.26 330 / 0.5)" }}
          >
            Incoming Challenges
          </h3>
          <Badge
            variant="outline"
            className="ml-auto font-mono text-[10px]"
            style={{
              borderColor: "oklch(0.62 0.26 330 / 0.4)",
              color: "oklch(0.62 0.26 330)",
            }}
          >
            {incoming.length}
          </Badge>
        </div>

        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="py-4 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : incoming.length === 0 ? (
            <div className="py-6 text-center">
              <Flag className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-sm font-display font-bold text-muted-foreground">
                No incoming challenges
              </p>
              <p className="text-[11px] font-mono text-muted-foreground/50 mt-0.5">
                Challengers will show here
              </p>
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            incoming.map((c: any) => {
              const { label, color } = statusLabel(c.status);
              const isPending = c.status && "pending" in c.status;
              return (
                <div
                  key={c.id?.toString()}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      From:{" "}
                      <span className="text-foreground/80">
                        {c.challenger?.toString?.().slice(0, 12)}…
                      </span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Challenge #{c.id?.toString()}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono shrink-0 ${color}`}
                  >
                    {label}
                  </Badge>
                  {isPending && (
                    <Button
                      size="sm"
                      onClick={() => handleAccept(BigInt(c.id))}
                      disabled={acceptChallenge.isPending}
                      className="h-7 px-2.5 text-xs font-display font-bold tracking-wide bg-secondary text-secondary-foreground hover:opacity-90 shrink-0"
                      style={{
                        boxShadow: "0 0 10px oklch(0.62 0.26 330 / 0.3)",
                      }}
                    >
                      {acceptChallenge.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      )}
                      Accept
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Outgoing Challenges */}
      <div className="rounded-lg border border-neon-cyan/20 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
          <Swords
            className="h-4 w-4 neon-cyan"
            style={{
              filter: "drop-shadow(0 0 6px oklch(0.82 0.18 195 / 0.6))",
            }}
          />
          <h3 className="font-display font-bold text-sm uppercase tracking-widest neon-cyan">
            Sent Challenges
          </h3>
          <Badge
            variant="outline"
            className="ml-auto font-mono text-[10px] border-neon-cyan/30"
            style={{ color: "oklch(0.82 0.18 195)" }}
          >
            {outgoing.length}
          </Badge>
        </div>

        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="py-4 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : outgoing.length === 0 ? (
            <div className="py-6 text-center">
              <Swords className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
              <p className="text-sm font-display font-bold text-muted-foreground">
                No sent challenges
              </p>
              <p className="text-[11px] font-mono text-muted-foreground/50 mt-0.5">
                Challenge someone from the Throw Down tab
              </p>
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            outgoing.map((c: any) => {
              const { label, color } = statusLabel(c.status);
              return (
                <div
                  key={c.id?.toString()}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      To:{" "}
                      <span className="text-foreground/80">
                        {c.challenged?.toString?.().slice(0, 12)}…
                      </span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Challenge #{c.id?.toString()}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono shrink-0 ${color}`}
                  >
                    {label}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Challenge Panel ───────────────────────────────────────────────────────────

function ChallengePanel({ profile }: { profile: RacerProfile }) {
  const { identity } = useInternetIdentity();
  const createChallenge = useCreateChallenge();
  const [challengedId, setChallengedId] = useState("");
  const [selectedRacer, setSelectedRacer] = useState<RacerProfile | null>(null);
  const challengeFormRef = useRef<HTMLDivElement>(null);

  const handleSelectRacer = (racer: RacerProfile) => {
    setSelectedRacer(racer);
    setTimeout(() => {
      challengeFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengedId.trim()) return;

    let principal: Principal;
    try {
      principal = Principal.fromText(challengedId.trim());
    } catch {
      toast.error("Invalid Principal ID. Check the address and try again.");
      return;
    }

    try {
      const challengeId = await createChallenge.mutateAsync(principal);
      toast.success(
        `Challenge #${challengeId} sent! Waiting for them to accept.`,
      );
      setChallengedId("");
      setSelectedRacer(null);
    } catch {
      toast.error(
        "Failed to send challenge. Make sure they have a racer profile.",
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg border border-neon-cyan/20 bg-card p-5 card-glow">
        <div className="chassis-stripe h-[2px] w-full absolute top-0 left-0" />
        <div className="flex items-center gap-3 mb-1">
          <Flag className="h-5 w-5 neon-cyan" />
          <h2 className="font-display text-xl font-black neon-cyan neon-glow-cyan">
            Throw Down
          </h2>
        </div>
        <p className="text-muted-foreground text-sm font-body">
          Find a racer, grab their ID, and send the challenge.
        </p>
      </div>

      {/* Browse Racers */}
      <BrowseRacersPanel
        myProfileName={profile.name}
        onSelectRacer={handleSelectRacer}
      />

      {/* Connector arrow */}
      <div className="flex items-center justify-center gap-2 py-1">
        <div className="h-px flex-1 bg-border" />
        <ChevronDown className="h-4 w-4 text-muted-foreground/40 shrink-0" />
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Send Challenge Form */}
      <div ref={challengeFormRef} className="space-y-4">
        {selectedRacer && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-lg border p-3"
            style={{
              borderColor: "oklch(0.62 0.26 330 / 0.3)",
              background: "oklch(0.62 0.26 330 / 0.06)",
            }}
          >
            <Swords
              className="h-4 w-4 mt-0.5 shrink-0"
              style={{ color: "oklch(0.62 0.26 330)" }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-display font-bold"
                style={{ color: "oklch(0.62 0.26 330)" }}
              >
                Challenging: {selectedRacer.name}
              </p>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5 leading-relaxed">
                Ask{" "}
                <span className="text-foreground/80">{selectedRacer.name}</span>{" "}
                for their Principal ID and enter it below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRacer(null)}
              className="text-muted-foreground/40 hover:text-muted-foreground text-[10px] font-mono mt-0.5 shrink-0"
              aria-label="Clear selection"
            >
              ✕
            </button>
          </motion.div>
        )}

        <form
          onSubmit={handleChallenge}
          className="bg-card rounded-lg border border-border p-4 space-y-4"
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="challenged-id"
              className="text-xs uppercase tracking-widest font-mono text-foreground/70"
            >
              {selectedRacer
                ? `${selectedRacer.name}'s Principal ID`
                : "Opponent's Principal ID"}
            </Label>
            <Input
              id="challenged-id"
              placeholder="e.g. rdmx6-jaaaa-aaaah-aadmq-cai"
              value={challengedId}
              onChange={(e) => setChallengedId(e.target.value)}
              className="bg-input border-border focus:border-neon-cyan/50 font-mono text-sm"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0" />
              {selectedRacer
                ? `Ask ${selectedRacer.name} to copy their ID from the Race tab`
                : "Ask your opponent to copy their ID from the Race tab"}
            </p>
          </div>

          <Button
            type="submit"
            disabled={!challengedId.trim() || createChallenge.isPending}
            className="w-full bg-secondary text-secondary-foreground font-display font-bold tracking-wider hover:opacity-90 btn-neon"
            style={{ boxShadow: "0 0 20px oklch(0.62 0.26 330 / 0.3)" }}
          >
            {createChallenge.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Flag className="mr-2 h-4 w-4" />
            )}
            {createChallenge.isPending
              ? "Sending..."
              : selectedRacer
                ? `Challenge ${selectedRacer.name}`
                : "Send Challenge"}
          </Button>
        </form>

        {/* My ID */}
        {identity && (
          <div className="bg-card rounded-lg border border-neon-cyan/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Copy
                className="h-4 w-4 neon-cyan"
                style={{
                  filter: "drop-shadow(0 0 5px oklch(0.82 0.18 195 / 0.6))",
                }}
              />
              <h3 className="font-display font-bold text-sm uppercase tracking-widest neon-cyan">
                Your Racer ID
              </h3>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
              Share your ID so other racers can challenge you.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono text-primary bg-primary/10 px-3 py-2 rounded-md border border-primary/20 truncate select-all">
                {identity.getPrincipal().toString()}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-3 font-mono text-xs border-neon-cyan/30 hover:border-neon-cyan/60 hover:bg-neon-cyan/5 shrink-0"
                style={{ color: "oklch(0.82 0.18 195)" }}
                onClick={() => {
                  navigator.clipboard.writeText(
                    identity.getPrincipal().toString(),
                  );
                  toast.success("Principal ID copied!");
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="outline"
              className="border-neon-lime/40 font-mono text-[10px]"
              style={{ color: "oklch(0.88 0.22 120)" }}
            >
              YOUR STATS
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p
                className="font-display font-black text-2xl neon-lime"
                style={{ textShadow: "0 0 10px oklch(0.88 0.22 120 / 0.7)" }}
              >
                {profile.wins.toString()}
              </p>
              <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
                Wins
              </p>
            </div>
            <div>
              <p className="font-display font-black text-2xl text-destructive">
                {profile.losses.toString()}
              </p>
              <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
                Losses
              </p>
            </div>
            <div>
              <p className="font-display font-black text-2xl neon-cyan neon-glow-cyan">
                {profile.reputation.toString()}
              </p>
              <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
                Rep
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main RaceTab ──────────────────────────────────────────────────────────────

type RaceSubTab = "challenge" | "racelist";

export function RaceTab() {
  const { identity, login } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const [subTab, setSubTab] = useState<RaceSubTab>("challenge");

  const isLoggedIn = !!identity;

  if (!isLoggedIn) {
    return <LoginPrompt onLogin={login} />;
  }

  if (profileLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin neon-cyan" />
      </div>
    );
  }

  if (!profile) {
    return <ProfilePrompt />;
  }

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex rounded-lg border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setSubTab("challenge")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-display font-bold uppercase tracking-wider transition-all ${
            subTab === "challenge"
              ? "bg-primary/10 text-primary border-r border-primary/20"
              : "text-muted-foreground hover:text-foreground/70 border-r border-border"
          }`}
        >
          <Swords className="h-3.5 w-3.5" />
          Throw Down
        </button>
        <button
          type="button"
          onClick={() => setSubTab("racelist")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-display font-bold uppercase tracking-wider transition-all ${
            subTab === "racelist"
              ? "bg-secondary/10 text-secondary"
              : "text-muted-foreground hover:text-foreground/70"
          }`}
        >
          <List className="h-3.5 w-3.5" />
          Race List
        </button>
      </div>

      {/* Sub-tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {subTab === "challenge" ? (
            <ChallengePanel profile={profile} />
          ) : (
            <RaceList />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
