"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "利用料金はかかりますか？",
    answer:
      "基本機能はすべて無料でお使いいただけます。",
  },
  {
    question: "初心者でも使えますか？",
    answer:
      "もちろんです。「ゆるトレの会」など、初心者向けのコミュニティも充実しています。",
  },
  {
    question: "どこのジムでも使えますか？",
    answer:
      "エニタイムフィットネス、ゴールドジム、チョコザップ、市営ジムなど、全国すべてのジムに対応しています。",
  },
];

export default function LpFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="bg-[#ffffff] px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-black text-[#1f2937] md:text-3xl">
          FITPEAKに関するよくある質問
        </h2>

        <div className="mt-12 flex flex-col gap-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#e5e5e5] bg-[#ffffff] transition-shadow hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="pr-4 text-base font-semibold text-[#1f2937]">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[#6b7280] transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5">
                  <p className="leading-relaxed text-[#4b5563]">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
