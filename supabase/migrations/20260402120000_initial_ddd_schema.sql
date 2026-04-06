-- EAD Platform initial schema
-- Source of truth: .specs/specs.md

-- 1) Schemas
create schema if not exists identity;
create schema if not exists catalog;
create schema if not exists learning;
create schema if not exists notification;
create schema if not exists marketing;

-- 2) Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- 3) Shared enums
create type public.company_segment as enum (
  'Tecnologia', 'Instituição Financeira', 'Saúde', 'Educação',
  'Varejo', 'Farmacia', 'Industria', 'Consultoria', 'Distribuidora', 'Governo', 'Outros'
);

create type public.company_size as enum (
  'micro',
  'pequeno',
  'medio',
  'grande'
);

create type public.notification_type as enum (
  'system', 'course_update', 'comment_reply',
  'enrollment', 'certificate', 'manual'
);

create type public.banner_placement as enum (
  'home_hero', 'home_secondary', 'course_list',
  'course_detail', 'sidebar', 'global_top'
);

create type public.content_status as enum (
  'draft', 'published', 'archived'
);

create type public.material_type as enum (
  'pdf', 'spreadsheet', 'presentation', 'link', 'zip', 'other'
);

-- 4) Shared utility functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.attach_updated_at(target_table regclass)
returns void
language plpgsql
as $$
begin
  execute format(
    'create trigger trg_set_updated_at
     before update on %s
     for each row execute function public.set_updated_at()',
    target_table
  );
end;
$$;

create or replace function public.slugify(v text)
returns text
language plpgsql
as $$
begin
  return lower(regexp_replace(unaccent(trim(v)), '[^a-z0-9]+', '-', 'gi'));
end;
$$;

-- 5) Identity domain
create table identity.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  email           text not null unique,
  phone           text,
  avatar_url      text,
  street          text,
  complement      text,
  neighborhood    text,
  city            text,
  state           char(2),
  zip_code        text,
  country         char(2) not null default 'BR',
  onboarding_done boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

select public.attach_updated_at('identity.profiles'::regclass);

create table identity.onboarding_answers (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null unique
                       references identity.profiles(id) on delete cascade,
  job_title        text not null,
  company_segment  public.company_segment not null,
  company_size     public.company_size not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

select public.attach_updated_at('identity.onboarding_answers'::regclass);

create or replace function identity.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into identity.profiles (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'given_name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'family_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function identity.handle_new_user();

-- 6) Catalog domain
create table catalog.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon_url    text,
  parent_id   uuid references catalog.categories(id) on delete set null,
  sort_order  int not null default 0,
  status      public.content_status not null default 'published',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

select public.attach_updated_at('catalog.categories'::regclass);

create table catalog.courses (
  id               uuid primary key default gen_random_uuid(),
  category_id      uuid references catalog.categories(id) on delete set null,
  title            text not null,
  slug             text not null unique,
  description      text,
  short_description text,
  thumbnail_url    text,
  trailer_vimeo_id text,
  level            text not null default 'beginner',
  duration_minutes int,
  is_free          boolean not null default false,
  status           public.content_status not null default 'draft',
  published_at     timestamptz,
  created_by       uuid references identity.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

select public.attach_updated_at('catalog.courses'::regclass);

create table catalog.modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references catalog.courses(id) on delete cascade,
  title       text not null,
  description text,
  sort_order  int not null default 0,
  status      public.content_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

select public.attach_updated_at('catalog.modules'::regclass);

create table catalog.lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references catalog.modules(id) on delete cascade,
  title            text not null,
  description      text,
  vimeo_video_id   text not null,
  vimeo_duration_s int,
  sort_order       int not null default 0,
  is_preview       boolean not null default false,
  status           public.content_status not null default 'draft',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

select public.attach_updated_at('catalog.lessons'::regclass);

create table catalog.support_materials (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid references catalog.courses(id) on delete cascade,
  lesson_id    uuid references catalog.lessons(id) on delete cascade,
  title        text not null,
  type         public.material_type not null,
  url          text not null,
  file_size_kb int,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint chk_material_parent
    check (course_id is not null or lesson_id is not null)
);

select public.attach_updated_at('catalog.support_materials'::regclass);

create table catalog.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table catalog.course_tags (
  course_id uuid not null references catalog.courses(id) on delete cascade,
  tag_id    uuid not null references catalog.tags(id) on delete cascade,
  primary key (course_id, tag_id)
);

-- 7) Learning domain
create table learning.enrollments (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references identity.profiles(id) on delete cascade,
  course_id    uuid not null references catalog.courses(id) on delete cascade,
  enrolled_at  timestamptz not null default now(),
  completed_at timestamptz,
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (profile_id, course_id)
);

select public.attach_updated_at('learning.enrollments'::regclass);

create table learning.lesson_progress (
  id             uuid primary key default gen_random_uuid(),
  enrollment_id  uuid not null references learning.enrollments(id) on delete cascade,
  lesson_id      uuid not null references catalog.lessons(id) on delete cascade,
  watched_seconds int not null default 0,
  is_completed   boolean not null default false,
  completed_at   timestamptz,
  last_position_s int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);

select public.attach_updated_at('learning.lesson_progress'::regclass);

create table learning.comments (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references catalog.lessons(id) on delete cascade,
  profile_id uuid not null references identity.profiles(id) on delete cascade,
  parent_id  uuid references learning.comments(id) on delete cascade,
  body       text not null,
  is_pinned  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

select public.attach_updated_at('learning.comments'::regclass);

create table learning.course_ratings (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references catalog.courses(id) on delete cascade,
  profile_id uuid not null references identity.profiles(id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  review     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, profile_id)
);

select public.attach_updated_at('learning.course_ratings'::regclass);

create or replace function learning.calculate_course_progress(
  p_enrollment_id uuid
) returns numeric
language sql
stable
as $$
  select
    round(
      100.0 * count(*) filter (where lp.is_completed)
      / nullif(count(*), 0),
    2)
  from catalog.lessons l
  join catalog.modules m on m.id = l.module_id
  join learning.enrollments e on e.course_id = m.course_id
  left join learning.lesson_progress lp
         on lp.lesson_id = l.id and lp.enrollment_id = e.id
  where e.id = p_enrollment_id
    and l.status = 'published';
$$;

-- 8) Notification domain
create table notification.notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references identity.profiles(id) on delete cascade,
  type       public.notification_type not null,
  title      text not null,
  body       text not null,
  action_url text,
  metadata   jsonb not null default '{}',
  is_read    boolean not null default false,
  read_at    timestamptz,
  sent_at    timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

select public.attach_updated_at('notification.notifications'::regclass);

create index idx_notifications_profile_unread
  on notification.notifications (profile_id)
  where is_read = false;

create or replace function notification.notify_user(
  p_profile_id  uuid,
  p_type        public.notification_type,
  p_title       text,
  p_body        text,
  p_action_url  text default null,
  p_metadata    jsonb default '{}'
) returns uuid
language sql
as $$
  insert into notification.notifications
    (profile_id, type, title, body, action_url, metadata)
  values
    (p_profile_id, p_type, p_title, p_body, p_action_url, p_metadata)
  returning id;
$$;

-- 9) Marketing domain
create table marketing.banners (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  placement        public.banner_placement not null,
  image_url        text not null,
  image_alt        text,
  headline         text,
  subheadline      text,
  cta_label        text,
  cta_url          text,
  background_color text,
  is_active        boolean not null default false,
  starts_at        timestamptz,
  ends_at          timestamptz,
  sort_order       int not null default 0,
  created_by       uuid references identity.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

select public.attach_updated_at('marketing.banners'::regclass);

create index idx_banners_active_placement
  on marketing.banners (placement, sort_order)
  where is_active = true and deleted_at is null;

create or replace function marketing.active_banners(
  p_placement public.banner_placement
) returns setof marketing.banners
language sql
stable
as $$
  select * from marketing.banners
  where placement  = p_placement
    and is_active  = true
    and deleted_at is null
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >  now())
  order by sort_order;
$$;

-- 10) Auth helpers + RLS
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select (auth.jwt()->>'app_role') = 'admin';
$$;

alter table identity.profiles enable row level security;
create policy profiles_select_own on identity.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on identity.profiles
  for update using (id = auth.uid());
create policy profiles_admin_all on identity.profiles
  for all using (public.is_admin());

alter table identity.onboarding_answers enable row level security;
create policy onboarding_select_own on identity.onboarding_answers
  for select using (profile_id = auth.uid() or public.is_admin());
create policy onboarding_insert_own on identity.onboarding_answers
  for insert with check (profile_id = auth.uid());
create policy onboarding_update_own on identity.onboarding_answers
  for update using (profile_id = auth.uid());

alter table catalog.categories enable row level security;
create policy cat_read_all on catalog.categories
  for select using (status = 'published' or public.is_admin());
create policy cat_admin_all on catalog.categories
  for all using (public.is_admin());

alter table catalog.courses enable row level security;
create policy courses_read on catalog.courses
  for select using (
    (status = 'published' and deleted_at is null and auth.uid() is not null)
    or public.is_admin()
  );
create policy courses_admin_all on catalog.courses
  for all using (public.is_admin());

alter table catalog.modules enable row level security;
create policy modules_read on catalog.modules
  for select using (
    exists (
      select 1 from catalog.courses c
      where c.id = course_id and c.status = 'published' and c.deleted_at is null
    ) or public.is_admin()
  );
create policy modules_admin_all on catalog.modules
  for all using (public.is_admin());

alter table catalog.lessons enable row level security;
create policy lessons_read on catalog.lessons
  for select using (
    is_preview = true
    or exists (
      select 1 from learning.enrollments e
      join catalog.modules m on m.id = module_id
      where e.profile_id = auth.uid() and e.course_id = m.course_id
    )
    or public.is_admin()
  );
create policy lessons_admin_all on catalog.lessons
  for all using (public.is_admin());

alter table catalog.support_materials enable row level security;
create policy materials_read on catalog.support_materials
  for select using (
    exists (
      select 1
      from catalog.courses c
      where c.id = course_id and c.status = 'published' and c.deleted_at is null
    )
    or exists (
      select 1
      from catalog.lessons l
      join catalog.modules m on m.id = l.module_id
      join catalog.courses c on c.id = m.course_id
      where l.id = lesson_id and c.status = 'published' and c.deleted_at is null
    )
    or public.is_admin()
  );
create policy materials_admin_all on catalog.support_materials
  for all using (public.is_admin());

alter table catalog.tags enable row level security;
create policy tags_read_all on catalog.tags
  for select using (auth.uid() is not null or public.is_admin());
create policy tags_admin_all on catalog.tags
  for all using (public.is_admin());

alter table catalog.course_tags enable row level security;
create policy course_tags_read on catalog.course_tags
  for select using (
    exists (
      select 1 from catalog.courses c
      where c.id = course_id and c.status = 'published' and c.deleted_at is null
    ) or public.is_admin()
  );
create policy course_tags_admin_all on catalog.course_tags
  for all using (public.is_admin());

alter table learning.enrollments enable row level security;
create policy enrollments_own on learning.enrollments
  for select using (profile_id = auth.uid() or public.is_admin());
create policy enrollments_insert on learning.enrollments
  for insert with check (profile_id = auth.uid());
create policy enrollments_update_own on learning.enrollments
  for update using (profile_id = auth.uid() or public.is_admin());

alter table learning.lesson_progress enable row level security;
create policy progress_own on learning.lesson_progress
  for all using (
    exists (
      select 1
      from learning.enrollments e
      where e.id = enrollment_id and e.profile_id = auth.uid()
    ) or public.is_admin()
  );

alter table learning.comments enable row level security;
create policy comments_read on learning.comments
  for select using (deleted_at is null and auth.uid() is not null);
create policy comments_insert on learning.comments
  for insert with check (profile_id = auth.uid());
create policy comments_delete_own on learning.comments
  for update using (profile_id = auth.uid() or public.is_admin());

alter table learning.course_ratings enable row level security;
create policy ratings_read on learning.course_ratings
  for select using (auth.uid() is not null or public.is_admin());
create policy ratings_insert_own on learning.course_ratings
  for insert with check (profile_id = auth.uid() or public.is_admin());
create policy ratings_update_own on learning.course_ratings
  for update using (profile_id = auth.uid() or public.is_admin());

alter table notification.notifications enable row level security;
create policy notif_select_own on notification.notifications
  for select using (profile_id = auth.uid() or public.is_admin());
create policy notif_update_own on notification.notifications
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
create policy notif_admin_all on notification.notifications
  for all using (public.is_admin());

alter table marketing.banners enable row level security;
create policy banners_read_active on marketing.banners
  for select using (
    (is_active = true and deleted_at is null)
    or public.is_admin()
  );
create policy banners_admin_write on marketing.banners
  for all using (public.is_admin());

-- 11) Indexes
create index idx_profiles_email on identity.profiles (email);
create index idx_profiles_deleted on identity.profiles (deleted_at) where deleted_at is not null;

create index idx_courses_category on catalog.courses (category_id);
create index idx_courses_status on catalog.courses (status) where deleted_at is null;
create index idx_courses_slug on catalog.courses (slug);
create index idx_modules_course on catalog.modules (course_id, sort_order);
create index idx_lessons_module on catalog.lessons (module_id, sort_order);

create index idx_enrollments_profile on learning.enrollments (profile_id);
create index idx_enrollments_course on learning.enrollments (course_id);
create index idx_progress_enrollment on learning.lesson_progress (enrollment_id);
create index idx_comments_lesson on learning.comments (lesson_id) where deleted_at is null;
create index idx_comments_parent on learning.comments (parent_id) where parent_id is not null;

create index idx_notif_profile_sent on notification.notifications (profile_id, sent_at desc);

create index idx_courses_fts on catalog.courses
  using gin (to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(description, '')));

-- 12) Realtime publication
do $$
begin
  alter publication supabase_realtime add table notification.notifications;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table learning.lesson_progress;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table learning.comments;
exception
  when duplicate_object then null;
end $$;

