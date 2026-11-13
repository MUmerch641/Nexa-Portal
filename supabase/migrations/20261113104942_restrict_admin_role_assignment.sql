-- Keep manager and HR users from granting or changing admin accounts.
drop policy if exists user_profiles_admin_update on public.user_profiles;
create policy user_profiles_admin_update on public.user_profiles
  for update to authenticated
  using (
    (select private.is_portal_admin())
    and ((select private.current_app_role()) = 'admin' or role <> 'admin')
  )
  with check (
    (select private.is_portal_admin())
    and ((select private.current_app_role()) = 'admin' or role <> 'admin')
  );
