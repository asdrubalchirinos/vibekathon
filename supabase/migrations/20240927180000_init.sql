-- Vibekathon — esquema inicial
-- Puedes pegar este archivo en el SQL Editor de Supabase
-- o aplicarlo con: supabase db push / supabase migration up

-- ------------------------------------------------------------
-- Tablas
-- ------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  github_username text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.vibekathons (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  visibility text not null default 'public'
    check (visibility in ('public', 'private')),
  -- Token secreto para el link de invitación de eventos privados.
  invite_token text unique default encode(gen_random_bytes(24), 'hex'),
  winner_submission_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- Quién redimió un link de invitación (necesario para ver un evento privado).
create table public.event_access (
  vibekathon_id uuid not null references public.vibekathons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (vibekathon_id, user_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  vibekathon_id uuid not null references public.vibekathons (id) on delete cascade,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  repo_url text not null,
  demo_url text,
  description text not null default '',
  -- Puntaje 1–10 que pone el organizador. Null = todavía no votó.
  score integer check (score is null or (score >= 1 and score <= 10)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vibekathon_id, participant_id)
);

-- El ganador se elige después de crear envíos, por eso el FK va aquí.
alter table public.vibekathons
  add constraint vibekathons_winner_submission_id_fkey
  foreign key (winner_submission_id)
  references public.submissions (id)
  on delete set null;

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index vibekathons_visibility_starts_idx
  on public.vibekathons (visibility, starts_at desc);

create index submissions_event_idx
  on public.submissions (vibekathon_id);

create index comments_submission_idx
  on public.comments (submission_id);

create index event_access_user_idx
  on public.event_access (user_id);

-- ------------------------------------------------------------
-- updated_at automático
-- ------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vibekathons_touch_updated_at
  before update on public.vibekathons
  for each row execute function public.touch_updated_at();

create trigger submissions_touch_updated_at
  before update on public.submissions
  for each row execute function public.touch_updated_at();

-- El participante no puede cambiarse el puntaje ni mover el envío de evento.
create or replace function public.protect_submission_columns()
returns trigger
language plpgsql
as $$
begin
  if new.participant_id is distinct from old.participant_id
     or new.vibekathon_id is distinct from old.vibekathon_id then
    raise exception 'No puedes cambiar el participante o el evento';
  end if;

  if new.score is distinct from old.score
     and not public.is_event_organizer(old.vibekathon_id) then
    raise exception 'Solo el organizador puede cambiar el puntaje';
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- Perfil al registrarse (GitHub: user_name + avatar_url)
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, github_username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'user_name',
      new.raw_user_meta_data ->> 'preferred_username',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Funciones SECURITY DEFINER
-- Evitan recursión de RLS (una política no debe leer otra tabla
-- cuya política a su vez lee la primera).
-- ------------------------------------------------------------

create or replace function public.is_event_organizer(event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vibekathons
    where id = event_id
      and organizer_id = auth.uid()
  );
$$;

create trigger submissions_protect_columns
  before update on public.submissions
  for each row execute function public.protect_submission_columns();

create or replace function public.can_view_event(event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vibekathons v
    where v.id = event_id
      and (
        v.visibility = 'public'
        or v.organizer_id = auth.uid()
        or exists (
          select 1
          from public.event_access a
          where a.vibekathon_id = v.id
            and a.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.event_is_open(event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vibekathons
    where id = event_id
      and ends_at >= now()
  );
$$;

-- El token de invitación no viaja en el SELECT normal (ver grants abajo).
create or replace function public.get_invite_token(event_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select invite_token
  from public.vibekathons
  where id = event_id
    and organizer_id = auth.uid();
$$;

-- Redimir un link /invite/[token]: da acceso al evento privado.
create or replace function public.redeem_invite(token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para aceptar la invitación';
  end if;

  select id into event_id
  from public.vibekathons
  where invite_token = token;

  if event_id is null then
    raise exception 'Esta invitación no es válida';
  end if;

  insert into public.event_access (vibekathon_id, user_id)
  values (event_id, auth.uid())
  on conflict do nothing;

  return event_id;
end;
$$;

-- El organizador pone un puntaje 1–10 (o lo quita con null).
create or replace function public.set_submission_score(sub_id uuid, new_score integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
begin
  if new_score is not null and (new_score < 1 or new_score > 10) then
    raise exception 'El puntaje debe estar entre 1 y 10';
  end if;

  select vibekathon_id into event_id
  from public.submissions
  where id = sub_id;

  if event_id is null then
    raise exception 'Envío no encontrado';
  end if;

  if not public.is_event_organizer(event_id) then
    raise exception 'Solo el organizador puede puntuar';
  end if;

  update public.submissions
  set score = new_score
  where id = sub_id;
end;
$$;

-- El organizador marca un envío como ganador (o lo desmarca).
create or replace function public.set_winner(event_id uuid, sub_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_event_organizer(event_id) then
    raise exception 'Solo el organizador puede elegir ganador';
  end if;

  if sub_id is not null then
    if not exists (
      select 1
      from public.submissions
      where id = sub_id
        and vibekathon_id = event_id
    ) then
      raise exception 'Ese envío no pertenece a este vibekathon';
    end if;
  end if;

  update public.vibekathons
  set winner_submission_id = sub_id
  where id = event_id;
end;
$$;

-- ------------------------------------------------------------
-- Permisos
-- ------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

-- El token de invitación no se entrega en SELECT: solo get_invite_token().
grant select (
  id,
  organizer_id,
  title,
  description,
  starts_at,
  ends_at,
  visibility,
  winner_submission_id,
  created_at,
  updated_at
) on public.vibekathons to anon, authenticated;

grant insert, update on public.vibekathons to authenticated;

grant select, insert on public.event_access to authenticated;

grant select on public.submissions to anon, authenticated;
grant insert, update on public.submissions to authenticated;

grant select, insert on public.comments to authenticated;

grant execute on function public.get_invite_token(uuid) to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.set_submission_score(uuid, integer) to authenticated;
grant execute on function public.set_winner(uuid, uuid) to authenticated;
grant execute on function public.can_view_event(uuid) to anon, authenticated;
grant execute on function public.is_event_organizer(uuid) to authenticated;
grant execute on function public.event_is_open(uuid) to authenticated;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.vibekathons enable row level security;
alter table public.event_access enable row level security;
alter table public.submissions enable row level security;
alter table public.comments enable row level security;

-- Perfiles: visibles (nombre y avatar en las páginas).
-- Solo puedes editar el tuyo. El INSERT lo hace el trigger.
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- Eventos: públicos para todos; privados solo organizador o invitados.
create policy "vibekathons_select_visible"
  on public.vibekathons for select
  using (public.can_view_event(id));

create policy "vibekathons_insert_own"
  on public.vibekathons for insert
  to authenticated
  with check (organizer_id = auth.uid());

create policy "vibekathons_update_organizer"
  on public.vibekathons for update
  to authenticated
  using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid());

-- Acceso por invitación: ves las filas tuyas o las de eventos que organizas.
create policy "event_access_select_own_or_organizer"
  on public.event_access for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_event_organizer(vibekathon_id)
  );

-- El INSERT normal lo hace redeem_invite (security definer).
-- No damos INSERT directo para que nadie se auto-invite sin token.

-- Envíos: visibles si puedes ver el evento.
create policy "submissions_select_if_event_visible"
  on public.submissions for select
  using (public.can_view_event(vibekathon_id));

create policy "submissions_insert_own_while_open"
  on public.submissions for insert
  to authenticated
  with check (
    participant_id = auth.uid()
    and public.can_view_event(vibekathon_id)
    and public.event_is_open(vibekathon_id)
  );

-- El participante edita su envío (repo, demo, texto) mientras el evento está abierto.
-- El puntaje lo cambia set_submission_score (security definer), no esta política.
create policy "submissions_update_own_while_open"
  on public.submissions for update
  to authenticated
  using (
    participant_id = auth.uid()
    and public.event_is_open(vibekathon_id)
  )
  with check (
    participant_id = auth.uid()
  );

-- Comentarios: solo organizador del evento y dueño del envío.
create policy "comments_select_organizer_or_participant"
  on public.comments for select
  to authenticated
  using (
    exists (
      select 1
      from public.submissions s
      where s.id = comments.submission_id
        and (
          s.participant_id = auth.uid()
          or public.is_event_organizer(s.vibekathon_id)
        )
    )
  );

create policy "comments_insert_organizer_or_participant"
  on public.comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.submissions s
      where s.id = comments.submission_id
        and (
          s.participant_id = auth.uid()
          or public.is_event_organizer(s.vibekathon_id)
        )
    )
  );
