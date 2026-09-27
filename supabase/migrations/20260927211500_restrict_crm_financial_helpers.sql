revoke all on function public.crm_project_paid(uuid) from public, anon;
revoke all on function public.crm_project_balance(uuid) from public, anon;
grant execute on function public.crm_project_paid(uuid) to authenticated;
grant execute on function public.crm_project_balance(uuid) to authenticated;