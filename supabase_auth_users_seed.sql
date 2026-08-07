-- ====================================================================
-- SUPABASE AUTHENTICATION USERS MIGRATION QUERY
-- Inserts default system accounts directly into Supabase auth.users & auth.identities
-- ====================================================================

-- Enable pgcrypto extension for bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Relax profiles_role_check constraint if present on public.profiles table
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Function to safely insert Supabase Auth User with Hashed Password
CREATE OR REPLACE FUNCTION create_supabase_auth_user(
    user_email TEXT,
    user_password TEXT,
    user_role TEXT DEFAULT 'authenticated',
    user_name TEXT DEFAULT 'System User'
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID := uuid_generate_v4();
    hashed_pw TEXT;
BEGIN
    -- Generate bcrypt password hash
    hashed_pw := crypt(user_password, gen_salt('bf'));

    -- Check if user already exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        UPDATE auth.users 
        SET encrypted_password = hashed_pw,
            email_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE email = user_email
        RETURNING id INTO new_user_id;
    ELSE
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            user_email,
            hashed_pw,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', user_name, 'role', user_role),
            NOW(),
            NOW(),
            '', '', '', ''
        );

        -- Insert into auth.identities with provider_id explicitly set
        INSERT INTO auth.identities (
            id,
            user_id,
            provider_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            new_user_id,
            new_user_id,
            user_email,
            jsonb_build_object('sub', new_user_id::text, 'email', user_email),
            'email',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute function to seed all default system login accounts into Supabase Auth Cloud
SELECT create_supabase_auth_user('admin@gmail.com', 'adminpassword', 'admin', 'System Admin');
SELECT create_supabase_auth_user('student@gmail.com', 'studentpassword', 'student', 'Ali Hassan (Student)');
SELECT create_supabase_auth_user('sara.design@gmail.com', 'employeepassword', 'employee', 'Sara Khan');
SELECT create_supabase_auth_user('rahim.dev@gmail.com', 'employeepassword', 'employee', 'Rahim Bugti');
SELECT create_supabase_auth_user('ali.staff@gmail.com', 'employeepassword', 'employee', 'Ali Staff');
SELECT create_supabase_auth_user('client@acmetech.com', 'clientpassword', 'client', 'Acme Corp Client');
