"use client";

import Image from "next/image";
import { ChevronLeft, Users, Loader2, MessageCircle, MapPin, Dumbbell, Calendar, Target } from "lucide-react";
import { toGenderLabel } from "@/lib/constants";

export interface OtherProfileTopProps {
  /** ヘッダー画像URL。未設定時はグラデーション */
  headerUrl?: string | null;
  /** アバター画像URL */
  avatarUrl?: string | null;
  /** 表示名 */
  name: string;
  /** 戻る/閉じるボタン押下（モーダルでは閉じる、ページでは戻る） */
  onBack?: () => void;
  /** 自己紹介（bio） */
  bio?: string | null;
  /** 目標（例: 筋肉肥大） */
  goal?: string | null;
  /** 年齢表示（例: "25歳" / "非公開"） */
  ageDisplay?: string | null;
  /** 性別表示 */
  gender?: string | null;
  /** よく行くジム */
  gym?: string | null;
  /** トレーニング歴（年数） */
  trainingYears?: number;
  /** 住まい（都道府県など） */
  area?: string | null;
  /** フォロワー数 */
  followersCount?: number;
  /** フォロー中数 */
  followingCount?: number;
  /** 合トレ実績数 */
  collabCount?: number;
  /** フォロー中か */
  isFollowing?: boolean;
  /** フォローボタン押下 */
  onFollow?: () => void;
  /** フォロー処理中 */
  followLoading?: boolean;
  /** 自分自身のプロフィールの場合はフォローボタンを非表示 */
  isOwnProfile?: boolean;
  /** チャットボタン押下（その人との個別チャットへ遷移） */
  onMessage?: () => void;
  /** チャット遷移処理中 */
  messageLoading?: boolean;
  /** フォロワー数をクリックしたとき（一覧モーダル用） */
  onFollowersClick?: () => void;
  /** フォロー中数をクリックしたとき（一覧モーダル用） */
  onFollowingClick?: () => void;
  /** 先着100人記念バッジを表示 */
  showEarlyAdopterBadge?: boolean;
}

export default function OtherProfileTop({
  headerUrl,
  avatarUrl,
  name,
  onBack,
  bio,
  goal,
  ageDisplay,
  gender,
  gym,
  trainingYears = 0,
  area,
  followersCount = 0,
  followingCount = 0,
  collabCount = 0,
  isFollowing = false,
  onFollow,
  followLoading = false,
  isOwnProfile = false,
  onMessage,
  messageLoading = false,
  onFollowersClick,
  onFollowingClick,
  showEarlyAdopterBadge = false,
}: OtherProfileTopProps) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const avatarSrc = avatarUrl
    ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}v=${Date.now()}`
    : null;

  const stats = [
    { label: "フォロワー", value: followersCount.toLocaleString(), onClick: onFollowersClick },
    { label: "フォロー中", value: followingCount.toLocaleString(), onClick: onFollowingClick },
    { label: "合トレ実績", value: collabCount.toLocaleString() },
  ];

  return (
    <section className="relative">
      {/* ヘッダー画像 */}
      <div className="relative h-32 w-full overflow-hidden sm:h-40">
        {headerUrl ? (
          <Image
            src={headerUrl}
            alt=""
            fill
            className="object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500" />
        )}

        {/* 戻るボタン */}
        {onBack && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center p-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background/80"
              aria-label="戻る"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* アバター + 名前 */}
      <div className="relative px-5 pb-4 sm:px-8">
        <div className="-mt-12 mb-4 flex flex-col items-start gap-3">
          <div className="flex h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-secondary shadow-xl shadow-black/40 sm:h-28 sm:w-28">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={name}
                width={112}
                height={112}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gold/20 to-gold/5 text-gold">
                <span className="text-3xl font-black sm:text-4xl">{initial}</span>
              </div>
            )}
          </div>
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {name || "名前未設定"}
            {showEarlyAdopterBadge && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-gold/50 bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-gold"
                title="先着100人登録記念"
              >
                🎉 先着100人
              </span>
            )}
          </h1>
        </div>

        {/* 自己紹介 */}
        {bio && (
          <p className="mb-4 text-sm font-semibold leading-relaxed tracking-wide text-foreground">
            {bio}
          </p>
        )}

        {/* 年齢・性別・ジム・トレ歴・住まいのバッジ */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {goal && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1.5 text-xs font-bold text-foreground">
              <Target className="h-3.5 w-3.5" />
              {goal}
            </span>
          )}
          {ageDisplay != null && ageDisplay !== "" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-gold/70" />
              {ageDisplay}
            </span>
          )}
          {toGenderLabel(gender) && (
            <span className="inline-flex items-center rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {toGenderLabel(gender)}
            </span>
          )}
          {gym && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Dumbbell className="h-3.5 w-3.5 text-gold/70" />
              {gym}
            </span>
          )}
          {trainingYears > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-gold/70" />
              トレ歴 {trainingYears}年
            </span>
          )}
          {area && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-gold/70" />
              {area}
            </span>
          )}
        </div>

        {/* フォロワー・フォロー中・合トレ実績 */}
        <div className="flex items-center gap-0 border-t border-border/60 pt-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex-1 text-center ${i !== stats.length - 1 ? "border-r border-border/40" : ""}`}
            >
              {stat.onClick ? (
                <button
                  type="button"
                  onClick={stat.onClick}
                  className="block w-full py-1 text-center transition-colors hover:opacity-80 active:opacity-70"
                >
                  <p className="text-xl font-black text-foreground sm:text-2xl">{stat.value}</p>
                  <p className="mt-0.5 text-xs font-semibold tracking-wide text-muted-foreground">{stat.label}</p>
                </button>
              ) : (
                <>
                  <p className="text-xl font-black text-foreground sm:text-2xl">{stat.value}</p>
                  <p className="mt-0.5 text-xs font-semibold tracking-wide text-muted-foreground">{stat.label}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* フォローボタン・チャットボタン（他ユーザーのときのみ） */}
        {!isOwnProfile && (onFollow != null || onMessage != null) && (
          <div className="mt-5 flex gap-3">
            {onFollow != null && (
              <button
                type="button"
                onClick={onFollow}
                disabled={followLoading}
                title={isFollowing ? "クリックでフォロー解除" : undefined}
                aria-label={isFollowing ? "フォロー解除" : "フォローする"}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer ${
                  isFollowing
                    ? "border-gold/50 bg-gold/10 text-gold hover:bg-gold/20"
                    : "border-border bg-transparent text-foreground hover:border-gold/30 hover:bg-secondary"
                }`}
              >
                {followLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                {isFollowing ? "フォロー中" : "フォローする"}
              </button>
            )}
            {onMessage != null && (
              <button
                type="button"
                onClick={onMessage}
                disabled={messageLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-bold tracking-wide text-[#050505] transition-all hover:bg-gold-light active:scale-[0.98] disabled:opacity-60"
              >
                {messageLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                チャット
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
