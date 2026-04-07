import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSearch } from "@/contexts/AppSearchContext";
import { BookOpen, CheckCircle2, ChevronRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLearningCatalog } from "@/hooks/learning/useLearningCourses";
import { cdnBanner } from "@/lib/cdn";

const Cursos = () => {
  const { data, isLoading, isError, error } = useLearningCatalog();
  const navigate = useNavigate();
  const cursos = useMemo(() => data?.courses ?? [], [data?.courses]);
  const completedCourseIds = useMemo(() => data?.completedCourseIds ?? [], [data?.completedCourseIds]);
  const completedSet = useMemo(() => new Set(completedCourseIds), [completedCourseIds]);
  const { query: headerQuery, setQuery: setHeaderQuery } = useAppSearch();

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [failedBannerIds, setFailedBannerIds] = useState<Record<string, boolean>>({});

  const categoryOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cursos) {
      if (c.category_id && c.categoryName) map.set(c.category_id, c.categoryName);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cursos]);

  const filteredCourses = useMemo(() => {
    const effectiveQuery = (headerQuery || q).trim().toLowerCase();
    let list = cursos;

    if (categoryId !== "all") {
      list = list.filter((c) => c.category_id === categoryId);
    }

    if (effectiveQuery) {
      list = list.filter((c) => {
        const hay = `${c.title} ${c.description ?? ""}`.toLowerCase();
        return hay.includes(effectiveQuery);
      });
    }

    return list;
  }, [cursos, headerQuery, q, categoryId]);

  const openCourse = (courseId: string) => {
    navigate(`/cursos/${courseId}`);
  };

  const bannerSlides = [
    {
      id: "banner-1",
      imageUrl: cdnBanner("1.jpg"),
      alt: "Banner promocional 1",
    },
    {
      id: "banner-2",
      imageUrl: cdnBanner("2.jpg"),
      alt: "Banner promocional 2",
    },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 py-6 md:py-8 space-y-6">
        <section className="w-full h-[400px] rounded-2xl border overflow-hidden bg-muted">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-2xl" />
          ) : (
            <Carousel
              className="h-full w-full"
              opts={{ loop: bannerSlides.length > 1, align: "start" }}
              plugins={
                bannerSlides.length > 1
                  ? [
                      Autoplay({
                        delay: 5500,
                        stopOnInteraction: false,
                        stopOnMouseEnter: true,
                      }),
                    ]
                  : []
              }
            >
              <CarouselContent className="h-[400px] -ml-0">
                {bannerSlides.map((banner) => (
                  <CarouselItem key={banner.id} className="pl-0 basis-full h-[400px] min-h-0">
                    <div className="relative h-full w-full">
                      {failedBannerIds[banner.id] ? (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/25 to-background flex items-end p-6 md:p-10">
                          <p className="text-white/95 text-lg md:text-2xl font-semibold drop-shadow-sm">
                            Banner indisponível no momento
                          </p>
                        </div>
                      ) : (
                        <>
                          <img
                            src={banner.imageUrl}
                            alt={banner.alt}
                            className="h-full w-full object-cover"
                            onError={() =>
                              setFailedBannerIds((prev) => ({
                                ...prev,
                                [banner.id]: true,
                              }))
                            }
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}
        </section>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Meus Cursos</h1>
            <p className="text-muted-foreground mt-1">
              Continue de onde parou, filtre por status e encontre rapidamente o que precisa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:items-center">
            <div className="relative w-full sm:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={headerQuery || q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setHeaderQuery(e.target.value);
                }}
                placeholder="Buscar cursos…"
                className="h-10 rounded-full pl-9"
              />
            </div>
            {categoryOptions.length > 0 ? (
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v as string | "all")}>
                <SelectTrigger className="h-10 w-full sm:w-[200px] rounded-full">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </div>

        {isError && (
          <p className="text-sm text-destructive mt-4">
            {(error as Error)?.message ?? "Não foi possível carregar os cursos."}
          </p>
        )}

        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[320px] rounded-2xl" />
              ))}
            </div>
          ) : !filteredCourses.length ? (
            <p className="text-muted-foreground">Nenhum curso disponível no momento.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((curso) => {
                const isCompleted = completedSet.has(curso.id);
                return (
                  <div key={curso.id} className="group">
                    <button
                      type="button"
                      onClick={() => openCourse(curso.id)}
                      className="block w-full text-left"
                    >
                      <Card className="h-full min-h-[320px] overflow-hidden rounded-2xl border bg-card hover:shadow-md transition-shadow">
                        <div
                          className={`relative p-6 pb-5 ${
                            isCompleted
                              ? "bg-emerald-600/70"
                              : "bg-primary"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-white">
                              <p className="text-base md:text-lg font-semibold leading-snug line-clamp-2">
                                {curso.title}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {curso.categoryName ? (
                                  <Badge className="bg-white/15 text-white border-white/15 hover:bg-white/20 text-xs px-3 py-1">
                                    {curso.categoryName}
                                  </Badge>
                                ) : null}
                                {curso.tagNames.map((tag) => (
                                  <Badge
                                    key={`${curso.id}-${tag}`}
                                    variant="secondary"
                                    className="bg-white/10 text-white border border-white/15 hover:bg-white/15 text-xs px-3 py-1"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-white/85">
                              <ChevronRight className="h-5 w-5" />
                            </div>
                          </div>
                        </div>

                        <CardHeader className="pt-6 space-y-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                            <span className="text-xs">Curso</span>
                            <span className="mx-1 text-muted-foreground/40">•</span>
                            <span className="text-xs">{isCompleted ? "Concluído" : "Disponível"}</span>
                          </div>
                          <CardDescription className="line-clamp-4 text-sm">
                            {curso.description || "Acesse o conteúdo completo do curso."}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cursos;
