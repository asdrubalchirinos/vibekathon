-- Vibekathon — refuerzos de seguridad para la beta
-- Pega este archivo en el SQL Editor de Supabase (sobre la base que ya tiene
-- la migración inicial). Es seguro volver a ejecutarlo: usa drop if exists,
-- create or replace, etc.
--
-- Datos existentes:
--   * Textos más largos que el máximo se recortan.
--   * demo_url que no sea http(s) se deja en null.
--   * repo_url se intenta normalizar a https://github.com/...
--     Si alguna fila sigue sin cumplir el formato (envíos viejos raros),
--     la regla se añade NOT VALID: esas filas quedan, las nuevas sí se exigen.

-- ------------------------------------------------------------
-- 1. Limpiar datos que no cumplirían las nuevas reglas
-- ------------------------------------------------------------

update public.vibekathons
set title = 'Sin título'
where char_length(trim(title)) = 0;

update public.vibekathons
set title = left(title, 120)
where char_length(title) > 120;

update public.vibekathons
set description = left(description, 8000)
where char_length(description) > 8000;

update public.submissions
set description = left(description, 2000)
where char_length(description) > 2000;

update public.submissions
set repo_url = left(repo_url, 200)
where char_length(repo_url) > 200;

update public.submissions
set demo_url = left(demo_url, 500)
where demo_url is not null
  and char_length(demo_url) > 500;

-- http://github.com/... → https://
update public.submissions
set repo_url = regexp_replace(repo_url, '^http://', 'https://', 'i')
where repo_url ~* '^http://(www\.)?github\.com/';

update public.submissions
set demo_url = null
where demo_url is not null
  and demo_url !~* '^https?://[^[:space:]]+$';

delete from public.comments
where char_length(trim(body)) = 0;

update public.comments
set body = left(body, 2000)
where char_length(body) > 2000;

-- ------------------------------------------------------------
-- 2. Límites de largo y formato de URL
-- ------------------------------------------------------------

alter table public.vibekathons drop constraint if exists vibekathons_title_len;
alter table public.vibekathons
  add constraint vibekathons_title_len
  check (char_length(title) between 1 and 120);

alter table public.vibekathons drop constraint if exists vibekathons_description_len;
alter table public.vibekathons
  add constraint vibekathons_description_len
  check (char_length(description) <= 8000);

alter table public.submissions drop constraint if exists submissions_description_len;
alter table public.submissions
  add constraint submissions_description_len
  check (char_length(description) <= 2000);

alter table public.submissions drop constraint if exists submissions_repo_url_len;
alter table public.submissions
  add constraint submissions_repo_url_len
  check (char_length(repo_url) between 1 and 200);

alter table public.submissions drop constraint if exists submissions_demo_url_len;
alter table public.submissions
  add constraint submissions_demo_url_len
  check (demo_url is null or char_length(demo_url) <= 500);

alter table public.submissions drop constraint if exists submissions_demo_url_http;
alter table public.submissions
  add constraint submissions_demo_url_http
  check (demo_url is null or demo_url ~* '^https?://[^[:space:]]+$');

-- Formato GitHub. NOT VALID: no falla si hay envíos viejos raros.
alter table public.submissions drop constraint if exists submissions_repo_url_github;
alter table public.submissions
  add constraint submissions_repo_url_github
  check (
    repo_url ~* '^https://(www\.)?github\.com/[A-Za-z0-9._-]+/[A-Za-z0-9._-]+/?$'
  ) not valid;

alter table public.comments drop constraint if exists comments_body_len;
alter table public.comments
  add constraint comments_body_len
  check (char_length(body) between 1 and 2000);

-- ------------------------------------------------------------
-- 3. Ventana de fechas: envíos entre starts_at y ends_at
-- ------------------------------------------------------------

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
      and starts_at <= now()
      and ends_at >= now()
  );
$$;

create or replace function public.event_has_ended(event_id uuid)
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
      and ends_at < now()
  );
$$;

-- El participante edita solo mientras el evento está abierto (inicio → fin).
drop policy if exists "submissions_update_own_while_open" on public.submissions;
create policy "submissions_update_own_while_open"
  on public.submissions for update
  to authenticated
  using (
    participant_id = auth.uid()
    and public.event_is_open(vibekathon_id)
  )
  with check (
    participant_id = auth.uid()
    and public.event_is_open(vibekathon_id)
  );

-- ------------------------------------------------------------
-- 4. Puntaje y ganador solo DESPUÉS de ends_at
-- ------------------------------------------------------------

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

  if not public.event_has_ended(event_id) then
    raise exception 'El puntaje se asigna cuando el vibekathon ya terminó';
  end if;

  update public.submissions
  set score = new_score
  where id = sub_id;
end;
$$;

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

  if not public.event_has_ended(event_id) then
    raise exception 'El ganador se elige cuando el vibekathon ya terminó';
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

  -- Marca temporal: el trigger permite cambiar winner_submission_id.
  perform set_config('vibekathon.allow_set_winner', 'on', true);

  update public.vibekathons
  set winner_submission_id = sub_id
  where id = event_id;
end;
$$;

-- Un envío nuevo nunca trae puntaje (aunque alguien llame a la API directo).
create or replace function public.protect_submission_insert()
returns trigger
language plpgsql
as $$
begin
  new.score := null;
  return new;
end;
$$;

drop trigger if exists submissions_protect_insert on public.submissions;
create trigger submissions_protect_insert
  before insert on public.submissions
  for each row execute function public.protect_submission_insert();

-- ------------------------------------------------------------
-- 5. Ganador y token solo por sus funciones (no por UPDATE directo)
-- ------------------------------------------------------------

create or replace function public.protect_vibekathon_columns()
returns trigger
language plpgsql
as $$
begin
  if new.organizer_id is distinct from old.organizer_id then
    raise exception 'No puedes cambiar el organizador';
  end if;

  if new.id is distinct from old.id then
    raise exception 'No puedes cambiar el identificador del evento';
  end if;

  if new.invite_token is distinct from old.invite_token
     and current_setting('vibekathon.allow_invite_rotate', true) is distinct from 'on' then
    raise exception 'El link de invitación solo se cambia regenerándolo';
  end if;

  if new.winner_submission_id is distinct from old.winner_submission_id
     and current_setting('vibekathon.allow_set_winner', true) is distinct from 'on' then
    raise exception 'El ganador solo se elige con la acción correspondiente';
  end if;

  return new;
end;
$$;

drop trigger if exists vibekathons_protect_columns on public.vibekathons;
create trigger vibekathons_protect_columns
  before update on public.vibekathons
  for each row execute function public.protect_vibekathon_columns();

-- ------------------------------------------------------------
-- 6. Regenerar invitación: nuevo token + revocar accesos sin envío
-- ------------------------------------------------------------

create or replace function public.regenerate_invite(event_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_token text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
  end if;

  if not public.is_event_organizer(event_id) then
    raise exception 'Solo el organizador puede regenerar el link de invitación';
  end if;

  new_token := encode(gen_random_bytes(24), 'hex');

  perform set_config('vibekathon.allow_invite_rotate', 'on', true);

  update public.vibekathons
  set invite_token = new_token
  where id = event_id;

  -- Quienes ya enviaron un repo se quedan. El resto pierde el acceso.
  delete from public.event_access a
  where a.vibekathon_id = event_id
    and not exists (
      select 1
      from public.submissions s
      where s.vibekathon_id = a.vibekathon_id
        and s.participant_id = a.user_id
    );

  return new_token;
end;
$$;

-- ------------------------------------------------------------
-- 7. Máximo 5 eventos creados por usuario cada 24 horas
-- ------------------------------------------------------------

create or replace function public.enforce_event_create_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.vibekathons
    where organizer_id = new.organizer_id
      and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'Has alcanzado el límite de 5 vibekathons en 24 horas';
  end if;

  -- El token lo genera la base, no quien llama a la API.
  new.invite_token := encode(gen_random_bytes(24), 'hex');
  new.winner_submission_id := null;

  return new;
end;
$$;

drop trigger if exists vibekathons_create_rate on public.vibekathons;
create trigger vibekathons_create_rate
  before insert on public.vibekathons
  for each row execute function public.enforce_event_create_rate();

-- ------------------------------------------------------------
-- 8. Borrar lo propio
-- ------------------------------------------------------------

drop policy if exists "vibekathons_delete_organizer" on public.vibekathons;
create policy "vibekathons_delete_organizer"
  on public.vibekathons for delete
  to authenticated
  using (organizer_id = auth.uid());

drop policy if exists "submissions_delete_own" on public.submissions;
create policy "submissions_delete_own"
  on public.submissions for delete
  to authenticated
  using (participant_id = auth.uid());

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (author_id = auth.uid());

-- ------------------------------------------------------------
-- 9. Permisos: columnas sensibles fuera del UPDATE/INSERT normal
-- ------------------------------------------------------------

revoke all on table public.vibekathons from anon, authenticated;
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

grant insert (
  id,
  organizer_id,
  title,
  description,
  starts_at,
  ends_at,
  visibility,
  invite_token,
  created_at,
  updated_at
) on public.vibekathons to authenticated;

grant update (
  title,
  description,
  starts_at,
  ends_at,
  visibility,
  updated_at
) on public.vibekathons to authenticated;

grant delete on public.vibekathons to authenticated;

revoke all on table public.submissions from anon, authenticated;
grant select on public.submissions to anon, authenticated;
grant insert (
  id,
  vibekathon_id,
  participant_id,
  repo_url,
  demo_url,
  description,
  created_at,
  updated_at
) on public.submissions to authenticated;
grant update (
  repo_url,
  demo_url,
  description,
  updated_at
) on public.submissions to authenticated;
grant delete on public.submissions to authenticated;

revoke all on table public.comments from anon, authenticated;
grant select, insert, delete on public.comments to authenticated;

revoke all on table public.event_access from anon, authenticated;
grant select on public.event_access to authenticated;

revoke all on table public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert (id, github_username, avatar_url, created_at) on public.profiles to authenticated;
grant update (github_username, avatar_url) on public.profiles to authenticated;

-- Funciones: solo quien inició sesión (no anon / public).
revoke all on function public.regenerate_invite(uuid) from public, anon;
grant execute on function public.regenerate_invite(uuid) to authenticated;

revoke all on function public.get_invite_token(uuid) from public, anon;
grant execute on function public.get_invite_token(uuid) to authenticated;

revoke all on function public.redeem_invite(text) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;

revoke all on function public.set_submission_score(uuid, integer) from public, anon;
grant execute on function public.set_submission_score(uuid, integer) to authenticated;

revoke all on function public.set_winner(uuid, uuid) from public, anon;
grant execute on function public.set_winner(uuid, uuid) to authenticated;

grant execute on function public.event_has_ended(uuid) to authenticated;
grant execute on function public.event_is_open(uuid) to authenticated;
grant execute on function public.can_view_event(uuid) to anon, authenticated;
grant execute on function public.is_event_organizer(uuid) to authenticated;
