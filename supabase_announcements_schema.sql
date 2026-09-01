-- ====================================================================
-- SUPABASE DATABASE TABLE: ANNOUNCEMENTS
-- Run this in your Supabase SQL Editor to create the announcements table
-- ====================================================================

-- 1. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General Notice',
    priority VARCHAR(50) DEFAULT 'Normal',
    target_audience VARCHAR(100) DEFAULT 'All Users',
    target_type VARCHAR(100) DEFAULT 'all',
    target_key VARCHAR(255),
    content TEXT NOT NULL,
    start_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    due_date DATE,
    is_fee_notice BOOLEAN DEFAULT FALSE,
    broadcast_notification BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 3. Create Public Policies (Allows Portal to read and publish announcements)
DROP POLICY IF EXISTS "Allow public read on announcements" ON announcements;
CREATE POLICY "Allow public read on announcements"
ON announcements FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow public insert on announcements" ON announcements;
CREATE POLICY "Allow public insert on announcements"
ON announcements FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on announcements" ON announcements;
CREATE POLICY "Allow public update on announcements"
ON announcements FOR UPDATE
TO public
USING (true);

DROP POLICY IF EXISTS "Allow public delete on announcements" ON announcements;
CREATE POLICY "Allow public delete on announcements"
ON announcements FOR DELETE
TO public
USING (true);

-- 4. Seed Initial Announcements into Supabase Table
INSERT INTO announcements (title, category, priority, target_audience, content, start_date, expiry_date)
VALUES 
('System Maintenance & Portal Updates 🚀', 'General Notice', 'Normal', 'All Users', 'Nexa Portal features have been updated with automated attendance tracking and live remote screen monitoring station.', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days'),
('Academy & Office Sunday Holiday 🏖️', 'Holiday', 'Urgent', 'All Users', 'All remote interns, students, and employees are reminded that Sundays are official off-days with no shift attendance required.', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

