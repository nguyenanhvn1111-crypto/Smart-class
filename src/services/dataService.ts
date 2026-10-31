import { isSupabaseConfigured, supabase } from './supabase';
import {
  saveQuestionToFirestore,
  deleteQuestionFromFirestore,
  fetchQuestionsFromFirestore,
  saveStudentToFirestore,
  fetchStudentsFromFirestore,
  deleteStudentFromFirestore,
  batchSaveStudentsToFirestore
} from './firebaseDataService';
import { createFirebaseUserAccount } from './firebaseAuthAdminService';
import {
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE_SESSIONS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_GRADE_ITEMS,
  INITIAL_GRADE_RECORDS,
  INITIAL_QUESTIONS,
  INITIAL_QUIZZES,
  INITIAL_RESOURCES,
  INITIAL_BEHAVIOR_RECORDS,
  INITIAL_REWARDS,
  INITIAL_ALERTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SCHEDULES,
  INITIAL_AUDIT_LOGS,
  INITIAL_SUBJECTS,
  INITIAL_GRADE_LEVELS,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_SCHOOL,
  INITIAL_GRADE_CATEGORIES
} from './seedData';
import {
  ClassModel,
  Student,
  AttendanceSession,
  AttendanceRecord,
  Assignment,
  Submission,
  GradeItem,
  GradeRecord,
  Question,
  Quiz,
  ResourceItem,
  BehaviorRecord,
  RewardBadge,
  AlertItem,
  Announcement,
  ScheduleItem,
  AuditLogItem,
  Subject,
  GradeLevel,
  AcademicYear,
  School,
  GradeCategory
} from '../types';

// In-memory persistent reactive store
class DataStore {
  classes: ClassModel[] = [...INITIAL_CLASSES];
  students: Student[] = [...INITIAL_STUDENTS];
  attendanceSessions: AttendanceSession[] = [...INITIAL_ATTENDANCE_SESSIONS];
  assignments: Assignment[] = [...INITIAL_ASSIGNMENTS];
  submissions: Submission[] = [...INITIAL_SUBMISSIONS];
  gradeCategories: GradeCategory[] = [...INITIAL_GRADE_CATEGORIES];
  gradeItems: GradeItem[] = [...INITIAL_GRADE_ITEMS];
  gradeRecords: GradeRecord[] = [...INITIAL_GRADE_RECORDS];
  questions: Question[] = [...INITIAL_QUESTIONS];
  quizzes: Quiz[] = [...INITIAL_QUIZZES];
  resources: ResourceItem[] = [...INITIAL_RESOURCES];
  behaviorRecords: BehaviorRecord[] = [...INITIAL_BEHAVIOR_RECORDS];
  rewards: RewardBadge[] = [...INITIAL_REWARDS];
  alerts: AlertItem[] = [...INITIAL_ALERTS];
  announcements: Announcement[] = [...INITIAL_ANNOUNCEMENTS];
  schedules: ScheduleItem[] = [...INITIAL_SCHEDULES];
  auditLogs: AuditLogItem[] = [...INITIAL_AUDIT_LOGS];
  subjects: Subject[] = [...INITIAL_SUBJECTS];
  gradeLevels: GradeLevel[] = [...INITIAL_GRADE_LEVELS];
  academicYears: AcademicYear[] = [...INITIAL_ACADEMIC_YEARS];
  school: School = { ...INITIAL_SCHOOL };

  listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  logAudit(action: string, entity_type: string, entity_id: string, details: string, user_name = 'Người dùng hiện tại', user_role: any = 'teacher') {
    const newLog: AuditLogItem = {
      id: 'log-' + Date.now(),
      user_id: 'usr-current',
      user_name,
      user_role,
      action,
      entity_type,
      entity_id,
      details,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);
    this.notify();
  }
}

export const store = new DataStore();

// DATA SERVICE API
export const DataService = {
  // Subscription helper for React hooks
  subscribe(callback: () => void) {
    return store.subscribe(callback);
  },

  // SCHOOL & METADATA
  async getSchool(): Promise<School> {
    return store.school;
  },
  async getAcademicYears(): Promise<AcademicYear[]> {
    return store.academicYears;
  },
  async getGradeLevels(): Promise<GradeLevel[]> {
    return store.gradeLevels;
  },
  async getSubjects(): Promise<Subject[]> {
    return store.subjects;
  },

  // CLASSES
  async getClasses(): Promise<ClassModel[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('classes').select('*');
      if (!error && data && data.length > 0) return data as ClassModel[];
    }
    return [...store.classes];
  },

  async getClassById(id: string): Promise<ClassModel | undefined> {
    return store.classes.find((c) => c.id === id);
  },

  async createClass(item: Omit<ClassModel, 'id' | 'created_at' | 'student_count' | 'join_code'>): Promise<ClassModel> {
    const newClass: ClassModel = {
      ...item,
      id: 'cls-' + Math.random().toString(36).substring(2, 9),
      join_code: 'SMART' + Math.floor(1000 + Math.random() * 9000),
      student_count: 0,
      status: 'active',
      created_at: new Date().toISOString()
    };
    store.classes.unshift(newClass);
    store.logAudit('CREATE_CLASS', 'classes', newClass.id, `Tạo mới lớp học: ${newClass.name}`);
    store.notify();
    return newClass;
  },

  async updateClass(id: string, updates: Partial<ClassModel>): Promise<ClassModel> {
    const index = store.classes.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Không tìm thấy lớp học');
    store.classes[index] = { ...store.classes[index], ...updates };
    store.logAudit('UPDATE_CLASS', 'classes', id, `Cập nhật thông tin lớp: ${store.classes[index].name}`);
    store.notify();
    return store.classes[index];
  },

  async deleteClass(id: string): Promise<void> {
    const target = store.classes.find((c) => c.id === id);
    store.classes = store.classes.filter((c) => c.id !== id);
    store.logAudit('DELETE_CLASS', 'classes', id, `Xóa lớp học: ${target?.name || id}`);
    store.notify();
  },

  // STUDENTS
  async getStudents(classId?: string): Promise<Student[]> {
    try {
      const remote = await fetchStudentsFromFirestore(classId);
      if (remote && remote.length > 0) {
        const idMap = new Map(store.students.map((s) => [s.id, s]));
        remote.forEach((rs) => {
          idMap.set(rs.id, { ...(idMap.get(rs.id) || {}), ...rs });
        });
        store.students = Array.from(idMap.values());
      }
    } catch (e) {
      console.warn('Firestore getStudents fallback to local cache:', e);
    }

    if (classId) {
      return store.students.filter((s) => s.class_id === classId);
    }
    return [...store.students];
  },

  async getStudentById(id: string): Promise<Student | undefined> {
    return store.students.find((s) => s.id === id);
  },

  async createStudent(
    student: Omit<Student, 'id' | 'attendance_rate' | 'gpa' | 'behavior_score' | 'profile_id'> & {
      profile_id?: string;
    },
    authPassword = 'password123'
  ): Promise<Student> {
    let authUid = student.profile_id;

    // Automatically provision user into Firebase Authentication if an email is provided or generated
    const studentEmail =
      student.email?.trim() ||
      `${student.student_code.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.smartclass.edu.vn`;

    try {
      const authRes = await createFirebaseUserAccount({
        email: studentEmail,
        password: authPassword,
        fullName: student.full_name,
        role: 'student',
        phone: student.phone
      });
      if (authRes.success && authRes.uid) {
        authUid = authRes.uid;
      }
    } catch (e) {
      console.warn('Firebase Auth creation warning for student:', e);
    }

    const newStudent: Student = {
      ...student,
      email: studentEmail,
      id: 'stu-' + Math.random().toString(36).substring(2, 9),
      profile_id: authUid || 'usr-' + Date.now(),
      attendance_rate: 100,
      gpa: 8.0,
      behavior_score: 90
    };
    store.students.push(newStudent);
    // update student count in class
    const cls = store.classes.find((c) => c.id === newStudent.class_id);
    if (cls) cls.student_count += 1;
    store.logAudit('CREATE_STUDENT', 'students', newStudent.id, `Thêm học sinh ${newStudent.full_name} (${newStudent.student_code})`);
    store.notify();

    // Tự động lưu học sinh mới trực tiếp vào Firebase Firestore
    try {
      await saveStudentToFirestore(newStudent);
    } catch (fsErr) {
      console.warn('Lỗi khi lưu học sinh vào Firebase Firestore:', fsErr);
    }

    return newStudent;
  },

  async batchCreateStudents(
    classId: string,
    students: Partial<Student>[],
    defaultPassword = 'password123'
  ): Promise<{ success: number; failed: number }> {
    const cls = store.classes.find((c) => c.id === classId);
    let success = 0;
    const createdStudents: Student[] = [];

    for (let idx = 0; idx < students.length; idx++) {
      const item = students[idx];
      if (item.full_name && item.student_code) {
        const studentEmail =
          item.email?.trim() ||
          `${item.student_code.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.smartclass.edu.vn`;
        let authUid = 'usr-' + Math.random().toString(36).substring(2, 9);

        try {
          const authRes = await createFirebaseUserAccount({
            email: studentEmail,
            password: defaultPassword,
            fullName: item.full_name,
            role: 'student',
            phone: item.phone
          });
          if (authRes.success && authRes.uid) {
            authUid = authRes.uid;
          }
        } catch (e) {
          console.warn('Batch student Firebase Auth warning:', e);
        }

        const newStu: Student = {
          id: 'stu-' + Math.random().toString(36).substring(2, 9),
          profile_id: authUid,
          student_code: item.student_code,
          full_name: item.full_name,
          email: studentEmail,
          phone: item.phone,
          gender: item.gender || 'male',
          date_of_birth: item.date_of_birth || '2010-01-01',
          address: item.address,
          status: 'active',
          class_id: classId,
          class_name: cls?.name || '10A1',
          roll_number: (cls?.student_count || 0) + idx + 1,
          attendance_rate: 100,
          gpa: 8.0,
          behavior_score: 90
        };
        store.students.push(newStu);
        createdStudents.push(newStu);
        success++;
      }
    }
    if (cls) cls.student_count += success;
    store.logAudit('IMPORT_STUDENTS', 'students', classId, `Nhập thành công ${success} học sinh vào lớp ${cls?.name}`);
    store.notify();

    // Tự động lưu toàn bộ học sinh batch vào Firebase Firestore
    if (createdStudents.length > 0) {
      try {
        await batchSaveStudentsToFirestore(createdStudents);
      } catch (e) {
        console.warn('Lỗi khi lưu batch học sinh vào Firebase Firestore:', e);
      }
    }

    return { success, failed: students.length - success };
  },

  async syncStudentToFirebaseAuth(
    studentId: string,
    password = 'password123'
  ): Promise<{ success: boolean; uid?: string; error?: string }> {
    const stu = store.students.find((s) => s.id === studentId);
    if (!stu) return { success: false, error: 'Không tìm thấy học sinh' };
    const email =
      stu.email?.trim() ||
      `${stu.student_code.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.smartclass.edu.vn`;
    const res = await createFirebaseUserAccount({
      email,
      password,
      fullName: stu.full_name,
      role: 'student',
      phone: stu.phone
    });
    if (res.success && res.uid) {
      stu.profile_id = res.uid;
      stu.email = email;
      store.logAudit('SYNC_FIREBASE_AUTH', 'students', stu.id, `Đồng bộ tài khoản Firebase Auth cho học sinh ${stu.full_name}`);
      store.notify();
      // Update in Firestore
      await saveStudentToFirestore(stu).catch(() => {});
    }
    return res;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const index = store.students.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Không tìm thấy học sinh');
    store.students[index] = { ...store.students[index], ...updates };
    store.logAudit('UPDATE_STUDENT', 'students', id, `Cập nhật hồ sơ học sinh: ${store.students[index].full_name}`);
    store.notify();

    // Tự động cập nhật lên Firebase Firestore
    try {
      await saveStudentToFirestore(store.students[index]);
    } catch (fsErr) {
      console.warn('Lỗi khi cập nhật học sinh trên Firebase Firestore:', fsErr);
    }

    return store.students[index];
  },

  async deleteStudent(id: string): Promise<void> {
    const target = store.students.find((s) => s.id === id);
    if (target) {
      const cls = store.classes.find((c) => c.id === target.class_id);
      if (cls && cls.student_count > 0) cls.student_count -= 1;
    }
    store.students = store.students.filter((s) => s.id !== id);
    store.logAudit('DELETE_STUDENT', 'students', id, `Xóa học sinh: ${target?.full_name || id}`);
    store.notify();

    // Tự động xóa khỏi Firebase Firestore
    try {
      await deleteStudentFromFirestore(id);
    } catch (fsErr) {
      console.warn('Lỗi khi xóa học sinh trên Firebase Firestore:', fsErr);
    }
  },

  // ATTENDANCE
  async getAttendanceSession(classId: string, date: string): Promise<AttendanceSession | null> {
    const session = store.attendanceSessions.find((s) => s.class_id === classId && s.date === date);
    if (session) return session;
    return null;
  },

  async saveAttendanceSession(
    classId: string,
    date: string,
    notes: string,
    records: { student_id: string; status: any; note?: string }[]
  ): Promise<AttendanceSession> {
    const cls = store.classes.find((c) => c.id === classId);
    const existingIndex = store.attendanceSessions.findIndex((s) => s.class_id === classId && s.date === date);

    let present = 0, excused = 0, unexcused = 0, late = 0, early = 0;
    const formattedRecords: AttendanceRecord[] = records.map((r, i) => {
      if (r.status === 'present') present++;
      if (r.status === 'absent_excused') excused++;
      if (r.status === 'absent_unexcused') unexcused++;
      if (r.status === 'late') late++;
      if (r.status === 'early_leave') early++;
      const stu = store.students.find((s) => s.id === r.student_id);
      return {
        id: 'ar-' + Date.now() + '-' + i,
        session_id: '',
        student_id: r.student_id,
        student_name: stu?.full_name || '',
        student_code: stu?.student_code || '',
        status: r.status,
        note: r.note
      };
    });

    const sessionId = existingIndex >= 0 ? store.attendanceSessions[existingIndex].id : 'att-' + Date.now();
    formattedRecords.forEach((r) => (r.session_id = sessionId));

    const session: AttendanceSession = {
      id: sessionId,
      class_id: classId,
      class_name: cls?.name,
      date,
      session_type: 'daily',
      recorded_by_name: 'Cô Trần Thị Mai',
      notes,
      present_count: present,
      absent_excused_count: excused,
      absent_unexcused_count: unexcused,
      late_count: late,
      early_leave_count: early,
      total_students: records.length,
      records: formattedRecords
    };

    if (existingIndex >= 0) {
      store.attendanceSessions[existingIndex] = session;
    } else {
      store.attendanceSessions.unshift(session);
    }

    store.logAudit('RECORD_ATTENDANCE', 'attendance', sessionId, `Điểm danh lớp ${cls?.name} ngày ${date}: Có mặt ${present}/${records.length}`);
    store.notify();
    return session;
  },

  async getAttendanceHistory(classId: string): Promise<AttendanceSession[]> {
    return store.attendanceSessions.filter((s) => s.class_id === classId);
  },

  // ASSIGNMENTS
  async getAssignments(classId?: string): Promise<Assignment[]> {
    if (classId) {
      return store.assignments.filter((a) => a.class_id === classId);
    }
    return [...store.assignments];
  },

  async getAssignmentById(id: string): Promise<Assignment | undefined> {
    return store.assignments.find((a) => a.id === id);
  },

  async createAssignment(assignment: Omit<Assignment, 'id' | 'submitted_count' | 'graded_count' | 'total_students' | 'created_at'>): Promise<Assignment> {
    const cls = store.classes.find((c) => c.id === assignment.class_id);
    const newAsg: Assignment = {
      ...assignment,
      id: 'asg-' + Math.random().toString(36).substring(2, 9),
      submitted_count: 0,
      graded_count: 0,
      total_students: cls?.student_count || 24,
      created_at: new Date().toISOString()
    };
    store.assignments.unshift(newAsg);
    store.logAudit('CREATE_ASSIGNMENT', 'assignments', newAsg.id, `Giao bài tập: ${newAsg.title} (${newAsg.class_name})`);
    store.notify();
    return newAsg;
  },

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    const index = store.assignments.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Không tìm thấy bài tập');
    store.assignments[index] = { ...store.assignments[index], ...updates };
    store.notify();
    return store.assignments[index];
  },

  async deleteAssignment(id: string): Promise<void> {
    const target = store.assignments.find((a) => a.id === id);
    store.assignments = store.assignments.filter((a) => a.id !== id);
    store.logAudit('DELETE_ASSIGNMENT', 'assignments', id, `Xóa bài tập: ${target?.title}`);
    store.notify();
  },

  // SUBMISSIONS & GRADING
  async getSubmissions(assignmentId?: string): Promise<Submission[]> {
    if (!assignmentId) return [...store.submissions];
    return store.submissions.filter((s) => s.assignment_id === assignmentId);
  },

  async submitAssignment(submission: Omit<Submission, 'id' | 'submitted_at' | 'status'>): Promise<Submission> {
    const newSub: Submission = {
      ...submission,
      id: 'sub-' + Math.random().toString(36).substring(2, 9),
      submitted_at: new Date().toISOString(),
      status: 'submitted'
    };
    const existingIndex = store.submissions.findIndex(
      (s) => s.assignment_id === submission.assignment_id && s.student_id === submission.student_id
    );
    if (existingIndex >= 0) {
      store.submissions[existingIndex] = newSub;
    } else {
      store.submissions.push(newSub);
      const asg = store.assignments.find((a) => a.id === submission.assignment_id);
      if (asg) asg.submitted_count += 1;
    }
    store.logAudit('SUBMIT_ASSIGNMENT', 'submissions', newSub.id, `Học sinh ${newSub.student_name} nộp bài`);
    store.notify();
    return newSub;
  },

  async gradeSubmission(submissionId: string, score: number, feedback: string, teacherName = 'Cô Trần Thị Mai'): Promise<Submission> {
    const index = store.submissions.findIndex((s) => s.id === submissionId);
    if (index === -1) throw new Error('Không tìm thấy bài nộp');
    const prevStatus = store.submissions[index].status;
    store.submissions[index] = {
      ...store.submissions[index],
      score,
      feedback,
      graded_by: teacherName,
      graded_at: new Date().toISOString(),
      status: 'graded'
    };
    if (prevStatus !== 'graded') {
      const asg = store.assignments.find((a) => a.id === store.submissions[index].assignment_id);
      if (asg) asg.graded_count += 1;
    }
    store.logAudit('GRADE_SUBMISSION', 'submissions', submissionId, `Chấm điểm học sinh ${store.submissions[index].student_name}: ${score}đ`);
    store.notify();
    return store.submissions[index];
  },

  // GRADEBOOK
  async getGradeCategories(): Promise<GradeCategory[]> {
    return store.gradeCategories;
  },
  async getGradeItems(classId: string): Promise<GradeItem[]> {
    return store.gradeItems.filter((g) => g.class_id === classId);
  },
  async createGradeItem(item: Omit<GradeItem, 'id'>): Promise<GradeItem> {
    const newItem: GradeItem = {
      ...item,
      id: 'gi-' + Math.random().toString(36).substring(2, 9)
    };
    store.gradeItems.push(newItem);
    store.notify();
    return newItem;
  },
  async getGradeRecords(gradeItemId?: string): Promise<GradeRecord[]> {
    if (gradeItemId) {
      return store.gradeRecords.filter((r) => r.grade_item_id === gradeItemId);
    }
    return [...store.gradeRecords];
  },
  async batchSaveGradeRecords(records: { grade_item_id: string; student_id: string; score: number | null; comment?: string }[]): Promise<void> {
    records.forEach((r) => {
      const existing = store.gradeRecords.find((x) => x.grade_item_id === r.grade_item_id && x.student_id === r.student_id);
      if (existing) {
        existing.score = r.score;
        existing.comment = r.comment;
        existing.updated_at = new Date().toISOString();
      } else {
        store.gradeRecords.push({
          id: 'gr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          grade_item_id: r.grade_item_id,
          student_id: r.student_id,
          score: r.score,
          comment: r.comment,
          updated_at: new Date().toISOString()
        });
      }
    });
    store.logAudit('SAVE_GRADES', 'grade_records', 'batch', `Cập nhật bảng điểm cho ${records.length} học sinh`);
    store.notify();
  },

  // QUIZZES & QUESTIONS (NGÂN HÀNG CÂU HỎI THÔNG MINH)
  async getQuestions(filter?: {
    subjectId?: string;
    gradeId?: string;
    status?: string;
    difficulty?: string;
    type?: string;
    search?: string;
  } | string): Promise<Question[]> {
    if (typeof filter === 'string') {
      return store.questions.filter((q) => q.subject_id === filter);
    }
    let list = [...store.questions];
    if (!filter) return list;

    if (filter.subjectId && filter.subjectId !== 'all') {
      list = list.filter((q) => q.subject_id === filter.subjectId);
    }
    if (filter.gradeId && filter.gradeId !== 'all') {
      list = list.filter((q) => q.grade_id === filter.gradeId);
    }
    if (filter.status && filter.status !== 'all') {
      list = list.filter((q) => q.status === filter.status);
    }
    if (filter.difficulty && filter.difficulty !== 'all') {
      list = list.filter((q) => q.difficulty === filter.difficulty);
    }
    if (filter.type && filter.type !== 'all') {
      list = list.filter((q) => q.question_type === filter.type);
    }
    if (filter.search && filter.search.trim()) {
      const kw = filter.search.toLowerCase().trim();
      list = list.filter(
        (q) =>
          q.question_text.toLowerCase().includes(kw) ||
          q.code?.toLowerCase().includes(kw) ||
          q.explanation?.toLowerCase().includes(kw) ||
          q.tags?.some((t) => t.toLowerCase().includes(kw))
      );
    }
    return list;
  },

  async getQuestionById(id: string): Promise<Question | undefined> {
    return store.questions.find((q) => q.id === id);
  },

  async createQuestion(question: Partial<Question>): Promise<Question> {
    const codePrefix = question.subject_name?.includes('Toán')
      ? 'CH-TOAN'
      : question.subject_name?.includes('Lý')
      ? 'CH-LY'
      : question.subject_name?.includes('Hóa')
      ? 'CH-HOA'
      : question.subject_name?.includes('Văn')
      ? 'CH-VAN'
      : question.subject_name?.includes('Anh')
      ? 'CH-ENG'
      : 'CH';

    const count = store.questions.length + 1001;
    const newQ: Question = {
      id: question.id || 'q-' + Math.random().toString(36).substring(2, 9),
      code: question.code || `${codePrefix}-${count}`,
      teacher_id: question.teacher_id || 'user-teacher-1',
      teacher_name: question.teacher_name || 'Cô Trần Thị Mai',
      subject_id: question.subject_id || 'sub-math',
      subject_name: question.subject_name || 'Toán Học',
      grade_id: question.grade_id || 'grade-10',
      grade_name: question.grade_name || 'Khối 10',
      chapter_name: question.chapter_name || 'Chương 1: Kiến thức trọng tâm',
      lesson_name: question.lesson_name,
      topic_name: question.topic_name,
      tags: question.tags || [],
      difficulty: question.difficulty || 'thong_hieu',
      question_text: question.question_text || '',
      question_type: question.question_type || 'single_choice',
      options: question.options || [],
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      points: question.points || 1.0,
      status: question.status || 'approved',
      source_type: question.source_type || 'teacher_composed',
      version: 1,
      revisions: [
        {
          version: 1,
          updated_by: question.teacher_name || 'Cô Trần Thị Mai',
          updated_at: new Date().toISOString(),
          change_summary: 'Khởi tạo câu hỏi mới',
          status: question.status || 'approved'
        }
      ],
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      statements: question.statements,
      matching_pairs: question.matching_pairs,
      ordering_items: question.ordering_items,
      blanks: question.blanks,
      short_answer_config: question.short_answer_config,
      rubric: question.rubric,
      passage_text: question.passage_text,
      passage_image: question.passage_image,
      sub_questions: question.sub_questions
    };

    store.questions.unshift(newQ);
    store.logAudit('CREATE_QUESTION', 'questions', newQ.id, `Tạo câu hỏi ${newQ.code} (${newQ.question_type})`);
    store.notify();
    // Sync to Firebase Firestore asynchronously
    saveQuestionToFirestore(newQ).catch(() => {});
    return newQ;
  },

  async updateQuestion(id: string, updates: Partial<Question>, summary = 'Cập nhật nội dung câu hỏi'): Promise<Question> {
    const idx = store.questions.findIndex((q) => q.id === id);
    if (idx === -1) throw new Error('Không tìm thấy câu hỏi');

    const current = store.questions[idx];
    const newVersion = (current.version || 1) + 1;
    const currentRevisions = current.revisions || [];

    const newRevision = {
      version: newVersion,
      updated_by: updates.teacher_name || 'Cô Trần Thị Mai',
      updated_at: new Date().toISOString(),
      change_summary: summary,
      status: updates.status || current.status || 'approved'
    };

    // If updating an already approved question, it can require review or keep track
    const updatedStatus = current.status === 'approved' && updates.question_text && updates.question_text !== current.question_text
      ? 'pending_review'
      : (updates.status || current.status);

    const updatedQ: Question = {
      ...current,
      ...updates,
      version: newVersion,
      status: updatedStatus,
      revisions: [newRevision, ...currentRevisions],
      updated_at: new Date().toISOString()
    };

    store.questions[idx] = updatedQ;
    store.logAudit('UPDATE_QUESTION', 'questions', id, `Cập nhật câu hỏi ${updatedQ.code} lên version ${newVersion}`);
    store.notify();
    // Sync update to Firebase Firestore
    saveQuestionToFirestore(updatedQ).catch(() => {});
    return updatedQ;
  },

  async duplicateQuestion(id: string): Promise<Question> {
    const original = store.questions.find((q) => q.id === id);
    if (!original) throw new Error('Không tìm thấy câu hỏi');

    const copy: Partial<Question> = {
      ...original,
      id: 'q-' + Math.random().toString(36).substring(2, 9),
      code: `${original.code || 'CH'}-COPY`,
      question_text: `[Bản sao] ${original.question_text}`,
      status: 'draft',
      version: 1,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return this.createQuestion(copy);
  },

  async deleteQuestion(id: string, softDelete = true): Promise<void> {
    const target = store.questions.find((q) => q.id === id);
    if (!target) return;

    if (softDelete) {
      target.status = 'archived';
      target.updated_at = new Date().toISOString();
      store.logAudit('ARCHIVE_QUESTION', 'questions', id, `Lưu trữ câu hỏi ${target.code}`);
      saveQuestionToFirestore(target).catch(() => {});
    } else {
      store.questions = store.questions.filter((q) => q.id !== id);
      store.logAudit('DELETE_QUESTION', 'questions', id, `Xóa câu hỏi ${target.code}`);
      deleteQuestionFromFirestore(id).catch(() => {});
    }
    store.notify();
  },

  async syncQuestionsWithFirestore(): Promise<number> {
    try {
      const fbQuestions = await fetchQuestionsFromFirestore();
      if (fbQuestions && fbQuestions.length > 0) {
        fbQuestions.forEach((fbQ) => {
          const idx = store.questions.findIndex((q) => q.id === fbQ.id);
          if (idx >= 0) {
            store.questions[idx] = fbQ;
          } else {
            store.questions.unshift(fbQ);
          }
        });
        store.notify();
        return fbQuestions.length;
      }
    } catch (e) {
      console.warn('Sync questions from Firestore skipped or pending auth:', e);
    }
    return 0;
  },

  async batchUpdateQuestionStatus(ids: string[], status: any): Promise<void> {
    store.questions.forEach((q) => {
      if (ids.includes(q.id)) {
        q.status = status;
        q.updated_at = new Date().toISOString();
      }
    });
    store.logAudit('BATCH_STATUS_QUESTION', 'questions', 'batch', `Cập nhật trạng thái ${status} cho ${ids.length} câu hỏi`);
    store.notify();
  },

  async batchDeleteQuestions(ids: string[], softDelete = true): Promise<void> {
    if (softDelete) {
      store.questions.forEach((q) => {
        if (ids.includes(q.id)) {
          q.status = 'archived';
          q.updated_at = new Date().toISOString();
        }
      });
    } else {
      store.questions = store.questions.filter((q) => !ids.includes(q.id));
    }
    store.logAudit('BATCH_DELETE_QUESTION', 'questions', 'batch', `Xóa ${ids.length} câu hỏi`);
    store.notify();
  },

  async batchCreateQuestions(questions: Partial<Question>[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    for (const q of questions) {
      if (q.question_text) {
        await this.createQuestion(q);
        success++;
      }
    }
    return { success, failed: questions.length - success };
  },
  async getQuizzes(classId?: string): Promise<Quiz[]> {
    if (classId) {
      return store.quizzes.filter((q) => q.class_id === classId);
    }
    return [...store.quizzes];
  },
  async getQuizById(id: string): Promise<Quiz | undefined> {
    return store.quizzes.find((q) => q.id === id);
  },
  async createQuiz(quiz: Omit<Quiz, 'id' | 'attempt_count'>): Promise<Quiz> {
    const newQuiz: Quiz = {
      ...quiz,
      id: 'qz-' + Math.random().toString(36).substring(2, 9),
      attempt_count: 0
    };
    store.quizzes.unshift(newQuiz);
    store.logAudit('CREATE_QUIZ', 'quizzes', newQuiz.id, `Tạo bài kiểm tra: ${newQuiz.title}`);
    store.notify();
    return newQuiz;
  },

  // RESOURCES (Học liệu)
  async getResources(): Promise<ResourceItem[]> {
    return [...store.resources];
  },
  async uploadResource(res: Omit<ResourceItem, 'id' | 'downloads_count' | 'created_at'>): Promise<ResourceItem> {
    const newRes: ResourceItem = {
      ...res,
      id: 'res-' + Math.random().toString(36).substring(2, 9),
      downloads_count: 0,
      created_at: new Date().toISOString()
    };
    store.resources.unshift(newRes);
    store.logAudit('UPLOAD_RESOURCE', 'resources', newRes.id, `Tải lên tài liệu học liệu: ${newRes.title}`);
    store.notify();
    return newRes;
  },
  async deleteResource(id: string): Promise<void> {
    store.resources = store.resources.filter((r) => r.id !== id);
    store.notify();
  },

  // BEHAVIOR & REWARDS
  async getBehaviorRecords(classId?: string): Promise<BehaviorRecord[]> {
    if (classId) {
      return store.behaviorRecords.filter((b) => b.class_id === classId);
    }
    return [...store.behaviorRecords];
  },
  async addBehaviorRecord(record: Omit<BehaviorRecord, 'id' | 'created_at'>): Promise<BehaviorRecord> {
    const newRec: BehaviorRecord = {
      ...record,
      id: 'beh-' + Date.now(),
      created_at: new Date().toISOString()
    };
    store.behaviorRecords.unshift(newRec);
    // update student behavior score
    const stu = store.students.find((s) => s.id === record.student_id);
    if (stu && stu.behavior_score !== undefined) {
      stu.behavior_score = Math.max(0, Math.min(100, stu.behavior_score + record.points));
    }
    store.logAudit('RECORD_BEHAVIOR', 'behavior', newRec.id, `Ghi nhận hạnh kiểm [${record.points > 0 ? '+' : ''}${record.points}đ]: ${record.student_name}`);
    store.notify();
    return newRec;
  },
  async getRewards(studentId?: string): Promise<RewardBadge[]> {
    if (studentId) {
      return store.rewards.filter((r) => r.student_id === studentId);
    }
    return [...store.rewards];
  },
  async grantReward(reward: Omit<RewardBadge, 'id' | 'granted_at'>): Promise<RewardBadge> {
    const newRw: RewardBadge = {
      ...reward,
      id: 'rw-' + Date.now(),
      granted_at: new Date().toISOString()
    };
    store.rewards.push(newRw);
    store.notify();
    return newRw;
  },

  // ALERTS (Cảnh báo thông minh)
  async getAlerts(classId?: string): Promise<AlertItem[]> {
    if (classId) {
      return store.alerts.filter((a) => !a.class_id || a.class_id === classId);
    }
    return [...store.alerts];
  },
  async updateAlertStatus(id: string, status: AlertItem['status']): Promise<AlertItem> {
    const index = store.alerts.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Không tìm thấy cảnh báo');
    store.alerts[index].status = status;
    if (status === 'resolved') {
      store.alerts[index].resolved_at = new Date().toISOString();
    }
    store.logAudit('UPDATE_ALERT', 'alerts', id, `Chuyển trạng thái cảnh báo sang: ${status}`);
    store.notify();
    return store.alerts[index];
  },
  async createAlert(alert: Omit<AlertItem, 'id' | 'created_at'>): Promise<AlertItem> {
    const newAlt: AlertItem = {
      ...alert,
      id: 'alt-' + Date.now(),
      created_at: new Date().toISOString()
    };
    store.alerts.unshift(newAlt);
    store.notify();
    return newAlt;
  },

  // ANNOUNCEMENTS (Thông báo)
  async getAnnouncements(): Promise<Announcement[]> {
    return [...store.announcements];
  },
  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at' | 'read_count' | 'total_recipients'>): Promise<Announcement> {
    const newAnc: Announcement = {
      ...announcement,
      id: 'anc-' + Date.now(),
      created_at: new Date().toISOString(),
      read_count: 0,
      total_recipients: 28
    };
    store.announcements.unshift(newAnc);
    store.logAudit('CREATE_ANNOUNCEMENT', 'announcements', newAnc.id, `Gửi thông báo: ${newAnc.title}`);
    store.notify();
    return newAnc;
  },

  // SCHEDULES
  async getSchedules(classId?: string): Promise<ScheduleItem[]> {
    if (classId) {
      return store.schedules.filter((s) => s.class_id === classId);
    }
    return [...store.schedules];
  },
  async createSchedule(item: Omit<ScheduleItem, 'id'>): Promise<ScheduleItem> {
    const newSch: ScheduleItem = {
      ...item,
      id: 'sch-' + Math.random().toString(36).substring(2, 9)
    };
    store.schedules.push(newSch);
    store.logAudit(
      'CREATE_SCHEDULE',
      'schedules',
      newSch.id,
      `Thêm tiết ${newSch.period_number} Thứ ${newSch.day_of_week} môn ${newSch.subject_name} cho lớp ${newSch.class_name}`
    );
    store.notify();
    return newSch;
  },
  async updateSchedule(id: string, updates: Partial<ScheduleItem>): Promise<ScheduleItem> {
    const index = store.schedules.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Không tìm thấy tiết học');
    store.schedules[index] = { ...store.schedules[index], ...updates };
    store.logAudit(
      'UPDATE_SCHEDULE',
      'schedules',
      id,
      `Cập nhật tiết ${store.schedules[index].period_number} môn ${store.schedules[index].subject_name}`
    );
    store.notify();
    return store.schedules[index];
  },
  async deleteSchedule(id: string): Promise<void> {
    const target = store.schedules.find((s) => s.id === id);
    store.schedules = store.schedules.filter((s) => s.id !== id);
    if (target) {
      store.logAudit(
        'DELETE_SCHEDULE',
        'schedules',
        id,
        `Xóa tiết ${target.period_number} môn ${target.subject_name} lớp ${target.class_name}`
      );
    }
    store.notify();
  },

  // AUDIT LOGS (Chỉ Admin xem, không cho sửa/xóa)
  async getAuditLogs(): Promise<AuditLogItem[]> {
    return [...store.auditLogs];
  }
};
