-- Run only after nexa@admin.com has created and confirmed their account.
update public.user_profiles
set role = 'admin',
    status = 'active',
    updated_at = now()
where lower(email) = lower('nexa@admin.com')
  and exists (
    select 1
    from auth.users as owner
    where owner.id = user_profiles.id
      and lower(owner.email) = lower('nexa@admin.com')
      and owner.confirmed_at is not null
  )
returning id, email, role, status;
