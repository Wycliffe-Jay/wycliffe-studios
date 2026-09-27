do $$
declare t text;
begin
  foreach t in array array['hero_content','portfolio_items','services','testimonials','about_content','process_items','faq_items','site_settings'] loop
    execute format('drop policy if exists "Admin insert %I" on public.%I', t, t);
    execute format('drop policy if exists "Admin update %I" on public.%I', t, t);
    execute format('drop policy if exists "Admin delete %I" on public.%I', t, t);
    execute format('create policy "Admin insert %I" on public.%I for insert to authenticated with check ((select auth.uid()) = ''617fe2f1-a6d6-4a49-bb20-d7c09857452f''::uuid)', t, t);
    execute format('create policy "Admin update %I" on public.%I for update to authenticated using ((select auth.uid()) = ''617fe2f1-a6d6-4a49-bb20-d7c09857452f''::uuid) with check ((select auth.uid()) = ''617fe2f1-a6d6-4a49-bb20-d7c09857452f''::uuid)', t, t);
    execute format('create policy "Admin delete %I" on public.%I for delete to authenticated using ((select auth.uid()) = ''617fe2f1-a6d6-4a49-bb20-d7c09857452f''::uuid)', t, t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['clients','inquiries','projects','payments','follow_ups','activity_logs'] loop
    execute format('drop policy if exists "crm owner access" on public.%I', t);
    execute format('create policy "crm owner access" on public.%I for all to authenticated using ((select auth.uid()) = ''617fe2f1-a6d6-4a49-bb20-d7c09857452f''::uuid) with check ((select auth.uid()) = ''617fe2f1-a6d6-4a49-bb20-d7c09857452f''::uuid)', t);
  end loop;
end $$;

drop policy if exists "Admin can upload site images" on storage.objects;
drop policy if exists "Admin can update site images" on storage.objects;
drop policy if exists "Admin can delete site images" on storage.objects;

create policy "Admin can upload site images" on storage.objects for insert to authenticated
with check (bucket_id='site-images' and name like 'editor/%' and (select auth.uid()) = '617fe2f1-a6d6-4a49-bb20-d7c09857452f'::uuid);

create policy "Admin can update site images" on storage.objects for update to authenticated
using (bucket_id='site-images' and name like 'editor/%' and (select auth.uid()) = '617fe2f1-a6d6-4a49-bb20-d7c09857452f'::uuid)
with check (bucket_id='site-images' and name like 'editor/%' and (select auth.uid()) = '617fe2f1-a6d6-4a49-bb20-d7c09857452f'::uuid);

create policy "Admin can delete site images" on storage.objects for delete to authenticated
using (bucket_id='site-images' and name like 'editor/%' and (select auth.uid()) = '617fe2f1-a6d6-4a49-bb20-d7c09857452f'::uuid);