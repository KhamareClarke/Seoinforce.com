import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

export interface ErrorLogData {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  endpoint?: string;
  requestData?: any;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
}

export async function logError(data: ErrorLogData) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    
    // Try to get current user if not provided
    let userId = data.userId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    const { error } = await supabase
      .from('error_logs')
      .insert({
        user_id: userId || null,
        error_type: data.errorType,
        error_message: data.errorMessage,
        error_stack: data.errorStack || null,
        endpoint: data.endpoint || null,
        request_data: data.requestData || null,
        severity: data.severity || 'error',
      });

    if (error) {
      console.error('Failed to log error to database:', error);
    }
  } catch (error) {
    // Silently fail - don't let error logging break the app
    console.error('Error logging failed:', error);
  }
}