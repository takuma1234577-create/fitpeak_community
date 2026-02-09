import { Award, BadgeCheck } from "lucide-react";
import type { Achievement } from "@/types/profile";

interface ProfileDetailsProps {
  achievements: Achievement[];
  certifications: string[];
  trainingYears: number;
  goal: string | null;
}

export default function ProfileDetails({
  achievements,
  certifications,
}: ProfileDetailsProps) {
  const safeAchievements = Array.isArray(achievements) ? achievements : [];
  const safeCertifications = Array.isArray(certifications) ? certifications : [];
  const hasAchievements = safeAchievements.length > 0;
  const hasCertifications = safeCertifications.length > 0;

  if (!hasAchievements && !hasCertifications) return null;

  return (
    <section className="px-5 py-6 sm:px-8">
      {hasAchievements && (
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">
              コンテスト実績
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {(Array.isArray(safeAchievements) ? safeAchievements : []).map((a, i) => (
              <div
                key={`${a.title}-${a.year}`}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-gold/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <span className="text-sm font-black">{i + 1}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.year}年
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-gold/10 px-3 py-1 text-xs font-bold text-gold">
                  {a.rank}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasCertifications && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">
              保有資格
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(safeCertifications) ? safeCertifications : []).map((cert) => (
              <span
                key={cert}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.06] px-3.5 py-1.5 text-xs font-bold text-gold"
              >
                <BadgeCheck className="h-3 w-3" />
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
