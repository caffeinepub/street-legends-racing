import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Car as CarIcon, Loader2, PlusCircle, Wrench, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Car } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useRegisterCar } from "../hooks/useQueries";

function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  const { isLoggingIn } = useInternetIdentity();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 space-y-6"
    >
      <CarIcon
        className="h-14 w-14 mx-auto neon-magenta"
        style={{ filter: "drop-shadow(0 0 14px oklch(0.62 0.26 330 / 0.7))" }}
      />
      <div className="space-y-2">
        <h2
          className="font-display text-2xl font-black text-secondary"
          style={{ textShadow: "0 0 10px oklch(0.62 0.26 330 / 0.8)" }}
        >
          Your Garage Awaits
        </h2>
        <p className="text-muted-foreground text-sm font-body max-w-xs mx-auto">
          Login to register your ride and show the streets what you&apos;re
          working with.
        </p>
      </div>
      <Button
        onClick={onLogin}
        className="bg-secondary text-secondary-foreground font-display font-bold tracking-wider hover:opacity-90 btn-neon"
        style={{ boxShadow: "0 0 20px oklch(0.62 0.26 330 / 0.3)" }}
        disabled={isLoggingIn}
      >
        {isLoggingIn ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        {isLoggingIn ? "Authenticating..." : "Open Garage"}
      </Button>
    </motion.div>
  );
}

function CarDisplay({ car }: { car: Car }) {
  const hp = Number(car.hp);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg border border-neon-magenta/30 bg-card p-5 card-glow"
      style={{ boxShadow: "0 0 30px oklch(0.62 0.26 330 / 0.1)" }}
    >
      <div className="chassis-stripe h-[2px] w-full absolute top-0 left-0" />
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3
            className="font-display text-2xl font-black text-secondary"
            style={{ textShadow: "0 0 10px oklch(0.62 0.26 330 / 0.6)" }}
          >
            {car.year.toString()} {car.make}
          </h3>
          <p className="font-display text-lg font-bold text-foreground/80">
            {car.model}
          </p>
        </div>
        {/* HP Badge */}
        {hp > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center rounded-lg border border-neon-lime/40 bg-neon-lime/5 px-3 py-2"
            style={{ boxShadow: "0 0 20px oklch(0.88 0.22 120 / 0.2)" }}
          >
            <span
              className="font-display font-black text-3xl leading-none neon-lime"
              style={{
                textShadow:
                  "0 0 14px oklch(0.88 0.22 120 / 0.9), 0 0 40px oklch(0.88 0.22 120 / 0.4)",
              }}
            >
              {hp}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
              HP
            </span>
          </motion.div>
        )}
      </div>

      {car.mods.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground">
            Mods
          </p>
          <div className="flex flex-wrap gap-2">
            {car.mods.map((mod) => (
              <Badge
                key={mod}
                variant="outline"
                className="text-xs border-neon-cyan/30 text-primary bg-primary/5 font-mono"
              >
                {mod}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface GarageFormProps {
  existing?: Car | null;
  onSuccess: () => void;
}

function GarageForm({ existing, onSuccess }: GarageFormProps) {
  const [make, setMake] = useState(existing?.make || "");
  const [model, setModel] = useState(existing?.model || "");
  const [year, setYear] = useState(existing ? existing.year.toString() : "");
  const [modsRaw, setModsRaw] = useState(existing?.mods.join(", ") || "");
  const [hpRaw, setHpRaw] = useState(
    existing?.hp && existing.hp > 0n ? existing.hp.toString() : "",
  );
  const registerCar = useRegisterCar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const yearNum = Number.parseInt(year, 10);
    if (Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2030) {
      toast.error("Enter a valid year between 1900 and 2030.");
      return;
    }
    const mods = modsRaw
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const hpNum = hpRaw.trim() ? Number.parseInt(hpRaw, 10) : 0;
    if (hpRaw.trim() && (Number.isNaN(hpNum) || hpNum < 0)) {
      toast.error("Enter a valid HP number.");
      return;
    }

    try {
      await registerCar.mutateAsync({
        make: make.trim(),
        model: model.trim(),
        year: BigInt(yearNum),
        mods,
        hp: BigInt(hpNum),
      });
      toast.success(
        existing
          ? "Garage updated! Your ride is looking fresh."
          : "Ride registered! Welcome to the garage.",
      );
      onSuccess();
    } catch {
      toast.error("Failed to register car. Try again.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-lg border border-border p-4 space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Wrench className="h-4 w-4 neon-cyan" />
        <h3 className="font-display font-bold text-sm uppercase tracking-widest text-foreground/70">
          {existing ? "Update Your Ride" : "Register Your Ride"}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="car-make"
            className="text-[11px] uppercase tracking-widest font-mono text-foreground/60"
          >
            Make
          </Label>
          <Input
            id="car-make"
            placeholder="Toyota"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="bg-input border-border focus:border-neon-cyan/50 font-body text-sm"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="car-model"
            className="text-[11px] uppercase tracking-widest font-mono text-foreground/60"
          >
            Model
          </Label>
          <Input
            id="car-model"
            placeholder="Supra"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-input border-border focus:border-neon-cyan/50 font-body text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="car-year"
            className="text-[11px] uppercase tracking-widest font-mono text-foreground/60"
          >
            Year
          </Label>
          <Input
            id="car-year"
            type="number"
            placeholder="1993"
            min={1900}
            max={2030}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-input border-border focus:border-neon-cyan/50 font-mono text-sm"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="car-hp"
            className="text-[11px] uppercase tracking-widest font-mono text-foreground/60"
          >
            HP{" "}
            <span className="normal-case tracking-normal text-muted-foreground font-body">
              (optional)
            </span>
          </Label>
          <Input
            id="car-hp"
            type="number"
            placeholder="340"
            min={0}
            max={5000}
            value={hpRaw}
            onChange={(e) => setHpRaw(e.target.value)}
            className="bg-input border-border focus:border-neon-lime/50 font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="car-mods"
          className="text-[11px] uppercase tracking-widest font-mono text-foreground/60"
        >
          Mods{" "}
          <span className="normal-case tracking-normal text-muted-foreground font-body">
            (comma-separated)
          </span>
        </Label>
        <Input
          id="car-mods"
          placeholder="Turbo, NOS, Coilovers, Wide Body..."
          value={modsRaw}
          onChange={(e) => setModsRaw(e.target.value)}
          className="bg-input border-border focus:border-neon-cyan/50 font-body text-sm"
        />
      </div>

      <Button
        type="submit"
        disabled={
          !make.trim() || !model.trim() || !year || registerCar.isPending
        }
        className="w-full bg-primary text-primary-foreground font-display font-bold tracking-wider hover:opacity-90 btn-neon"
      >
        {registerCar.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <PlusCircle className="mr-2 h-4 w-4" />
        )}
        {registerCar.isPending
          ? "Saving..."
          : existing
            ? "Update Ride"
            : "Park It"}
      </Button>
    </form>
  );
}

export function GarageTab() {
  const { identity, login } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { actor, isFetching } = useActor();
  const [showForm, setShowForm] = useState(false);

  const {
    data: car,
    isLoading: carLoading,
    refetch,
  } = useQuery<Car | null>({
    queryKey: ["myCar", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getCar(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });

  // Show form automatically if no car registered
  useEffect(() => {
    if (!carLoading && !car && identity) {
      setShowForm(true);
    }
  }, [car, carLoading, identity]);

  if (!identity) {
    return <LoginPrompt onLogin={login} />;
  }

  if (profileLoading || carLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin neon-cyan" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CarIcon className="h-5 w-5 text-secondary" />
          <h2
            className="font-display text-xl font-black text-secondary"
            style={{ textShadow: "0 0 10px oklch(0.62 0.26 330 / 0.6)" }}
          >
            My Garage
          </h2>
        </div>
        {car && !showForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Wrench className="mr-1 h-3 w-3" />
            Update
          </Button>
        )}
      </div>

      {/* Registered Car */}
      {car && <CarDisplay car={car} />}

      {/* Form */}
      {showForm && (
        <GarageForm
          existing={car}
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {/* Empty state - no car, no form (shouldn't happen but just in case) */}
      {!car && !showForm && (
        <div className="text-center py-8 space-y-3">
          <CarIcon className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            No ride registered yet
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="border-neon-cyan/30 text-primary hover:bg-primary/10"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Register Your Ride
          </Button>
        </div>
      )}

      {/* Profile hint if no profile */}
      {!profile && identity && (
        <div className="bg-muted/50 rounded-md border border-border p-3 text-xs text-muted-foreground font-body">
          💡 Create a racer profile in the Race tab to unlock challenges.
        </div>
      )}
    </motion.div>
  );
}
