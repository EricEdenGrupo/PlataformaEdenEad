-- Public-safe curriculum for pre-enrollment pages (no video IDs).
-- Security definer bypasses catalog.lessons RLS while only exposing titles and order.

create or replace function public.course_curriculum_preview(p_course_id uuid)
returns table (
  module_id uuid,
  module_title text,
  module_sort_order integer,
  lesson_id uuid,
  lesson_title text,
  lesson_sort_order integer,
  lesson_duration_s integer
)
language sql
stable
security definer
set search_path = catalog, public
as $$
  select
    m.id,
    m.title,
    m.sort_order,
    l.id,
    l.title,
    l.sort_order,
    coalesce(l.vimeo_duration_s, 0)::integer
  from catalog.modules m
  join catalog.lessons l on l.module_id = m.id
  join catalog.courses c on c.id = m.course_id
  where m.course_id = p_course_id
    and c.status = 'published'
    and c.deleted_at is null
    and m.status = 'published'
    and l.status = 'published'
  order by m.sort_order, l.sort_order;
$$;

revoke all on function public.course_curriculum_preview(uuid) from public;
grant execute on function public.course_curriculum_preview(uuid) to authenticated;
