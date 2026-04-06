import { useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type TrackPayload = {
  lessonId: string;
  courseId: string;
  enrollmentId: string;
  orderedLessonIds: string[];
  seconds: number;
  duration?: number;
  markCompleted?: boolean;
};

const SAVE_INTERVAL_MS = 10_000;
const MIN_SECONDS_DELTA = 5;

function safeSeconds(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function useLearningLessonTracking() {
  const lastSavedAtByLessonRef = useRef<Map<string, number>>(new Map());
  const maxWatchedByLessonRef = useRef<Map<string, number>>(new Map());
  const hasLoadedBaselineRef = useRef<Set<string>>(new Set());

  const maybeLoadBaseline = useCallback(async (lessonId: string, enrollmentId: string) => {
    if (hasLoadedBaselineRef.current.has(lessonId)) return;
    hasLoadedBaselineRef.current.add(lessonId);

    const { data } = await (supabase as any)
      .schema("learning")
      .from("lesson_progress")
      .select("watched_seconds")
      .eq("enrollment_id", enrollmentId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const baseline = safeSeconds(Number(data?.watched_seconds ?? 0));
    maxWatchedByLessonRef.current.set(lessonId, baseline);
  }, []);

  const trackPlayback = useCallback(
    async ({ lessonId, courseId, enrollmentId, orderedLessonIds, seconds, duration, markCompleted }: TrackPayload) => {
      if (!lessonId || !courseId || !enrollmentId) return;

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;

      await maybeLoadBaseline(lessonId, enrollmentId);

      const now = Date.now();
      const currentSeconds = safeSeconds(seconds);
      const prevSavedAt = lastSavedAtByLessonRef.current.get(lessonId) ?? 0;
      const prevMaxSeconds = maxWatchedByLessonRef.current.get(lessonId) ?? 0;
      const nextMaxSeconds = Math.max(prevMaxSeconds, currentSeconds);

      const shouldSkipByTime = now - prevSavedAt < SAVE_INTERVAL_MS;
      const shouldSkipByDelta = Math.abs(nextMaxSeconds - prevMaxSeconds) < MIN_SECONDS_DELTA;
      const completeByProgress =
        duration != null && Number.isFinite(duration) && duration > 0
          ? currentSeconds / Number(duration) >= 0.95
          : false;
      const completed = markCompleted === true || completeByProgress;

      if (!completed && shouldSkipByTime && shouldSkipByDelta) return;

      maxWatchedByLessonRef.current.set(lessonId, nextMaxSeconds);
      lastSavedAtByLessonRef.current.set(lessonId, now);

      await (supabase as any)
        .schema("learning")
        .from("lesson_progress")
        .upsert(
          {
            enrollment_id: enrollmentId,
            lesson_id: lessonId,
            watched_seconds: nextMaxSeconds,
            last_position_s: currentSeconds,
            is_completed: completed,
            completed_at: completed ? new Date().toISOString() : undefined,
          },
          { onConflict: "enrollment_id,lesson_id" },
        );
    },
    [maybeLoadBaseline],
  );

  return useMemo(
    () => ({
      trackPlayback,
    }),
    [trackPlayback],
  );
}
