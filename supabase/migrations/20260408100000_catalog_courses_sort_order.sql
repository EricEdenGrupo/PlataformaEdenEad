-- Display order on the learning catalog: lower sort_order first; NULLs after explicit values.
alter table catalog.courses
  add column if not exists sort_order integer null;

comment on column catalog.courses.sort_order is
  'Catalog priority (ascending). NULL: order by title, then created_at desc.';

create index if not exists idx_courses_catalog_sort
  on catalog.courses (sort_order nulls last, title asc, created_at desc)
  where deleted_at is null and status = 'published';
