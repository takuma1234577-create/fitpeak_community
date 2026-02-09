"use client";

import { useForm } from "react-hook-form";
import type { RecruitmentFormDefaultValues, RecruitmentInitialData } from "./recruitment-form-defaults";
import { getSafeRecruitmentDefaultValues } from "./recruitment-form-defaults";

type RecruitmentFormProps = {
  initialData?: RecruitmentInitialData | null;
  onSubmit: (values: RecruitmentFormDefaultValues) => void | Promise<void>;
  children: (form: ReturnType<typeof useForm<RecruitmentFormDefaultValues>>) => React.ReactNode;
};

/**
 * 合トレ募集フォーム。useForm の defaultValues で配列フィールドを必ず [] にし、
 * TypeError: i.map is not a function を防ぐ。
 */
export function RecruitmentForm({ initialData, onSubmit, children }: RecruitmentFormProps) {
  const defaultValues = getSafeRecruitmentDefaultValues(initialData);

  const form = useForm<RecruitmentFormDefaultValues>({
    defaultValues: {
      title: defaultValues.title,
      description: defaultValues.description,
      target_body_part: defaultValues.target_body_part,
      event_date: defaultValues.event_date,
      event_time: defaultValues.event_time,
      location: defaultValues.location,
      area: defaultValues.area,
      level: defaultValues.level,
      tags: defaultValues.tags || [],
      images: defaultValues.images || [],
      areas: defaultValues.areas || [],
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      tags: values.tags ?? [],
      images: values.images ?? [],
      areas: values.areas ?? [],
    });
  });

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4">
      {children(form)}
    </form>
  );
}

export type { RecruitmentFormDefaultValues, RecruitmentInitialData };
export { getSafeRecruitmentDefaultValues };
