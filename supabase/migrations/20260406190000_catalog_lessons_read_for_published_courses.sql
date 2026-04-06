-- Allow authenticated learners to read published lessons for published courses,
-- without requiring an enrollment row. Previously only is_preview or enrollment
-- could see rows, which broke nested selects (modules with empty lessons) and
-- the Vimeo player on the course page.

drop policy if exists lessons_read on catalog.lessons;

create policy lessons_read on catalog.lessons
  for select using (
    public.is_admin()
    or is_preview = true
    or (
      status = 'published'
      and exists (
        select 1
        from catalog.modules m
        join catalog.courses c on c.id = m.course_id
        where m.id = module_id
          and c.status = 'published'
          and c.deleted_at is null
      )
    )
    or exists (
      select 1
      from learning.enrollments e
      join catalog.modules m on m.id = module_id
      where e.profile_id = auth.uid()
        and e.course_id = m.course_id
    )
  );
