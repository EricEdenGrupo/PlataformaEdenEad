import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import VideoPlayer, { type VimeoPlayerCallbacks } from "@/components/VideoPlayer";
import LessonList from "@/components/LessonList";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { useLearningCoursePlayer } from "@/hooks/learning/useLearningCoursePlayer";
import { useLearningLessonTracking } from "@/hooks/learning/useLearningLessonTracking";
import { useEnrollInCourse } from "@/hooks/learning/useEnrollInCourse";
import { CourseRatingPanel } from "@/components/learning/CourseRatingPanel";
import { CourseEnrollmentView } from "@/components/learning/CourseEnrollmentView";
import { LessonCommentsPanel } from "@/components/learning/LessonCommentsPanel";
import { Skeleton } from "@/components/ui/skeleton";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const Course = () => {
  const { courseId } = useParams();
  const { data, isLoading, isError, error } = useLearningCoursePlayer(courseId);
  const { trackPlayback } = useLearningLessonTracking();
  const enroll = useEnrollInCourse();
  const [lessonId, setLessonId] = useState<string | null>(null);

  useEffect(() => {
    setLessonId(null);
  }, [courseId]);

  useEffect(() => {
    if (!data?.defaultLessonId) return;
    setLessonId(data.defaultLessonId);
  }, [courseId, data?.defaultLessonId]);

  const active = lessonId ? data?.lessonById.get(lessonId) : undefined;

  const lastTimeLogRef = useRef(0);
  const vimeoCallbacks = useMemo<VimeoPlayerCallbacks>(
    () => ({
      play: (d) => {
        if (!data || !lessonId || !courseId || !data.enrollmentId) return;
        void trackPlayback({
          lessonId,
          courseId,
          enrollmentId: data.enrollmentId,
          orderedLessonIds: data.orderedLessonIds,
          seconds: d.seconds,
          duration: d.duration,
        });
        if (import.meta.env.DEV) {
          console.debug("[vimeo] play", { courseId, lessonId, seconds: d.seconds, duration: d.duration });
        }
      },
      pause: (d) => {
        if (!data || !lessonId || !courseId || !data.enrollmentId) return;
        void trackPlayback({
          lessonId,
          courseId,
          enrollmentId: data.enrollmentId,
          orderedLessonIds: data.orderedLessonIds,
          seconds: d.seconds,
          duration: d.duration,
        });
        if (import.meta.env.DEV) {
          console.debug("[vimeo] pause", { courseId, lessonId, seconds: d.seconds });
        }
      },
      ended: (d) => {
        if (!data || !lessonId || !courseId || !data.enrollmentId) return;
        void trackPlayback({
          lessonId,
          courseId,
          enrollmentId: data.enrollmentId,
          orderedLessonIds: data.orderedLessonIds,
          seconds: d.seconds,
          duration: d.duration,
          markCompleted: true,
        });
        if (import.meta.env.DEV) {
          console.debug("[vimeo] ended", { courseId, lessonId, seconds: d.seconds });
        }
      },
      timeupdate: (d) => {
        const now = Date.now();
        if (now - lastTimeLogRef.current < 1000) return;
        lastTimeLogRef.current = now;
        if (data && lessonId && courseId && data.enrollmentId) {
          void trackPlayback({
            lessonId,
            courseId,
            enrollmentId: data.enrollmentId,
            orderedLessonIds: data.orderedLessonIds,
            seconds: d.seconds,
            duration: d.duration,
          });
        }
        if (import.meta.env.DEV) {
          console.debug("[vimeo] timeupdate", {
            courseId,
            lessonId,
            seconds: d.seconds,
            percent: d.percent,
            duration: d.duration,
          });
        }
      },
      error: (e) => {
        if (import.meta.env.DEV) console.warn("[vimeo] error", e);
      },
    }),
    [courseId, data, lessonId, trackPlayback],
  );

  const invalidId = !!courseId && !UUID_RE.test(courseId);

  if (invalidId) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cursos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos cursos
          </Link>
        </Button>
        <p className="text-muted-foreground">Identificador de curso inválido.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="aspect-video w-full max-w-5xl mx-auto rounded-lg" />
          <Skeleton className="h-24 w-full max-w-5xl mx-auto" />
        </div>
        <aside className="w-full lg:w-96 border-l bg-card p-6 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </aside>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cursos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos cursos
          </Link>
        </Button>
        <p className="text-destructive text-sm">{(error as Error)?.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/cursos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos cursos
          </Link>
        </Button>
        <p className="text-muted-foreground">Curso não encontrado ou não publicado.</p>
      </div>
    );
  }

  if (!data.isEnrolled) {
    return <CourseEnrollmentView data={data} enroll={enroll} />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" asChild>
            <Link to="/cursos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos cursos
            </Link>
          </Button>

          {active?.vimeoVideoId ? (
            <VideoPlayer
              key={`${lessonId}-${active.vimeoVideoId}`}
              videoId={active.vimeoVideoId}
              type="vimeo"
              vimeoCallbacks={vimeoCallbacks}
            />
          ) : (
            <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
              Selecione uma aula com vídeo
            </div>
          )}

          <div className="mt-6">
            <h1 className="text-2xl font-bold mb-2">{active?.title ?? data.title}</h1>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {active?.description || data.description || "—"}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <LessonCommentsPanel lessonId={lessonId} />
            <CourseRatingPanel courseId={data.courseId} />
          </div>
        </div>
      </div>

      <aside className="w-full lg:w-96 border-l bg-card p-6 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold flex-1">{data.title}</h2>
              <Button variant="ghost" size="icon" className="flex-shrink-0" type="button">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <Progress value={data.progressPercent} className="h-2 mb-2" />
            <div className="text-sm text-muted-foreground">{data.progressPercent}%</div>
          </div>

          <LessonList
            key={data.courseId}
            modules={data.modules}
            currentLessonId={lessonId ?? undefined}
            onLessonClick={setLessonId}
            expandAllModules
          />

        </div>
      </aside>
    </div>
  );
};

export default Course;
