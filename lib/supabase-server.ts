import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      // Simple get/set/remove adapter compatible with Next.js async cookies
      async get(name: string) {
        return cookieStore.get(name)?.value ?? null;
      },
      async set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      async remove(name: string, options: any) {
        // options are ignored by Next.js cookies().delete, but we accept them for compatibility
        cookieStore.delete(name);
      }
    }
  } as any);
}

