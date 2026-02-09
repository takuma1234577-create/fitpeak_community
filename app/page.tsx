import Link from "next/link";
import { Dumbbell, Plus, Users } from "lucide-react";
import AuthForm from "@/components/auth-form";

export default function Page() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-4 py-12 md:py-16">
      <div
        className="absolute inset-0"
        style={{ pointerEvents: "none" }}
        aria-hidden
      >
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gold/[0.04] blur-[140px]" />
        <div className="absolute -bottom-56 -left-56 h-[600px] w-[600px] rounded-full bg-gold/[0.03] blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.015] blur-[200px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.6) 100%)",
          }}
        />
      </div>

      {/* ヒーローセクション + CTA */}
      <div className="relative z-10 mb-10 w-full max-w-[440px] text-center">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-10 w-10 text-gold" strokeWidth={2.5} />
            <h1 className="text-4xl font-black tracking-[0.2em] text-gold md:text-5xl">
              FITPEAK
            </h1>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Community
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href="/dashboard/recruit"
            className="flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-sm font-black uppercase tracking-wider text-[#050505] shadow-lg shadow-gold/25 transition-all duration-300 hover:bg-gold-light hover:shadow-xl hover:shadow-gold/30 active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            合トレを募集する
          </Link>
          <Link
            href="/dashboard/search"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-gold/60 bg-gold/10 px-6 py-4 text-sm font-black uppercase tracking-wider text-gold transition-all duration-300 hover:bg-gold/20 hover:border-gold active:scale-[0.98]"
          >
            <Users className="h-5 w-5" strokeWidth={2.5} />
            筋トレ仲間を探す
          </Link>
        </div>
      </div>

      <div className="relative z-10 w-full" style={{ pointerEvents: "auto" }}>
        <AuthForm />
      </div>
    </main>
  );
}
