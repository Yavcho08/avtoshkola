-- ==============================================================================
-- MOCK DATA FOR AVTOSHKOLA DATABASE
-- Run this in your Supabase SQL Editor to populate your tables for testing.
-- ==============================================================================

-- 0. Insert Auth Users (Required for login and foreign keys in profiles)
-- Supabase GoTrue requires valid auth.users and auth.identities records for login to work.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- A. Insert Users
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES 
('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@avtoshkola.local', crypt('password123', gen_salt('bf')), NOW(), NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'instructor@avtoshkola.local', crypt('password123', gen_salt('bf')), NOW(), NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW(), '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'student@avtoshkola.local', crypt('password123', gen_salt('bf')), NOW(), NULL, NOW(), '{"provider": "email", "providers": ["email"]}', '{}', NOW(), NOW(), '', '', '', '')
ON CONFLICT (id) DO UPDATE SET 
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data;

-- B. Insert Identities (Crucial for email/password login to work)
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id) VALUES
('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', format('{"sub":"%s", "email":"%s"}', '20000000-0000-0000-0000-000000000001', 'admin@avtoshkola.local')::jsonb, 'email', NOW(), NOW(), NOW(), '20000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', format('{"sub":"%s", "email":"%s"}', '20000000-0000-0000-0000-000000000002', 'instructor@avtoshkola.local')::jsonb, 'email', NOW(), NOW(), NOW(), '20000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', format('{"sub":"%s", "email":"%s"}', '20000000-0000-0000-0000-000000000003', 'student@avtoshkola.local')::jsonb, 'email', NOW(), NOW(), NOW(), '20000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- 1. Insert Categories
INSERT INTO categories (id, name) VALUES 
('10000000-0000-0000-0000-000000000001', 'B'),
('10000000-0000-0000-0000-000000000002', 'C'),
('10000000-0000-0000-0000-000000000003', 'AM'),
('10000000-0000-0000-0000-000000000004', 'A')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Profiles
INSERT INTO profiles (id, role, first_name, last_name, phone) VALUES 
('20000000-0000-0000-0000-000000000001', 'admin'::user_role, 'Admin', 'Adminov', '0888111222'),
('20000000-0000-0000-0000-000000000002', 'instructor'::user_role, 'Ivan', 'Ivanov', '0888333444'),
('20000000-0000-0000-0000-000000000003', 'student'::user_role, 'Petar', 'Petrov', '0888555666')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Instructors
INSERT INTO instructors (id, profile_id, license_number, is_active) VALUES 
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'LIC-12345', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Students
INSERT INTO students (id, profile_id, egn, registration_date, status) VALUES 
('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '9901011234', CURRENT_DATE, 'active'::student_status)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Vehicles
INSERT INTO vehicles (id, registration_number, make, model, category_id, technical_inspection_date, status) VALUES 
('50000000-0000-0000-0000-000000000001', 'CB1234AB', 'Volkswagen', 'Golf', '10000000-0000-0000-0000-000000000001', (CURRENT_DATE + INTERVAL '6 months')::date, 'active'::vehicle_status)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Student Categories
INSERT INTO student_categories (id, student_id, category_id, instructor_id, readiness_status) VALUES 
('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 50)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Lessons (Practice and Theory)
INSERT INTO lessons (id, student_id, instructor_id, vehicle_id, type, start_time, end_time, status, instructor_notes) VALUES 
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'practice'::lesson_type, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'completed'::lesson_status, 'Good parking.'),
('70000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'practice'::lesson_type, NOW() + INTERVAL '1 day', NOW() + INTERVAL '25 hours', 'scheduled'::lesson_status, NULL)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Exams
INSERT INTO exams (id, student_id, type, exam_date, status, score) VALUES 
('80000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'internal_theory'::exam_type, NOW() + INTERVAL '10 days', 'scheduled'::exam_status, NULL)
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Payments
INSERT INTO payments (id, student_id, amount, type, status, due_date, payment_date) VALUES 
('90000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 300.00, 'installment'::payment_type, 'paid'::payment_status, (CURRENT_DATE - INTERVAL '5 days')::date, (CURRENT_DATE - INTERVAL '5 days')::date),
('90000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 300.00, 'installment'::payment_type, 'overdue'::payment_status, (CURRENT_DATE - INTERVAL '1 day')::date, NULL)
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Expenses
INSERT INTO expenses (id, description, amount, expense_date, category) VALUES 
('A0000000-0000-0000-0000-000000000001', 'Fuel for Golf CB1234AB', 120.50, (CURRENT_DATE - INTERVAL '2 days')::date, 'fuel'::expense_category),
('A0000000-0000-0000-0000-000000000002', 'Office Rent', 800.00, (CURRENT_DATE - INTERVAL '5 days')::date, 'rent'::expense_category)
ON CONFLICT (id) DO NOTHING;
