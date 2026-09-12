\set ON_ERROR_STOP on
begin;
select set_config('cx.bootstrap_owner_id', :'owner_id', true);
lock table public.cx_roles in exclusive mode;
do $$
declare target uuid:=current_setting('cx.bootstrap_owner_id')::uuid;
begin
 if exists(select 1 from public.cx_roles where role='owner') then raise exception 'An owner already exists; use the reviewed owner transfer procedure'; end if;
 if not exists(select 1 from auth.users u join public.cx_profiles p on p.id=u.id where u.id=target and u.email_confirmed_at is not null and p.status='active') then raise exception 'The selected account must be active and email verified'; end if;
 update public.cx_roles set role='owner' where user_id=target;
 if not found then raise exception 'ConnectX profile is missing'; end if;
 insert into public.cx_audit(actor_id,action,target_id,reason) values(target,'bootstrap_owner',target,'Initial owner assigned by trusted database operator');
end$$;
commit;
