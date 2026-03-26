export type Database = {
  public: {
    Tables: {
      sign_in_records: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          success: boolean;
          failure_reason: string | null;
          session_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          device_info: Record<string, unknown> | null;
          location_info: Record<string, unknown> | null;
          sign_in_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          success: boolean;
          failure_reason?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          device_info?: Record<string, unknown> | null;
          location_info?: Record<string, unknown> | null;
          sign_in_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          success?: boolean;
          failure_reason?: string | null;
          session_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          device_info?: Record<string, unknown> | null;
          location_info?: Record<string, unknown> | null;
          sign_in_at?: string;
        };
      };
    };
  };
};
