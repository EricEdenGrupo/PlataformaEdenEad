import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCourseRatings, useMyCourseRating, useUpsertMyCourseRating } from "@/hooks/learning/useCourseRating";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function CourseRatingPanel({ courseId }: { courseId: string }) {
  const { data: stats, isLoading: statsLoading } = useCourseRatings(courseId);
  const { data: mine, isLoading: mineLoading } = useMyCourseRating(courseId);
  const save = useUpsertMyCourseRating(courseId);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  useEffect(() => {
    if (!mine) {
      setRating(0);
      setReview("");
      return;
    }
    setRating(mine.rating);
    setReview(mine.review ?? "");
  }, [mine]);

  const busy = statsLoading || mineLoading || save.isPending;
  const avg = stats?.average;
  const count = stats?.count ?? 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Avaliação do curso</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {statsLoading
            ? "Carregando…"
            : count === 0
              ? "Nenhuma avaliação ainda. Seja o primeiro."
              : avg != null
                ? `Média ${avg.toFixed(1)} de 5 · ${count} avaliação${count === 1 ? "" : "s"}`
                : "—"}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={busy}
            className="p-0.5 rounded-md hover:bg-muted disabled:opacity-50"
            onClick={() => setRating(n)}
            aria-label={`${n} estrelas`}
          >
            <Star
              className={cn(
                "h-6 w-6",
                n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">{rating > 0 ? `${rating}/5` : "Escolha uma nota"}</span>
      </div>

      <Textarea
        placeholder="Comentário sobre o curso (opcional)"
        value={review}
        onChange={(e) => setReview(e.target.value)}
        rows={3}
        disabled={busy}
        className="resize-none text-sm"
      />

      <Button
        type="button"
        size="sm"
        disabled={busy || rating < 1 || rating > 5}
        onClick={() => save.mutate({ rating, review })}
      >
        {mine ? "Atualizar avaliação" : "Enviar avaliação"}
      </Button>

      {save.isError ? (
        <p className="text-xs text-destructive">{(save.error as Error)?.message ?? "Não foi possível salvar."}</p>
      ) : null}

      {stats?.rows?.length ? (
        <div className="border-t pt-3 space-y-2 max-h-40 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground">Avaliações recentes</p>
          {stats.rows
            .filter((r) => r.id !== mine?.id)
            .slice(0, 8)
            .map((r) => (
            <div key={r.id} className="text-xs rounded-md bg-muted/40 px-2 py-1.5">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              {r.review ? <p className="mt-1 text-foreground">{r.review}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
