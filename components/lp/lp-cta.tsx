import Link from "next/link";

export default function LpCta() {
  return (
    <section className="bg-[#FF6B00] px-4 py-16 md:py-20">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <h2 className="text-2xl font-black text-[#ffffff] md:text-3xl">
          今日から最高のトレーニングパートナーを見つけよう
        </h2>
        <p className="max-w-lg leading-relaxed text-[#ffffff]/90">
          10,000人以上のトレーニーが既にFITPEAKで合トレ仲間を見つけています。あなたも無料で始めませんか？
        </p>
        <Link
          href="/login"
          className="mt-2 rounded-full bg-[#ffffff] px-10 py-4 text-base font-bold text-[#FF6B00] transition-all hover:bg-[#f8f9fa] hover:shadow-lg hover:-translate-y-0.5"
        >
          無料で始める
        </Link>
      </div>
    </section>
  );
}
