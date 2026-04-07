import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cdnThumb } from "@/lib/cdn";

export type LearningCourseListItem = {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: "draft" | "published" | "archived" | null;
  sort_order: number | null;
  created_at: string | null;
  categoryName: string | null;
  tagNames: string[];
};

function isCourseCompleted(p: {
  percent: number | string | null;
  completed_lessons: number | null;
  total_lessons: number | null;
}): boolean {
  if (p.percent != null && Number(p.percent) >= 100) return true;
  const tl = p.total_lessons ?? 0;
  const cl = p.completed_lessons ?? 0;
  return tl > 0 && cl >= tl;
}

export type LearningCatalogData = {
  courses: LearningCourseListItem[];
  completedCount: number;
  remainingCount: number;
  totalPublished: number;
  completedCourseIds: string[];
};

/** Cursos publicados + contagem concluídos/faltantes via enrollments + lesson_progress. */
export function useLearningCatalog() {
  return useQuery({
    queryKey: ["learning", "catalog"],
    queryFn: async (): Promise<LearningCatalogData> => {
      const { data: courses, error: cErr } = await (supabase as any)
        .schema("catalog")
        .from("courses")
        .select("id,category_id,title,description,thumbnail_url,status,sort_order,created_at")
        .eq("status", "published")
        .is("deleted_at", null)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("title", { ascending: true })
        .order("created_at", { ascending: false });

      if (cErr) throw cErr;
      const baseList = (courses ?? []) as Omit<LearningCourseListItem, "categoryName" | "tagNames">[];
      const ids = baseList.map((c) => c.id);
      const categoryIds = [...new Set(baseList.map((c) => c.category_id).filter(Boolean))] as string[];

      let categoryNameById = new Map<string, string>();
      if (categoryIds.length > 0) {
        const { data: categories, error: catErr } = await (supabase as any)
          .schema("catalog")
          .from("categories")
          .select("id,name")
          .in("id", categoryIds);
        if (catErr) throw catErr;
        categoryNameById = new Map<string, string>(
          (categories ?? []).map((row: { id: string; name: string }) => [row.id, row.name]),
        );
      }

      let tagsByCourseId = new Map<string, string[]>();
      if (ids.length > 0) {
        const { data: courseTags, error: ctErr } = await (supabase as any)
          .schema("catalog")
          .from("course_tags")
          .select("course_id,tag_id")
          .in("course_id", ids);
        if (ctErr) throw ctErr;

        const tagIds = [...new Set((courseTags ?? []).map((row: { tag_id: string }) => row.tag_id))];
        let tagNameById = new Map<string, string>();
        if (tagIds.length > 0) {
          const { data: tags, error: tErr } = await (supabase as any)
            .schema("catalog")
            .from("tags")
            .select("id,name")
            .in("id", tagIds);
          if (tErr) throw tErr;
          tagNameById = new Map<string, string>(
            (tags ?? []).map((row: { id: string; name: string }) => [row.id, row.name]),
          );
        }

        tagsByCourseId = new Map<string, string[]>();
        for (const row of courseTags ?? []) {
          const tagName = tagNameById.get(row.tag_id);
          if (!tagName) continue;
          const current = tagsByCourseId.get(row.course_id) ?? [];
          if (!current.includes(tagName)) current.push(tagName);
          tagsByCourseId.set(row.course_id, current);
        }
      }

      const list: LearningCourseListItem[] = baseList.map((course) => ({
        ...course,
        thumbnail_url: course.thumbnail_url ? cdnThumb(course.thumbnail_url) : null,
        categoryName: course.category_id ? categoryNameById.get(course.category_id) ?? null : null,
        tagNames: tagsByCourseId.get(course.id) ?? [],
      }));

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      let completedCount = 0;
      const completedCourseIds: string[] = [];
      if (userId && ids.length > 0) {
        const { data: enrollments, error: eErr } = await (supabase as any)
          .schema("learning")
          .from("enrollments")
          .select("id,course_id")
          .eq("profile_id", userId)
          .in("course_id", ids);

        if (eErr) throw eErr;
        const enrollmentByCourse = new Map<string, string>(
          (enrollments ?? []).map((e: { id: string; course_id: string }) => [e.course_id, e.id]),
        );

        const { data: modules, error: mErr } = await (supabase as any)
          .schema("catalog")
          .from("modules")
          .select("id,course_id")
          .in("course_id", ids);
        if (mErr) throw mErr;
        const moduleToCourse = new Map<string, string>(
          (modules ?? []).map((m: { id: string; course_id: string }) => [m.id, m.course_id]),
        );

        const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
        const { data: lessons, error: lErr } = await (supabase as any)
          .schema("catalog")
          .from("lessons")
          .select("id,module_id")
          .eq("status", "published")
          .in("module_id", moduleIds.length ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);
        if (lErr) throw lErr;

        const totalLessonsByCourse = new Map<string, number>();
        for (const row of lessons ?? []) {
          const courseId = moduleToCourse.get(row.module_id as string);
          if (!courseId) continue;
          totalLessonsByCourse.set(courseId, (totalLessonsByCourse.get(courseId) ?? 0) + 1);
        }

        const enrollmentIds = (enrollments ?? []).map((e: { id: string }) => e.id);
        let completedByEnrollment = new Map<string, number>();
        if (enrollmentIds.length) {
          const { data: progressRows, error: pErr } = await (supabase as any)
            .schema("learning")
            .from("lesson_progress")
            .select("enrollment_id,is_completed")
            .in("enrollment_id", enrollmentIds)
            .eq("is_completed", true);
          if (pErr) throw pErr;
          completedByEnrollment = new Map<string, number>();
          for (const row of progressRows ?? []) {
            completedByEnrollment.set(
              row.enrollment_id,
              (completedByEnrollment.get(row.enrollment_id) ?? 0) + 1,
            );
          }
        }

        for (const id of ids) {
          const enrollmentId = enrollmentByCourse.get(id);
          if (!enrollmentId) continue;
          const total = totalLessonsByCourse.get(id) ?? 0;
          const completed = completedByEnrollment.get(enrollmentId) ?? 0;
          if (isCourseCompleted({ percent: null, completed_lessons: completed, total_lessons: total })) {
            completedCount++;
            completedCourseIds.push(id);
          }
        }
      }

      const totalPublished = list.length;
      const remainingCount = Math.max(0, totalPublished - completedCount);

      return {
        courses: list,
        completedCount,
        remainingCount,
        totalPublished,
        completedCourseIds,
      };
    },
  });
}
