-- ConnectX v1. Namespaced tables preserve the original site's schema.
create schema if not exists cx_private;
revoke all on schema cx_private from public;
grant usage on schema cx_private to anon, authenticated;

create table public.cx_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check(username ~ '^[a-z0-9_]{3,24}$'),
 display_name text not null check(length(display_name) between 1 and 60),
 bio text not null default '' check(length(bio)<=320), location text not null default '',
 website text not null default '' check(website='' or website ~ '^https?://'),
 avatar_path text, banner_path text, minecraft_username text not null default '' check(minecraft_username='' or minecraft_username ~ '^[A-Za-z0-9_]{3,16}$'),
 minecraft_uuid text, skin_url text, cape_url text, identity_verified boolean not null default false,
 favorite_server text not null default '', version text not null default '', playstyle text not null default 'Survival',
 verified boolean not null default false, verification_category text,
 status text not null default 'active' check(status in ('active','suspended','banned','deactivated')),
 created_at timestamptz not null default now()
);
create table public.cx_roles(user_id uuid primary key references public.cx_profiles on delete cascade, role text not null check(role in ('user','moderator','admin','owner')));
create table public.cx_settings(
 user_id uuid primary key references public.cx_profiles on delete cascade,
 private_account boolean not null default false, dm_policy text not null default 'everyone' check(dm_policy in ('everyone','following','nobody')),
 mention_policy text not null default 'everyone' check(mention_policy in ('everyone','following','nobody')),
 likes_visible boolean not null default false, communities_visible boolean not null default true, search_visible boolean not null default true,
 notifications jsonb not null default '{"like":true,"reply":true,"mention":true,"follow":true,"message":true,"community":true,"verification":true,"repost":true}',
 muted_words text[] not null default '{}', theme text not null default 'dark' check(theme in ('dark','light'))
);
create table public.cx_follows(follower_id uuid references public.cx_profiles on delete cascade,following_id uuid references public.cx_profiles on delete cascade,accepted boolean not null default true,created_at timestamptz not null default now(),primary key(follower_id,following_id),check(follower_id<>following_id));
create index on public.cx_follows(following_id,accepted);
create table public.cx_blocks(user_id uuid references public.cx_profiles on delete cascade,target_id uuid references public.cx_profiles on delete cascade,primary key(user_id,target_id),check(user_id<>target_id));
create index on public.cx_blocks(target_id);
create table public.cx_mutes(user_id uuid references public.cx_profiles on delete cascade,target_id uuid references public.cx_profiles on delete cascade,primary key(user_id,target_id));
create table public.cx_communities(
 id uuid primary key default gen_random_uuid(),handle text not null unique check(handle ~ '^[a-z0-9_-]{3,40}$'),name text not null check(length(name) between 1 and 80),
 description text not null default '' check(length(description)<=2000),rules text not null default 'Be respectful. No spam, scams, or harassment.',
 owner_id uuid not null references public.cx_profiles, privacy text not null default 'public' check(privacy in ('public','private','request')),
 category text not null default 'Building Community',icon_path text,banner_path text,verified boolean not null default false,
 status text not null default 'active' check(status in ('active','suspended','deleted')),created_at timestamptz not null default now()
);
create table public.cx_members(community_id uuid references public.cx_communities on delete cascade,user_id uuid references public.cx_profiles on delete cascade,role text not null default 'member' check(role in ('owner','administrator','moderator','member')),permissions text[] not null default '{}',state text not null default 'active' check(state in ('active','pending','banned','muted')),created_at timestamptz not null default now(),primary key(community_id,user_id));
create index on public.cx_members(user_id);
create table public.cx_posts(
 id uuid primary key default gen_random_uuid(),author_id uuid not null references public.cx_profiles on delete cascade,
 body text not null check(length(body) between 1 and 1000),community_id uuid references public.cx_communities on delete cascade,
 parent_id uuid references public.cx_posts on delete cascade,quote_id uuid references public.cx_posts on delete set null,
 media_path text,media_type text check(media_type in ('image','video')),server_address text not null default '',
 poll_options text[] check(poll_options is null or cardinality(poll_options) between 2 and 4),poll_closes_at timestamptz,
 removed boolean not null default false,locked boolean not null default false,pinned boolean not null default false,
 created_at timestamptz not null default now(),edited_at timestamptz
);
create index on public.cx_posts(created_at desc);
create index on public.cx_posts(author_id,created_at desc);
create index on public.cx_posts(community_id,created_at desc);
create index on public.cx_posts(parent_id);
create index cx_posts_search on public.cx_posts using gin(to_tsvector('english',body));
create table public.cx_reactions(user_id uuid references public.cx_profiles on delete cascade,post_id uuid references public.cx_posts on delete cascade,kind text not null check(kind in ('like','repost','bookmark')),created_at timestamptz not null default now(),primary key(user_id,post_id,kind));
create index on public.cx_reactions(post_id);
create table public.cx_votes(user_id uuid references public.cx_profiles on delete cascade,post_id uuid references public.cx_posts on delete cascade,option_index int not null check(option_index between 0 and 3),primary key(user_id,post_id));
create table public.cx_notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.cx_profiles on delete cascade,actor_id uuid references public.cx_profiles on delete cascade,kind text not null,subject_id uuid,body text not null,read_at timestamptz,created_at timestamptz not null default now());
create index on public.cx_notifications(user_id,created_at desc);
create table public.cx_conversations(id uuid primary key default gen_random_uuid(),user_a uuid not null references public.cx_profiles on delete cascade,user_b uuid not null references public.cx_profiles on delete cascade,hidden_by uuid[] not null default '{}',created_at timestamptz not null default now(),unique(user_a,user_b),check(user_a<user_b));
create index on public.cx_conversations(user_b);
create table public.cx_messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.cx_conversations on delete cascade,sender_id uuid not null references public.cx_profiles on delete cascade,body text not null check(length(body) between 1 and 4000),media_path text,reply_id uuid references public.cx_messages on delete set null,created_at timestamptz not null default now());
create index on public.cx_messages(conversation_id,created_at desc);
create table public.cx_servers(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.cx_profiles,name text not null check(length(name) between 1 and 80),description text not null default '' check(length(description)<=2000),java_address text not null default '',bedrock_address text not null default '',version text not null default '',website text not null default '' check(website='' or website ~ '^https?://'),category text not null default 'SMP',community_id uuid references public.cx_communities on delete set null,logo_path text,banner_path text,verified boolean not null default false,created_at timestamptz not null default now());
create table public.cx_reports(id uuid primary key default gen_random_uuid(),reporter_id uuid references public.cx_profiles on delete set null,target_type text not null check(target_type in ('post','profile','community','message')),target_id uuid not null,reason text not null check(length(reason) between 3 and 2000),state text not null default 'open' check(state in ('open','assigned','resolved','dismissed','escalated')),assigned_to uuid references public.cx_profiles,created_at timestamptz not null default now());
create table public.cx_audit(id bigint generated always as identity primary key,actor_id uuid references public.cx_profiles on delete set null,action text not null,target_id uuid,community_id uuid references public.cx_communities on delete set null,reason text not null,created_at timestamptz not null default now());
create table public.cx_verification_records(id uuid primary key default gen_random_uuid(),target_type text not null,target_id uuid not null,category text not null,notes text not null,actor_id uuid references public.cx_profiles on delete set null,created_at timestamptz not null default now());
create table public.cx_support_tickets(id uuid primary key default gen_random_uuid(),user_id uuid references public.cx_profiles on delete set null,category text not null,body text not null check(length(body) between 10 and 4000),state text not null default 'open',created_at timestamptz not null default now());
create table public.cx_config(key text primary key,value jsonb not null);
insert into public.cx_config values('post_limit','1000'),('blocked_phrases','[]'),('blocked_domains','[]');
create table cx_private.rate_limits(user_id uuid not null,bucket text not null,window_start timestamptz not null,hits int not null,primary key(user_id,bucket,window_start));
alter table cx_private.rate_limits enable row level security;

-- Small non-exposed security helpers. No permissions are read from editable metadata.
create function cx_private.staff() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.cx_roles r join public.cx_profiles p on p.id=r.user_id where r.user_id=auth.uid() and r.role in ('admin','owner') and p.status='active')
$$;
create function cx_private.active() returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and exists(select 1 from public.cx_profiles where id=auth.uid() and status='active')$$;
create function cx_private.blocked(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.cx_blocks where (user_id=a and target_id=b) or (user_id=b and target_id=a))$$;
create function cx_private.profile_visible(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.cx_profiles p join public.cx_settings s on s.user_id=p.id where p.id=target and (p.id=auth.uid() or (p.status='active' and not cx_private.blocked(auth.uid(),p.id) and (not s.private_account or exists(select 1 from public.cx_follows f where f.follower_id=auth.uid() and f.following_id=p.id and f.accepted))))) or cx_private.staff()
$$;
create function cx_private.community_visible(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select target is null or exists(select 1 from public.cx_communities c where c.id=target and c.status='active' and (c.privacy<>'private' or exists(select 1 from public.cx_members m where m.community_id=c.id and m.user_id=auth.uid() and m.state in ('active','muted')))) or cx_private.staff()
$$;
create function cx_private.can_moderate(target uuid,permission text default 'delete_posts') returns boolean language sql stable security definer set search_path='' as $$
 select cx_private.active() and exists(select 1 from public.cx_members where community_id=target and user_id=auth.uid() and state='active' and (role in ('owner','administrator') or (role='moderator' and permission=any(permissions))))
$$;
create function cx_private.post_visible(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.cx_posts p where p.id=target and (not p.removed or cx_private.staff() or cx_private.can_moderate(p.community_id)) and cx_private.profile_visible(p.author_id) and cx_private.community_visible(p.community_id))
$$;
create function cx_private.in_conversation(target uuid) returns boolean language sql stable security definer set search_path='' as $$select cx_private.active() and exists(select 1 from public.cx_conversations where id=target and auth.uid() in (user_a,user_b))$$;

do $$ declare t text; begin
 for t in select tablename from pg_tables where schemaname='public' and tablename like 'cx\_%' escape '\' loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to anon,authenticated',t);
 end loop;
end $$;
create policy profiles_read on public.cx_profiles for select using(cx_private.profile_visible(id));
create policy roles_read on public.cx_roles for select to authenticated using(user_id=auth.uid() or cx_private.staff());
create policy settings_read on public.cx_settings for select to authenticated using(user_id=auth.uid());
create policy follows_read on public.cx_follows for select using(follower_id=auth.uid() or following_id=auth.uid() or (accepted and cx_private.profile_visible(follower_id) and cx_private.profile_visible(following_id)));
create policy blocks_read on public.cx_blocks for select to authenticated using(user_id=auth.uid());
create policy mutes_read on public.cx_mutes for select to authenticated using(user_id=auth.uid());
create policy communities_read on public.cx_communities for select using(cx_private.community_visible(id));
create policy members_read on public.cx_members for select using(user_id=auth.uid() or cx_private.can_moderate(community_id,'manage_members') or (state='active' and cx_private.community_visible(community_id) and exists(select 1 from public.cx_settings s where s.user_id=auth.uid() and s.communities_visible)));
-- Public membership lists intentionally omit other users' private memberships.
create policy posts_read on public.cx_posts for select using(cx_private.post_visible(id));
create policy reactions_read on public.cx_reactions for select using(cx_private.post_visible(post_id) and (user_id=auth.uid() or (kind='repost' and cx_private.profile_visible(user_id))));
create policy votes_read on public.cx_votes for select to authenticated using(user_id=auth.uid() and cx_private.post_visible(post_id));
create policy notifications_read on public.cx_notifications for select to authenticated using(user_id=auth.uid() and cx_private.active());
create policy conversations_read on public.cx_conversations for select to authenticated using(cx_private.in_conversation(id));
create policy messages_read on public.cx_messages for select to authenticated using(cx_private.in_conversation(conversation_id));
create policy servers_read on public.cx_servers for select using(cx_private.profile_visible(owner_id) and cx_private.community_visible(community_id));
create policy reports_read on public.cx_reports for select to authenticated using(reporter_id=auth.uid() or cx_private.staff() or (target_type='post' and exists(select 1 from public.cx_posts p where p.id=target_id and cx_private.can_moderate(p.community_id,'view_reports'))));
create policy audit_read on public.cx_audit for select to authenticated using(cx_private.staff() or (community_id is not null and cx_private.can_moderate(community_id,'view_logs')));
create policy verification_read on public.cx_verification_records for select to authenticated using(cx_private.staff());
create policy tickets_read on public.cx_support_tickets for select to authenticated using(user_id=auth.uid() or cx_private.staff());
create policy config_read on public.cx_config for select using(key='post_limit' or cx_private.staff());

create function cx_private.register_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare handle text;
begin
 handle:=lower(new.raw_user_meta_data->>'username');
 if handle is null or handle !~ '^[a-z0-9_]{3,24}$' then handle:='player_'||substr(replace(new.id::text,'-',''),1,12); end if;
 insert into public.cx_profiles(id,username,display_name) values(new.id,handle,left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),handle),60));
 insert into public.cx_roles values(new.id,'user'); insert into public.cx_settings(user_id) values(new.id);
 return new;
end $$;
create trigger cx_auth_created after insert on auth.users for each row execute function cx_private.register_profile();
-- Preserve existing auth accounts; no default password or privileged role.
insert into public.cx_profiles(id,username,display_name) select id,'player_'||substr(replace(id::text,'-',''),1,12),'Minecraft player' from auth.users on conflict do nothing;
insert into public.cx_roles select id,'user' from public.cx_profiles on conflict do nothing;
insert into public.cx_settings(user_id) select id from public.cx_profiles on conflict do nothing;

create function cx_private.rate_limit(bucket_name text,maximum int) returns void language plpgsql security definer set search_path='' as $$
declare n int;
begin
 if auth.uid() is null then raise exception 'Sign in to continue'; end if;
 insert into cx_private.rate_limits values(auth.uid(),bucket_name,date_trunc('minute',now()),1) on conflict(user_id,bucket,window_start) do update set hits=cx_private.rate_limits.hits+1 returning hits into n;
 if n>maximum then raise exception 'Too many requests. Try again in a minute.'; end if;
 delete from cx_private.rate_limits where window_start<now()-interval '1 day' and user_id=auth.uid();
end $$;
create function cx_private.notify(recipient uuid,kind_name text,subject uuid,message_text text) returns void language plpgsql security definer set search_path='' as $$
begin
 if recipient<>auth.uid() and not cx_private.blocked(recipient,auth.uid()) and exists(select 1 from public.cx_settings where user_id=recipient and coalesce((notifications->>kind_name)::boolean,true)) then
 insert into public.cx_notifications(user_id,actor_id,kind,subject_id,body) values(recipient,auth.uid(),kind_name,subject,message_text);
 end if;
end $$;

-- One allowlisted command gateway; all writes are transactionally checked here.
create function cx_private.command(action text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); target uuid; cid uuid; pid uuid; recipient uuid; result jsonb:='{}'; txt text; selected text; perm text; p public.cx_posts; c public.cx_communities; member public.cx_members; v int; enabled boolean;
begin
 if not cx_private.active() then raise exception 'An active signed-in account is required'; end if;
 perform cx_private.rate_limit('commands',90);
 if payload ? 'id' then target:=(payload->>'id')::uuid; end if;
 case action
 when 'profile' then
 update public.cx_profiles set username=lower(payload->>'username'),display_name=payload->>'display_name',bio=left(coalesce(payload->>'bio',''),320),location=left(coalesce(payload->>'location',''),100),website=coalesce(payload->>'website',''),minecraft_username=coalesce(payload->>'minecraft_username',''),favorite_server=left(coalesce(payload->>'favorite_server',''),100),version=left(coalesce(payload->>'version',''),40),playstyle=left(coalesce(payload->>'playstyle','Survival'),40) where id=me;
 when 'profile_media' then
 txt:=payload->>'path'; if txt not like me::text||'/%' then raise exception 'Invalid media ownership'; end if;
 if payload->>'kind'='avatar' then update public.cx_profiles set avatar_path=txt where id=me; else update public.cx_profiles set banner_path=txt where id=me; end if;
 when 'settings' then
 update public.cx_settings set private_account=coalesce((payload->>'private_account')::boolean,private_account),dm_policy=coalesce(payload->>'dm_policy',dm_policy),mention_policy=coalesce(payload->>'mention_policy',mention_policy),likes_visible=coalesce((payload->>'likes_visible')::boolean,likes_visible),communities_visible=coalesce((payload->>'communities_visible')::boolean,communities_visible),search_visible=coalesce((payload->>'search_visible')::boolean,search_visible),theme=coalesce(payload->>'theme',theme),notifications=coalesce(payload->'notifications',notifications),muted_words=case when payload ? 'muted_words' then array(select jsonb_array_elements_text(payload->'muted_words')) else muted_words end where user_id=me;
 when 'post' then
 perform cx_private.rate_limit('posts',8); txt:=trim(payload->>'body');
 select least(1000,(value::text)::int) into v from public.cx_config where key='post_limit';
 if length(txt)>v or length(txt)<1 then raise exception 'Post must contain 1 to % characters',v; end if;
 if exists(select 1 from public.cx_config,jsonb_array_elements_text(value) word where key in ('blocked_phrases','blocked_domains') and length(word)>0 and position(lower(word) in lower(txt))>0) then raise exception 'This content contains a restricted phrase or domain'; end if;
 cid:=nullif(payload->>'community_id','')::uuid; pid:=nullif(payload->>'parent_id','')::uuid;
 if pid is not null then select * into p from public.cx_posts where id=pid; if not found or not cx_private.post_visible(pid) or p.locked then raise exception 'Replies are unavailable'; end if; cid:=p.community_id; end if;
 if cid is not null and (not cx_private.community_visible(cid) or not exists(select 1 from public.cx_members where community_id=cid and user_id=me and state='active')) then raise exception 'Join this community before posting'; end if;
 if nullif(payload->>'quote_id','') is not null and not cx_private.post_visible((payload->>'quote_id')::uuid) then raise exception 'Quote unavailable'; end if;
 txt:=coalesce(txt,'');
 if nullif(payload->>'media_path','') is not null and (payload->>'media_path') not like me::text||'/%' then raise exception 'Invalid media ownership'; end if;
 insert into public.cx_posts(author_id,body,community_id,parent_id,quote_id,media_path,media_type,server_address,poll_options,poll_closes_at) values(me,txt,cid,pid,nullif(payload->>'quote_id','')::uuid,nullif(payload->>'media_path',''),nullif(payload->>'media_type',''),left(coalesce(payload->>'server_address',''),150),case when payload ? 'poll_options' then array(select left(jsonb_array_elements_text(payload->'poll_options'),100)) else null end,case when payload ? 'poll_options' then now()+interval '1 day' else null end) returning id into target;
 if pid is not null then perform cx_private.notify(p.author_id,'reply',target,'replied to your post'); end if;
 if nullif(payload->>'quote_id','') is not null then select author_id into recipient from public.cx_posts where id=(payload->>'quote_id')::uuid; perform cx_private.notify(recipient,'reply',target,'quoted your post'); end if;
 for recipient in select pr.id from public.cx_profiles pr join public.cx_settings s on s.user_id=pr.id where txt ~* ('@'||pr.username||'\M') and (s.mention_policy='everyone' or (s.mention_policy='following' and exists(select 1 from public.cx_follows where follower_id=pr.id and following_id=me and accepted))) loop perform cx_private.notify(recipient,'mention',target,'mentioned you in a post'); end loop;
 result:=jsonb_build_object('id',target);
 when 'edit_post' then
 update public.cx_posts set body=trim(payload->>'body'),edited_at=now() where id=target and author_id=me and created_at>now()-interval '15 minutes' and not removed and not locked;
 if not found then raise exception 'Editing is available for 15 minutes after posting'; end if;
 when 'delete_post' then
 select * into p from public.cx_posts where id=target;
 if p.author_id<>me or p.id is null then raise exception 'Only the author can delete this post'; end if;
 delete from public.cx_posts where id=target;
 when 'reaction' then
 if not cx_private.post_visible(target) then raise exception 'Post unavailable'; end if;
 selected:=payload->>'kind'; if selected not in ('like','repost','bookmark') then raise exception 'Invalid reaction'; end if;
 delete from public.cx_reactions where user_id=me and post_id=target and kind=selected;
 if not found then insert into public.cx_reactions values(me,target,selected,now()); select author_id into recipient from public.cx_posts where id=target; if selected<>'bookmark' then perform cx_private.notify(recipient,selected,target,case when selected='like' then 'liked your post' else 'reposted your post' end); end if; end if;
 when 'vote' then
 select * into p from public.cx_posts where id=target;
 v:=(payload->>'option')::int;
 if not cx_private.post_visible(target) or p.poll_options is null or p.poll_closes_at<=now() or v<0 or v>=cardinality(p.poll_options) then raise exception 'Poll is unavailable'; end if;
 insert into public.cx_votes values(me,target,v) on conflict(user_id,post_id) do update set option_index=excluded.option_index;
 when 'follow' then
 if me=target or cx_private.blocked(me,target) or not exists(select 1 from public.cx_profiles where id=target and status='active') then raise exception 'Cannot follow this account'; end if;
 delete from public.cx_follows where follower_id=me and following_id=target;
 if not found then insert into public.cx_follows select me,target,not private_account,now() from public.cx_settings where user_id=target; perform cx_private.notify(target,'follow',me,'followed you or requested to follow'); end if;
 when 'follow_request' then
 if (payload->>'accept')::boolean then update public.cx_follows set accepted=true where following_id=me and follower_id=target; else delete from public.cx_follows where following_id=me and follower_id=target; end if;
 when 'block' then
 if me=target then raise exception 'Cannot block yourself'; end if;
 delete from public.cx_blocks where user_id=me and target_id=target;
 if not found then insert into public.cx_blocks values(me,target); delete from public.cx_follows where (follower_id=me and following_id=target) or (follower_id=target and following_id=me); end if;
 when 'mute' then delete from public.cx_mutes where user_id=me and target_id=target; if not found then insert into public.cx_mutes values(me,target); end if;
 when 'community' then
 perform cx_private.rate_limit('communities',2);
 insert into public.cx_communities(handle,name,description,rules,owner_id,privacy,category) values(lower(payload->>'handle'),payload->>'name',coalesce(payload->>'description',''),coalesce(payload->>'rules','Be respectful. No spam.'),me,coalesce(payload->>'privacy','public'),coalesce(payload->>'category','Building Community')) returning id into target;
 insert into public.cx_members(community_id,user_id,role) values(target,me,'owner'); result:=jsonb_build_object('id',target);
 when 'join' then
 select * into c from public.cx_communities where id=target and status='active'; if not found then raise exception 'Community unavailable'; end if;
 select * into member from public.cx_members where community_id=target and user_id=me;
 if member.role='owner' then raise exception 'Transfer ownership before leaving'; end if;
 if member.state in ('banned','muted') then raise exception 'Membership is restricted'; end if;
 if member.user_id is not null then delete from public.cx_members where community_id=target and user_id=me;
 else insert into public.cx_members(community_id,user_id,state) values(target,me,case when c.privacy='public' then 'active' else 'pending' end); perform cx_private.notify(c.owner_id,'community',target,'joined or requested to join your community'); end if;
 when 'community_edit' then
 if not cx_private.can_moderate(target,'edit_community') then raise exception 'Community permission required'; end if;
 update public.cx_communities set name=payload->>'name',description=payload->>'description',rules=payload->>'rules',privacy=payload->>'privacy' where id=target;
 insert into public.cx_audit(actor_id,action,target_id,community_id,reason) values(me,action,target,target,'Updated community settings');
 when 'member' then
 cid:=(payload->>'community_id')::uuid; select * into c from public.cx_communities where id=cid;
 if not cx_private.can_moderate(cid,'manage_members') then raise exception 'Community permission required'; end if;
 select * into member from public.cx_members where community_id=cid and user_id=target;
 if target=c.owner_id or (member.role in ('administrator','moderator') and me<>c.owner_id) then raise exception 'Only the owner manages staff; transfer ownership separately'; end if;
 if length(trim(coalesce(payload->>'reason','')))<3 then raise exception 'A reason is required'; end if;
 selected:=coalesce(payload->>'role',member.role,'member');
 if selected='owner' or (selected<>'member' and me<>c.owner_id) then raise exception 'Only the owner assigns staff'; end if;
 insert into public.cx_members(community_id,user_id,role,state,permissions) values(cid,target,selected,coalesce(payload->>'state','active'),array(select jsonb_array_elements_text(coalesce(payload->'permissions','[]')))) on conflict(community_id,user_id) do update set role=excluded.role,state=excluded.state,permissions=excluded.permissions;
 insert into public.cx_audit(actor_id,action,target_id,community_id,reason) values(me,action,target,cid,payload->>'reason'); perform cx_private.notify(target,'community',cid,'updated your community membership');
 when 'transfer' then
 cid:=(payload->>'community_id')::uuid;
 select * into c from public.cx_communities where id=cid for update;
 if c.owner_id<>me or not exists(select 1 from public.cx_members m join public.cx_profiles pr on pr.id=m.user_id where m.community_id=cid and m.user_id=target and m.state='active' and pr.status='active') then raise exception 'Transfer requires the owner and an active member'; end if;
 update public.cx_communities set owner_id=target where id=cid; update public.cx_members set role='administrator' where community_id=cid and user_id=me; update public.cx_members set role='owner' where community_id=cid and user_id=target;
 insert into public.cx_audit(actor_id,action,target_id,community_id,reason) values(me,action,target,cid,'Owner transferred community');
 when 'message' then
 perform cx_private.rate_limit('messages',20); recipient:=(payload->>'recipient')::uuid;
 if recipient=me or cx_private.blocked(me,recipient) or not exists(select 1 from public.cx_profiles pr join public.cx_settings s on s.user_id=pr.id where pr.id=recipient and pr.status='active' and (s.dm_policy='everyone' or (s.dm_policy='following' and exists(select 1 from public.cx_follows where follower_id=recipient and following_id=me and accepted)))) then raise exception 'This person is not accepting messages from you'; end if;
 insert into public.cx_conversations(user_a,user_b) values(least(me,recipient),greatest(me,recipient)) on conflict(user_a,user_b) do update set hidden_by='{}' returning id into cid;
 if nullif(payload->>'reply_id','') is not null and not exists(select 1 from public.cx_messages where id=(payload->>'reply_id')::uuid and conversation_id=cid) then raise exception 'Invalid reply'; end if;
 if nullif(payload->>'media_path','') is not null and (payload->>'media_path') not like me::text||'/%' then raise exception 'Invalid media ownership'; end if;
 insert into public.cx_messages(conversation_id,sender_id,body,media_path,reply_id) values(cid,me,trim(payload->>'body'),nullif(payload->>'media_path',''),nullif(payload->>'reply_id','')::uuid) returning id into target;
 perform cx_private.notify(recipient,'message',cid,'sent you a message'); result:=jsonb_build_object('id',cid);
 when 'hide_conversation' then
 if not cx_private.in_conversation(target) then raise exception 'Conversation unavailable'; end if;
 update public.cx_conversations set hidden_by=array_append(hidden_by,me) where id=target;
 when 'read_notifications' then update public.cx_notifications set read_at=now() where user_id=me and (target is null or id=target);
 when 'report' then
 perform cx_private.rate_limit('reports',5);
 selected:=payload->>'target_type';
 if selected='message' and not exists(select 1 from public.cx_messages where id=target and cx_private.in_conversation(conversation_id)) then raise exception 'Message unavailable'; end if;
 insert into public.cx_reports(reporter_id,target_type,target_id,reason) values(me,selected,target,payload->>'reason');
 when 'server' then
 perform cx_private.rate_limit('servers',2);
 cid:=nullif(payload->>'community_id','')::uuid;
 if cid is not null and not cx_private.can_moderate(cid,'edit_community') then raise exception 'Community permission required'; end if;
 insert into public.cx_servers(owner_id,name,description,java_address,bedrock_address,version,website,category,community_id) values(me,payload->>'name',coalesce(payload->>'description',''),left(coalesce(payload->>'java_address',''),150),left(coalesce(payload->>'bedrock_address',''),150),left(coalesce(payload->>'version',''),40),coalesce(payload->>'website',''),coalesce(payload->>'category','SMP'),cid);
 when 'support' then perform cx_private.rate_limit('support',3); insert into public.cx_support_tickets(user_id,category,body) values(me,payload->>'category',payload->>'body');
 when 'moderate_post' then
 select * into p from public.cx_posts where id=target;
 if p.id is null or not (cx_private.staff() or cx_private.can_moderate(p.community_id,'delete_posts')) then raise exception 'Moderation permission required'; end if;
 if length(trim(coalesce(payload->>'reason','')))<3 then raise exception 'A reason is required'; end if;
 update public.cx_posts set removed=coalesce((payload->>'removed')::boolean,removed),locked=coalesce((payload->>'locked')::boolean,locked),pinned=coalesce((payload->>'pinned')::boolean,pinned),media_path=case when (payload->>'remove_media')::boolean then null else media_path end where id=target;
 insert into public.cx_audit(actor_id,action,target_id,community_id,reason) values(me,action,target,p.community_id,payload->>'reason');
 when 'verify' then
 if not cx_private.staff() then raise exception 'Administrator permission required'; end if;
 enabled:=(payload->>'verified')::boolean;
 if payload->>'target_type'='profile' then update public.cx_profiles set verified=enabled,verification_category=payload->>'category' where id=target;
 elsif payload->>'target_type'='community' then update public.cx_communities set verified=enabled where id=target;
 else raise exception 'Invalid verification target'; end if;
 insert into public.cx_verification_records(target_type,target_id,category,notes,actor_id) values(payload->>'target_type',target,coalesce(payload->>'category',''),coalesce(payload->>'notes',''),me);
 insert into public.cx_audit(actor_id,action,target_id,reason) values(me,case when enabled then 'verified' else 'unverified' end,target,coalesce(payload->>'category','Verification update'));
 if payload->>'target_type'='profile' then perform cx_private.notify(target,'verification',target,'updated your verification status'); end if;
 when 'staff' then
 if not cx_private.staff() then raise exception 'Administrator permission required'; end if;
 if length(trim(coalesce(payload->>'reason','')))<3 then raise exception 'A reason is required'; end if;
 selected:=payload->>'operation';
 if selected='role' then
 if not exists(select 1 from public.cx_roles where user_id=me and role='owner') or target=me or exists(select 1 from public.cx_roles where user_id=target and role='owner') or payload->>'value'='owner' then raise exception 'Only the owner may assign non-owner roles'; end if;
 update public.cx_roles set role=payload->>'value' where user_id=target;
 elsif selected='status' then
 if target=me or exists(select 1 from public.cx_roles where user_id=target and role='owner') or (exists(select 1 from public.cx_roles where user_id=target and role='admin') and not exists(select 1 from public.cx_roles where user_id=me and role='owner')) then raise exception 'Cannot change this staff account'; end if;
 update public.cx_profiles set status=payload->>'value' where id=target;
 elsif selected='community_status' then update public.cx_communities set status=payload->>'value' where id=target;
 elsif selected='report' then update public.cx_reports set state=payload->>'value',assigned_to=me where id=target;
 elsif selected='warn' then perform cx_private.notify(target,'verification',target,'Staff warning: '||payload->>'reason');
 elsif selected='ticket' then update public.cx_support_tickets set state=left(payload->>'value',40) where id=target;
 else raise exception 'Unknown moderation operation'; end if;
 insert into public.cx_audit(actor_id,action,target_id,reason) values(me,selected||':'||(payload->>'value'),target,payload->>'reason');
 when 'config' then
 if not cx_private.staff() then raise exception 'Administrator permission required'; end if;
 if payload->>'key' not in ('post_limit','blocked_phrases','blocked_domains') then raise exception 'Unknown configuration'; end if;
 if payload->>'key'='post_limit' and ((payload->>'value')::int<1 or (payload->>'value')::int>1000) then raise exception 'Post limit must be 1–1000'; end if;
 update public.cx_config set value=payload->'value' where key=payload->>'key'; insert into public.cx_audit(actor_id,action,reason) values(me,'config',payload->>'key');
 when 'deactivate' then
 if exists(select 1 from public.cx_communities where owner_id=me) or exists(select 1 from public.cx_roles where user_id=me and role='owner') then raise exception 'Transfer community and platform ownership first'; end if;
 update public.cx_profiles set status='deactivated' where id=me;
 else raise exception 'Unknown action';
 end case;
 return result;
end $$;
create function public.cx_command(action text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select cx_private.command(action,payload)$$;

-- Aggregated engagement reveals counts, never private bookmark owners or voters.
create function cx_private.post_stats(ids uuid[]) returns jsonb language sql stable security definer set search_path='' as $$
select coalesce(jsonb_object_agg(p.id,jsonb_build_object('likes',(select count(*) from public.cx_reactions r where r.post_id=p.id and r.kind='like'),'reposts',(select count(*) from public.cx_reactions r where r.post_id=p.id and r.kind='repost'),'replies',(select count(*) from public.cx_posts r where r.parent_id=p.id and not r.removed and cx_private.post_visible(r.id)),'votes',(select coalesce(jsonb_agg(jsonb_build_object('option',v.option_index,'count',v.n)),'[]') from (select option_index,count(*) n from public.cx_votes where post_id=p.id group by option_index) v))), '{}') from public.cx_posts p where p.id=any(ids[1:50]) and cx_private.post_visible(p.id)
$$;
create function public.cx_post_stats(ids uuid[]) returns jsonb language sql security invoker set search_path='' as $$select cx_private.post_stats(ids)$$;
create function cx_private.trending() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(t),'[]') from (select lower((regexp_matches(p.body,'#([A-Za-z0-9_]+)','g'))[1]) topic,count(distinct p.author_id) creators from public.cx_posts p where p.created_at>now()-interval '7 days' and p.community_id is null and not p.removed and exists(select 1 from public.cx_settings s where s.user_id=p.author_id and not s.private_account) and cx_private.post_visible(p.id) group by topic order by creators desc limit 8) t
$$;
create function public.cx_trending() returns jsonb language sql security invoker set search_path='' as $$select cx_private.trending()$$;

revoke all on all functions in schema cx_private from public;
grant execute on function cx_private.staff(),cx_private.active(),cx_private.blocked(uuid,uuid),cx_private.profile_visible(uuid),cx_private.community_visible(uuid),cx_private.can_moderate(uuid,text),cx_private.post_visible(uuid),cx_private.in_conversation(uuid),cx_private.post_stats(uuid[]),cx_private.trending() to anon,authenticated;
grant execute on function cx_private.command(text,jsonb) to authenticated;
revoke all on function public.cx_command(text,jsonb),public.cx_post_stats(uuid[]),public.cx_trending() from public;
grant execute on function public.cx_command(text,jsonb) to authenticated;
grant execute on function public.cx_post_stats(uuid[]),public.cx_trending() to anon,authenticated;

create function cx_private.social_visible(target uuid,kind text) returns boolean language sql stable security definer set search_path='' as $$select target=auth.uid() or (cx_private.profile_visible(target) and exists(select 1 from public.cx_settings where user_id=target and case when kind='likes' then likes_visible else communities_visible end))$$;
drop policy members_read on public.cx_members;
create policy members_read on public.cx_members for select using(user_id=auth.uid() or cx_private.can_moderate(community_id,'manage_members') or (state='active' and cx_private.community_visible(community_id) and cx_private.social_visible(user_id,'communities')));
drop policy reactions_read on public.cx_reactions;
create policy reactions_read on public.cx_reactions for select using(cx_private.post_visible(post_id) and (user_id=auth.uid() or (kind='repost' and cx_private.profile_visible(user_id)) or (kind='like' and cx_private.social_visible(user_id,'likes'))));
create function cx_private.find_profile(handle text) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('id',id,'username',username) from public.cx_profiles where username=lower(handle) and status='active' and not cx_private.blocked(auth.uid(),id) and auth.uid() is not null$$;
create function public.cx_find_profile(handle text) returns jsonb language sql security invoker set search_path='' as $$select cx_private.find_profile(handle)$$;
create function cx_private.find_community(handle text) returns jsonb language sql stable security definer set search_path='' as $$select jsonb_build_object('id',id,'handle',handle) from public.cx_communities c where c.handle=find_community.handle and status='active' and auth.uid() is not null$$;
create function public.cx_find_community(handle text) returns jsonb language sql security invoker set search_path='' as $$select cx_private.find_community(handle)$$;
create function cx_private.indexable(target uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.cx_settings s join public.cx_profiles p on p.id=s.user_id where p.id=target and s.search_visible and not s.private_account and p.status='active')$$;
create function public.cx_indexable(target uuid) returns boolean language sql security invoker set search_path='' as $$select cx_private.indexable(target)$$;
revoke all on function cx_private.social_visible(uuid,text),cx_private.find_profile(text),cx_private.find_community(text),cx_private.indexable(uuid),public.cx_find_profile(text),public.cx_find_community(text),public.cx_indexable(uuid) from public;
grant execute on function cx_private.social_visible(uuid,text),cx_private.indexable(uuid),public.cx_indexable(uuid) to anon,authenticated;
grant execute on function cx_private.find_profile(text),cx_private.find_community(text),public.cx_find_profile(text),public.cx_find_community(text) to authenticated;
