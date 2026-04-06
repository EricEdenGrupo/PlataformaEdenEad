import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CurriculumPreviewRow = {
  module_id: string;
  module_title: string;
  module_sort_order: number;
  lesson_id: string;
  lesson_title: string;
  lesson_sort_order: number;
  lesson_duration_s: number;
};

/** Grade curricular pública antes da matrícula (via RPC security definer). */
export function useCourseCurriculumPreview(courseId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["catalog", "course-curriculum-preview", courseId],
    enabled: !!courseId && enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("course_curriculum_preview", {
        p_course_id: courseId,
      });
      if (error) throw error;
      return (data ?? []) as CurriculumPreviewRow[];
    },
  });
}

export function groupCurriculumPreview(rows: CurriculumPreviewRow[]) {
  type ModuleGroup = {
    moduleId: string;
    moduleTitle: string;
    moduleSort: number;
    lessons: { id: string; title: string; sortOrder: number; durationS: number }[];
  };
  const ordered: ModuleGroup[] = [];
  const indexByModule = new Map<string, number>();

  for (const r of rows) {
    let idx = indexByModule.get(r.module_id);
    if (idx === undefined) {
      idx = ordered.length;
      indexByModule.set(r.module_id, idx);
      ordered.push({
        moduleId: r.module_id,
        moduleTitle: r.module_title,
        moduleSort: r.module_sort_order,
        lessons: [],
      });
    }
    ordered[idx].lessons.push({
      id: r.lesson_id,
      title: r.lesson_title,
      sortOrder: r.lesson_sort_order,
      durationS: r.lesson_duration_s,
    });
  }

  return ordered.sort((a, b) => a.moduleSort - b.moduleSort);
}
