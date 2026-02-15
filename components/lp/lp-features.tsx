import Image from "next/image";

const features = [
  {
    heading: "トレーニングメニュー・ログをワンタップで共有",
    description:
      "憧れのトレーニーのルーティンをコピーして実践。あなたの記録は自動でグラフ化され、仲間と競い合えます。",
    imageAlt: "FITPEAKのトレーニングログ共有機能の画面イメージ",
  },
  {
    heading: "現在地から近くの合トレ募集を即座にマッチング",
    description:
      "「今からジム行く人！」でOK。GPS連動で近くのトレーニーに通知。信頼スコア機能で安心してパートナーを探せます。",
    imageAlt: "FITPEAKの合トレマッチング機能の画面イメージ",
  },
  {
    heading: "所属ジム対抗！総挙上重量ランキング",
    description:
      "エニタイム〇〇店 vs ワールドプラス〇〇店。あなたの1レップが、チームの勝利に貢献します。",
    imageAlt: "FITPEAKのジム対抗ランキング機能の画面イメージ",
  },
];

export default function LpFeatures() {
  return (
    <section id="features" className="bg-[#ffffff] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-black text-[#1f2937] md:text-3xl">
          FITPEAKが選ばれる3つの理由
        </h2>

        <div className="mt-16 flex flex-col gap-20">
          {features.map((feature, i) => {
            const isReversed = i % 2 === 1;
            return (
              <div
                key={i}
                className={`flex flex-col items-center gap-10 lg:flex-row lg:gap-16 ${
                  isReversed ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Text */}
                <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
                  <h3 className="text-xl font-bold leading-snug text-[#1f2937] md:text-2xl">
                    {feature.heading}
                  </h3>
                  <p className="mt-4 max-w-md leading-relaxed text-[#4b5563]">
                    {feature.description}
                  </p>
                </div>

                {/* Image */}
                <div className="flex flex-1 items-center justify-center">
                  <div className="relative h-[320px] w-full max-w-[440px] overflow-hidden rounded-2xl bg-[#f8f9fa] shadow-lg">
                    <Image
                      src={`/placeholder.svg?height=320&width=440`}
                      alt={feature.imageAlt}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
