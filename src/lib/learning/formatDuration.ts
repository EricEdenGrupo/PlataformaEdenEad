/** Duração total do curso (minutos no cadastro). */
export function formatCourseDurationMinutes(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return "—";
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}min` : `${h}h`;
  }
  return `${minutes} min`;
}

/** Duração de uma aula (segundos vindos do PostgREST). */
export function formatLessonDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "—";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

/** Soma de várias aulas (ex.: total do módulo). */
export function formatTotalDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${Math.max(0, m)}min`;
  return `${Math.max(1, m)} min`;
}
