import { createSupabaseServerClient } from '@/lib/supabase/client';

/** Updates users.last_active_at (non-blocking for callers if you void it). */
export async function touchUserLastActive(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase
    .from('users')
    .update({ last_active_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', userId);
}
