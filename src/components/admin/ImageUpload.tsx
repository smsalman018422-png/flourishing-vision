import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket: string;
  folder?: string;
  label?: string;
  aspectClass?: string; // e.g. "aspect-square", "aspect-video"
};

export function ImageUpload({
  value,
  onChange,
  bucket,
  folder = "",
  label = "Image",
  aspectClass = "aspect-video",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadViaAdmin = async (file: File) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Your session expired. Please sign in again.");

    const form = new FormData();
    form.append("file", file);
    form.append("bucket", bucket);
    form.append("folder", folder);
    const res = await fetch("/api/admin-upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || body?.error || !body?.url) throw new Error(body?.error ?? "Upload failed");
    return body.url;
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Max image size is 8 MB");
      return;
    }
    setUploading(true);
    try {
      const publicUrl = await uploadViaAdmin(file);
      onChange(publicUrl);
      setUploading(false);
      toast.success(`${label} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className={`relative ${aspectClass} w-full overflow-hidden rounded-xl border border-border/60 bg-muted/20`}>
          <img src={value} alt={label} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2">
            <Button type="button" variant="ghost" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Replace
            </Button>
            <Button type="button" variant="danger" onClick={() => onChange(null)} aria-label="Remove">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${aspectClass} w-full rounded-xl border-2 border-dashed border-border/60 bg-muted/10 hover:bg-muted/20 transition flex flex-col items-center justify-center gap-2 text-muted-foreground`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs">Click to upload {label.toLowerCase()}</span>
              <span className="text-[10px] opacity-70">PNG, JPG, WEBP · max 8 MB</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

type MultiProps = {
  values: string[];
  onChange: (urls: string[]) => void;
  bucket: string;
  folder?: string;
};

export function MultiImageUpload({ values, onChange, bucket, folder = "" }: MultiProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadViaAdmin = async (file: File) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Your session expired. Please sign in again.");

    const form = new FormData();
    form.append("file", file);
    form.append("bucket", bucket);
    form.append("folder", folder);
    const res = await fetch("/api/admin-upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
    if (!res.ok || body?.error || !body?.url) throw new Error(body?.error ?? "Upload failed");
    return body.url;
  };

  const upload = async (files: FileList) => {
    setUploading(true);
    const next: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} is over 8 MB`);
        continue;
      }
      try {
        next.push(await uploadViaAdmin(file));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Couldn't upload ${file.name}`);
        continue;
      }
    }
    onChange([...values, ...next]);
    setUploading(false);
    if (next.length) toast.success(`${next.length} image${next.length > 1 ? "s" : ""} added`);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) upload(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {values.map((url, i) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-border/60 group">
            <img src={url} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(values.filter((u) => u !== url))}
              className="absolute top-1 right-1 grid place-items-center h-7 w-7 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-lg border-2 border-dashed border-border/60 hover:bg-muted/20 transition grid place-items-center text-muted-foreground"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
