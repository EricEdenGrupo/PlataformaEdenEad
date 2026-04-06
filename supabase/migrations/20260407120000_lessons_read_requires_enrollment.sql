-- Lessons are readable only for preview lessons, enrolled learners, or admins.
-- Reverts the temporary policy that exposed all published lessons without enrollment.

drop policy if exists lessons_read on catalog.lessons;

create policy lessons_read on catalog.lessons
  for select using (
    public.is_admin()
    or is_preview = true
    or exists (
      select 1
      from learning.enrollments e
      join catalog.modules m on m.id = module_id
      where e.profile_id = auth.uid()
        and e.course_id = m.course_id
    )
  );
