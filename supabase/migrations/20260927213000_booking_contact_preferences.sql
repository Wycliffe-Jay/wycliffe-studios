alter table public.inquiries
  add column if not exists additional_information text not null default '',
  add column if not exists preferred_contact_method text
    check (preferred_contact_method is null or preferred_contact_method in ('WhatsApp','Email'));

drop policy if exists "public can choose inquiry contact method" on public.inquiries;
create policy "public can choose inquiry contact method"
on public.inquiries for update to anon
using (source = 'Website' and status = 'New')
with check (
  source = 'Website'
  and status = 'New'
  and preferred_contact_method in ('WhatsApp','Email')
);

grant update (preferred_contact_method) on public.inquiries to anon;