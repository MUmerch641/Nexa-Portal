-- ====================================================================
-- SUPABASE DATABASE SCHEMA MIGRATION: REMOTE EMPLOYEE MONITORING SYSTEM
-- Software House Management Portal
-- ====================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. REMOTE WORK SESSIONS TABLE
CREATE TABLE IF NOT EXISTS remote_work_sessions (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'sess-' || uuid_generate_v4(),
    employee_id VARCHAR(100) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) DEFAULT 'Engineering',
    device_name VARCHAR(255),
    os VARCHAR(100),
    ip_address VARCHAR(50),
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Idle', 'Completed'
    active_minutes INT DEFAULT 0,
    idle_minutes INT DEFAULT 0,
    productivity_score INT DEFAULT 100,
    current_app VARCHAR(255),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'act-' || uuid_generate_v4(),
    session_id VARCHAR(100) REFERENCES remote_work_sessions(id) ON DELETE CASCADE,
    employee_id VARCHAR(100) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds INT DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- 'Active', 'Idle'
    mouse_events INT DEFAULT 0,
    keyboard_events INT DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SCREENSHOT LOGS TABLE
CREATE TABLE IF NOT EXISTS screenshot_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'sc-' || uuid_generate_v4(),
    session_id VARCHAR(100) REFERENCES remote_work_sessions(id) ON DELETE CASCADE,
    employee_id VARCHAR(100) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    screenshot_url TEXT NOT NULL,
    captured_app VARCHAR(255),
    activity_level INT DEFAULT 100, -- percentage
    date DATE DEFAULT CURRENT_DATE,
    time VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    interval_minutes INT DEFAULT 10,
    device_name VARCHAR(255),
    os VARCHAR(100),
    ip_address VARCHAR(50),
    size VARCHAR(100),
    resolution VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. APPLICATION USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS app_usage_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'app-' || uuid_generate_v4(),
    session_id VARCHAR(100) REFERENCES remote_work_sessions(id) ON DELETE CASCADE,
    employee_id VARCHAR(100) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    window_title TEXT,
    website_url TEXT,
    category VARCHAR(100) DEFAULT 'Development',
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    usage_minutes INT DEFAULT 0,
    percentage INT DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WORK TIMELINES TABLE
CREATE TABLE IF NOT EXISTS work_timelines (
    id VARCHAR(100) PRIMARY KEY DEFAULT 't-' || uuid_generate_v4(),
    session_id VARCHAR(100) REFERENCES remote_work_sessions(id) ON DELETE CASCADE,
    employee_id VARCHAR(100) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    time VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'Login', 'App Focus', 'Screenshot', 'Idle Alert', 'Activity Resume', 'Logout'
    detail TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    date DATE DEFAULT CURRENT_DATE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PRODUCTIVITY REPORTS TABLE
CREATE TABLE IF NOT EXISTS productivity_reports (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'rep-' || uuid_generate_v4(),
    employee_id VARCHAR(100) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    report_type VARCHAR(50) NOT NULL, -- 'Daily', 'Weekly', 'Monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_active_hours NUMERIC(5,2) DEFAULT 0,
    total_idle_hours NUMERIC(5,2) DEFAULT 0,
    focus_time_hours NUMERIC(5,2) DEFAULT 0,
    screenshot_count INT DEFAULT 0,
    productivity_percentage INT DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_remote_sessions_emp ON remote_work_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_remote_sessions_date ON remote_work_sessions(date);
CREATE INDEX IF NOT EXISTS idx_screenshot_logs_emp ON screenshot_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_screenshot_logs_sess ON screenshot_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_screenshot_logs_date ON screenshot_logs(date);
CREATE INDEX IF NOT EXISTS idx_work_timelines_emp ON work_timelines(employee_id);
CREATE INDEX IF NOT EXISTS idx_app_usage_emp ON app_usage_logs(employee_id);

-- ====================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all monitoring tables
ALTER TABLE remote_work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_reports ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon Anon Key Read & Insert for App Features
CREATE POLICY "Allow select on remote_work_sessions" ON remote_work_sessions FOR SELECT USING (true);
CREATE POLICY "Allow insert on remote_work_sessions" ON remote_work_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on remote_work_sessions" ON remote_work_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow delete on remote_work_sessions" ON remote_work_sessions FOR DELETE USING (true);

CREATE POLICY "Allow all on activity_logs" ON activity_logs FOR ALL USING (true);
CREATE POLICY "Allow all on screenshot_logs" ON screenshot_logs FOR ALL USING (true);
CREATE POLICY "Allow all on app_usage_logs" ON app_usage_logs FOR ALL USING (true);
CREATE POLICY "Allow all on work_timelines" ON work_timelines FOR ALL USING (true);
CREATE POLICY "Allow all on productivity_reports" ON productivity_reports FOR ALL USING (true);

-- ====================================================================
-- SUPABASE STORAGE BUCKET FOR SCREENSHOTS
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('remote-screenshots', 'remote-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policy
CREATE POLICY "Public Read Access for Screenshots" ON storage.objects 
FOR SELECT USING (bucket_id = 'remote-screenshots');

CREATE POLICY "Public Insert Access for Screenshots" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'remote-screenshots');

-- ====================================================================
-- TRUNCATE / CLEANUP COMMANDS TO REMOVE DUMMY DEMO DATA
-- ====================================================================
TRUNCATE TABLE remote_work_sessions CASCADE;
TRUNCATE TABLE screenshot_logs CASCADE;
TRUNCATE TABLE activity_logs CASCADE;
TRUNCATE TABLE app_usage_logs CASCADE;
TRUNCATE TABLE work_timelines CASCADE;
TRUNCATE TABLE productivity_reports CASCADE;
