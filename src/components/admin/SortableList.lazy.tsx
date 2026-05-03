import { lazy, Suspense, type ReactNode } from "react";

type Item = { id: string };

type Props<T extends Item> = {
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (item: T) => ReactNode;
};

const SortableListImpl = lazy(() =>
  import("./SortableList").then((m) => ({ default: m.SortableList as unknown as React.ComponentType<Props<Item>> })),
);

export function SortableList<T extends Item>(props: Props<T>) {
  return (
    <Suspense
      fallback={
        <ul className="divide-y divide-border/60">
          {props.items.map((item) => (
            <li key={item.id} className="py-2">
              {props.renderItem(item)}
            </li>
          ))}
        </ul>
      }
    >
      {/* @ts-expect-error generic narrowing through lazy */}
      <SortableListImpl {...props} />
    </Suspense>
  );
}
