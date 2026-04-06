import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const userId = auth.user?.id;
      if (!userId) throw new Error("Faça login para se matricular.");

      const { error } = await (supabase as any).schema("learning").from("enrollments").insert({
        profile_id: userId,
        course_id: courseId,
      });

      if (error) {
        if ((error as { code?: string }).code === "23505") {
          return;
        }
        throw error;
      }
    },
    onSuccess: (_data, courseId) => {
      void queryClient.invalidateQueries({ queryKey: ["learning", "course-player", courseId] });
      void queryClient.invalidateQueries({ queryKey: ["learning", "catalog"] });
    },
  });
}
