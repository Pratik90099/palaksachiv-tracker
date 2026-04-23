import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useNotifications() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Subscribe to realtime inserts.
  // CONVENTION: Realtime subscriptions MUST use empty deps + removeChannel cleanup
  // to prevent "cannot add postgres_changes callbacks after subscribe()" errors.
  // Never include qc or other reactive deps here.
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = (query.data || []).filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllAsRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return { ...query, unreadCount, markAsRead, markAllAsRead };
}
