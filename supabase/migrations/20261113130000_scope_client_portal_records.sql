-- Let client accounts read records attached to projects they own.
create or replace function private.can_read_app_record(p_module text, p_payload jsonb, p_role text, p_email text)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare
  audience text := lower(coalesce(p_payload ->> 'targetAudience', ''));
  project_id text;
begin
  if p_role is null then return false; end if;
  if p_role in ('admin', 'manager', 'hr') then return true; end if;
  if p_module = 'attendance_policy' then return true; end if;
  if p_module in ('announcements', 'meetings') then
    if p_module = 'meetings' and p_role = 'client' then
      project_id := coalesce(p_payload ->> 'projectId', p_payload ->> 'project_id');
    else
      return true;
    end if;
  end if;

  if p_role in ('employee', 'intern') then
    if p_module = 'daily_tasks' then
      return private.record_matches_user(p_payload, p_email)
        or (p_role = 'intern' and (audience like '%all remote & onsite interns%' or audience like '%all interns%'))
        or (p_role = 'employee' and (audience like '%all paid staff%' or audience like '%all staff%' or audience like '%all employees%'));
    end if;
    if p_module in ('projects', 'tasks', 'comments', 'bug_reports', 'milestones', 'clients') then return true; end if;
    if p_module in ('employees', 'students', 'interns', 'attendance', 'student_attendance', 'leaves', 'complaints',
      'activity_logs', 'employee_activity_statuses', 'remote_work_sessions', 'monitoring_sessions',
      'screenshot_logs', 'app_usage_logs', 'work_timelines', 'productivity_reports')
      then return private.record_matches_user(p_payload, p_email); end if;
    return false;
  end if;

  if p_role = 'student' then
    if p_module = 'mcq_exams' then return true; end if;
    if p_module = 'daily_tasks' then
      return private.record_matches_user(p_payload, p_email)
        or audience like '%all enrolled students%'
        or audience like '%all students%';
    end if;
    if p_module in ('students', 'attendance', 'student_attendance', 'complaints', 'mcq_attempts')
      then return private.record_matches_user(p_payload, p_email)
        or (p_module = 'student_attendance' and private.user_is_linked_student(p_payload ->> 'student_id', p_email));
    end if;
    if p_module = 'student_fee_cycles' then return private.user_is_linked_student(p_payload ->> 'student_id', p_email); end if;
    return false;
  end if;

  if p_role = 'client' then
    if p_module not in ('projects', 'invoices', 'milestones', 'tasks', 'comments', 'bug_reports', 'meetings', 'users', 'clients') then
      return false;
    end if;
    if private.record_matches_user(p_payload, p_email) then return true; end if;

    if p_module = 'projects' then
      project_id := coalesce(p_payload ->> 'clientId', p_payload ->> 'client_id');
      return project_id is not null and exists (
        select 1 from public.app_records as client
        where client.module = 'clients'
          and client.payload ->> 'id' = project_id
          and private.record_matches_user(client.payload, p_email)
      );
    end if;

    project_id := coalesce(p_payload ->> 'projectId', p_payload ->> 'project_id');
    return project_id is not null and exists (
      select 1 from public.app_records as project
      where project.module = 'projects'
        and project.payload ->> 'id' = project_id
        and (
          private.record_matches_user(project.payload, p_email)
          or exists (
            select 1 from public.app_records as client
            where client.module = 'clients'
              and client.payload ->> 'id' = coalesce(project.payload ->> 'clientId', project.payload ->> 'client_id')
              and private.record_matches_user(client.payload, p_email)
          )
        )
    );
  end if;
  return false;
end;
$$;

revoke all on function private.can_read_app_record(text, jsonb, text, text) from public, anon;
grant execute on function private.can_read_app_record(text, jsonb, text, text) to authenticated;
