import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
  {
    auth: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        return fn();
      },
    },
  }
);

export function getPhotoUrl(playerId: number): string | null {
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/media/player-${playerId}-photo`;
}
