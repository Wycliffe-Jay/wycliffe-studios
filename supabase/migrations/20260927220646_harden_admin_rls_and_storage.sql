do $$
declare t text;
begin
  foreach t in array array['hero_content','portfolio_items','services','testimonials','about_content','process_items','faq_items','site_settings'] loop
    execute format('drop policy if exists "Admin write %I" on public.%I', t, t);
    execute format('create policy "Admin write %I" on public.%I for all to authenticated using ((select auth.uid()) = ''ecbb9203-f2aa-4c73-b471-dee154ea56ac''::uuid) with check ((select auth.uid()) = ''ecbb9203-f2aa-4c73-b471-dee154ea56ac''::uuid)', t, t);
  end loop;
end $$;

drop policy if exists "crm owner access" on public.clients;
drop policy if exists "crm owner access" on public.inquiries;
drop policy if exists "crm owner access" on public.projects;
drop policy if exists "crm owner access" on public.payments;
drop policy if exists "crm owner access" on public.follow_ups;
drop policy if exists "crm owner access" on public.activity_logs;

do $$
declare t text;
begin
  foreach t in array array['clients','inquiries','projects','payments','follow_ups','activity_logs'] loop
    execute format('create policy "crm owner access" on public.%I for all to authenticated using ((select auth.uid()) = ''ecbb9203-f2aa-4c73-b471-dee154ea56ac''::uuid) with check ((select auth.uid()) = ''ecbb9203-f2aa-4c73-b471-dee154ea56ac''::uuid)', t);
  end loop;
end $$;

drop policy if exists "Authenticated users can upload site images" on storage.objects;
drop policy if exists "Authenticated users can update site images" on storage.objects;
drop policy if exists "Authenticated users can delete site images" on storage.objects;

create policy "Admin can upload site images" on storage.objects for insert to authenticated
with check (bucket_id='site-images' and name like 'editor/%' and (select auth.uid()) = 'ecbb9203-f2aa-4c73-b471-dee154ea56ac'::uuid);

create policy "Admin can update site images" on storage.objects for update to authenticated
using (bucket_id='site-images' and name like 'editor/%' and (select auth.uid()) = 'ecbb9203-f2aa-4c73-b471-dee154ea56ac'::uuid)
with check (bucket_id='site-images' and name like 'editor/%' and (select auth.uid()) = 'ecbb9203-f2aa-4c73-b471-dee154ea56ac'::uuid);

create policy "Admin can delete site images" on storage.objects for delete to authenticated
using (bucket_id='site-images' and name like 'editor/%' and (select auth.uid()) = 'ecbb9203-f2aa-4c73-b471-dee154ea56ac'::uuid);

create or replace function public.crm_touch_updated_at()
returns trigger language plpgsql
set search_path = public
as $$ begin new.updated_at=now(); return new; end $$;

revoke execute on function public.crm_project_paid(uuid) from public, anon, authenticated;
revoke execute on function public.crm_project_balance(uuid) from public, anon, authenticated;