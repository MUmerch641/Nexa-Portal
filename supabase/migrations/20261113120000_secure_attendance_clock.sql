-- Self-service attendance can only be changed through the trusted clock RPC.
create or replace function private.can_write_app_record(p_module text, p_payload jsonb, p_role text, p_email text)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
begin
  if p_role is null then return false; end if;
  if p_role in ('admin', 'manager', 'hr') then return true; end if;
  if p_role in ('employee', 'intern') then
    if p_module in ('leaves', 'complaints', 'activity_logs', 'employee_activity_statuses',
      'remote_work_sessions', 'monitoring_sessions', 'screenshot_logs', 'app_usage_logs', 'work_timelines', 'daily_tasks')
      then return private.record_matches_user(p_payload, p_email); end if;
    if p_module in ('comments', 'bug_reports') then return true; end if;
    return false;
  end if;
  if p_role = 'student' then
    if p_module in ('leaves', 'complaints', 'mcq_attempts', 'daily_tasks')
      then return private.record_matches_user(p_payload, p_email); end if;
    if p_module in ('comments', 'bug_reports') then return true; end if;
    return false;
  end if;
  if p_role = 'client' and p_module in ('comments', 'bug_reports') then
    return private.record_matches_user(p_payload, p_email);
  end if;
  return false;
end;
$$;

create or replace function public.clock_attendance(p_action text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text := lower(coalesce(private.current_app_email(), ''));
  v_role text := private.current_app_role();
  v_now timestamptz := now();
  v_local_now timestamp := timezone('Asia/Karachi', v_now);
  v_date date := v_local_now::date;
  v_time text := to_char(v_local_now, 'FMHH12:MI AM');
  v_minutes integer := extract(hour from v_local_now)::integer * 60 + extract(minute from v_local_now)::integer;
  v_policy jsonb := '{}'::jsonb;
  v_matches text[];
  v_hour integer;
  v_shift_start integer := 600;
  v_grace integer := 14;
  v_warning integer := 29;
  v_deduction integer := 30;
  v_status text;
  v_record_key text;
  v_existing public.app_records%rowtype;
  v_payload jsonb;
  v_check_in timestamptz;
  v_seconds integer;
  v_hours integer;
  v_remainder_minutes integer;
begin
  if v_uid is null or v_role is null or v_email = '' then
    return jsonb_build_object('success', false, 'error', 'Sign in with an active portal account.');
  end if;
  if v_role not in ('admin', 'manager', 'hr', 'employee', 'intern', 'student') then
    return jsonb_build_object('success', false, 'error', 'This account cannot record attendance.');
  end if;
  if p_action is null or p_action not in ('check_in', 'check_out') then
    return jsonb_build_object('success', false, 'error', 'Choose check_in or check_out.');
  end if;

  -- Serialize an account's check-in/out actions so simultaneous requests
  -- cannot create duplicate daily rows or accept two check-outs.
  perform pg_advisory_xact_lock(hashtextextended(v_email || ':' || v_date::text, 0));

  select payload into v_policy from public.app_records where module = 'attendance_policy' limit 1;
  v_policy := coalesce(v_policy, '{}'::jsonb);
  v_matches := regexp_match(coalesce(v_policy ->> 'shift_start', '10:00 AM'), '^(\d{1,2}):(\d{2})\s*(AM|PM)$', 'i');
  if v_matches is not null then
    v_hour := v_matches[1]::integer;
    if upper(v_matches[3]) = 'PM' and v_hour < 12 then v_hour := v_hour + 12; end if;
    if upper(v_matches[3]) = 'AM' and v_hour = 12 then v_hour := 0; end if;
    v_shift_start := v_hour * 60 + v_matches[2]::integer;
  end if;
  if coalesce(v_policy ->> 'grace_period_minutes', '') ~ '^\d+$' then
    v_grace := greatest(0, least(180, (v_policy ->> 'grace_period_minutes')::integer));
  end if;
  if coalesce(v_policy ->> 'late_warning_minutes', '') ~ '^\d+$' then
    v_warning := greatest(v_grace, least(180, (v_policy ->> 'late_warning_minutes')::integer));
  end if;
  if coalesce(v_policy ->> 'salary_deduction_after', '') ~ '^\d+$' then
    v_deduction := greatest(v_warning, least(180, (v_policy ->> 'salary_deduction_after')::integer));
  end if;

  v_record_key := 'attendance:' || v_email || ':' || v_date::text;
  select * into v_existing
    from public.app_records
    where module = 'attendance'
      and lower(coalesce(payload ->> 'user_email', payload ->> 'email', payload ->> 'employee_email', payload ->> 'student_email', '')) = v_email
      and coalesce(payload ->> 'attendance_date', payload ->> 'date', left(payload ->> 'timestamp', 10), '') = v_date::text
    order by created_at desc
    limit 1;

  v_payload := coalesce(v_existing.payload, '{}'::jsonb);
  if p_action = 'check_in' then
    if coalesce(v_payload ->> 'check_in_time', '') not in ('', '--:--', 'N/A', 'Not Checked In') then
      return jsonb_build_object('success', false, 'error', 'You have already checked in today.');
    end if;
    if lower(coalesce(v_payload ->> 'attendance_status', '')) like '%leave%' then
      return jsonb_build_object('success', false, 'error', 'Your attendance is already recorded as approved leave today.');
    end if;
    if v_minutes < v_shift_start then
      return jsonb_build_object('success', false, 'error', 'Attendance opens at ' || coalesce(v_policy ->> 'shift_start', '10:00 AM') || '.');
    end if;

    if v_minutes < v_shift_start + v_grace then
      v_status := case when v_role in ('student', 'intern') then 'Present (On Time)' else 'On Time' end;
    elsif v_minutes < v_shift_start + v_warning then
      v_status := 'Late Warning';
    elsif v_minutes < v_shift_start + v_deduction then
      v_status := 'Late';
    else
      v_status := case when v_role in ('student', 'intern') then 'Late Fine' else 'Salary Deduction' end;
    end if;

    v_payload := v_payload || jsonb_build_object(
      'id', coalesce(nullif(v_payload ->> 'id', ''), v_record_key),
      'employee_id', coalesce(v_payload ->> 'employee_id', v_email),
      'student_id', coalesce(v_payload ->> 'student_id', v_email),
      'user_id', v_email,
      'user_email', v_email,
      'email', v_email,
      'employee_email', v_email,
      'student_email', v_email,
      'user_name', coalesce((select full_name from public.user_profiles where id = v_uid), split_part(v_email, '@', 1)),
      'employee_name', coalesce((select full_name from public.user_profiles where id = v_uid), split_part(v_email, '@', 1)),
      'user_role', v_role,
      'type', 'check_in',
      'check_in_time', v_time,
      'check_out_time', 'Not Checked Out',
      'attendance_status', v_status,
      'status', v_status,
      'attendance_date', v_date::text,
      'date', v_date::text,
      'timestamp', v_now,
      'check_in_timestamp', v_now,
      'public_ip', ''
    );

    if v_existing.id is null then
      insert into public.app_records(module, record_key, payload, created_by)
      values ('attendance', v_record_key, v_payload, v_uid);
    else
      update public.app_records set payload = v_payload, updated_at = v_now where id = v_existing.id;
    end if;
    return jsonb_build_object('success', true, 'record', v_payload);
  end if;

  if v_existing.id is null or coalesce(v_payload ->> 'check_in_time', '') in ('', '--:--', 'N/A', 'Not Checked In', 'Leave Approved') then
    return jsonb_build_object('success', false, 'error', 'Check in before checking out.');
  end if;
  if coalesce(v_payload ->> 'check_out_time', '') not in ('', '--:--', 'N/A', 'Not Checked Out') then
    return jsonb_build_object('success', false, 'error', 'You have already checked out today.');
  end if;

  begin
    v_check_in := coalesce(nullif(v_payload ->> 'check_in_timestamp', '')::timestamptz, nullif(v_payload ->> 'timestamp', '')::timestamptz);
  exception when others then
    v_check_in := v_now;
  end;
  v_seconds := greatest(0, floor(extract(epoch from (v_now - coalesce(v_check_in, v_now))))::integer);
  v_hours := floor(v_seconds / 3600.0)::integer;
  v_remainder_minutes := floor((v_seconds % 3600) / 60.0)::integer;
  v_payload := v_payload || jsonb_build_object(
    'type', 'check_out',
    'check_out_time', v_time,
    'check_out_timestamp', v_now,
    'total_work_seconds', v_seconds,
    'total_work_hours', case when v_hours > 0 then v_hours || 'h ' || v_remainder_minutes || 'm ' || (v_seconds % 60) || 's' else v_remainder_minutes || 'm ' || (v_seconds % 60) || 's' end,
    'updated_at', v_now
  );
  update public.app_records set payload = v_payload, updated_at = v_now where id = v_existing.id;
  return jsonb_build_object('success', true, 'record', v_payload);
end;
$$;

revoke all on function private.can_write_app_record(text, jsonb, text, text) from public, anon;
grant execute on function private.can_write_app_record(text, jsonb, text, text) to authenticated;
revoke all on function public.clock_attendance(text) from public, anon;
grant execute on function public.clock_attendance(text) to authenticated;
