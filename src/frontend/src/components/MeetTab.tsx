import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../backend";
import type { ChatMessage as BackendChatMessage, ChatRoom } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useGetRoomMembers } from "../hooks/useQueries";

// ── Taco Bell Banner ─────────────────────────────────────────────────────────

function TacoBellMeetBanner() {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-neon-magenta/40 mb-5"
      style={{ boxShadow: "0 0 40px oklch(0.62 0.26 330 / 0.25)" }}
    >
      {imgFailed ? (
        <div
          className="w-full h-40 flex items-center justify-center"
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
      ) : (
        <img
          src="/assets/generated/taco-bell-meet.dim_800x400.jpg"
          alt="Taco Bell Meet Spot"
          className="w-full h-40 object-cover object-center"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent pointer-events-none" />
      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
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
              TACO BELL PARKING LOT
            </span>
          </div>
          <p className="font-body text-xs text-muted-foreground ml-7">
            The ultimate meet spot — pick a room and talk live
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
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Room {
  id: string;
  name: string;
  maxMembers: number;
  isCustom?: boolean;
  createdBy?: string;
}

const MAX_ROOM_MEMBERS = 20;

// Convert bigint nanoseconds timestamp to milliseconds
function nanoToMs(nano: bigint): number {
  return Number(nano / 1_000_000n);
}

function formatTime(tsMs: number): string {
  return new Date(tsMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function backendRoomToRoom(r: ChatRoom): Room {
  return {
    id: r.id,
    name: r.name,
    maxMembers: MAX_ROOM_MEMBERS,
    isCustom: r.isCustom,
    createdBy: r.createdBy,
  };
}

// ── Room List ────────────────────────────────────────────────────────────────

function RoomList({
  rooms,
  isLoading,
  onJoin,
  onCreateRoom,
  onDeleteRoom,
  canCreate,
  myId,
}: {
  rooms: Room[];
  isLoading: boolean;
  onJoin: (room: Room) => void;
  onCreateRoom: (name: string) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  canCreate: boolean;
  myId: string;
}) {
  const [newRoomName, setNewRoomName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async () => {
    const name = newRoomName.trim();
    if (!name) return;
    if (!canCreate) {
      toast.error("Login to create a room");
      return;
    }
    setIsCreating(true);
    try {
      await onCreateRoom(name);
      setNewRoomName("");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    setDeletingId(roomId);
    try {
      await onDeleteRoom(roomId);
      toast.success("Room deleted");
    } catch {
      toast.error("Failed to delete room");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Taco Bell Meet Spot Banner */}
      <TacoBellMeetBanner />

      {/* Room list header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 neon-cyan" />
          <h3 className="font-display font-bold text-sm uppercase tracking-widest text-foreground/70">
            Active Rooms {isLoading ? "" : `(${rooms.length})`}
          </h3>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-display font-bold tracking-wide border-neon-cyan/30 hover:border-neon-cyan/60 hover:bg-neon-cyan/5"
              style={{ color: "oklch(0.82 0.18 195)" }}
            >
              <Plus className="mr-1.5 h-3 w-3" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display font-black neon-cyan">
                Create a Room
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label className="text-[11px] uppercase tracking-widest font-mono text-foreground/60">
                Room Name
              </Label>
              <Input
                placeholder="e.g. Boost Gang HQ"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="bg-input border-border focus:border-neon-cyan/50 font-body"
                autoFocus
                maxLength={40}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!newRoomName.trim() || isCreating}
                className="bg-primary text-primary-foreground font-display font-bold tracking-wider hover:opacity-90 btn-neon"
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Room
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Loading rooms...
          </span>
        </div>
      ) : (
        /* Rooms grid */
        <div className="space-y-2">
          {rooms.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-neon-cyan/30 hover:bg-muted/20 transition-all duration-200"
            >
              <div
                className="h-9 w-9 rounded-md flex items-center justify-center shrink-0"
                style={{
                  background: room.isCustom
                    ? "oklch(0.62 0.26 330 / 0.1)"
                    : "oklch(0.82 0.18 195 / 0.08)",
                  border: room.isCustom
                    ? "1px solid oklch(0.62 0.26 330 / 0.3)"
                    : "1px solid oklch(0.82 0.18 195 / 0.2)",
                }}
              >
                <MessageSquare
                  className="h-4 w-4"
                  style={{
                    color: room.isCustom
                      ? "oklch(0.62 0.26 330)"
                      : "oklch(0.82 0.18 195)",
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-sm text-foreground truncate">
                    {room.name}
                  </span>
                  {room.isCustom && (
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono shrink-0"
                      style={{
                        borderColor: "oklch(0.62 0.26 330 / 0.4)",
                        color: "oklch(0.62 0.26 330)",
                      }}
                    >
                      CUSTOM
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] font-mono text-muted-foreground">
                  Max {room.maxMembers} members
                </p>
              </div>
              {room.isCustom && room.createdBy && room.createdBy === myId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deletingId === room.id}
                      aria-label={`Delete room ${room.name}`}
                      className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      {deletingId === room.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-popover border-border max-w-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display font-black text-foreground">
                        Delete room?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="font-body text-muted-foreground">
                        Delete{" "}
                        <span className="font-bold text-foreground">
                          {room.name}
                        </span>
                        ? This will remove the room and all its messages
                        permanently.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-display font-bold">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(room.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display font-bold"
                      >
                        Delete Room
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                size="sm"
                onClick={() => onJoin(room)}
                className="h-7 px-3 text-xs font-display font-bold tracking-wide bg-primary text-primary-foreground hover:opacity-90 shrink-0"
                style={{ boxShadow: "0 0 10px oklch(0.82 0.18 195 / 0.2)" }}
              >
                Join
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Room Member Count Badge ───────────────────────────────────────────────────

function RoomMemberBadge({ roomId }: { roomId: string }) {
  const { data: count } = useGetRoomMembers(roomId);
  const memberCount = count !== undefined ? Number(count) : null;

  if (memberCount === null) return null;

  return (
    <Badge
      variant="outline"
      className="font-mono text-[10px] shrink-0"
      style={{
        borderColor: "oklch(0.88 0.22 120 / 0.4)",
        color: "oklch(0.88 0.22 120)",
      }}
    >
      <Users className="h-2.5 w-2.5 mr-1" />
      {memberCount}/{MAX_ROOM_MEMBERS}
    </Badge>
  );
}

// ── Chat Room ────────────────────────────────────────────────────────────────

function ChatRoomView({
  room,
  actor,
  myId,
  isLoggedIn,
  onLeave,
}: {
  room: Room;
  actor: backendInterface;
  myId: string;
  isLoggedIn: boolean;
  onLeave: () => void;
}) {
  const [messages, setMessages] = useState<BackendChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasJoinedRef = useRef(false);

  // Fetch messages from backend
  const fetchMessages = useCallback(async () => {
    try {
      const fetched = await actor.getChatMessages(room.id);
      // Sort by timestamp ascending
      const sorted = [...fetched].sort((a, b) => {
        if (a.timestamp < b.timestamp) return -1;
        if (a.timestamp > b.timestamp) return 1;
        return Number(a.id - b.id);
      });
      setMessages(sorted);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      // Silently ignore poll failures
    } finally {
      setIsLoadingMessages(false);
    }
  }, [actor, room.id]);

  // Join room when entering, leave when exiting
  useEffect(() => {
    if (!isLoggedIn) return;

    const joinRoom = async () => {
      if (hasJoinedRef.current) return;
      try {
        await actor.joinRoom(room.id);
        hasJoinedRef.current = true;
      } catch (err) {
        // Gracefully handle - room might be full or error, don't crash
        console.warn("joinRoom error (non-fatal):", err);
      }
    };

    joinRoom();

    return () => {
      // Leave room on cleanup - must not throw or affect profile data
      if (hasJoinedRef.current) {
        actor.leaveRoom(room.id).catch((err) => {
          console.warn("leaveRoom error (non-fatal):", err);
        });
        hasJoinedRef.current = false;
      }
    };
  }, [actor, room.id, isLoggedIn]);

  // Initial fetch + polling every 2s
  useEffect(() => {
    setIsLoadingMessages(true);
    setMessages([]);
    fetchMessages();

    pollingRef.current = setInterval(fetchMessages, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchMessages]);

  // Auto-scroll to bottom when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollRef is a stable DOM ref; messages drives re-render
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    if (!isLoggedIn) {
      toast.error("Login to chat");
      return;
    }

    if (!actor) {
      toast.error("Not connected. Please wait.");
      return;
    }

    setIsSending(true);
    setInput("");
    try {
      await actor.sendChatMessage(room.id, text);
      // Immediately re-fetch so the message appears right away
      await fetchMessages();
    } catch (err) {
      console.error("sendChatMessage error:", err);
      toast.error("Failed to send message. Try again.");
      setInput(text); // restore on failure
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLeave = () => {
    // Leave is handled by the cleanup effect above; just navigate back
    onLeave();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-[calc(100dvh-14rem)] min-h-[400px] rounded-lg border border-secondary/30 bg-card overflow-hidden"
      style={{ boxShadow: "0 0 30px oklch(0.62 0.26 330 / 0.1)" }}
    >
      {/* Room header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20 shrink-0">
        <button
          type="button"
          onClick={handleLeave}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Leave room"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-sm text-foreground truncate">
            {room.name}
          </h3>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: "oklch(0.88 0.22 120)",
                boxShadow: "0 0 4px oklch(0.88 0.22 120)",
              }}
            />
            <span className="text-[10px] font-mono text-muted-foreground">
              Live · on-chain
            </span>
          </div>
        </div>
        <RoomMemberBadge roomId={room.id} />
        <Badge
          variant="outline"
          className="font-mono text-[10px] border-neon-cyan/30 shrink-0"
          style={{ color: "oklch(0.82 0.18 195)" }}
        >
          {messages.length} msgs
        </Badge>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {isLoadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Loading messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 space-y-3">
            <MessageSquare className="h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm font-display font-bold text-muted-foreground">
              No messages yet
            </p>
            <p className="text-xs font-mono text-muted-foreground/50">
              Be the first to say something
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === myId;
            const tsMs = nanoToMs(msg.timestamp);
            return (
              <div
                key={String(msg.id)}
                className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5">
                  {!isMe && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {msg.senderName || msg.senderId.slice(0, 8)}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    {formatTime(tsMs)}
                  </span>
                  {isMe && (
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: "oklch(0.82 0.18 195)" }}
                    >
                      You
                    </span>
                  )}
                </div>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg text-sm font-body leading-relaxed ${
                    isMe
                      ? "rounded-tr-none text-primary-foreground"
                      : "rounded-tl-none text-foreground/90 border border-border"
                  }`}
                  style={
                    isMe
                      ? {
                          background: "oklch(0.82 0.18 195)",
                          color: "oklch(0.08 0.01 265)",
                        }
                      : {
                          background: "oklch(0.16 0.014 265)",
                        }
                  }
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/10 shrink-0">
        {isLoggedIn ? (
          <>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Say something..."
              className="bg-input border-border focus:border-neon-cyan/50 font-body text-sm flex-1"
              maxLength={500}
              disabled={isSending}
            />
            <Button
              type="button"
              size="sm"
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              className="h-9 w-9 p-0 bg-primary text-primary-foreground hover:opacity-90 shrink-0"
              style={{ boxShadow: "0 0 10px oklch(0.82 0.18 195 / 0.2)" }}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </>
        ) : (
          <p className="text-xs font-mono text-muted-foreground text-center w-full py-1">
            Login to chat in this room
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Tab ─────────────────────────────────────────────────────────────────

export function MeetTab() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { actor, isFetching: isActorFetching } = useActor();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const roomPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLoggedIn = !!identity;
  const myId = identity?.getPrincipal().toString() ?? "";
  // profile is used for racer name display in other components; here we just need it loaded
  void profile;

  // Fetch rooms from backend
  const fetchRooms = useCallback(async () => {
    if (!actor) return;
    try {
      const fetched = await actor.getChatRooms();
      setRooms(fetched.map(backendRoomToRoom));
    } catch (err) {
      console.warn("fetchRooms error (non-fatal):", err);
      // Silently ignore poll failures
    } finally {
      setIsLoadingRooms(false);
    }
  }, [actor]);

  useEffect(() => {
    if (!actor || isActorFetching) return;
    setIsLoadingRooms(true);
    fetchRooms();
    roomPollingRef.current = setInterval(fetchRooms, 5000);
    return () => {
      if (roomPollingRef.current) clearInterval(roomPollingRef.current);
    };
  }, [actor, isActorFetching, fetchRooms]);

  const handleCreateRoom = useCallback(
    async (name: string) => {
      if (!actor) throw new Error("Not connected");
      try {
        await actor.createChatRoom(name);
      } catch (err) {
        console.error("createChatRoom error:", err);
        throw err;
      }
      // Re-fetch immediately so new room appears
      await fetchRooms();
    },
    [actor, fetchRooms],
  );

  const handleDeleteRoom = useCallback(
    async (roomId: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.deleteChatRoom(roomId);
      await fetchRooms();
    },
    [actor, fetchRooms],
  );

  // Actor not ready yet — show minimal loading
  if (!actor) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          Connecting...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <AnimatePresence mode="wait">
        {activeRoom ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChatRoomView
              room={activeRoom}
              actor={actor}
              myId={myId}
              isLoggedIn={isLoggedIn}
              onLeave={() => setActiveRoom(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RoomList
              rooms={rooms}
              isLoading={isLoadingRooms}
              onJoin={(room) => setActiveRoom(room)}
              onCreateRoom={handleCreateRoom}
              onDeleteRoom={handleDeleteRoom}
              canCreate={isLoggedIn}
              myId={myId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
