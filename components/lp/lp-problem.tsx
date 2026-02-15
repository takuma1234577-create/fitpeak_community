import { UserX, Search, BarChart3 } from "lucide-react";

const problems = [
  {
    icon: UserX,
    text: "ベンチプレスの補助がいなくて、MAX挑戦ができない",
  },
  {
    icon: Search,
    text: "Twitterや掲示板での合トレ募集は、相手がどんな人か不安",
  },
  {
    icon: BarChart3,
    text: "一人のトレーニングだと、どうしても甘えが出て追い込めない",
  },
];

export default function LpProblem() {
  return (
    <section className="bg-[#f3f4f6] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-black text-[#1f2937] md:text-3xl">
          ジムでこんな悩み、ありませんか？
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {problems.map((item, i) => {
            const Icon = item.icon;
            return (
              <article
                key={i}
                className="flex flex-col items-center gap-5 rounded-2xl bg-[#ffffff] px-6 py-8 text-center shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF0E0]">
                  <Icon className="h-7 w-7 text-[#FF6B00]" />
                </div>
                <p className="text-base font-semibold leading-relaxed text-[#1f2937]">
                  {item.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
