"use client";

import Image from "next/image";
import { ChevronLeft } from "lucide-react";

export interface OtherProfileTopProps {
  /** ヘッダー画像URL。未設定時はグラデーション */
  headerUrl?: string | null;
  /** アバター画像URL */
  avatarUrl?: string | null;
  /** 表示名 */
  name: string;
  /** 戻る/閉じるボタン押下（モーダルでは閉じる、ページでは戻る） */
  onBack?: () => void;
}

export default function OtherProfileTop({
  headerUrl,
  avatarUrl,
  name,
  onBack,
}: OtherProfileTopProps) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const avatarSrc = avatarUrl
    ? `${avatarUrl}${avatarUrl.includes("?") ? "&" : "?"}v=${Date.now()}`
    : null;

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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

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
      <div className="relative px-5 pb-5 sm:px-8">
        <div className="-mt-12 mb-3 flex flex-col items-start gap-3">
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
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {name || "名前未設定"}
          </h1>
        </div>
      </div>
    </section>
  );
}
