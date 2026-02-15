import { Star } from "lucide-react";
import Image from "next/image";

const reviews = [
  {
    name: "Kenji T.",
    gym: "エニタイムフィットネス 渋谷店",
    avatar: "/placeholder.svg?height=48&width=48",
    rating: 5,
    text: "合トレ募集を出したら30分で相手が見つかった。ベンチMAX更新できて最高！",
  },
  {
    name: "Yuki M.",
    gym: "ゴールドジム 原宿店",
    avatar: "/placeholder.svg?height=48&width=48",
    rating: 5,
    text: "トレーニングログの共有機能が神。上級者のメニューを参考にして半年でBIG3合計+50kg達成。",
  },
  {
    name: "Saki N.",
    gym: "チョコザップ 新宿店",
    avatar: "/placeholder.svg?height=48&width=48",
    rating: 5,
    text: "初心者でも気軽に参加できるコミュニティがあって安心。一人じゃ絶対続かなかった。",
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count}つ星評価`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < count
              ? "fill-[#FF6B00] text-[#FF6B00]"
              : "fill-[#e5e5e5] text-[#e5e5e5]"
          }`}
        />
      ))}
    </div>
  );
}

export default function LpSocialProof() {
  return (
    <section id="testimonials" className="bg-[#FFF7F0] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-black text-[#1f2937] md:text-3xl">
          多くのガチトレーニーが愛用中
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((review, i) => (
            <article
              key={i}
              className="flex flex-col gap-4 rounded-2xl bg-[#ffffff] px-6 py-8 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <Stars count={review.rating} />
              <p className="flex-1 leading-relaxed text-[#4b5563]">
                {review.text}
              </p>
              <div className="flex items-center gap-3 border-t border-[#f3f4f6] pt-4">
                <Image
                  src={review.avatar}
                  alt={`${review.name}のアバター`}
                  width={48}
                  height={48}
                  className="h-10 w-10 rounded-full bg-[#f3f4f6] object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-[#1f2937]">
                    {review.name}
                  </p>
                  <p className="text-xs text-[#6b7280]">{review.gym}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
