import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CourseRatingPublic = {
  id: string;
  rating: number;
  review: string | null;
  profile_id: string;
  created_at: string;
};

/** Aggregate + list for a course (all rows readable when authenticated). */
export function useCourseRatings(courseId: string | undefined) {
  return useQuery({
    queryKey: ["learning", "course-ratings", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .schema("learning")
        .from("course_ratings")
        .select("id,rating,review,profile_id,created_at")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = (data ?? []) as CourseRatingPublic[];
      const n = rows.length;
      const avg = n === 0 ? null : rows.reduce((s, r) => s + Number(r.rating), 0) / n;
      return { rows, count: n, average: avg };
    },
  });
}

export function useMyCourseRating(courseId: string | undefined) {
  return useQuery({
    queryKey: ["learning", "my-course-rating", courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<CourseRatingPublic | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId || !courseId) return null;

      const { data, error } = await (supabase as any)
        .schema("learning")
        .from("course_ratings")
        .select("id,rating,review,profile_id,created_at")
        .eq("course_id", courseId)
        .eq("profile_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as CourseRatingPublic | null;
    },
  });
}

export function useUpsertMyCourseRating(courseId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { rating: number; review: string | null }) => {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const userId = auth.user?.id;
      if (!userId || !courseId) throw new Error("Sessão inválida.");

      const reviewTrim = payload.review?.trim() || null;
      const { data: existing, error: findErr } = await (supabase as any)
        .schema("learning")
        .from("course_ratings")
        .select("id")
        .eq("course_id", courseId)
        .eq("profile_id", userId)
        .maybeSingle();

      if (findErr) throw findErr;

      if (existing?.id) {
        const { error } = await (supabase as any)
          .schema("learning")
          .from("course_ratings")
          .update({
            rating: payload.rating,
            review: reviewTrim,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).schema("learning").from("course_ratings").insert({
          course_id: courseId,
          profile_id: userId,
          rating: payload.rating,
          review: reviewTrim,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learning", "course-ratings", courseId] });
      void queryClient.invalidateQueries({ queryKey: ["learning", "my-course-rating", courseId] });
    },
  });
}
