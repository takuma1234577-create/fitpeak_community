/** 一覧・カード表示用の募集（正規化済み） */
export interface RecruitmentPost {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  tags: string[];
  description?: string;
  user_id?: string;
  user: {
    name: string;
    title: string;
    avatar?: string;
    initial?: string;
  };
  spots: number;
  spotsLeft: number;
  event_date?: string;
}

/** 参加ステータス */
export type ParticipantStatus = "pending" | "approved" | "rejected" | "withdrawn";

/** 並び替えキー */
export type SortKey = "newest" | "date_nearest" | "date_furthest";

/** 管理画面用：DB 1行 */
export interface RecruitmentRow {
  id: string;
  title: string;
  description: string | null;
  target_body_part: string | null;
  event_date: string;
  location: string | null;
  status: string;
  created_at: string;
  chat_room_id: string | null;
}

/** 承認待ち参加者 */
export interface PendingParticipant {
  user_id: string;
  recruitment_id: string;
  status: string;
  profiles: { nickname: string | null; username: string | null; avatar_url: string | null } | null;
}
