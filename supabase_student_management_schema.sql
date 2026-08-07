-- ====================================================================
-- SUPABASE DATABASE SCHEMA MIGRATION: STUDENT MANAGEMENT SYSTEM
-- Software House Management Portal (Fixed UUID & Foreign Key Types)
-- ====================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old conflicting tables if they exist with mismatched column types
DROP TABLE IF EXISTS exam_attempts CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS fee_records CASCADE;
DROP TABLE IF EXISTS admissions CASCADE;
DROP TABLE IF EXISTS guardians CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS daily_tasks CASCADE;
DROP TABLE IF EXISTS examinations CASCADE;

-- 1. STUDENTS TABLE (Primary Key UUID)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_no VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    profile_photo TEXT,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    cnic VARCHAR(50),
    dob DATE,
    gender VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(100),
    admission_date DATE DEFAULT CURRENT_DATE,
    batch VARCHAR(100),
    course_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Completed', 'Suspended'
    attendance_percentage INT DEFAULT 100,
    progress_percentage INT DEFAULT 0,
    fee_status VARCHAR(50) DEFAULT 'Paid',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GUARDIANS TABLE (Foreign Key UUID)
CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    guardian_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100),
    cnic VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    occupation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ADMISSIONS TABLE (Foreign Key UUID)
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    admission_date DATE DEFAULT CURRENT_DATE,
    admission_fee NUMERIC(10,2) DEFAULT 0,
    course_fee NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0,
    scholarship NUMERIC(10,2) DEFAULT 0,
    final_fee NUMERIC(10,2) NOT NULL,
    payment_plan VARCHAR(100) DEFAULT 'Monthly', -- 'Full', 'Monthly', 'Installments'
    joining_batch VARCHAR(100),
    duration_months INT DEFAULT 3,
    expected_completion_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DAILY TASKS TABLE
CREATE TABLE daily_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
    assigned_to_email VARCHAR(255) NOT NULL,
    assigned_by_name VARCHAR(255) DEFAULT 'System Admin',
    due_date DATE,
    estimated_hours NUMERIC(4,2) DEFAULT 1.0,
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Started', 'Paused', 'In Progress', 'Completed'
    start_time TIMESTAMPTZ,
    pause_time TIMESTAMPTZ,
    completion_time TIMESTAMPTZ,
    total_working_seconds INT DEFAULT 0,
    notes TEXT,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EXAMINATIONS TABLE
CREATE TABLE examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) DEFAULT 'MCQ', -- 'MCQ', 'Assignment', 'Coding', 'Practical'
    total_marks INT DEFAULT 100,
    pass_percentage INT DEFAULT 70,
    duration_minutes INT DEFAULT 30,
    questions_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EXAM ATTEMPTS TABLE (Foreign Key UUID)
CREATE TABLE exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES examinations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_email VARCHAR(255) NOT NULL,
    marks_obtained INT DEFAULT 0,
    percentage INT DEFAULT 0,
    passed BOOLEAN DEFAULT FALSE,
    attempt_date TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CERTIFICATES TABLE (Foreign Key UUID)
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    completion_date DATE DEFAULT CURRENT_DATE,
    grade VARCHAR(20) DEFAULT 'A+',
    instructor_name VARCHAR(255),
    qr_code_url TEXT,
    status VARCHAR(50) DEFAULT 'Valid', -- 'Valid', 'Revoked'
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FEE RECORDS TABLE (Foreign Key UUID)
CREATE TABLE fee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    receipt_no VARCHAR(100) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    total_fee NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) NOT NULL,
    remaining_balance NUMERIC(10,2) DEFAULT 0,
    due_date DATE,
    payment_method VARCHAR(100) DEFAULT 'Cash', -- 'Cash', 'JazzCash', 'EasyPaisa', 'Bank Transfer'
    payment_status VARCHAR(50) DEFAULT 'Approved', -- 'Pending', 'Approved', 'Rejected'
    payment_proof_url TEXT,
    transaction_ref VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_course ON students(course_name);
CREATE INDEX idx_daily_tasks_email ON daily_tasks(assigned_to_email);
CREATE INDEX idx_certificates_no ON certificates(certificate_number);
CREATE INDEX idx_fee_records_student ON fee_records(student_id);

-- ====================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access Students" ON students FOR SELECT USING (true);
CREATE POLICY "Public Insert Access Students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access Students" ON students FOR UPDATE USING (true);
CREATE POLICY "Public Delete Access Students" ON students FOR DELETE USING (true);

CREATE POLICY "Public Access Guardians" ON guardians FOR ALL USING (true);
CREATE POLICY "Public Access Admissions" ON admissions FOR ALL USING (true);
CREATE POLICY "Public Access Daily Tasks" ON daily_tasks FOR ALL USING (true);
CREATE POLICY "Public Access Examinations" ON examinations FOR ALL USING (true);
CREATE POLICY "Public Access Exam Attempts" ON exam_attempts FOR ALL USING (true);
CREATE POLICY "Public Access Certificates" ON certificates FOR ALL USING (true);
CREATE POLICY "Public Access Fee Records" ON fee_records FOR ALL USING (true);
