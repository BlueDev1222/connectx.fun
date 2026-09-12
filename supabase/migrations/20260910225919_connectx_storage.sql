insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('connectx-media','connectx-media',false,20971520,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']) on conflict(id) do nothing;
-- Uploads are server-only after authentication, file signature checks, and rate limiting.
-- No client INSERT/UPDATE policy is granted for this bucket.
create function cx_private.media_visible(path text) returns boolean language sql stable security definer set search_path='' as $$
 select (auth.uid() is not null and split_part(path,'/',1)=auth.uid()::text and cx_private.active())
 or exists(select 1 from public.cx_profiles p where (p.avatar_path=path or p.banner_path=path) and cx_private.profile_visible(p.id))
 or exists(select 1 from public.cx_posts p where p.media_path=path and not p.removed and cx_private.post_visible(p.id))
 or exists(select 1 from public.cx_messages m where m.media_path=path and cx_private.in_conversation(m.conversation_id))
$$;
revoke all on function cx_private.media_visible(text) from public;
grant execute on function cx_private.media_visible(text) to anon,authenticated;
create policy cx_media_read on storage.objects for select to anon,authenticated using(bucket_id='connectx-media' and cx_private.media_visible(name));
create function public.cx_upload_check() returns void language plpgsql security invoker set search_path='' as $$begin if not cx_private.active() then raise exception 'Active account required'; end if; perform cx_private.upload_limit(); end$$;
create function cx_private.upload_limit() returns void language plpgsql security definer set search_path='' as $$begin if not cx_private.active() then raise exception 'Active account required'; end if; perform cx_private.rate_limit('uploads',6); end$$;
revoke all on function public.cx_upload_check(),cx_private.upload_limit() from public;
grant execute on function public.cx_upload_check(),cx_private.upload_limit() to authenticated;
do $$begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
 alter publication supabase_realtime add table public.cx_notifications;
 alter publication supabase_realtime add table public.cx_messages;
 end if;
end$$;
