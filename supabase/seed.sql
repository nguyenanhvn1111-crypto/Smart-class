-- ====================================================================
-- SMARTCLASS SEED DATA FOR DEMO & TESTING
-- ====================================================================

-- 1. Insert School
INSERT INTO public.schools (id, name, code, address, phone, email, principal_name)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Trường THPT Chuyên Khoa Học Thực Nghiệm',
    'THPT-KHTN',
    '182 Lương Thế Vinh, Thanh Xuân, Hà Nội',
    '024 3854 4455',
    'contact@thpt-khtn.edu.vn',
    'TS. Nguyễn Văn Bình'
) ON CONFLICT (code) DO NOTHING;

-- 2. Insert Academic Year
INSERT INTO public.academic_years (id, school_id, name, start_date, end_date, is_current)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Năm học 2025 - 2026',
    '2025-09-05',
    '2026-05-31',
    true
) ON CONFLICT DO NOTHING;

-- 3. Insert Grade Levels
INSERT INTO public.grade_levels (id, school_id, name, level_number) VALUES
('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Khối 10', 10),
('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Khối 11', 11),
('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Khối 12', 12)
ON CONFLICT DO NOTHING;

-- 4. Insert Subjects
INSERT INTO public.subjects (id, school_id, name, code, color) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Toán Học', 'MATH', '#2563EB'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Ngữ Văn', 'LIT', '#DC2626'),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Tiếng Anh', 'ENG', '#7C3AED'),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Vật Lý', 'PHYS', '#059669'),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Hóa Học', 'CHEM', '#D97706'),
('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Tin Học', 'IT', '#0284C7')
ON CONFLICT DO NOTHING;

-- 5. Insert Grade Categories
INSERT INTO public.grade_categories (id, school_id, name, weight, code) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Đánh giá thường xuyên (ĐGTX)', 1.0, 'TX'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Đánh giá giữa kỳ (ĐGGK)', 2.0, 'GK'),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Đánh giá cuối kỳ (ĐGCK)', 3.0, 'CK')
ON CONFLICT DO NOTHING;

-- Instruction comment for executing seed with auth.users
-- Profiles & users can be synced through Supabase Auth triggers or direct INSERT.
