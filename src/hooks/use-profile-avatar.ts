import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Foto de perfil actual: prioriza la subida por el usuario (tabla profiles)
 * y cae al avatar de Google de los metadatos de auth.
 */
export function useProfileAvatar() {
  const { user } = useAuth();
  const googleAvatar =
    (user?.user_metadata?.["avatar_url"] as string | undefined) ??
    (user?.user_metadata?.["picture"] as string | undefined) ??
    null;

  const { data } = useQuery({
    queryKey: ["profile-avatar", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.avatar_url as string | null) ?? null;
    },
  });

  return { avatarUrl: data ?? googleAvatar, googleAvatar, userId: user?.id ?? null };
}
