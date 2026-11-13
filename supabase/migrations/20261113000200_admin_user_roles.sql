-- Allow authenticated administrators to assign roles to approved accounts.
grant update (role, status, updated_at) on public.user_profiles to authenticated;
drop policy if exists user_profiles_admin_update on public.user_profiles;
create policy user_profiles_admin_update on public.user_profiles
  for update to authenticated
  using (private.is_portal_admin())
  with check (private.is_portal_admin());
