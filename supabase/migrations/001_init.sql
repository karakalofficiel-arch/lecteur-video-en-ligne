-- Table de configuration Karavision (une seule ligne)
create table if not exists karavision_config (
  id               integer primary key default 1,
  video_url        text,
  video_title      text,
  updated_at       timestamptz default now(),
  admin_password_hash text,
  constraint single_row check (id = 1)
);

-- Insérer la ligne par défaut si elle n'existe pas
insert into karavision_config (id)
values (1)
on conflict (id) do nothing;

-- Désactiver RLS (accès contrôlé via service_role uniquement côté serveur)
alter table karavision_config disable row level security;

-- Bucket de stockage vidéo (à créer depuis le dashboard Supabase ou via CLI)
-- Storage > New bucket > Name: "videos" > Public: ON
-- Ou via SQL :
-- insert into storage.buckets (id, name, public, file_size_limit)
-- values ('videos', 'videos', true, 2147483648)  -- 2 Go max
-- on conflict do nothing;
