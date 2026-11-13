-- Enforce the no-password-in-JSON rule at the database boundary too, so a
-- client that bypasses the portal API cannot store Auth credentials in rows.
alter table public.app_records
  add constraint app_records_no_password_fields
  check (payload::text !~* '"(password|password_hash|assigned_password|confirm_password|current_password|new_password)"\s*:');

alter table public.app_records
  add constraint app_records_no_legacy_auth_passwords
  check (payload::text !~* '"(user_id|emergency_contact)"\s*:\s*"auth:');
