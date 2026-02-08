export interface Achievement {
  title: string;
  year: number;
  rank: string;
}

export interface Profile {
  id: string;
  name: string | null;
  bio: string | null;
  email: string | null;
  avatar_url: string | null;
  bench_max: number;
  squat_max: number;
  deadlift_max: number;
  area: string | null;
  gym: string | null;
  training_years: number;
  goal: string | null;
  achievements: Achievement[];
  certifications: string[];
  followers_count: number;
  following_count: number;
  collab_count: number;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdate = Partial<
  Omit<Profile, "id" | "created_at" | "updated_at">
>;
