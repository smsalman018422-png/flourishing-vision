import { lazy, Suspense } from "react";

const RichTextEditorImpl = lazy(() =>
  import("./RichTextEditor").then((m) => ({ default: m.RichTextEditor })),
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
        <div className="rounded-xl border border-border/60 bg-background/40 min-h-[300px] animate-pulse" />
      }
    >
      <RichTextEditorImpl {...props} />
    </Suspense>
  );
}
