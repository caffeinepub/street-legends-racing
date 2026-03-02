import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Upload, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { RacerProfile } from "../backend.d";
import { useSaveProfile } from "../hooks/useQueries";
import { useUploadAvatar } from "../hooks/useUploadAvatar";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile?: RacerProfile;
}

export function ProfileModal({ open, onClose, profile }: ProfileModalProps) {
  const isEditing = !!profile;
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [previewSrc, setPreviewSrc] = useState<string | null>(
    profile?.avatarUrl ?? null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = useSaveProfile();
  const { uploadAvatar, uploadProgress, isUploading } = useUploadAvatar();

  // Sync pre-fill when profile prop changes (e.g. modal opens with existing data)
  useEffect(() => {
    if (open) {
      setName(profile?.name ?? "");
      setBio(profile?.bio ?? "");
      setPreviewSrc(profile?.avatarUrl ?? null);
      setSelectedFile(null);
    }
  }, [open, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20 MB.");
      return;
    }
    setSelectedFile(file);
    // Immediate local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewSrc(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      let avatarUrl: string | null = profile?.avatarUrl ?? null;

      if (selectedFile) {
        avatarUrl = await uploadAvatar(selectedFile);
      }

      await saveProfile.mutateAsync({
        name: name.trim(),
        bio: bio.trim(),
        avatarUrl,
        existingProfile: profile,
      });

      toast.success(
        isEditing
          ? "Profile updated. Stay legendary."
          : "Racer profile created! Welcome to the streets.",
      );
      onClose();
    } catch {
      toast.error("Failed to save profile. Try again.");
    }
  };

  const isBusy = isUploading || saveProfile.isPending;
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border border-neon-cyan/20 max-w-md">
        <div className="chassis-stripe h-[2px] w-full -mt-6 mb-4 rounded-t-lg" />
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black neon-cyan neon-glow-cyan">
            {isEditing ? "Edit Profile" : "Create Your Legend"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing
              ? "Update your racer identity. Changes are saved on-chain."
              : "Set your racer name and rep to enter the streets."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="h-20 w-20 ring-2 ring-neon-cyan/30 ring-offset-2 ring-offset-card transition-all group-hover:ring-neon-cyan/60">
                {previewSrc && (
                  <AvatarImage
                    src={previewSrc}
                    alt="Avatar preview"
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary font-display font-black text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Overlay camera button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:cursor-not-allowed"
                aria-label="Upload profile photo"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-3.5 w-3.5" />
              {previewSrc ? "Change photo" : "Upload photo"}
            </button>
            <p className="text-[10px] font-mono text-muted-foreground/60">
              Supports large photos up to 20 MB
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Uploading photo…
                </span>
                <span className="text-[11px] font-mono neon-cyan">
                  {uploadProgress}%
                </span>
              </div>
              <Progress
                value={uploadProgress}
                className="h-1 bg-muted [&>div]:bg-primary"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="racer-name"
              className="text-foreground/80 text-xs uppercase tracking-widest font-mono"
            >
              Racer Name
            </Label>
            <Input
              id="racer-name"
              placeholder="e.g. NightShift, Ghost, Specter..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border-border focus:border-neon-cyan/50 font-mono"
              required
              maxLength={32}
              disabled={isBusy}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="racer-bio"
              className="text-foreground/80 text-xs uppercase tracking-widest font-mono"
            >
              Bio{" "}
              <span className="text-muted-foreground normal-case tracking-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="racer-bio"
              placeholder="Who are you on the streets?"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-input border-border focus:border-neon-cyan/50 font-body resize-none"
              rows={3}
              maxLength={200}
              disabled={isBusy}
            />
          </div>

          <Button
            type="submit"
            disabled={!name.trim() || isBusy}
            className="w-full bg-primary text-primary-foreground font-display font-bold tracking-wider hover:opacity-90 transition-all"
          >
            {isBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {isUploading
              ? `Uploading… ${uploadProgress}%`
              : saveProfile.isPending
                ? isEditing
                  ? "Saving…"
                  : "Joining…"
                : isEditing
                  ? "Save Changes"
                  : "Hit the Streets"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
