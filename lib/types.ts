export interface DayRow {
  user_id?: string;
  date: string;
  crossfit: boolean;
  run_minutes: number | null;
  run_km: number | null;
  no_alcohol: boolean;
  reading: boolean;
  skincare: boolean;
  phone_free_sleep: boolean;
  weight_kg: number | null;
  waist_cm: number | null;
  note: string | null;
  completed_at: string | null;
  updated_at?: string;
}

export type Pose = "front" | "side" | "back";

export interface PhotoRow {
  id: string;
  user_id?: string;
  date: string;
  pose: Pose;
  storage_path: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface ReviewRow {
  user_id?: string;
  week_start: string;
  went_well: string | null;
  obstacles: string | null;
  change_next: string | null;
  updated_at?: string;
}

export function emptyDay(date: string): DayRow {
  return {
    date,
    crossfit: false,
    run_minutes: null,
    run_km: null,
    no_alcohol: false,
    reading: false,
    skincare: false,
    phone_free_sleep: false,
    weight_kg: null,
    waist_cm: null,
    note: null,
    completed_at: null,
  };
}

export const POSES: { id: Pose; label: string }[] = [
  { id: "front", label: "Урд" },
  { id: "side", label: "Хажуу" },
  { id: "back", label: "Ар" },
];

export function reviewHasContent(r: ReviewRow | null | undefined): boolean {
  return !!r && [r.went_well, r.obstacles, r.change_next].some((t) => (t ?? "").trim().length > 0);
}
