/**
 * プロフィール「完了」判定（オンボーディング必須項目が揃っているか）。
 * メール認証・LINEログインのみではサイトに表示されず、
 * この条件を満たしたユーザーのみおすすめ一覧・検索に表示する。
 */

export type ProfileRowForCompletion = {
  avatar_url?: string | null;
  nickname?: string | null;
  username?: string | null;
  bio?: string | null;
  prefecture?: string | null;
  exercises?: string[] | null;
};

/**
 * 必須: プロフィール画像・ニックネーム・自己紹介・都道府県・種目1以上
 */
export function isProfileCompleted(row: ProfileRowForCompletion | null | undefined): boolean {
  if (!row) return false;
  const nickname = (row.nickname ?? row.username ?? "").toString().trim();
  const bio = (row.bio ?? "").toString().trim();
  const prefecture = (row.prefecture ?? "").toString().trim();
  const exercises = Array.isArray(row.exercises) ? row.exercises.filter(Boolean) : [];
  return (
    !!row.avatar_url &&
    nickname.length > 0 &&
    bio.length > 0 &&
    prefecture.length > 0 &&
    exercises.length > 0
  );
}
