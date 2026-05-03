import { lazy, Suspense } from "react";

const Impl = lazy(() =>
  import("./RichTextEditor.impl").then((m) => ({ default: m.RichTextEditor })),
);

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function RichTextEditor(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-border/60 bg-background/40 min-h-[320px] animate-pulse" />
      }
    >
      <Impl {...props} />
    </Suspense>
  );
}
