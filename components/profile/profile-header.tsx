"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Dumbbell,
  Users,
  Handshake,
  Settings,
  Share2,
  ChevronLeft,
  Target,
  Calendar,
  MessageCircle,
  Loader2,
} from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/** SNSのURLまたはID。表示時はフルURLに変換して別タブで開く */
type SnsLinks = {
  instagram_id?: string | null;
  youtube_url?: string | null;
  twitter_url?: string | null;
  tiktok_url?: string | null;
  facebook_url?: string | null;
};

interface ProfileHeaderProps {
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  /** キャッシュ無効化用。avatarUrl に ?v= を付与する */
  avatarUpdatedAt?: string | null;
  /** 住まい（都道府県）。非公開時は "非公開" を渡す */
  area: string | null;
  /** よく行くジム。非公開時は "非公開" を渡す */
  gym: string | null;
  /** 年齢表示。例: "25歳"。非公開時は "非公開"。表示しない場合は null */
  ageDisplay: string | null;
  goal: string | null;
  trainingYears: number;
  followersCount: number;
  followingCount: number;
  collabCount: number;
  snsLinks?: SnsLinks | null;
  /** 他人のプロフィール表示時: false。自分の時は未指定でボタンは従来表示 */
  isOwnProfile?: boolean;
  /** 表示中のプロフィールの user id（メッセージ用） */
  profileUserId?: string;
  /** フォロー中か */
  isFollowing?: boolean;
  /** フォローボタン押下 */
  onFollow?: () => void;
  /** フォロー処理中 */
  followLoading?: boolean;
  /** メッセージボタン押下（会話取得 or 作成後に遷移） */
  onMessage?: () => void;
}

function toFullUrl(kind: keyof SnsLinks, value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (kind === "instagram_id") return `https://instagram.com/${v.replace(/^@/, "")}`;
  if (kind === "youtube_url") return v.startsWith("@") ? `https://youtube.com/${v}` : `https://youtube.com/@${v.replace(/^@/, "")}`;
  if (kind === "twitter_url") return `https://x.com/${v.replace(/^@/, "")}`;
  if (kind === "tiktok_url") return v.includes("tiktok.com") ? v : `https://tiktok.com/@${v.replace(/^@/, "")}`;
  if (kind === "facebook_url") return `https://facebook.com/${v.replace(/^\//, "")}`;
  return v;
}

export default function ProfileHeader({
  name,
  bio,
  avatarUrl,
  avatarUpdatedAt,
  area,
  gym,
  ageDisplay,
  goal,
  trainingYears,
  followersCount,
  followingCount,
  collabCount,
  snsLinks,
  isOwnProfile,
  profileUserId,
  isFollowing,
  onFollow,
  followLoading,
  onMessage,
}: ProfileHeaderProps) {
  const router = useRouter();
  const showFollowMessage = !isOwnProfile && profileUserId;
  const avatarSrc = avatarUrl
    ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}v=${avatarUpdatedAt || Date.now()}`
    : null;

  const stats = [
    { label: "フォロワー", value: followersCount.toLocaleString() },
    { label: "フォロー中", value: followingCount.toLocaleString() },
    { label: "合トレ実績", value: collabCount.toLocaleString() },
  ];

  const initial = name.charAt(0).toUpperCase();

  return (
    <section className="relative">
      <div className="relative h-56 w-full overflow-hidden sm:h-72">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/20 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background/80"
            aria-label="戻る"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background/80"
              aria-label="共有"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/settings")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background/80"
              aria-label="設定"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative px-5 pb-6 sm:px-8">
        <div className="-mt-16 mb-4 flex items-end gap-4">
          <div className="relative shrink-0">
            <div className="flex h-28 w-28 overflow-hidden rounded-full border-4 border-background bg-secondary shadow-xl shadow-black/40 sm:h-32 sm:w-32">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={name}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gold/20 to-gold/5 text-gold">
                  <span className="text-4xl font-black sm:text-5xl">
                    {initial}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-background bg-emerald-500" />
          </div>

          {showFollowMessage ? (
            <div className="ml-auto mb-2 hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={onMessage}
                className="flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold tracking-wide text-[#050505] transition-all hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20 active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                メッセージ
              </button>
              <button
                type="button"
                onClick={onFollow}
                disabled={followLoading}
                className={`flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 ${
                  isFollowing
                    ? "border-gold/50 bg-gold/10 text-gold hover:bg-gold/20"
                    : "border-border bg-transparent text-foreground hover:border-gold/30 hover:bg-secondary/80"
                }`}
              >
                {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {isFollowing ? "フォロー中" : "フォローする"}
              </button>
            </div>
          ) : (
            <div className="ml-auto mb-2 hidden items-center gap-2 sm:flex">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold tracking-wide text-[#050505] transition-all hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20 active:scale-[0.98]"
              >
                <Handshake className="h-4 w-4" />
                合トレ申請
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings")}
                className="flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-bold tracking-wide text-foreground transition-all hover:border-gold/30 hover:bg-secondary/80"
              >
                <Settings className="h-4 w-4" />
                設定
              </button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {name}
          </h1>
          {bio && (
            <p className="mt-1 text-sm font-semibold tracking-wide text-gold">
              {bio}
            </p>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {goal && (
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-gold/70" />
              <span className="font-medium">{goal}</span>
            </span>
          )}
          {ageDisplay !== null && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gold/70" />
              <span className="font-medium">{ageDisplay}</span>
            </span>
          )}
          {trainingYears > 0 && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gold/70" />
              <span className="font-medium">
                トレ歴 {trainingYears}年
              </span>
            </span>
          )}
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {(gym ?? area) && (
            <>
              {gym && (
                <span className="flex items-center gap-1.5">
                  <Dumbbell className="h-3.5 w-3.5 text-gold/70" />
                  <span className="font-medium">{gym}</span>
                </span>
              )}
              {area && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gold/70" />
                  <span className="font-medium">{area}</span>
                </span>
              )}
            </>
          )}
        </div>

        {snsLinks && (snsLinks.instagram_id || snsLinks.youtube_url || snsLinks.twitter_url || snsLinks.tiktok_url || snsLinks.facebook_url) && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {snsLinks.instagram_id && (
              <a
                href={toFullUrl("instagram_id", snsLinks.instagram_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-gold/20 hover:text-gold"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            )}
            {snsLinks.youtube_url && (
              <a
                href={toFullUrl("youtube_url", snsLinks.youtube_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-gold/20 hover:text-gold"
                aria-label="YouTube"
              >
                <YouTubeIcon className="h-4 w-4" />
              </a>
            )}
            {snsLinks.twitter_url && (
              <a
                href={toFullUrl("twitter_url", snsLinks.twitter_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-gold/20 hover:text-gold"
                aria-label="X (Twitter)"
              >
                <XIcon className="h-4 w-4" />
              </a>
            )}
            {snsLinks.tiktok_url && (
              <a
                href={toFullUrl("tiktok_url", snsLinks.tiktok_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-gold/20 hover:text-gold"
                aria-label="TikTok"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
            )}
            {snsLinks.facebook_url && (
              <a
                href={toFullUrl("facebook_url", snsLinks.facebook_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-gold/20 hover:text-gold"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        <div className="flex items-center gap-0 border-t border-border/60 pt-5">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex-1 text-center ${
                i !== stats.length - 1 ? "border-r border-border/40" : ""
              }`}
            >
              <p className="text-xl font-black text-foreground sm:text-2xl">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs font-semibold tracking-wide text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {showFollowMessage ? (
          <div className="mt-5 flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={onMessage}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-bold tracking-wide text-[#050505] transition-all hover:bg-gold-light active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" />
              メッセージ
            </button>
            <button
              type="button"
              onClick={onFollow}
              disabled={followLoading}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 ${
                isFollowing ? "border-gold/50 bg-gold/10 text-gold" : "border-border bg-transparent text-foreground hover:border-gold/30"
              }`}
            >
              {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              {isFollowing ? "フォロー中" : "フォローする"}
            </button>
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2 sm:hidden">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gold py-3 text-sm font-bold tracking-wide text-[#050505] transition-all hover:bg-gold-light active:scale-[0.98]"
            >
              <Handshake className="h-4 w-4" />
              合トレ申請
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/settings")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-transparent py-3 text-sm font-bold tracking-wide text-foreground transition-all hover:border-gold/30"
            >
              <Settings className="h-4 w-4" />
              設定
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
