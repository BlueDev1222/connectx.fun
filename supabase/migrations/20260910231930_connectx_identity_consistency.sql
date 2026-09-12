create function cx_private.reset_minecraft_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if new.minecraft_username is distinct from old.minecraft_username then
 new.minecraft_uuid:=null; new.skin_url:=null; new.cape_url:=null; new.identity_verified:=false;
 end if;
 return new;
end$$;
revoke all on function cx_private.reset_minecraft_identity() from public;
create trigger cx_reset_minecraft_identity before update of minecraft_username on public.cx_profiles for each row execute function cx_private.reset_minecraft_identity();
