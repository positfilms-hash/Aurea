-- ============================================================
--  AUREA · Migración inicial
--  Pega este archivo completo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================


-- ============================
-- EXTENSIONES
-- ============================
create extension if not exists "uuid-ossp";


-- ============================
-- FUNCIÓN AUXILIAR: updated_at automático
-- ============================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================
-- TABLA: profiles
-- Perfil público de cada usuario, extiende auth.users
-- ============================
create table public.profiles (
  id               uuid        primary key references auth.users(id) on delete cascade,
  nombre           text        not null,
  apellido         text        not null default '',
  email            text        not null unique,
  avatar_url       text,
  avatar_color     text        not null default '#C8973A',
  bio              text,
  frase            text,                          -- "Una frase sobre ti"
  ubicacion        text,
  rol              text        not null default 'discipulo'
                               check (rol in ('maestro','discipulo','ambos')),
  constancia_score integer     not null default 50
                               check (constancia_score between 0 and 100),
  verified         boolean     not null default false,
  activo           boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function set_updated_at();


-- ============================
-- TABLA: maestro_perfiles
-- Datos exclusivos del rol maestro (relación 1:1 con profiles)
-- ============================
create table public.maestro_perfiles (
  id                     uuid        primary key references public.profiles(id) on delete cascade,
  disciplina             text        not null,
  categoria              text        not null
                                     check (categoria in (
                                       'Filosofía','Artes','Oficios','Deportes',
                                       'Espiritualidad','Ciencia','Lenguas','Otra'
                                     )),
  hashtags               text[]      not null default '{}',
  experiencia_anos       integer     check (experiencia_anos >= 0),
  formato                text        not null default 'ambos'
                                     check (formato in ('presencial','online','ambos')),
  disponibilidad_dias    text,                   -- "Martes y jueves"
  horas_semanales        text,                   -- "3–4 h"
  radio_km               integer,                -- radio presencial en km
  max_discipulos         integer     not null default 4
                                     check (max_discipulos between 1 and 10),
  acepta_solicitudes     boolean     not null default true,
  -- Requisitos mínimos para discípulos
  constancia_minima      integer     not null default 0
                                     check (constancia_minima between 0 and 100),
  motivacion_obligatoria boolean     not null default true,
  nivel_requerido        text        check (nivel_requerido in ('principiante','intermedio','avanzado')),
  requisitos_libres      text[],                 -- requisitos en texto libre
  -- Estadísticas calculadas
  reputacion             numeric(3,2) check (reputacion between 0 and 5),
  num_resenas            integer     not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger trg_maestro_perfiles_updated_at
  before update on public.maestro_perfiles
  for each row execute function set_updated_at();

-- Índices para la página Discover
create index idx_maestro_categoria   on public.maestro_perfiles (categoria);
create index idx_maestro_hashtags    on public.maestro_perfiles using gin (hashtags);
create index idx_maestro_disciplina  on public.maestro_perfiles
  using gin (to_tsvector('spanish', disciplina));
create index idx_maestro_acepta      on public.maestro_perfiles (acepta_solicitudes)
  where acepta_solicitudes = true;


-- ============================
-- TABLA: trayectoria
-- Entradas de trayectoria del maestro (relación 1:N)
-- ============================
create table public.trayectoria (
  id          uuid        primary key default uuid_generate_v4(),
  maestro_id  uuid        not null references public.profiles(id) on delete cascade,
  periodo     text        not null,   -- "2012–hoy", "2020", "2015–2018"
  titulo      text        not null,
  descripcion text,
  orden       integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_trayectoria_maestro on public.trayectoria (maestro_id, orden);


-- ============================
-- TABLA: solicitudes
-- Petición de discípulo → maestro para iniciar una relación
-- ============================
create table public.solicitudes (
  id           uuid        primary key default uuid_generate_v4(),
  discipulo_id uuid        not null references public.profiles(id) on delete cascade,
  maestro_id   uuid        not null references public.profiles(id) on delete cascade,
  disciplina   text        not null,
  motivacion   text,
  estado       text        not null default 'nueva'
                           check (estado in ('nueva','vista','aceptada','rechazada')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_solicitudes_updated_at
  before update on public.solicitudes
  for each row execute function set_updated_at();

create index idx_solicitudes_maestro   on public.solicitudes (maestro_id, estado);
create index idx_solicitudes_discipulo on public.solicitudes (discipulo_id, estado);

-- Solo puede existir una solicitud pendiente (nueva o vista) entre el mismo par
create unique index uq_solicitud_activa
  on public.solicitudes (discipulo_id, maestro_id)
  where estado in ('nueva', 'vista');


-- ============================
-- TABLA: relaciones
-- Relación activa o histórica entre maestro y discípulo
-- ============================
create table public.relaciones (
  id                  uuid        primary key default uuid_generate_v4(),
  maestro_id          uuid        not null references public.profiles(id) on delete restrict,
  discipulo_id        uuid        not null references public.profiles(id) on delete restrict,
  disciplina          text        not null,
  solicitud_id        uuid        references public.solicitudes(id) on delete set null,
  estado              text        not null default 'prueba'
                                  check (estado in ('prueba','consolidada','pausada','finalizada','cancelada')),
  -- Decisiones en "sobre cerrado" al terminar el periodo de prueba.
  -- null = aún no ha decidido; true = acepta; false = rechaza
  decision_maestro    boolean,
  decision_discipulo  boolean,
  mensaje_cancelacion text,       -- mensaje opcional al cancelar
  dias_prueba_total   integer     not null default 30,
  iniciada_at         timestamptz not null default now(),
  consolidada_at      timestamptz,
  finalizada_at       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger trg_relaciones_updated_at
  before update on public.relaciones
  for each row execute function set_updated_at();

create index idx_relaciones_maestro   on public.relaciones (maestro_id, estado);
create index idx_relaciones_discipulo on public.relaciones (discipulo_id, estado);


-- ============================
-- TABLA: sesiones_prueba
-- Las sesiones pactadas durante el periodo de prueba (máx. 3 por defecto)
-- ============================
create table public.sesiones_prueba (
  id             uuid        primary key default uuid_generate_v4(),
  relacion_id    uuid        not null references public.relaciones(id) on delete cascade,
  numero         integer     not null check (numero >= 1),
  titulo         text,                   -- "Primera sesión", "Segunda sesión"…
  programada_at  timestamptz,
  completada_at  timestamptz,
  estado         text        not null default 'pendiente'
                             check (estado in ('pendiente','programada','completada')),
  notas          text,
  created_at     timestamptz not null default now(),
  constraint uq_sesion_numero unique (relacion_id, numero)
);

create index idx_sesiones_relacion on public.sesiones_prueba (relacion_id);


-- ============================
-- TABLA: mensajes
-- Chat entre maestro y discípulo durante el periodo de prueba
-- ============================
create table public.mensajes (
  id           uuid        primary key default uuid_generate_v4(),
  relacion_id  uuid        not null references public.relaciones(id) on delete cascade,
  autor_id     uuid        not null references public.profiles(id) on delete cascade,
  texto        text        not null,
  leido_at     timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_mensajes_relacion on public.mensajes (relacion_id, created_at);
create index idx_mensajes_no_leidos on public.mensajes (relacion_id)
  where leido_at is null;


-- ============================
-- TABLA: resenas
-- Reseñas públicas de ex-discípulos sobre el maestro
-- ============================
create table public.resenas (
  id              uuid        primary key default uuid_generate_v4(),
  maestro_id      uuid        not null references public.profiles(id) on delete cascade,
  discipulo_id    uuid        not null references public.profiles(id) on delete cascade,
  relacion_id     uuid        references public.relaciones(id) on delete set null,
  disciplina      text        not null,
  duracion_meses  integer     check (duracion_meses > 0),
  estrellas       integer     not null check (estrellas between 1 and 5),
  texto           text,
  created_at      timestamptz not null default now(),
  -- Un discípulo solo puede dejar una reseña por relación
  constraint uq_resena_por_relacion unique (relacion_id, discipulo_id)
);

create index idx_resenas_maestro on public.resenas (maestro_id, created_at desc);

-- Trigger: recalcular reputación del maestro tras cada cambio en reseñas
create or replace function actualizar_reputacion()
returns trigger language plpgsql as $$
declare
  v_maestro_id uuid;
begin
  v_maestro_id := coalesce(new.maestro_id, old.maestro_id);
  update public.maestro_perfiles
     set reputacion  = (
           select round(avg(estrellas)::numeric, 2)
             from public.resenas
            where maestro_id = v_maestro_id
         ),
         num_resenas = (
           select count(*)
             from public.resenas
            where maestro_id = v_maestro_id
         ),
         updated_at  = now()
   where id = v_maestro_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_actualizar_reputacion
  after insert or update or delete on public.resenas
  for each row execute function actualizar_reputacion();


-- ============================
-- TABLA: historial_discipulo
-- Registro de prácticas pasadas y en curso del discípulo
-- ============================
create table public.historial_discipulo (
  id              uuid        primary key default uuid_generate_v4(),
  discipulo_id    uuid        not null references public.profiles(id) on delete cascade,
  maestro_id      uuid        references public.profiles(id) on delete set null,
  maestro_nombre  text,           -- copia del nombre, por si el maestro borra su cuenta
  disciplina      text        not null,
  duracion_meses  integer     check (duracion_meses >= 0),
  estado          text        not null default 'en_curso'
                              check (estado in ('en_curso','completada','cancelada')),
  inicio_at       date,
  fin_at          date,
  relacion_id     uuid        references public.relaciones(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index idx_historial_discipulo on public.historial_discipulo (discipulo_id, estado);


-- ============================
-- FUNCIÓN + TRIGGER: crear perfil al registrarse
-- Supabase llama a este trigger automáticamente cada vez
-- que se crea un usuario en auth.users
-- ============================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nombre, apellido, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre',  split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'apellido', ''),
    new.email
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================

-- profiles ──────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "Perfiles visibles por todos"
  on public.profiles for select
  using (true);

create policy "Cada usuario actualiza su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- maestro_perfiles ───────────────────────────────────────────
alter table public.maestro_perfiles enable row level security;

create policy "Perfiles de maestro visibles por todos"
  on public.maestro_perfiles for select
  using (true);

create policy "Maestro gestiona su propio perfil"
  on public.maestro_perfiles for all
  using (auth.uid() = id);

-- trayectoria ────────────────────────────────────────────────
alter table public.trayectoria enable row level security;

create policy "Trayectoria visible por todos"
  on public.trayectoria for select
  using (true);

create policy "Maestro gestiona su trayectoria"
  on public.trayectoria for all
  using (auth.uid() = maestro_id);

-- solicitudes ────────────────────────────────────────────────
alter table public.solicitudes enable row level security;

create policy "Solicitudes visibles por sus participantes"
  on public.solicitudes for select
  using (auth.uid() = discipulo_id or auth.uid() = maestro_id);

create policy "Discípulo crea solicitudes"
  on public.solicitudes for insert
  with check (auth.uid() = discipulo_id);

create policy "Participantes actualizan solicitudes"
  on public.solicitudes for update
  using (auth.uid() = discipulo_id or auth.uid() = maestro_id);

-- relaciones ─────────────────────────────────────────────────
alter table public.relaciones enable row level security;

create policy "Relaciones visibles por sus participantes"
  on public.relaciones for select
  using (auth.uid() = maestro_id or auth.uid() = discipulo_id);

create policy "Participantes actualizan relaciones"
  on public.relaciones for update
  using (auth.uid() = maestro_id or auth.uid() = discipulo_id);

-- sesiones_prueba ────────────────────────────────────────────
alter table public.sesiones_prueba enable row level security;

create policy "Sesiones visibles por participantes de la relación"
  on public.sesiones_prueba for select
  using (
    exists (
      select 1 from public.relaciones r
       where r.id = relacion_id
         and (r.maestro_id = auth.uid() or r.discipulo_id = auth.uid())
    )
  );

create policy "Participantes gestionan sesiones"
  on public.sesiones_prueba for all
  using (
    exists (
      select 1 from public.relaciones r
       where r.id = relacion_id
         and (r.maestro_id = auth.uid() or r.discipulo_id = auth.uid())
    )
  );

-- mensajes ───────────────────────────────────────────────────
alter table public.mensajes enable row level security;

create policy "Mensajes visibles por participantes de la relación"
  on public.mensajes for select
  using (
    exists (
      select 1 from public.relaciones r
       where r.id = relacion_id
         and (r.maestro_id = auth.uid() or r.discipulo_id = auth.uid())
    )
  );

create policy "Participantes envían mensajes"
  on public.mensajes for insert
  with check (
    auth.uid() = autor_id
    and exists (
      select 1 from public.relaciones r
       where r.id = relacion_id
         and (r.maestro_id = auth.uid() or r.discipulo_id = auth.uid())
    )
  );

-- resenas ────────────────────────────────────────────────────
alter table public.resenas enable row level security;

create policy "Reseñas visibles por todos"
  on public.resenas for select
  using (true);

create policy "Discípulo publica su propia reseña"
  on public.resenas for insert
  with check (auth.uid() = discipulo_id);

-- historial_discipulo ────────────────────────────────────────
alter table public.historial_discipulo enable row level security;

create policy "Historial visible por todos"
  on public.historial_discipulo for select
  using (true);

create policy "Usuario gestiona su propio historial"
  on public.historial_discipulo for all
  using (auth.uid() = discipulo_id);
