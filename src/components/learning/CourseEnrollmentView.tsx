import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseRatingPanel } from "@/components/learning/CourseRatingPanel";
import {
  groupCurriculumPreview,
  useCourseCurriculumPreview,
} from "@/hooks/learning/useCourseCurriculumPreview";
import type { UseMutationResult } from "@tanstack/react-query";
import type { LearningCoursePlayerView } from "@/hooks/learning/useLearningCoursePlayer";
import { formatCourseDurationMinutes, formatLessonDuration } from "@/lib/learning/formatDuration";
import { ArrowLeft, BookOpen, Clock, GraduationCap, Play, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function levelLabel(level: string): string {
  const l = level?.toLowerCase() ?? "";
  if (l === "beginner" || l === "iniciante") return "Iniciante";
  if (l === "intermediate" || l === "intermediario" || l === "intermediário") return "Intermediário";
  if (l === "advanced" || l === "avancado" || l === "avançado") return "Avançado";
  return level || "—";
}

type EnrollMutation = UseMutationResult<void, Error, string, unknown>;

type Props = {
  data: LearningCoursePlayerView;
  enroll: EnrollMutation;
};

export function CourseEnrollmentView({ data, enroll }: Props) {
  const { data: curriculumRows, isLoading: curriculumLoading } = useCourseCurriculumPreview(
    data.courseId,
    true,
  );
  const modules = groupCurriculumPreview(curriculumRows ?? []);
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10 space-y-8">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link to="/cursos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos cursos
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="space-y-8">
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="grid gap-0 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <div className="relative aspect-video md:aspect-auto md:min-h-[240px] bg-muted">
                  {data.thumbnailUrl ? (
                    <img
                      src={data.thumbnailUrl}
                      alt={data.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/80 via-primary/50 to-primary/20">
                      <BookOpen className="h-16 w-16 text-white/90" />
                    </div>
                  )}
                </div>
                <CardHeader className="p-6 md:p-8 flex flex-col justify-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {levelLabel(data.level)}
                    </Badge>
                    <Badge variant="outline" className="rounded-full gap-1 bg-background">
                      <Clock className="h-3 w-3" />
                      {formatCourseDurationMinutes(data.durationMinutes)}
                    </Badge>
                    {totalLessons > 0 ? (
                      <Badge variant="outline" className="rounded-full gap-1 bg-background">
                        <Video className="h-3 w-3" />
                        {totalLessons} aula{totalLessons === 1 ? "" : "s"}
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
                    {data.title}
                  </CardTitle>
                  {data.shortDescription ? (
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {data.shortDescription}
                    </p>
                  ) : null}
                </CardHeader>
              </div>
              {data.description ? (
                <CardContent className="px-6 pb-8 pt-0 md:px-8 border-t bg-card">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pt-6">
                    {data.description}
                  </p>
                </CardContent>
              ) : null}
            </Card>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Grade curricular</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Conteúdo em vídeo que você terá acesso após se matricular.
              </p>

              {curriculumLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : modules.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl border bg-card p-6">
                  Em breve: módulos e aulas serão publicados aqui.
                </p>
              ) : (
                <div className="space-y-4">
                  {modules.map((mod) => (
                    <Card key={mod.moduleId} className="overflow-hidden">
                      <CardHeader className="py-4 bg-muted/40 border-b">
                        <CardTitle className="text-base font-medium">{mod.moduleTitle}</CardTitle>
                        <p className="text-xs text-muted-foreground font-normal">
                          {mod.lessons.length} vídeo{mod.lessons.length === 1 ? "" : "s"}
                        </p>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ul className="divide-y">
                          {mod.lessons.map((lesson, idx) => (
                            <li
                              key={lesson.id}
                              className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-muted/30"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium leading-snug">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Vídeo · {formatLessonDuration(lesson.durationS)}
                                </p>
                              </div>
                              <Video className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <CourseRatingPanel courseId={data.courseId} />
          </div>

          <aside className="lg:sticky lg:top-24 space-y-4">
            <Card className="shadow-md border-primary/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Matrícula</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Confirme sua matrícula para assistir às aulas, registrar progresso e participar dos comentários.
                </p>
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  disabled={enroll.isPending}
                  onClick={() => enroll.mutate(data.courseId)}
                >
                  {enroll.isPending ? "Matriculando…" : "Matricular-me neste curso"}
                </Button>
                {enroll.isError ? (
                  <p className="text-xs text-destructive">
                    {(enroll.error as Error)?.message ?? "Não foi possível matricular."}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
