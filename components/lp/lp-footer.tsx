import Link from "next/link";
import { Dumbbell } from "lucide-react";

const categoryLinks = [
  {
    title: "合トレ募集",
    links: [
      { label: "ベンチプレス向上委員会", href: "#" },
      { label: "ダイエット仲間募集", href: "#" },
      { label: "パワーリフティング初心者", href: "#" },
    ],
  },
  {
    title: "ジム検索",
    links: [
      { label: "エニタイムフィットネス", href: "#" },
      { label: "ゴールドジム", href: "#" },
      { label: "チョコザップ", href: "#" },
    ],
  },
  {
    title: "筋トレメニュー",
    links: [
      { label: "胸トレーニング", href: "#" },
      { label: "背中トレーニング", href: "#" },
      { label: "脚トレーニング", href: "#" },
    ],
  },
  {
    title: "コラム",
    links: [
      { label: "初心者ガイド", href: "#" },
      { label: "栄養管理", href: "#" },
      { label: "休息と回復", href: "#" },
    ],
  },
];

export default function LpFooter() {
  return (
    <footer className="bg-[#1f2937] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Top: Logo + Links */}
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          {/* Logo */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Dumbbell className="h-7 w-7 text-[#ffffff]" strokeWidth={2.5} />
              <span className="text-xl font-black tracking-widest text-[#ffffff]">
                FITPEAK
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-[#9ca3af]">
              日本最大級のトレーニングコミュニティ。合トレ仲間を見つけて、一緒に強くなろう。
            </p>
          </div>

          {/* Link columns */}
          <div className="grid flex-1 grid-cols-2 gap-8 md:grid-cols-4">
            {categoryLinks.map((category) => (
              <div key={category.title}>
                <h3 className="mb-3 text-sm font-bold text-[#ffffff]">
                  {category.title}
                </h3>
                <ul className="flex flex-col gap-2">
                  {category.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[#9ca3af] transition-colors hover:text-[#ffffff]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-[#374151] pt-8 text-center">
          <p className="text-sm text-[#6b7280]">
            {"© 2026 FITPEAK - All Rights Reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
}
