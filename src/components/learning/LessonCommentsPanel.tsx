import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateLessonComment, useLessonComments, useSoftDeleteLessonComment } from "@/hooks/learning/useLessonComments";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function LessonCommentsPanel({ lessonId }: { lessonId: string | null }) {
  const { data: rows, isLoading } = useLessonComments(lessonId ?? undefined);
  const create = useCreateLessonComment(lessonId ?? undefined);
  const remove = useSoftDeleteLessonComment(lessonId ?? undefined);
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  if (!lessonId) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        Selecione uma aula para ver os comentários.
      </div>
    );
  }

  const submit = () => {
    create.mutate(body, {
      onSuccess: () => setBody(""),
    });
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <h3 className="text-sm font-semibold">Comentários da aula</h3>

      <div className="space-y-2">
        <Textarea
          placeholder="Escreva um comentário…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          disabled={create.isPending}
          className="resize-none text-sm"
        />
        <Button type="button" size="sm" disabled={create.isPending || !body.trim()} onClick={submit}>
          Publicar
        </Button>
        {create.isError ? (
          <p className="text-xs text-destructive">{(create.error as Error)?.message ?? "Não foi possível publicar."}</p>
        ) : null}
      </div>

      <div className="border-t pt-3 space-y-3 max-h-64 overflow-y-auto">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : !rows?.length ? (
          <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
        ) : (
          rows
            .filter((c) => !c.parent_id)
            .map((c) => (
              <div key={c.id} className="text-sm rounded-lg border bg-background/50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {userId && c.profile_id === userId ? "Você" : "Aluno"} ·{" "}
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                  {userId && c.profile_id === userId ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(c.id)}
                      aria-label="Remover comentário"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
