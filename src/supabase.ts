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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cmyhfwogyzpmpyrxkahl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteWhmd29neXpwbXB5cnhrYWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTc0MDcsImV4cCI6MjA2OTAzMzQwN30.FdKq0u43jrHxUZZiUv6HJd8h-cd-TjnCRwGuhamReAc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);