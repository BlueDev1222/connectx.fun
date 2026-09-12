-- Keep OAuth identities independent of provider handles and privilege metadata.
create or replace function cx_private.register_profile() returns trigger
language plpgsql security definer set search_path='' as $$
declare handle text; label text;
begin
 if new.raw_app_meta_data->>'provider' in ('discord','apple','azure','google') then
  handle:='player_'||substr(replace(new.id::text,'-',''),1,17);
  label:=coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),nullif(trim(new.raw_user_meta_data->>'name'),''),handle);
 else
  handle:=lower(new.raw_user_meta_data->>'username');
  if handle is null or handle !~ '^[a-z0-9_]{3,24}$' then handle:='player_'||substr(replace(new.id::text,'-',''),1,12); end if;
  label:=coalesce(nullif(new.raw_user_meta_data->>'display_name',''),handle);
 end if;
 insert into public.cx_profiles(id,username,display_name) values(new.id,handle,left(label,60));
 insert into public.cx_roles values(new.id,'user');
 insert into public.cx_settings(user_id) values(new.id);
 return new;
end $$;
revoke all on function cx_private.register_profile() from public,anon,authenticated;
