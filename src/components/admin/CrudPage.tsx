import { useEffect, useState } from "react";
import { adminData, adminWrite } from "@/lib/admin-data";
import { subscribeToTable } from "@/lib/realtime";
import { Button, Card, Field, PageTitle, Select, TextArea, TextInput } from "./ui";
import { Edit2, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "url" | "email" | "boolean" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

type Row = Record<string, unknown> & { id: string };

export function CrudPage({
  table,
  title,
  fields,
  orderBy = "created_at",
  ascending = false,
  primaryColumn,
}: {
  table: string;
  title: string;
  fields: FieldDef[];
  orderBy?: string;
  ascending?: boolean;
  primaryColumn: string;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const open = editing || creating;

  const load = () => {
    setLoading(true);
    adminData<Row>({ table, select: "*", orders: [{ column: orderBy, ascending }], limit: 200 })
      .then(({ data, error }) => {
        if (error) toast.error(error);
        setRows((data ?? []) as Row[]);
        setLoading(false);
      });
  };
  useEffect(() => {
    load();
    return subscribeToTable(table, load, `admin-crud-${table}-changes`);
  }, [table, orderBy, ascending]);

  const remove = async (id: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    const { error } = await adminWrite({ table, op: "delete", match: [{ column: "id", value: id }] });
    if (error) return toast.error(error);
    toast.success("Deleted");
    load();
  };

  const save = async (data: Record<string, unknown>): Promise<void> => {
    if (editing) {
      const { error } = await adminWrite({ table, op: "update", values: data, match: [{ column: "id", value: editing.id }] });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Saved");
    } else {
      const { error } = await adminWrite({ table, op: "insert", values: data });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Created");
    }
    setEditing(null);
    setCreating(false);
    load();
  };

  return (
    <>
      <PageTitle
        title={title}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-8 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No items yet. Click "New" to add one.</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/30 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{String(r[primaryColumn] ?? "(untitled)")}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {fields
                      .slice(0, 2)
                      .filter((f) => f.name !== primaryColumn)
                      .map((f) => `${f.label}: ${String(r[f.name] ?? "—")}`)
                      .join(" · ")}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" onClick={() => setEditing(r)} aria-label="Edit">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="danger" onClick={() => remove(r.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {open && (
        <FormModal
          title={editing ? `Edit ${title.toLowerCase().replace(/s$/, "")}` : `New ${title.toLowerCase().replace(/s$/, "")}`}
          fields={fields}
          initial={editing ?? {}}
          onCancel={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={save}
        />
      )}
    </>
  );
}

function FormModal({
  title,
  fields,
  initial,
  onCancel,
  onSave,
}: {
  title: string;
  fields: FieldDef[];
  initial: Record<string, unknown>;
  onCancel: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const v: Record<string, unknown> = {};
    fields.forEach((f) => (v[f.name] = initial[f.name] ?? (f.type === "boolean" ? false : "")));
    return v;
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const cleaned: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = values[f.name];
      if (f.type === "number") cleaned[f.name] = raw === "" || raw == null ? null : Number(raw);
      else if (f.type === "boolean") cleaned[f.name] = !!raw;
      else cleaned[f.name] = raw === "" ? null : raw;
    }
    try {
      await onSave(cleaned);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur p-4 overflow-y-auto">
      <div className="glass-strong rounded-2xl w-full max-w-xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h2 className="font-display font-semibold">{title}</h2>
          <button onClick={onCancel} className="grid place-items-center h-9 w-9 rounded-lg hover:bg-muted/40">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {fields.map((f) => (
            <Field key={f.name} label={f.label}>
              {f.type === "textarea" ? (
                <TextArea
                  required={f.required}
                  placeholder={f.placeholder}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                />
              ) : f.type === "boolean" ? (
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!values[f.name]}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  Enabled
                </label>
              ) : f.type === "select" ? (
                <Select
                  required={f.required}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                >
                  <option value="">Select…</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              ) : (
                <TextInput
                  type={f.type === "number" ? "number" : f.type === "url" ? "url" : f.type === "email" ? "email" : "text"}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                />
              )}
            </Field>
          ))}
        </form>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border/60">
          <Button variant="ghost" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
