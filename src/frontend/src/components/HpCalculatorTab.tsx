import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Gauge, Loader2, Plus, Save, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Car } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegisterCar } from "../hooks/useQueries";

// ── Mod definitions ─────────────────────────────────────────────────────────

interface Mod {
  id: string;
  name: string;
  hp: number;
  note?: string;
}

const ENGINE_MODS: Mod[] = [
  { id: "cold-air-intake", name: "Cold Air Intake", hp: 15 },
  { id: "short-ram-intake", name: "Short Ram Intake", hp: 8 },
  { id: "exhaust-headers", name: "Exhaust Headers", hp: 20 },
  { id: "catback-exhaust", name: "Cat-Back Exhaust", hp: 15 },
  { id: "turbocharger", name: "Turbocharger", hp: 120 },
  { id: "supercharger", name: "Supercharger", hp: 100 },
  { id: "nitrous-50", name: "Nitrous Oxide (50-shot)", hp: 50 },
  { id: "nitrous-100", name: "Nitrous Oxide (100-shot)", hp: 100 },
  { id: "ported-heads", name: "Ported/Polished Heads", hp: 25 },
  { id: "cam-upgrade", name: "Cam Upgrade", hp: 30 },
  { id: "bigger-injectors", name: "Bigger Injectors", hp: 20 },
  { id: "fuel-pump", name: "Fuel Pump Upgrade", hp: 10 },
  { id: "ecu-tune", name: "ECU Tune / Remap", hp: 35 },
  { id: "intercooler", name: "Intercooler Upgrade", hp: 20 },
  { id: "throttle-body", name: "Throttle Body Upgrade", hp: 12 },
  { id: "hi-comp-pistons", name: "High Compression Pistons", hp: 18 },
  { id: "forged-internals", name: "Forged Internals", hp: 10 },
];

const WEIGHT_MODS: Mod[] = [
  { id: "carbon-hood", name: "Carbon Hood", hp: 5, note: "weight equiv." },
  {
    id: "stripped-interior",
    name: "Stripped Interior",
    hp: 10,
    note: "weight equiv.",
  },
  {
    id: "carbon-panels",
    name: "Carbon Fiber Body Panels",
    hp: 8,
    note: "weight equiv.",
  },
];

const DRIVETRAIN_MODS: Mod[] = [
  {
    id: "lsd",
    name: "Limited Slip Differential",
    hp: 0,
    note: "better power transfer",
  },
  {
    id: "short-throw",
    name: "Short Throw Shifter",
    hp: 0,
    note: "faster shifts",
  },
];

const BASE_HP = 150;

// ── HP Category Section ──────────────────────────────────────────────────────

function ModCategory({
  title,
  mods,
  selected,
  onToggle,
  color,
}: {
  title: string;
  mods: Mod[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  color: "cyan" | "magenta" | "lime";
}) {
  const borderColor =
    color === "cyan"
      ? "border-primary/30"
      : color === "magenta"
        ? "border-secondary/30"
        : "border-accent/30";
  const headerColor =
    color === "cyan"
      ? "neon-cyan"
      : color === "magenta"
        ? "neon-magenta"
        : "neon-lime";

  return (
    <div className={`rounded-lg border ${borderColor} bg-card overflow-hidden`}>
      <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
        <h3
          className={`font-display font-bold text-sm uppercase tracking-widest ${headerColor}`}
        >
          {title}
        </h3>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {mods.map((mod) => {
          const isChecked = selected.has(mod.id);
          return (
            <label
              key={mod.id}
              htmlFor={mod.id}
              className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer ${
                isChecked
                  ? "bg-primary/5 border border-primary/20"
                  : "hover:bg-muted/30 border border-transparent"
              }`}
            >
              <Checkbox
                id={mod.id}
                checked={isChecked}
                onCheckedChange={() => onToggle(mod.id)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="flex-1 flex items-center justify-between">
                <span className="font-body text-sm text-foreground/90">
                  {mod.name}
                </span>
                <span className="flex items-center gap-2">
                  {mod.note && (
                    <span className="text-[10px] font-mono text-muted-foreground italic">
                      {mod.note}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono shrink-0 ${
                      mod.hp > 0
                        ? "border-neon-lime/40 text-accent"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {mod.hp > 0 ? `+${mod.hp} hp` : "utility"}
                  </Badge>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function HpCalculatorTab() {
  const { identity, login } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const registerCar = useRegisterCar();

  const [selectedMods, setSelectedMods] = useState<Set<string>>(new Set());
  const [customMods, setCustomMods] = useState<
    Array<{ name: string; hp: number }>
  >([]);
  const [customName, setCustomName] = useState("");
  const [customHp, setCustomHp] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load existing car to prefill save
  const { data: existingCar } = useQuery<Car | null>({
    queryKey: ["myCar", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getCar(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });

  const toggleMod = (id: string) => {
    setSelectedMods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allMods = [...ENGINE_MODS, ...WEIGHT_MODS, ...DRIVETRAIN_MODS];
  const hpFromSelected = allMods
    .filter((m) => selectedMods.has(m.id))
    .reduce((sum, m) => sum + m.hp, 0);
  const hpFromCustom = customMods.reduce((sum, m) => sum + m.hp, 0);
  const totalHp = BASE_HP + hpFromSelected + hpFromCustom;

  const selectedModNames = [
    ...allMods.filter((m) => selectedMods.has(m.id)).map((m) => m.name),
    ...customMods.map((m) => `${m.name} (+${m.hp}hp)`),
  ];

  const handleAddCustomMod = () => {
    const name = customName.trim();
    const hp = Number.parseInt(customHp, 10);
    if (!name) {
      toast.error("Enter a mod name.");
      return;
    }
    if (Number.isNaN(hp)) {
      toast.error("Enter a valid HP value.");
      return;
    }
    setCustomMods((prev) => [...prev, { name, hp }]);
    setCustomName("");
    setCustomHp("");
    toast.success(`Added: ${name}`);
  };

  const handleSaveToGarage = async () => {
    if (!identity) {
      toast.error("Login to save to your garage.");
      return;
    }
    if (!existingCar) {
      toast.error("Register your car in the Garage tab first.");
      return;
    }
    setIsSaving(true);
    try {
      await registerCar.mutateAsync({
        make: existingCar.make,
        model: existingCar.model,
        year: existingCar.year,
        mods: selectedModNames,
        hp: BigInt(totalHp),
      });
      toast.success(`Mods & ${totalHp} HP saved to your garage!`);
    } catch {
      toast.error("Failed to save. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-lg border border-neon-lime/20 bg-card p-5 card-glow"
        style={{ boxShadow: "0 0 30px oklch(0.88 0.22 120 / 0.08)" }}
      >
        <div
          className="h-[2px] w-full absolute top-0 left-0"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.88 0.22 120 / 0.8) 0%, oklch(0.82 0.18 195 / 0.8) 100%)",
          }}
        />
        <div className="flex items-center gap-3 mb-1">
          <Gauge
            className="h-6 w-6 neon-lime"
            style={{
              filter: "drop-shadow(0 0 8px oklch(0.88 0.22 120 / 0.7))",
            }}
          />
          <h2 className="font-display text-xl font-black neon-lime neon-glow-lime">
            HP Calculator
          </h2>
        </div>
        <p className="text-muted-foreground text-sm font-body">
          Select your mods to estimate street power. Base: {BASE_HP} hp stock.
        </p>
      </div>

      {/* HP Meter */}
      <motion.div
        key={totalHp}
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="rounded-lg border border-neon-lime/30 bg-card p-6 text-center relative overflow-hidden"
        style={{ boxShadow: "0 0 40px oklch(0.88 0.22 120 / 0.12)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 120%, oklch(0.88 0.22 120 / 0.08), transparent)",
          }}
        />
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
          Estimated Power
        </p>
        <div className="flex items-end justify-center gap-2">
          <span
            className="font-display font-black text-7xl neon-lime"
            style={{
              textShadow:
                "0 0 20px oklch(0.88 0.22 120 / 0.8), 0 0 60px oklch(0.88 0.22 120 / 0.3)",
            }}
          >
            {totalHp}
          </span>
          <span className="font-display font-black text-2xl text-muted-foreground mb-2">
            HP
          </span>
        </div>
        {hpFromSelected + hpFromCustom > 0 && (
          <p className="text-xs font-mono text-muted-foreground mt-1">
            +{hpFromSelected + hpFromCustom} hp from{" "}
            {selectedMods.size + customMods.length} mod
            {selectedMods.size + customMods.length !== 1 ? "s" : ""}
          </p>
        )}
        {existingCar && existingCar.hp > 0n && (
          <p
            className="text-xs font-mono mt-2"
            style={{ color: "oklch(0.88 0.22 120 / 0.7)" }}
          >
            Current saved HP: {existingCar.hp.toString()}
          </p>
        )}
      </motion.div>

      {/* Engine Mods */}
      <ModCategory
        title="Engine Mods"
        mods={ENGINE_MODS}
        selected={selectedMods}
        onToggle={toggleMod}
        color="cyan"
      />

      {/* Weight Reduction */}
      <ModCategory
        title="Weight Reduction"
        mods={WEIGHT_MODS}
        selected={selectedMods}
        onToggle={toggleMod}
        color="lime"
      />

      {/* Drivetrain */}
      <ModCategory
        title="Suspension / Drivetrain"
        mods={DRIVETRAIN_MODS}
        selected={selectedMods}
        onToggle={toggleMod}
        color="magenta"
      />

      {/* Custom Mod Input */}
      <div className="rounded-lg border border-neon-amber/20 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
          <h3
            className="font-display font-bold text-sm uppercase tracking-widest neon-amber"
            style={{ color: "oklch(0.78 0.2 55)" }}
          >
            Custom Mod
          </h3>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-widest font-mono text-foreground/60">
                Mod Name
              </Label>
              <Input
                placeholder="e.g. Built Motor"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-input border-border focus:border-neon-amber/50 font-body text-sm"
                style={
                  {
                    "--tw-ring-color": "oklch(0.78 0.2 55 / 0.5)",
                  } as React.CSSProperties
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-widest font-mono text-foreground/60">
                HP Gain
              </Label>
              <Input
                type="number"
                placeholder="+45"
                value={customHp}
                onChange={(e) => setCustomHp(e.target.value)}
                className="bg-input border-border focus:border-neon-amber/50 font-mono text-sm"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCustomMod}
            disabled={!customName.trim() || !customHp}
            className="w-full font-display font-bold text-xs tracking-wider border-neon-amber/30 hover:border-neon-amber/60"
            style={{ color: "oklch(0.78 0.2 55)" }}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add Mod
          </Button>

          {/* Custom mods list */}
          {customMods.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <Separator className="bg-border/50" />
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider pt-1">
                Added
              </p>
              {customMods.map((m, i) => (
                <div
                  key={`${m.name}-${i}`}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/30 border border-border/50"
                >
                  <span className="text-xs font-body text-foreground/80">
                    {m.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-neon-lime/30 text-accent"
                    >
                      +{m.hp} hp
                    </Badge>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomMods((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      className="text-muted-foreground/40 hover:text-destructive text-xs leading-none"
                      aria-label="Remove mod"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active mods summary */}
      {selectedModNames.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Active Build ({selectedModNames.length} mods)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedModNames.map((name) => (
              <Badge
                key={name}
                variant="outline"
                className="text-xs border-neon-cyan/30 text-primary bg-primary/5 font-mono"
              >
                {name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Save to Garage */}
      <div className="pb-4">
        {identity ? (
          <Button
            type="button"
            onClick={handleSaveToGarage}
            disabled={selectedModNames.length === 0 || isSaving}
            className="w-full bg-primary text-primary-foreground font-display font-bold tracking-wider hover:opacity-90 btn-neon"
            style={{ boxShadow: "0 0 20px oklch(0.82 0.18 195 / 0.3)" }}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Save to Garage"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={login}
            className="w-full bg-primary text-primary-foreground font-display font-bold tracking-wider hover:opacity-90 btn-neon"
          >
            <Zap className="mr-2 h-4 w-4" />
            Login to Save Mods
          </Button>
        )}
        {identity && !existingCar && (
          <p className="text-center text-[11px] font-mono text-muted-foreground mt-2">
            Register your car in the Garage tab to enable saving.
          </p>
        )}
      </div>
    </motion.div>
  );
}
