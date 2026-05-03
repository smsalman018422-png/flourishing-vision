import { lazy, Suspense, type ReactNode } from "react";

type Item = { id: string };

type Props<T extends Item> = {
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (item: T) => ReactNode;
};

const Impl = lazy(() =>
  import("./SortableList.impl").then((m) => ({
    default: m.SortableList as unknown as <T extends Item>(p: Props<T>) => JSX.Element,
  })),
) as unknown as <T extends Item>(p: Props<T>) => JSX.Element;

export function SortableList<T extends Item>(props: Props<T>) {
  return (
    <Suspense
      fallback={
        <ul className="divide-y divide-border/60">
          {props.items.map((item) => (
            <li key={item.id} className="py-2">{props.renderItem(item)}</li>
          ))}
        </ul>
      }
    >
      <Impl {...props} />
    </Suspense>
  );
}
