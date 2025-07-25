import { createClient } from '@supabase/supabase-js';

export interface Database {
  public: {
    Tables: {
      leaderboard: {
        Row: {
          id: string;
          name: string;
          score: number;
          tile: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          score: number;
          tile: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          score?: number;
          tile?: number;
          created_at?: string;
        };
      };
    };
  };
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-public-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);