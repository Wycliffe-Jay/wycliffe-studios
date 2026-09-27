do $$
declare t text;
begin
  foreach t in array array['hero_content','portfolio_items','services','testimonials','about_content','process_items','faq_items','site_settings'] loop
    execute format('drop policy if exists "Admin write %I" on public.%I', t, t);
    execute format('create policy "Admin insert %I" on public.%I for insert to authenticated with check ((select auth.uid()) = ''ecbb9203-f2aa-4c73-b471-dee154ea56ac''::uuid)', t, t);
    execute format('create policy "Admin update %I" on public.%I for update to authenticated using ((select auth.uid()) = ''ecbb9203-f2aa-4c73-b471-dee154ea56ac''::uuid) with check ((select auth.uid()) = ''ecbb9203-f2aa-4c73-b471-dee154ea56ac''::uuid)', t, t);
    execute format('create policy "Admin delete %I" on public.%I for delete to authenticated using ((select auth.uid()) = ''ecbb9203-f2aa-4c73-b471-dee154ea56ac''::uuid)', t, t);
  end loop;
end $$;

drop policy if exists "crm owner access" on public.inquiries;
create policy "crm admin select inquiries" on public.inquiries for select to authenticated
using ((select auth.uid()) = 'ecbb9203-f2aa-4c73-b471-dee154ea56ac'::uuid);
create policy "crm admin update inquiries" on public.inquiries for update to authenticated
using ((select auth.uid()) = 'ecbb9203-f2aa-4c73-b471-dee154ea56ac'::uuid)
with check ((select auth.uid()) = 'ecbb9203-f2aa-4c73-b471-dee154ea56ac'::uuid);
create policy "crm admin delete inquiries" on public.inquiries for delete to authenticated
using ((select auth.uid()) = 'ecbb9203-f2aa-4c73-b471-dee154ea56ac'::uuid);
