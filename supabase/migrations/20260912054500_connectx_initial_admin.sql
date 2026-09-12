-- Grant ConnectX administrator access to the designated account.
-- This is enforced by the existing cx_roles table and cx_private.staff() checks.
do $$
declare
  admin_user uuid := 'e5e21c98-94a2-41cf-8317-3fa4d3266d1b';
begin
  if not exists (select 1 from auth.users where id = admin_user) then
    raise notice 'ConnectX admin user % does not exist in auth.users yet; role was not changed.', admin_user;
    return;
  end if;

  -- Ensure the profile/role rows exist in case this account predates the ConnectX schema.
  insert into public.cx_profiles (id, username, display_name)
  values (
    admin_user,
    'player_' || substr(replace(admin_user::text, '-', ''), 1, 12),
    'Minecraft player'
  )
  on conflict (id) do nothing;

  insert into public.cx_settings (user_id)
  values (admin_user)
  on conflict (user_id) do nothing;

  insert into public.cx_roles (user_id, role)
  values (admin_user, 'admin')
  on conflict (user_id) do update set role = excluded.role;
end $$;
