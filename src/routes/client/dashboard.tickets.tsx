import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/lib/use-client-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  ArrowLeft,
  Send,
  Paperclip,
  Download,
  X,
  MessageSquare,
} from "lucide-react";

type Ticket = {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  project_id: string | null;
  last_message_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "client" | "admin";
  message: string | null;
  file_url: string | null;
  file_name: string | null;
  is_read: boolean;
  created_at: string;
};

type TicketWithPreview = Ticket & {
  lastMessage: string | null;
  hasUnread: boolean;
};

const ticketSchema = z.object({
  subject: z.string().trim().min(1, "Subject required").max(150),
  priority: z.enum(["low", "medium", "high"]),
  message: z.string().trim().min(1, "Message required").max(5000),
  project_id: z.string().uuid().nullable(),
});

export const Route = createFileRoute("/client/dashboard/tickets")({
  head: () => ({
    meta: [
      { title: "Support — Client Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  component: TicketsPage,
});

function TicketsPage() {
  const { userId, ready } = useClientAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const selectedId = search.id;

  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketWithPreview[]>([]);
  const [openNew, setOpenNew] = useState(false);

  const loadTickets = async () => {
    if (!userId) return;
    const { data: rows, error } = await supabase
      .from("client_tickets")
      .select("*")
      .eq("client_id", userId)
      .order("last_message_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    const ticketRows = (rows ?? []) as Ticket[];
    // Fetch last messages
    const ids = ticketRows.map((t) => t.id);
    let msgMap = new Map<string, { text: string | null; hasUnread: boolean }>();
    if (ids.length > 0) {
      const { data: msgs } = await supabase
        .from("client_ticket_messages")
        .select("ticket_id, message, file_name, sender_type, is_read, created_at")
        .in("ticket_id", ids)
        .order("created_at", { ascending: false });
      for (const m of (msgs ?? []) as Message[]) {
        const existing = msgMap.get(m.ticket_id);
        if (!existing) {
          msgMap.set(m.ticket_id, {
            text: m.message ?? (m.file_name ? `📎 ${m.file_name}` : null),
            hasUnread: m.sender_type === "admin" && !m.is_read,
          });
        } else if (m.sender_type === "admin" && !m.is_read) {
          msgMap.set(m.ticket_id, { ...existing, hasUnread: true });
        }
      }
    }
    setTickets(
      ticketRows.map((t) => ({
        ...t,
        lastMessage: msgMap.get(t.id)?.text ?? null,
        hasUnread: msgMap.get(t.id)?.hasUnread ?? false,
      })),
    );
  };

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      setLoading(true);
      await loadTickets();
      setLoading(false);
    })();
    // Subscribe globally to refresh list on any new message touching client's tickets
    const channel = supabase
      .channel(`tickets-list-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_tickets", filter: `client_id=eq.${userId}` },
        () => void loadTickets(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "client_ticket_messages" },
        () => void loadTickets(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  if (!ready || loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showChat = !!selectedTicket;

  return (
    <>
      {/* DESKTOP split view */}
      <div className="lg:grid lg:grid-cols-[35%_1fr] lg:gap-4 lg:h-[calc(100vh-10rem)]">
        {/* List */}
        <div className={`${showChat ? "hidden lg:block" : ""} space-y-4`}>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-semibold">Support</h1>
            <Button
              onClick={() => setOpenNew(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> New Ticket
            </Button>
          </div>
          <div className="space-y-2 lg:overflow-y-auto lg:max-h-[calc(100%-3rem)] lg:pr-2">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No tickets yet. Click "New Ticket" to open one.
                </CardContent>
              </Card>
            ) : (
              tickets.map((t) => (
                <TicketRow
                  key={t.id}
                  ticket={t}
                  active={t.id === selectedId}
                  onClick={() =>
                    navigate({
                      to: "/client/dashboard/tickets",
                      search: { id: t.id },
                    })
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div className={`${showChat ? "" : "hidden lg:flex"} ${showChat ? "" : "lg:items-center lg:justify-center"} mt-4 lg:mt-0`}>
          {selectedTicket ? (
            <ChatView
              ticket={selectedTicket}
              userId={userId!}
              onBack={() =>
                navigate({ to: "/client/dashboard/tickets", search: {} })
              }
              onUpdate={() => void loadTickets()}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Select a ticket to view the conversation.</p>
          )}
        </div>
      </div>

      <NewTicketDialog
        open={openNew}
        onOpenChange={setOpenNew}
        userId={userId!}
        onCreated={async (ticketId) => {
          await loadTickets();
          navigate({ to: "/client/dashboard/tickets", search: { id: ticketId } });
        }}
      />
    </>
  );
}

/* ---------------- Ticket row ---------------- */

function TicketRow({
  ticket,
  active,
  onClick,
}: {
  ticket: TicketWithPreview;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${
        active
          ? "border-primary/60 bg-primary/5"
          : "border-border bg-card hover:bg-accent/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{ticket.ticket_number}</span>
            {ticket.hasUnread && (
              <span
                aria-label="Unread admin reply"
                className="h-2 w-2 rounded-full bg-emerald-500"
              />
            )}
          </div>
          <p className="mt-0.5 font-semibold truncate">{ticket.subject}</p>
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {timeAgo(ticket.last_message_at)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </div>
      {ticket.lastMessage && (
        <p className="mt-2 text-xs text-muted-foreground truncate">
          {ticket.lastMessage}
        </p>
      )}
    </button>
  );
}

/* ---------------- Chat view ---------------- */

function ChatView({
  ticket,
  userId,
  onBack,
  onUpdate,
}: {
  ticket: TicketWithPreview;
  userId: string;
  onBack: () => void;
  onUpdate: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior });
    });
  };

  // Load messages + mark admin messages read
  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("client_ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      if (!mounted) return;
      if (error) toast.error(error.message);
      const msgs = (data ?? []) as Message[];
      setMessages(msgs);
      setLoading(false);
      scrollToBottom("auto");

      // Mark unread admin messages as read
      const unreadIds = msgs
        .filter((m) => m.sender_type === "admin" && !m.is_read)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        void supabase
          .from("client_ticket_messages")
          .update({ is_read: true })
          .in("id", unreadIds)
          .then(() => onUpdate());
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  // Realtime subscription for this ticket
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_ticket_messages",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
          scrollToBottom();
          if (m.sender_type === "admin") {
            void supabase
              .from("client_ticket_messages")
              .update({ is_read: true })
              .eq("id", m.id)
              .then(() => onUpdate());
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed && !file) return;
    if (trimmed.length > 5000) {
      toast.error("Message too long");
      return;
    }
    setSending(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      if (file) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error("File too large (max 20MB)");
          setSending(false);
          return;
        }
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${userId}/${ticket.id}/${Date.now()}-${safe}`;
        const { data, error } = await supabase.storage
          .from("ticket-attachments")
          .upload(path, file);
        if (error) throw error;
        fileUrl = data.path;
        fileName = file.name;
      }
      const { error } = await supabase.from("client_ticket_messages").insert({
        ticket_id: ticket.id,
        sender_id: userId,
        sender_type: "client",
        message: trimmed || null,
        file_url: fileUrl,
        file_name: fileName,
      });
      if (error) throw error;
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  // Group messages by day
  const grouped = useMemo(() => groupByDay(messages), [messages]);

  return (
    <Card className="flex flex-col w-full lg:h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Back</span>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            {ticket.ticket_number}
          </div>
          <p className="font-semibold truncate text-sm sm:text-base">{ticket.subject}</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-2 bg-muted/30 min-h-[50vh] lg:min-h-0"
      >
        {loading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            No messages yet. Send the first one below.
          </p>
        ) : (
          grouped.map((group) => (
            <div key={group.day} className="space-y-2">
              <div className="flex justify-center my-3">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground bg-background border border-border/60 rounded-full px-3 py-0.5">
                  {group.label}
                </span>
              </div>
              {group.items.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/60 bg-card p-3">
        {file && (
          <div className="mb-2 flex items-center gap-2 text-xs bg-muted rounded-md px-2 py-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            <span className="truncate flex-1">{file.name}</span>
            <button
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Remove attachment"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="min-h-[40px] max-h-[120px] resize-none flex-1"
            disabled={sending}
          />
          <Button
            type="button"
            onClick={() => void sendMessage()}
            disabled={sending || (!text.trim() && !file)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- Message bubble ---------------- */

function MessageBubble({ message }: { message: Message }) {
  const isClient = message.sender_type === "client";
  return (
    <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
          isClient
            ? "bg-emerald-600 text-white rounded-br-sm"
            : "bg-card border border-border text-foreground rounded-bl-sm"
        }`}
      >
        {message.message && (
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
        )}
        {message.file_url && message.file_name && (
          <FileAttachment
            path={message.file_url}
            name={message.file_name}
            isClient={isClient}
          />
        )}
        <p
          className={`mt-1 text-[10px] ${
            isClient ? "text-white/70" : "text-muted-foreground"
          }`}
        >
          {new Date(message.created_at).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function FileAttachment({
  path,
  name,
  isClient,
}: {
  path: string;
  name: string;
  isClient: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const handle = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from("ticket-attachments")
        .createSignedUrl(path, 60);
      if (error || !data) throw error ?? new Error("Could not load file");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open file");
    } finally {
      setDownloading(false);
    }
  };
  return (
    <button
      onClick={handle}
      disabled={downloading}
      className={`mt-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
        isClient
          ? "bg-white/15 hover:bg-white/25 text-white"
          : "bg-muted hover:bg-muted/80 text-foreground"
      }`}
    >
      {downloading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      <span className="truncate max-w-[180px]">{name}</span>
    </button>
  );
}

/* ---------------- New ticket dialog ---------------- */

function NewTicketDialog({
  open,
  onOpenChange,
  userId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  onCreated: (id: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [projectId, setProjectId] = useState<string>("none");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const { data } = await supabase
        .from("client_projects")
        .select("id, name")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });
      setProjects(data ?? []);
    })();
  }, [open, userId]);

  const reset = () => {
    setSubject("");
    setMessage("");
    setPriority("medium");
    setProjectId("none");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    const parsed = ticketSchema.safeParse({
      subject,
      priority,
      message,
      project_id: projectId === "none" ? null : projectId,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      const { data: ticket, error: tErr } = await supabase
        .from("client_tickets")
        .insert({
          client_id: userId,
          subject: parsed.data.subject,
          priority: parsed.data.priority,
          message: parsed.data.message, // legacy column
          project_id: parsed.data.project_id,
          status: "open",
        })
        .select("id")
        .single();
      if (tErr || !ticket) throw tErr ?? new Error("Failed to create ticket");

      let fileUrl: string | null = null;
      let fileName: string | null = null;
      if (file) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error("File too large (max 20MB)");
        } else {
          const safe = file.name.replace(/[^\w.\-]+/g, "_");
          const path = `${userId}/${ticket.id}/${Date.now()}-${safe}`;
          const { data, error } = await supabase.storage
            .from("ticket-attachments")
            .upload(path, file);
          if (!error && data) {
            fileUrl = data.path;
            fileName = file.name;
          }
        }
      }

      const { error: mErr } = await supabase.from("client_ticket_messages").insert({
        ticket_id: ticket.id,
        sender_id: userId,
        sender_type: "client",
        message: parsed.data.message,
        file_url: fileUrl,
        file_name: fileName,
      });
      if (mErr) throw mErr;

      toast.success("Ticket created");
      reset();
      onOpenChange(false);
      onCreated(ticket.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Support Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              maxLength={150}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your request"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Related Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as typeof priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg">Message *</Label>
            <Textarea
              id="msg"
              maxLength={5000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue..."
              rows={5}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Attachment (optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-1" /> Attach file
              </Button>
              {file && (
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {file.name}
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Helpers ---------------- */

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    open: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
    in_progress: "bg-amber-500/15 text-amber-700 border-amber-500/40",
    "in progress": "bg-amber-500/15 text-amber-700 border-amber-500/40",
    resolved: "bg-blue-500/15 text-blue-700 border-blue-500/40",
    closed: "bg-muted text-muted-foreground border-border",
  };
  const label = s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <Badge className={`text-[10px] ${map[s] ?? "bg-muted text-muted-foreground"}`}>
      {label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  const map: Record<string, string> = {
    low: "bg-slate-500/15 text-slate-700 border-slate-500/40",
    medium: "bg-blue-500/15 text-blue-700 border-blue-500/40",
    normal: "bg-blue-500/15 text-blue-700 border-blue-500/40",
    high: "bg-orange-500/15 text-orange-700 border-orange-500/40",
    urgent: "bg-rose-500/15 text-rose-700 border-rose-500/40",
  };
  const label = p.charAt(0).toUpperCase() + p.slice(1);
  return (
    <Badge className={`text-[10px] ${map[p] ?? "bg-muted text-muted-foreground"}`}>
      {label}
    </Badge>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function groupByDay(messages: Message[]) {
  const groups: { day: string; label: string; items: Message[] }[] = [];
  for (const m of messages) {
    const d = new Date(m.created_at);
    const key = d.toDateString();
    let g = groups.find((x) => x.day === key);
    if (!g) {
      g = { day: key, label: dayLabel(d), items: [] };
      groups.push(g);
    }
    g.items.push(m);
  }
  return groups;
}

function dayLabel(d: Date) {
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
