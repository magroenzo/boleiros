import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function uploadMedia(userId: string, file: File) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function useSignedUrl(path?: string | null) {
  return useQuery({
    queryKey: ["signed-url", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("media")
        .createSignedUrl(path as string, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}