-- Legacy trigger is trigger-only; it must not be a public RPC.
do $$begin if to_regprocedure('public.handle_new_user()') is not null then revoke execute on function public.handle_new_user() from public,anon,authenticated; end if; end$$;
create policy deny_direct_rate_limit_access on cx_private.rate_limits for all using(false) with check(false);
alter table public.cx_profiles add constraint cx_reserved_handle check(username not in ('admin','home','explore','communities','servers','people','community','server','post','bookmarks','notifications','messages','settings','contact','status','profile','login','register','auth','api','hashtag','about','safety','developers','maintenance','suspended'));
create function cx_private.validate_post() returns trigger language plpgsql security definer set search_path='' as $$
declare lim int;
begin
 if tg_op='UPDATE' and new.body=old.body then return new; end if;
 select least(1000,(value::text)::int) into lim from public.cx_config where key='post_limit';
 if length(trim(new.body))<1 or length(new.body)>coalesce(lim,1000) then raise exception 'Post exceeds the configured character limit or is empty'; end if;
 if exists(select 1 from public.cx_config,jsonb_array_elements_text(value) word where key in ('blocked_phrases','blocked_domains') and length(word)>0 and position(lower(word) in lower(new.body))>0) then raise exception 'Content contains a restricted phrase or domain'; end if;
 if new.poll_options is not null and exists(select 1 from unnest(new.poll_options) opt where length(trim(opt)) not between 1 and 100) then raise exception 'Poll options must contain 1–100 characters'; end if;
 return new;
end$$;
revoke all on function cx_private.validate_post() from public;
create trigger cx_validate_post before insert or update on public.cx_posts for each row execute function cx_private.validate_post();
create index on public.cx_roles(role);
create index on public.cx_reports(state,created_at);
create index on public.cx_members(community_id,state);
create index on public.cx_servers(owner_id);
create index on public.cx_audit(community_id,created_at desc);

-- Appeals remain possible for suspended or deactivated accounts.
create function cx_private.support(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 if auth.uid() is null or not exists(select 1 from public.cx_profiles where id=auth.uid()) then raise exception 'Sign in to open a ticket'; end if;
 perform cx_private.rate_limit('support',3);
 insert into public.cx_support_tickets(user_id,category,body) values(auth.uid(),left(payload->>'category',60),payload->>'body') returning id into target;
 return jsonb_build_object('id',target);
end$$;
create function public.cx_support(payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select cx_private.support(payload)$$;
create function cx_private.community_count(target uuid) returns bigint language sql stable security definer set search_path='' as $$select count(*) from public.cx_members where community_id=target and state in ('active','muted') and cx_private.community_visible(target)$$;
create function public.cx_community_count(target uuid) returns bigint language sql security invoker set search_path='' as $$select cx_private.community_count(target)$$;
create function cx_private.entity_media(target uuid,kind text,path text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not cx_private.active() or path not like auth.uid()::text||'/%' then raise exception 'Invalid media ownership'; end if;
 if kind in ('community_icon','community_banner') then
 if not cx_private.can_moderate(target,'edit_community') then raise exception 'Community permission required'; end if;
 update public.cx_communities set icon_path=case when kind='community_icon' then path else icon_path end,banner_path=case when kind='community_banner' then path else banner_path end where id=target;
 insert into public.cx_audit(actor_id,action,target_id,community_id,reason) values(auth.uid(),'community_media',target,target,'Updated community image');
 elsif kind in ('server_logo','server_banner') then
 if not exists(select 1 from public.cx_servers where id=target and owner_id=auth.uid()) then raise exception 'Server ownership required'; end if;
 update public.cx_servers set logo_path=case when kind='server_logo' then path else logo_path end,banner_path=case when kind='server_banner' then path else banner_path end where id=target;
 else raise exception 'Invalid media kind'; end if;
end$$;
create function public.cx_entity_media(target uuid,kind text,path text) returns void language sql security invoker set search_path='' as $$select cx_private.entity_media(target,kind,path)$$;
create or replace function cx_private.media_visible(path text) returns boolean language sql stable security definer set search_path='' as $$
 select (auth.uid() is not null and split_part(path,'/',1)=auth.uid()::text and cx_private.active())
 or exists(select 1 from public.cx_profiles p where (p.avatar_path=path or p.banner_path=path) and cx_private.profile_visible(p.id))
 or exists(select 1 from public.cx_posts p where p.media_path=path and not p.removed and cx_private.post_visible(p.id))
 or exists(select 1 from public.cx_messages m where m.media_path=path and cx_private.in_conversation(m.conversation_id))
 or exists(select 1 from public.cx_communities c where (c.icon_path=path or c.banner_path=path) and cx_private.community_visible(c.id))
 or exists(select 1 from public.cx_servers s where (s.logo_path=path or s.banner_path=path) and cx_private.profile_visible(s.owner_id))
$$;
revoke all on function cx_private.support(jsonb),public.cx_support(jsonb),cx_private.community_count(uuid),public.cx_community_count(uuid),cx_private.entity_media(uuid,text,text),public.cx_entity_media(uuid,text,text) from public;
grant execute on function cx_private.support(jsonb),public.cx_support(jsonb),cx_private.entity_media(uuid,text,text),public.cx_entity_media(uuid,text,text) to authenticated;
grant execute on function cx_private.community_count(uuid),public.cx_community_count(uuid) to anon,authenticated;
