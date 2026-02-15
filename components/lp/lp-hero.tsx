import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";

export default function LpHero() {
  return (
    <section className="bg-[#ffffff] px-4 py-16 md:py-24 lg:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
        {/* Left: Copy */}
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <h1 className="text-balance text-3xl font-black leading-tight text-[#1f2937] md:text-4xl lg:text-5xl">
            日本最大級の合トレ募集・筋トレ記録共有アプリ | FITPEAK
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[#4b5563] md:text-lg">
            {"「一人では続かない、追い込めない。」"}
            <br />
            エニタイムやゴールドジムなど、いつものジムで最高のトレーニングパートナーを見つけよう。
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full bg-[#FF6B00] px-8 py-4 text-base font-bold text-[#ffffff] transition-all hover:bg-[#FF8533] hover:shadow-lg hover:-translate-y-0.5"
          >
            今すぐ合トレ仲間を探す（無料）
          </Link>

          {/* Trust badge */}
          <div className="mt-6 flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#f8f9fa] px-5 py-2.5">
            <Users className="h-5 w-5 text-[#FF6B00]" />
            <span className="text-sm font-semibold text-[#1f2937]">
              登録トレーニー数 10,000人突破
            </span>
          </div>
        </div>

        {/* Right: App mockup */}
        <div className="flex flex-1 items-center justify-center">
          <div className="relative h-[480px] w-[260px] overflow-hidden rounded-[2.5rem] border-[6px] border-[#1f2937] bg-[#f8f9fa] shadow-2xl md:h-[560px] md:w-[300px]">
            <Image
              src="/placeholder.svg?height=560&width=300"
              alt="FITPEAKアプリのトレーニング記録画面のスクリーンショット"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
