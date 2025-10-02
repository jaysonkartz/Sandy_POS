import { supabase } from './supabase';
import { Database } from '@/types/supabase';

type SignInRecord = Database['public']['Tables']['sign_in_records']['Insert'];

export interface SignInData {
  userId: string;
  email: string;
  success: boolean;
  failureReason?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: Record<string, any>;
  locationInfo?: Record<string, any>;
}

export class SignInLogger {
  /**
   * Log a sign-in attempt to the database
   */
  static async logSignIn(data: SignInData): Promise<void> {
    try {
      const record: SignInRecord = {
        user_id: data.userId,
        email: data.email,
        success: data.success,
        failure_reason: data.failureReason || null,
        session_id: data.sessionId || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        device_info: data.deviceInfo || null,
        location_info: data.locationInfo || null,
        sign_in_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('sign_in_records')
        .insert([record]);

      if (error) {
        console.error('Failed to log sign-in record:', error);
        // Don't throw error to avoid breaking the login flow
      }
    } catch (error) {
      console.error('Error logging sign-in:', error);
      // Don't throw error to avoid breaking the login flow
    }
  }

  /**
   * Get client IP address (for server-side usage)
   */
  static getClientIP(request: Request): string | undefined {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    
    return undefined;
  }

  /**
   * Get device information from user agent
   */
  static getDeviceInfo(userAgent?: string): Record<string, any> {
    if (!userAgent) return {};

    const deviceInfo: Record<string, any> = {};

    // Detect browser
    if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
    else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
    else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';

    // Detect OS
    if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
    else if (userAgent.includes('Mac')) deviceInfo.os = 'macOS';
    else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
    else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
    else if (userAgent.includes('iOS')) deviceInfo.os = 'iOS';

    // Detect device type
    if (userAgent.includes('Mobile')) deviceInfo.deviceType = 'Mobile';
    else if (userAgent.includes('Tablet')) deviceInfo.deviceType = 'Tablet';
    else deviceInfo.deviceType = 'Desktop';

    return deviceInfo;
  }

  /**
   * Get user's sign-in history
   */
  static async getUserSignInHistory(
    userId: string, 
    limit: number = 10
  ): Promise<Database['public']['Tables']['sign_in_records']['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('sign_in_records')
        .select('*')
        .eq('user_id', userId)
        .order('sign_in_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sign-in history:', error);
      return [];
    }
  }

  /**
   * Get recent sign-ins for admin dashboard
   */
  static async getRecentSignIns(limit: number = 50): Promise<Database['public']['Tables']['sign_in_records']['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('sign_in_records')
        .select('*')
        .order('sign_in_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent sign-ins:', error);
      return [];
    }
  }

  /**
   * Get sign-in statistics
   */
  static async getSignInStats(
    startDate?: string, 
    endDate?: string
  ): Promise<{
    totalSignIns: number;
    successfulSignIns: number;
    failedSignIns: number;
    uniqueUsers: number;
  }> {
    try {
      let query = supabase
        .from('sign_in_records')
        .select('*');

      if (startDate) {
        query = query.gte('sign_in_at', startDate);
      }
      if (endDate) {
        query = query.lte('sign_in_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const records = data || [];
      const successfulSignIns = records.filter(r => r.success).length;
      const failedSignIns = records.filter(r => !r.success).length;
      const uniqueUsers = new Set(records.map(r => r.user_id)).size;

      return {
        totalSignIns: records.length,
        successfulSignIns,
        failedSignIns,
        uniqueUsers,
      };
    } catch (error) {
      console.error('Error fetching sign-in stats:', error);
      return {
        totalSignIns: 0,
        successfulSignIns: 0,
        failedSignIns: 0,
        uniqueUsers: 0,
      };
    }
  }
}
