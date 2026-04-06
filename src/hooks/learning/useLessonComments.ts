import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LessonCommentRow = {
  id: string;
  profile_id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
};

export function useLessonComments(lessonId: string | undefined) {
  return useQuery({
    queryKey: ["learning", "lesson-comments", lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .schema("learning")
        .from("comments")
        .select("id,profile_id,body,created_at,parent_id")
        .eq("lesson_id", lessonId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as LessonCommentRow[];
    },
  });
}

export function useCreateLessonComment(lessonId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const userId = auth.user?.id;
      if (!userId || !lessonId) throw new Error("Sessão inválida.");

      const text = body.trim();
      if (!text) throw new Error("Escreva uma mensagem.");

      const { error } = await (supabase as any).schema("learning").from("comments").insert({
        lesson_id: lessonId,
        profile_id: userId,
        body: text,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learning", "lesson-comments", lessonId] });
    },
  });
}

export function useSoftDeleteLessonComment(lessonId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await (supabase as any)
        .schema("learning")
        .from("comments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["learning", "lesson-comments", lessonId] });
    },
  });
}
