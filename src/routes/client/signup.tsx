import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/client/signup")({
  beforeLoad: () => {
    throw redirect({ to: "/client/login", search: { tab: "signup" } });
  },
  component: () => null,
});
