"use client";

export default function RecruitmentEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 px-5 py-12 text-center">
      <p className="text-sm font-semibold text-muted-foreground">まだ募集はありません</p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-3 text-sm font-bold text-gold hover:underline"
      >
        最初の募集を作成する
      </button>
    </div>
  );
}
