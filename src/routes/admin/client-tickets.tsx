import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageTitle, Card } from "@/components/admin/ui";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send, ArrowLeft, MessageCircle } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type Ticket = {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  client_id: string;
  last_message_at: string;
  updated_at: string;
  client?: { full_name: string; email: string | null } | null;
};

type Message = {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "client" | "admin";
  message: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin/client-tickets")({
  head: () => ({ meta: [{ title: "Client Tickets — Admin" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  component: () => (
    <AdminShell>
      <TicketsPage />
    </AdminShell>
  ),
});

const FILTERS = ["all", "open", "in_progress", "resolved", "closed"] as const;
type Filter = (typeof FILTERS)[number];

function TicketsPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const selectedId = search.id;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await sb
      .from("client_tickets")
      .select("*, client:client_profiles(full_name,email)")
      .order("last_message_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
    const ch = sb
      .channel("admin-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_tickets" }, fetchTickets)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);

  const filtered = useMemo(
    () => filter === "all" ? tickets : tickets.filter((t) => t.status === filter),
    [tickets, filter],
  );

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  if (selected) {
    return (
      <ChatView
        ticket={selected}
        onBack={() => navigate({ to: "/admin/client-tickets" })}
        onChanged={fetchTickets}
      />
    );
  }

  return (
    <>
      <PageTitle title="Client Tickets" />

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize transition ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">No tickets in this view.</div>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border/60">
              <tr>
                <th className="text-left p-3">Ticket #</th>
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Subject</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Priority</th>
                <th className="text-left p-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate({ to: "/admin/client-tickets", search: { id: t.id } })}
                  className="border-b border-border/40 hover:bg-muted/20 cursor-pointer"
                >
                  <td className="p-3 font-mono text-xs">{t.ticket_number}</td>
                  <td className="p-3">{t.client?.full_name ?? "—"}</td>
                  <td className="p-3 font-medium">{t.subject}</td>
                  <td className="p-3"><StatusBadge status={t.status} /></td>
                  <td className="p-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(t.last_message_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    open: "bg-emerald-500/15 text-emerald-400",
    in_progress: "bg-yellow-500/15 text-yellow-400",
    resolved: "bg-blue-500/15 text-blue-400",
    closed: "bg-zinc-500/15 text-zinc-400",
  };
  return <Badge className={m[status] ?? m.closed}>{status.replace("_", " ")}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const m: Record<string, string> = {
    low: "bg-zinc-500/15 text-zinc-400",
    medium: "bg-blue-500/15 text-blue-400",
    normal: "bg-blue-500/15 text-blue-400",
    high: "bg-orange-500/15 text-orange-400",
    urgent: "bg-red-500/15 text-red-400",
  };
  return <Badge className={m[priority] ?? m.normal}>{priority}</Badge>;
}

function ChatView({ ticket, onBack, onChanged }: { ticket: Ticket; onBack: () => void; onChanged: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sb.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (data?.user) setAdminId(data.user.id);
    });
  }, []);

  const fetchMessages = async () => {
    const { data } = await sb
      .from("client_ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at");
    setMessages(data ?? []);
  };

  useEffect(() => {
    fetchMessages();
    const ch = sb
      .channel(`admin-ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "client_ticket_messages", filter: `ticket_id=eq.${ticket.id}` },
        (payload: { new: Message }) => setMessages((prev) => [...prev, payload.new]),
      )
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [ticket.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !adminId) return;
    setSending(true);
    try {
      const { error } = await sb.from("client_ticket_messages").insert({
        ticket_id: ticket.id,
        sender_id: adminId,
        sender_type: "admin",
        message: text.trim(),
      });
      if (error) throw error;
      setText("");
      await sb.from("client_notifications").insert({
        client_id: ticket.client_id,
        title: "New reply on your ticket",
        message: `Re: ${ticket.subject}`,
        type: "info",
        link: `/client/dashboard/tickets?id=${ticket.id}`,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const updateField = async (field: "status" | "priority", value: string) => {
    const { error } = await sb.from("client_tickets").update({ [field]: value }).eq("id", ticket.id);
    if (error) toast.error(error.message);
    else { toast.success(`${field} updated`); onChanged(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</span>
            <h2 className="font-semibold truncate">{ticket.subject}</h2>
          </div>
          <div className="text-xs text-muted-foreground">{ticket.client?.full_name} · {ticket.client?.email}</div>
        </div>
      </div>

      <Card className="mb-3 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Select value={ticket.status} onValueChange={(v) => updateField("status", v)}>
            <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Priority:</span>
          <Select value={ticket.priority} onValueChange={(v) => updateField("priority", v)}>
            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No messages yet.</div>
          ) : (
            messages.map((m) => {
              const isAdmin = m.sender_type === "admin";
              return (
                <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    isAdmin ? "bg-primary text-primary-foreground" : "bg-muted/40"
                  }`}>
                    {m.message && <div className="whitespace-pre-wrap break-words">{m.message}</div>}
                    {m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="text-xs underline">
                        📎 {m.file_name ?? "attachment"}
                      </a>
                    )}
                    <div className={`text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t border-border/60 p-3 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your reply…"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <Button onClick={send} disabled={sending || !text.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
