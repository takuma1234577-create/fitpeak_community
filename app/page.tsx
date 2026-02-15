import type { Metadata } from "next";
import LpHeader from "@/components/lp/lp-header";
import LpHero from "@/components/lp/lp-hero";
import LpProblem from "@/components/lp/lp-problem";
import LpFeatures from "@/components/lp/lp-features";
import LpSocialProof from "@/components/lp/lp-social-proof";
import LpFaq from "@/components/lp/lp-faq";
import LpCta from "@/components/lp/lp-cta";
import LpFooter from "@/components/lp/lp-footer";

export const metadata: Metadata = {
  title:
    "FITPEAK | 日本最大級の合トレ募集・筋トレ記録共有アプリ - トレーニングパートナーを見つけよう",
  description:
    "FITPEAKは合トレ仲間の募集、筋トレメニュー・ログの共有、ジム対抗ランキングが楽しめる日本最大級のトレーニングコミュニティアプリです。エニタイム・ゴールドジム・チョコザップなど全国のジムに対応。無料で今すぐ始めよう。",
  keywords: [
    "合トレ",
    "合トレ募集",
    "筋トレ仲間",
    "トレーニングパートナー",
    "筋トレ記録",
    "ジム仲間",
    "FITPEAK",
    "エニタイムフィットネス",
    "ゴールドジム",
    "筋トレアプリ",
  ],
  openGraph: {
    title: "FITPEAK | 日本最大級の合トレ募集・筋トレ記録共有アプリ",
    description:
      "一人では続かない筋トレを、最高のパートナーと。合トレ募集・ログ共有・ジム対抗ランキングが無料で使える。",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <LpHeader />
      <main>
        <LpHero />
        <LpProblem />
        <LpFeatures />
        <LpSocialProof />
        <LpFaq />
        <LpCta />
      </main>
      <LpFooter />
    </>
  );
}
