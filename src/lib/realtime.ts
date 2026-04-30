import { supabase } from "@/integrations/supabase/client";

export function subscribeToTable(table: string, onChange: () => void, channelName = `${table}-changes`) {
  const channel = (supabase as any)
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}