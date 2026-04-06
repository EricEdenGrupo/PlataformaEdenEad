import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatLessonDuration, formatTotalDuration } from "@/lib/learning/formatDuration";

type LessonRow = {
  id: string;
  title: string;
  description: string | null;
  vimeo_video_id: string;
  vimeo_duration_s: number | null;
  sort_order: number;
  status: "draft" | "published" | "archived" | null;
};

type ModuleRow = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: LessonRow[] | null;
};

type CourseTreeRow = {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  level: string;
  duration_minutes: number | null;
  modules: ModuleRow[] | null;
};

export type CoursePlayerLesson = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
};

export type CoursePlayerModule = {
  id: string;
  title: string;
  progress: number;
  totalDuration: string;
  lessons: CoursePlayerLesson[];
};

export type LearningCoursePlayerView = {
  courseId: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  level: string;
  durationMinutes: number | null;
  /** Matrícula ativa: necessária para o RLS expor aulas e vídeos. */
  isEnrolled: boolean;
  enrollmentId: string | null;
  progressPercent: number;
  modules: CoursePlayerModule[];
  lessonById: Map<
    string,
    { vimeoVideoId: string; title: string; description: string | null }
  >;
  orderedLessonIds: string[];
  defaultLessonId: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sortModules(mods: ModuleRow[]): ModuleRow[] {
  return [...mods].sort((a, b) => a.sort_order - b.sort_order).map((m) => ({
    ...m,
    lessons: [...(m.lessons ?? [])]
      .filter((l) => l.status === "published")
      .sort((x, y) => x.sort_order - y.sort_order),
  }));
}

export function useLearningCoursePlayer(courseId: string | undefined) {
  return useQuery({
    queryKey: ["learning", "course-player", courseId],
    enabled: !!courseId && UUID_RE.test(courseId),
    queryFn: async (): Promise<LearningCoursePlayerView | null> => {
      if (!courseId || !UUID_RE.test(courseId)) return null;

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Usuário não autenticado");

      const [courseRes, enrollmentRes] = await Promise.all([
        (supabase as any)
          .schema("catalog")
          .from("courses")
          .select(
            `
            id,
            title,
            description,
            short_description,
            thumbnail_url,
            level,
            duration_minutes,
            modules (
              id,
              title,
              description,
              sort_order,
              lessons (
                id,
                title,
                description,
                vimeo_video_id,
                vimeo_duration_s,
                sort_order,
                status
              )
            )
          `,
          )
          .eq("id", courseId)
          .eq("status", "published")
          .is("deleted_at", null)
          .maybeSingle(),
        (supabase as any)
          .schema("learning")
          .from("enrollments")
          .select("id")
          .eq("profile_id", userId)
          .eq("course_id", courseId)
          .maybeSingle(),
      ]);

      const { data: courseRaw, error: courseError } = courseRes;
      if (courseError) throw courseError;
      if (!courseRaw) return null;

      const { data: enrollment, error: enrErr } = enrollmentRes;
      if (enrErr) throw enrErr;

      const enrollmentId = (enrollment as { id: string } | null)?.id ?? null;
      const isEnrolled = !!enrollmentId;

      const course = courseRaw as unknown as CourseTreeRow;
      const modulesSorted = sortModules(course.modules ?? []);

      const orderedLessonIds = modulesSorted.flatMap((m) => m.lessons.map((l) => l.id));

      let progressRows: { lesson_id: string; is_completed: boolean | null }[] | null = null;
      if (isEnrolled && enrollmentId && orderedLessonIds.length > 0) {
        const { data, error: lpError } = await (supabase as any)
          .schema("learning")
          .from("lesson_progress")
          .select("lesson_id, is_completed")
          .eq("enrollment_id", enrollmentId)
          .in("lesson_id", orderedLessonIds);
        if (lpError) throw lpError;
        progressRows = data;
      }

      const completedMap = new Map<string, boolean>();
      for (const row of progressRows ?? []) {
        if (row.lesson_id) completedMap.set(row.lesson_id, row.is_completed === true);
      }

      const lessonById = new Map<
        string,
        { vimeoVideoId: string; title: string; description: string | null }
      >();

      const modulesOut: CoursePlayerModule[] = modulesSorted.map((mod) => {
        let moduleSeconds = 0;
        const lessonsOut: CoursePlayerLesson[] = mod.lessons.map((lesson) => {
          const completed = completedMap.get(lesson.id) === true;

          if (lesson.vimeo_duration_s && lesson.vimeo_duration_s > 0) {
            moduleSeconds += lesson.vimeo_duration_s;
          }

          lessonById.set(lesson.id, {
            vimeoVideoId: lesson.vimeo_video_id,
            title: lesson.title,
            description: lesson.description,
          });

          return {
            id: lesson.id,
            title: lesson.title,
            duration: formatLessonDuration(lesson.vimeo_duration_s),
            completed,
          };
        });

        const done = lessonsOut.filter((l) => l.completed).length;
        const progress =
          lessonsOut.length === 0 ? 0 : Math.round((done / lessonsOut.length) * 100);

        return {
          id: mod.id,
          title: mod.title,
          progress,
          totalDuration: formatTotalDuration(moduleSeconds),
          lessons: lessonsOut,
        };
      });

      const aggPercent = (() => {
        if (orderedLessonIds.length === 0) return 0;
        const done = orderedLessonIds.filter((id) => completedMap.get(id) === true).length;
        return Math.round((done / orderedLessonIds.length) * 100);
      })();

      const defaultLessonId = isEnrolled ? orderedLessonIds[0] ?? null : null;

      return {
        courseId: course.id,
        title: course.title,
        description: course.description,
        shortDescription: course.short_description,
        thumbnailUrl: course.thumbnail_url,
        level: course.level,
        durationMinutes: course.duration_minutes,
        isEnrolled,
        enrollmentId,
        progressPercent: aggPercent,
        modules: modulesOut,
        lessonById,
        orderedLessonIds,
        defaultLessonId,
      };
    },
  });
}
