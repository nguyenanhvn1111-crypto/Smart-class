export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  school_id: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  principal_name?: string;
  created_at: string;
}

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface GradeLevel {
  id: string;
  school_id: string;
  name: string;
  level_number: number;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string;
  color: string;
}

export interface ClassModel {
  id: string;
  school_id: string;
  academic_year_id: string;
  grade_level_id: string;
  name: string;
  room?: string;
  join_code: string;
  status: 'active' | 'archived' | 'completed';
  homeroom_teacher_id?: string;
  homeroom_teacher_name?: string;
  student_count: number;
  grade_name?: string;
  created_at: string;
}

export interface Student {
  id: string;
  profile_id: string;
  student_code: string;
  full_name: string;
  email: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  address?: string;
  status: 'active' | 'graduated' | 'suspended' | 'transferred';
  class_id: string;
  class_name: string;
  roll_number?: number;
  parent_id?: string;
  parent_name?: string;
  parent_phone?: string;
  attendance_rate?: number; // e.g. 96 (%)
  gpa?: number; // e.g. 8.4
  behavior_score?: number; // e.g. 95
  avatar_url?: string;
  parent_relationship?: string;
  parent_email?: string;
  parent_job?: string;
  parent_workplace?: string;
  mother_name?: string;
  mother_phone?: string;
  mother_job?: string;
  mother_workplace?: string;
  mother_email?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  ethnicity?: string;
  religion?: string;
  national_id?: string;
  blood_type?: string;
  class_role?: string;
  family_note?: string;
  parent_cmhs_role?: string; // 'Trưởng ban ĐD CMHS' | 'Phó ban ĐD CMHS'
  app_connected?: boolean;
}

export interface Guardian {
  id: string;
  profile_id: string;
  full_name: string;
  email: string;
  phone: string;
  relationship: string; // 'Bố', 'Mẹ', 'Người giám hộ'
  occupation?: string;
  workplace?: string;
  student_ids: string[];
}

export type AttendanceStatus = 'present' | 'absent_excused' | 'absent_unexcused' | 'late' | 'early_leave';

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  class_id: string;
  class_name?: string;
  date: string;
  session_type: 'daily' | 'morning' | 'afternoon' | 'period';
  period_number?: number;
  recorded_by?: string;
  recorded_by_name?: string;
  notes?: string;
  present_count?: number;
  absent_excused_count?: number;
  absent_unexcused_count?: number;
  late_count?: number;
  early_leave_count?: number;
  total_students?: number;
  records?: AttendanceRecord[];
}

export interface Assignment {
  id: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description: string;
  attachments?: { name: string; url: string; size?: string }[];
  due_date: string;
  points_max: number;
  status: 'draft' | 'published' | 'closed';
  allow_late: boolean;
  submitted_count: number;
  graded_count: number;
  total_students: number;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_code: string;
  submitted_at: string;
  content?: string;
  files?: { name: string; url: string; size?: string }[];
  score?: number;
  feedback?: string;
  graded_by?: string;
  graded_at?: string;
  status: 'submitted' | 'graded' | 'late' | 'returned';
}

export interface GradeCategory {
  id: string;
  school_id: string;
  name: string;
  weight: number;
  code: string;
}

export interface GradeItem {
  id: string;
  class_id: string;
  subject_id: string;
  subject_name?: string;
  category_id: string;
  category_name: string;
  name: string;
  max_score: number;
  semester: 1 | 2;
  date: string;
}

export interface GradeRecord {
  id: string;
  grade_item_id: string;
  student_id: string;
  score: number | null;
  comment?: string;
  updated_at: string;
}

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'matching'
  | 'ordering'
  | 'fill_blank'
  | 'short_answer'
  | 'essay'
  | 'passage';

export type QuestionDifficulty = 'nhan_biet' | 'thong_hieu' | 'van_dung' | 'van_dung_cao';

export type QuestionStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';

export type QuestionSourceType = 'teacher_composed' | 'ai_generated' | 'imported_file' | 'exam_archive';

export interface MatchingPair {
  left_id: string;
  left_text: string;
  right_id: string;
  right_text: string;
}

export interface StatementItem {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface OrderingItem {
  id: string;
  text: string;
  correct_order: number;
}

export interface BlankItem {
  id: string;
  label?: string;
  accepted_answers: string[];
  case_sensitive?: boolean;
}

export interface ShortAnswerConfig {
  sample_answer: string;
  variants: string[];
  numeric_tolerance?: number;
  unit?: string;
  manual_grading_threshold?: boolean;
}

export interface RubricItem {
  id: string;
  criteria: string;
  max_points: number;
  description: string;
}

export interface QuestionRevision {
  version: number;
  updated_by: string;
  updated_at: string;
  change_summary: string;
  status: QuestionStatus;
}

export interface Question {
  id: string;
  code?: string;
  teacher_id: string;
  teacher_name?: string;
  subject_id: string;
  subject_name?: string;
  grade_id?: string;
  grade_name?: string;
  chapter_name?: string;
  lesson_name?: string;
  topic_name?: string;
  tags?: string[];
  difficulty?: QuestionDifficulty;
  question_text: string;
  question_type: QuestionType;
  options: { id: string; text: string; is_correct?: boolean }[];
  correct_answer: any;
  explanation?: string;
  points: number;
  status?: QuestionStatus;
  source_type?: QuestionSourceType;
  source_ref?: string;
  version?: number;
  revisions?: QuestionRevision[];
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
  // Specific payloads for 9 types
  statements?: StatementItem[];
  matching_pairs?: MatchingPair[];
  ordering_items?: OrderingItem[];
  blanks?: BlankItem[];
  short_answer_config?: ShortAnswerConfig;
  rubric?: RubricItem[];
  // For passage (tình huống)
  passage_text?: string;
  passage_image?: string;
  sub_questions?: Question[];
}

export interface Quiz {
  id: string;
  class_id: string;
  class_name: string;
  teacher_id: string;
  subject_id: string;
  subject_name: string;
  title: string;
  description: string;
  duration_minutes: number;
  start_time?: string;
  end_time?: string;
  pass_score: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  is_published: boolean;
  questions: Question[];
  total_points: number;
  attempt_count: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  student_name?: string;
  started_at: string;
  completed_at?: string;
  score: number;
  max_score: number;
  answers: Record<string, any>;
  status: 'in_progress' | 'completed' | 'timed_out';
}

export interface ResourceItem {
  id: string;
  school_id: string;
  grade_level_id?: string;
  grade_name?: string;
  subject_id: string;
  subject_name: string;
  uploader_id: string;
  uploader_name: string;
  title: string;
  description?: string;
  topic: string;
  file_url: string;
  file_type: 'pdf' | 'docx' | 'pptx' | 'video' | 'link' | 'image';
  file_size_bytes?: number;
  is_public: boolean;
  downloads_count: number;
  created_at: string;
}

export interface BehaviorRecord {
  id: string;
  class_id: string;
  student_id: string;
  student_name: string;
  teacher_id: string;
  teacher_name: string;
  type: 'positive' | 'need_improvement';
  points: number;
  title: string;
  description?: string;
  created_at: string;
}

export interface RewardBadge {
  id: string;
  student_id: string;
  title: string;
  badge_icon: string;
  points: number;
  granted_by: string;
  granted_at: string;
}

export interface AlertItem {
  id: string;
  school_id: string;
  class_id?: string;
  class_name?: string;
  student_id?: string;
  student_name?: string;
  type: 'attendance' | 'academic' | 'behavior' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'new' | 'viewed' | 'in_progress' | 'resolved';
  assigned_to?: string;
  created_at: string;
  resolved_at?: string;
}

export interface Announcement {
  id: string;
  school_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  title: string;
  content: string;
  target_type: 'all' | 'class' | 'teachers' | 'students' | 'parents';
  target_id?: string;
  target_name?: string;
  priority: 'normal' | 'important' | 'urgent';
  attachments?: { name: string; url: string; size?: string }[];
  is_published: boolean;
  created_at: string;
  read_count: number;
  total_recipients: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'assignment' | 'attendance' | 'grade' | 'announcement' | 'alert';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  day_of_week: number; // 2 -> 7
  period_number: number; // 1 -> 5 (morning), 6 -> 10 (afternoon)
  start_time: string;
  end_time: string;
  room: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: string;
  ip_address?: string;
  created_at: string;
}
