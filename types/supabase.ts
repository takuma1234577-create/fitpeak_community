/**
 * FITPEAK - Supabase データベース型定義
 * schema.sql のテーブル構造に基づく手動定義
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          bio: string | null;
          avatar_url: string | null;
          header_url: string | null;
          area: string | null;
          gym: string | null;
          training_years: number | null;
          big3_total: number | null;
          bench_press_max: number | null;
          squat_max: number | null;
          deadlift_max: number | null;
          goal: string | null;
          instagram_id: string | null;
          youtube_url: string | null;
          twitter_url: string | null;
          tiktok_url: string | null;
          facebook_url: string | null;
          nickname: string | null;
          gender: string | null;
          birthday: string | null;
          prefecture: string | null;
          home_gym: string | null;
          exercises: string[] | null;
          is_age_public: boolean;
          is_prefecture_public: boolean;
          is_home_gym_public: boolean;
          email_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          header_url?: string | null;
          area?: string | null;
          gym?: string | null;
          training_years?: number | null;
          big3_total?: number | null;
          bench_press_max?: number | null;
          squat_max?: number | null;
          deadlift_max?: number | null;
          goal?: string | null;
          instagram_id?: string | null;
          youtube_url?: string | null;
          twitter_url?: string | null;
          tiktok_url?: string | null;
          facebook_url?: string | null;
          nickname?: string | null;
          gender?: string | null;
          birthday?: string | null;
          prefecture?: string | null;
          home_gym?: string | null;
          exercises?: string[] | null;
          is_age_public?: boolean;
          is_prefecture_public?: boolean;
          is_home_gym_public?: boolean;
          email_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          header_url?: string | null;
          area?: string | null;
          gym?: string | null;
          training_years?: number | null;
          big3_total?: number | null;
          bench_press_max?: number | null;
          squat_max?: number | null;
          deadlift_max?: number | null;
          goal?: string | null;
          instagram_id?: string | null;
          youtube_url?: string | null;
          twitter_url?: string | null;
          tiktok_url?: string | null;
          facebook_url?: string | null;
          nickname?: string | null;
          gender?: string | null;
          birthday?: string | null;
          prefecture?: string | null;
          home_gym?: string | null;
          exercises?: string[] | null;
          is_age_public?: boolean;
          is_prefecture_public?: boolean;
          is_home_gym_public?: boolean;
          email_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      recruitments: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_body_part: string | null;
          event_date: string;
          deadline_at: string | null;
          location: string | null;
          status: "open" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          target_body_part?: string | null;
          event_date: string;
          deadline_at?: string | null;
          location?: string | null;
          status?: "open" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          target_body_part?: string | null;
          event_date?: string;
          deadline_at?: string | null;
          location?: string | null;
          status?: "open" | "closed";
          created_at?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          created_by: string;
          is_private: boolean;
          chat_room_id: string | null;
          header_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          created_by: string;
          is_private?: boolean;
          chat_room_id?: string | null;
          header_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          created_by?: string;
          is_private?: boolean;
          chat_room_id?: string | null;
          header_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          group_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
          joined_at: string;
          last_read_at: string | null;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          joined_at?: string;
          last_read_at?: string | null;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
          last_read_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          is_read: boolean;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          is_read?: boolean;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          is_read?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// テーブルごとの Row / Insert / Update をエクスポート
export type ProfilesRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfilesInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type RecruitmentsRow = Database["public"]["Tables"]["recruitments"]["Row"];
export type RecruitmentsInsert =
  Database["public"]["Tables"]["recruitments"]["Insert"];
export type RecruitmentsUpdate =
  Database["public"]["Tables"]["recruitments"]["Update"];

export type GroupsRow = Database["public"]["Tables"]["groups"]["Row"];
export type GroupsInsert = Database["public"]["Tables"]["groups"]["Insert"];
export type GroupsUpdate = Database["public"]["Tables"]["groups"]["Update"];

export type GroupMembersRow =
  Database["public"]["Tables"]["group_members"]["Row"];
export type GroupMembersInsert =
  Database["public"]["Tables"]["group_members"]["Insert"];
export type GroupMembersUpdate =
  Database["public"]["Tables"]["group_members"]["Update"];

export type ConversationsRow =
  Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationsInsert =
  Database["public"]["Tables"]["conversations"]["Insert"];
export type ConversationsUpdate =
  Database["public"]["Tables"]["conversations"]["Update"];

export type ConversationParticipantsRow =
  Database["public"]["Tables"]["conversation_participants"]["Row"];
export type ConversationParticipantsInsert =
  Database["public"]["Tables"]["conversation_participants"]["Insert"];
export type ConversationParticipantsUpdate =
  Database["public"]["Tables"]["conversation_participants"]["Update"];

export type MessagesRow = Database["public"]["Tables"]["messages"]["Row"];
export type MessagesInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessagesUpdate = Database["public"]["Tables"]["messages"]["Update"];
