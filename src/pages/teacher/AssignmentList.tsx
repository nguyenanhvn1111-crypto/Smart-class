import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { aiAssistant } from '../../services/aiService';
import { Assignment, Submission, Student, AssignmentQuestionItem } from '../../types';
import { StatusChip } from '../../components/common/StatusChip';
import { SearchBox } from '../../components/common/SearchBox';
import { Modal } from '../../components/common/Modal';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  Users,
  Send,
  Sparkles,
  Award,
  ChevronRight,
  Filter,
  Check,
  X,
  FileCheck2,
  MessageSquare,
  HelpCircle,
  BookOpen,
  ArrowRight,
  BellRing,
  Layers,
  Database
} from 'lucide-react';

export const AssignmentList: React.FC = () => {
  const navigate = useNavigate();
  const { classes, selectedClassId } = useClass();

  // Exactly 3 tabs required for Teacher
  // Tab 1: 'assignments' ("Bài tập")
  // Tab 2: 'create' ("Giao bài")
  // Tab 3: 'submissions' ("Số, dữ liệu học sinh đã nộp")
  const [activeMainTab, setActiveMainTab] = useState<'assignments' | 'create' | 'submissions'>('assignments');

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Search & Filter in Tab 1
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // Selected assignment for Tab 3 (Số, dữ liệu học sinh đã nộp)
  const [selectedAsgIdForData, setSelectedAsgIdForData] = useState<string>('');
  const [subFilter, setSubFilter] = useState<'all' | 'submitted' | 'unsubmitted'>('all');

  // Grading Modal State
  const [gradingSub, setGradingSub] = useState<Submission | null>(null);
  const [activeGradingStudent, setActiveGradingStudent] = useState<Student | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isAiGrading, setIsAiGrading] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  // Form State for Tab 2: "Giao bài"
  const [newTitle, setNewTitle] = useState('');
  const [newClassId, setNewClassId] = useState(selectedClassId || 'cls-10a1');
  const [newSubjectName, setNewSubjectName] = useState('Toán Học');
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().slice(0, 16);
  });
  const [newPointsMax, setNewPointsMax] = useState(10);
  const [newAllowLate, setNewAllowLate] = useState(true);
  const [newDescription, setNewDescription] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Optional questions list in Tab 2
  const [questions, setQuestions] = useState<AssignmentQuestionItem[]>([
    {
      id: 'q-new-1',
      question_text: 'Cho ví dụ thực tế liên quan đến bài học và giải thích ngắn gọn.',
      type: 'multiple_choice',
      options: ['A. Lựa chọn phương án A', 'B. Lựa chọn phương án B', 'C. Lựa chọn phương án C', 'D. Lựa chọn phương án D'],
      correct_answer: 'A',
      explanation: 'Giải thích chi tiết cho câu hỏi.',
      points: 2
    }
  ]);

  const loadData = async () => {
    const asgs = await DataService.getAssignments();
    const subs = await DataService.getSubmissions();
    const stus = await DataService.getStudents();
    setAssignments(asgs);
    setSubmissions(subs);
    setStudents(stus);

    if (!selectedAsgIdForData && asgs.length > 0) {
      setSelectedAsgIdForData(asgs[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, []);

  // Filtered assignments for Tab 1
  const filteredAssignments = assignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      a.class_name.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'all' || a.class_id === filterClass;
    const matchSubject = filterSubject === 'all' || a.subject_name === filterSubject;
    return matchSearch && matchClass && matchSubject;
  });

  // Data for Tab 3: Selected assignment submissions
  const currentAsg = assignments.find((a) => a.id === selectedAsgIdForData) || assignments[0];
  const currentClassStudents = currentAsg
    ? students.filter((s) => s.class_id === currentAsg.class_id || !currentAsg.class_id)
    : students;
  const currentAsgSubmissions = submissions.filter((s) => s.assignment_id === currentAsg?.id);

  const submittedStudentMap = new Map<string, Submission>();
  currentAsgSubmissions.forEach((sub) => {
    submittedStudentMap.set(sub.student_id, sub);
  });

  const submittedCount = submittedStudentMap.size;
  const totalStudents = currentClassStudents.length || currentAsg?.total_students || 8;
  const unsubmittedCount = Math.max(0, totalStudents - submittedCount);
  const gradedCount = currentAsgSubmissions.filter((s) => s.status === 'graded' || s.score !== undefined).length;
  const averageScore =
    gradedCount > 0
      ? (
          currentAsgSubmissions
            .filter((s) => s.score !== undefined)
            .reduce((sum, s) => sum + (s.score || 0), 0) / gradedCount
        ).toFixed(1)
      : '--';

  // Handle Duplication
  const handleDuplicate = async (asg: Assignment) => {
    await DataService.createAssignment({
      class_id: asg.class_id,
      class_name: asg.class_name,
      subject_id: asg.subject_id,
      subject_name: asg.subject_name,
      teacher_id: asg.teacher_id,
      teacher_name: asg.teacher_name,
      title: `${asg.title} (Bản sao)`,
      description: asg.description,
      due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      points_max: asg.points_max,
      status: 'draft',
      allow_late: asg.allow_late,
      total_questions: asg.total_questions,
      questions: asg.questions
    });
    loadData();
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
      await DataService.deleteAssignment(id);
      loadData();
    }
  };

  // Switch to Tab 3 for a specific assignment
  const handleViewSubmissions = (asgId: string) => {
    setSelectedAsgIdForData(asgId);
    setActiveMainTab('submissions');
  };

  // AI Assist Create Assignment
  const handleGenerateAI = async () => {
    setIsAiGenerating(true);
    try {
      const res = await aiAssistant.generateAssignment({
        subject: newSubjectName,
        topic: newTitle || 'Kiến thức trọng tâm chương trình',
        gradeLevel: 'Khối 10',
        objectives: 'Rèn luyện khả năng tư duy và vận dụng lý thuyết giải bài tập'
      });
      if (res.title && !newTitle) setNewTitle(res.title);
      setNewDescription(res.description);
    } catch {
      setNewDescription(
        `1. Ôn tập kỹ lý thuyết trong SGK.\n2. Làm các câu hỏi trắc nghiệm và tự luận đính kèm.\n3. Nộp bài trước hạn để được chấm điểm và nhận xét chi tiết.`
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handle Create Assignment Form Submit
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tiêu đề bài tập!');
      return;
    }

    const cls = classes.find((c) => c.id === newClassId);
    const created = await DataService.createAssignment({
      class_id: newClassId,
      class_name: cls?.name || '10A1 - Chuyên Toán',
      subject_id: newSubjectName === 'Toán Học' ? 'sub-math' : newSubjectName === 'Ngữ Văn' ? 'sub-lit' : 'sub-eng',
      subject_name: newSubjectName,
      teacher_id: 'user-teacher-1',
      teacher_name: 'Cô Trần Thị Mai',
      title: newTitle,
      description: newDescription || 'Các em đọc kỹ hướng dẫn và nộp bài đúng hạn.',
      due_date: new Date(newDueDate).toISOString(),
      points_max: Number(newPointsMax),
      status: 'published',
      allow_late: newAllowLate,
      total_questions: questions.length,
      questions: questions
    });

    setFormSuccessMessage(`Đã giao bài tập "${created.title}" thành công cho lớp ${created.class_name}!`);
    setNewTitle('');
    setNewDescription('');

    setTimeout(() => {
      setFormSuccessMessage(null);
      setSelectedAsgIdForData(created.id);
      setActiveMainTab('assignments');
    }, 1500);

    loadData();
  };

  // Add Question in Tab 2
  const handleAddQuestion = () => {
    const nextNum = questions.length + 1;
    setQuestions([
      ...questions,
      {
        id: `q-new-${Date.now()}`,
        question_text: `Câu ${nextNum}: Điền nội dung câu hỏi trắc nghiệm vào đây...`,
        type: 'multiple_choice',
        options: ['A. Phương án A', 'B. Phương án B', 'C. Phương án C', 'D. Phương án D'],
        correct_answer: 'A',
        explanation: 'Giải thích đáp án đúng',
        points: 2
      }
    ]);
  };

  // Open Grading Modal
  const handleOpenGrading = (student: Student, sub?: Submission) => {
    setActiveGradingStudent(student);
    if (sub) {
      setGradingSub(sub);
      setScoreInput(sub.score !== undefined ? String(sub.score) : '');
      setFeedbackInput(sub.feedback || '');
    } else {
      setGradingSub(null);
      setScoreInput('');
      setFeedbackInput('');
    }
  };

  // AI Feedback
  const handleAiFeedbackSuggest = async () => {
    if (!activeGradingStudent) return;
    setIsAiGrading(true);
    try {
      const res = await aiAssistant.generateStudentFeedback({
        studentName: activeGradingStudent.full_name,
        gpa: Number(scoreInput) || 8.5,
        attendanceRate: activeGradingStudent.attendance_rate || 95,
        behaviorScore: activeGradingStudent.behavior_score || 90
      });
      setFeedbackInput(res);
    } catch {
      setFeedbackInput(
        `Bài làm đạt kết quả tốt (${scoreInput || 8}đ), nắm vững kiến thức trọng tâm. Cần tiếp tục phát huy ở các bài sau!`
      );
    } finally {
      setIsAiGrading(false);
    }
  };

  // Save Grade
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAsg || !activeGradingStudent) return;

    const numScore = parseFloat(scoreInput);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      alert('Vui lòng nhập điểm số từ 0 đến 10!');
      return;
    }

    if (gradingSub) {
      await DataService.gradeSubmission(gradingSub.id, numScore, feedbackInput, 'Cô Trần Thị Mai');
    } else {
      // Create graded submission directly for this student
      const sub = await DataService.submitAssignment({
        assignment_id: currentAsg.id,
        student_id: activeGradingStudent.id,
        student_name: activeGradingStudent.full_name,
        student_code: activeGradingStudent.student_code,
        content: 'Bài nộp trực tiếp tại lớp / giáo viên chấm bài giấy',
        score: numScore,
        feedback: feedbackInput
      });
      await DataService.gradeSubmission(sub.id, numScore, feedbackInput, 'Cô Trần Thị Mai');
    }

    setGradingSub(null);
    setActiveGradingStudent(null);
    loadData();
  };

  // Send reminder to unsubmitted students
  const handleSendReminder = () => {
    setReminderMessage(
      `Đã gửi thông báo nhắc nhở nộp bài "${currentAsg?.title}" đến ${unsubmittedCount} học sinh chưa nộp bài!`
    );
    setTimeout(() => setReminderMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              VAI TRÒ GIÁO VIÊN
            </span>
            <span className="text-xs text-slate-500 font-medium">Quản lý & Giao bài tập thông minh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
            Giao bài tập & Quản lý bài nộp
          </h1>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/teacher/assignments/topics"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-cyan-300 text-slate-700 hover:text-cyan-700 font-bold text-xs rounded-xl transition-all shadow-2xs hover:bg-cyan-50/40"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-600" />
            <span>Quản lý chủ đề (Màn 111)</span>
          </Link>

          <Link
            to="/teacher/assignments/create-from-bank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo đề từ ngân hàng</span>
          </Link>

          {activeMainTab !== 'create' && (
            <button
              onClick={() => setActiveMainTab('create')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>Giao bài nhanh</span>
            </button>
          )}
        </div>
      </div>

      {/* EXACTLY 3 TABS FOR TEACHER ROLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1.5 flex gap-2">
        <button
          onClick={() => setActiveMainTab('assignments')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeMainTab === 'assignments'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bài tập</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              activeMainTab === 'assignments' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {assignments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('create')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeMainTab === 'create'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Giao bài</span>
        </button>

        <button
          onClick={() => setActiveMainTab('submissions')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeMainTab === 'submissions'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Số, dữ liệu học sinh đã nộp</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              activeMainTab === 'submissions' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {submissions.length} bài nộp
          </span>
        </button>
      </div>

      {/* ================= TAB 1: BÀI TẬP ================= */}
      {activeMainTab === 'assignments' && (
        <div className="space-y-6">
          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="w-full md:w-80">
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Tìm bài tập, môn học, lớp..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Filter className="w-4 h-4 text-slate-400" />
                <span>Lớp:</span>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả các lớp</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Môn:</span>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả môn học</option>
                  <option value="Toán Học">Toán Học</option>
                  <option value="Ngữ Văn">Ngữ Văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssignments.map((asg) => {
              const asgSubs = submissions.filter((s) => s.assignment_id === asg.id);
              const subCount = asgSubs.length;
              const isPastDue = new Date(asg.due_date) < new Date();

              return (
                <div
                  key={asg.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Header Chips */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {asg.class_name}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                        {asg.subject_name}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          asg.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {asg.status === 'published' ? 'Đang giao' : 'Bản nháp'}
                      </span>
                    </div>

                    {/* Title & Desc */}
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {asg.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {asg.description}
                      </p>
                    </div>

                    {/* Meta stats */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          Hạn nộp:
                        </span>
                        <span className={`font-semibold ${isPastDue ? 'text-rose-600' : 'text-slate-800'}`}>
                          {new Date(asg.due_date).toLocaleDateString('vi-VN')} {new Date(asg.due_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Số câu hỏi:
                        </span>
                        <span className="font-bold text-slate-800">
                          {asg.total_questions || asg.questions?.length || 5} câu ({asg.points_max}đ)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <Users className="w-3.5 h-3.5" />
                          Tiến độ nộp:
                        </span>
                        <span className="font-bold text-blue-700">
                          {subCount} / {asg.total_students || 8} học sinh
                        </span>
                      </div>

                      {/* Mini progress bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.round((subCount / (asg.total_students || 8)) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleViewSubmissions(asg.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      <span>Xem dữ liệu nộp</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(asg)}
                      title="Nhân bản bài tập"
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(asg.id)}
                      title="Xóa bài tập"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredAssignments.length === 0 && (
              <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800">Không tìm thấy bài tập nào</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hãy thử thay đổi bộ lọc hoặc bấm "Giao bài" để tạo bài tập mới.
                </p>
                <button
                  onClick={() => setActiveMainTab('create')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Giao bài tập ngay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: GIAO BÀI ================= */}
      {activeMainTab === 'create' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Tab 2 / Form Giao Bài Tập Mới
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Thiết lập & Giao bài tập cho lớp
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tạo đề bài, thiết lập câu hỏi trắc nghiệm / tự luận, hạn nộp và gửi thông báo trực tiếp đến học sinh.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isAiGenerating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold text-xs transition-all active:scale-95 self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>{isAiGenerating ? 'Đang tạo bằng AI...' : 'Trợ lý AI gợi ý đề'}</span>
            </button>
          </div>

          {formSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          {/* Quick Choice Banner: Create from Question Bank vs Manage Topics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5 bg-gradient-to-br from-cyan-50/70 via-blue-50/40 to-slate-50 rounded-2xl border border-cyan-200/90 shadow-2xs">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">
                    Tạo bài tập từ ngân hàng câu hỏi
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                    Khuyến nghị 4.0
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Trích xuất câu hỏi từ chủ đề môn học, sinh đề tự động trắc nghiệm (1–20) và tự luận (1–10), đảo câu, ma trận điểm chuẩn hóa.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/teacher/assignments/create-from-bank')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95"
                >
                  <span>Mở trình tạo đề 5 bước</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3.5 border-t md:border-t-0 md:border-l border-cyan-200/70 pt-3 md:pt-0 md:pl-4">
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-cyan-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Layers className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <span className="font-extrabold text-slate-900 text-sm block">
                  Quản lý chủ đề bài học (Màn hình 111)
                </span>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Thiết lập chủ đề theo buổi học (tối đa 8.000 ký tự), liên kết câu hỏi ngân hàng, bảo vệ xóa khi bài tập đã sử dụng.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/teacher/assignments/topics')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  <span>Quản lý chủ đề</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hoặc giao bài tập nhanh / tự soạn tại đây:
            </h3>
          </div>

          <form onSubmit={handleCreateAssignment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Class selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lớp được giao <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.student_count} học sinh)
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Môn học <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Toán Học">Toán Học</option>
                  <option value="Ngữ Văn">Ngữ Văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Vật Lý">Vật Lý</option>
                  <option value="Hóa Học">Hóa Học</option>
                  <option value="Sinh Học">Sinh Học</option>
                  <option value="Lịch Sử & Địa Lý">Lịch Sử & Địa Lý</option>
                  <option value="Tin Học">Tin Học</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Thời hạn nộp bài <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tiêu đề bài tập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Bài tập tuần 6: Phương trình lượng giác cơ bản"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description & Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nội dung đề bài & Hướng dẫn làm bài
              </label>
              <textarea
                rows={4}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Nhập yêu cầu bài tập, các bước thực hiện, gợi ý hoặc tài liệu tham khảo..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Extra options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thang điểm tối đa
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newPointsMax}
                  onChange={(e) => setNewPointsMax(Number(e.target.value))}
                  className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-4">
                <input
                  type="checkbox"
                  id="allowLateCheck"
                  checked={newAllowLate}
                  onChange={(e) => setNewAllowLate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="allowLateCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Cho phép nộp muộn sau thời hạn (có gắn thẻ cảnh báo nộp trễ)
                </label>
              </div>
            </div>

            {/* Interactive Questions Builder */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Danh sách câu hỏi đính kèm ({questions.length} câu)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Học sinh sẽ trả lời trực tiếp trên hệ thống để tự động chấm điểm và tổng hợp câu đúng/sai.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm câu hỏi</span>
                </button>
              </div>

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Câu hỏi #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setQuestions(questions.filter((item) => item.id !== q.id))}
                        className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                      >
                        Xóa câu
                      </button>
                    </div>

                    <input
                      type="text"
                      value={q.question_text}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[idx].question_text = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder="Nội dung câu hỏi..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {q.options?.map((opt, oIdx) => (
                        <input
                          key={oIdx}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...questions];
                            if (updated[idx].options) {
                              updated[idx].options![oIdx] = e.target.value;
                              setQuestions(updated);
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                      <span>Đáp án đúng:</span>
                      {['A', 'B', 'C', 'D'].map((key) => (
                        <label key={key} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correct_answer === key}
                            onChange={() => {
                              const updated = [...questions];
                              updated[idx].correct_answer = key;
                              setQuestions(updated);
                            }}
                          />
                          <span>{key}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveMainTab('assignments')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Giao bài tập ngay</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 3: SỐ, DỮ LIỆU HỌC SINH ĐÃ NỘP ================= */}
      {activeMainTab === 'submissions' && (
        <div className="space-y-6">
          {/* Assignment Selector & High Level Metrics */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Tab 3 / Thống kê tiến độ nộp bài
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  Số, dữ liệu học sinh đã nộp
                </h2>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Chọn bài tập:</span>
                <select
                  value={selectedAsgIdForData}
                  onChange={(e) => setSelectedAsgIdForData(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.class_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* KPI Cards for the chosen assignment */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <span className="text-xs text-slate-500 font-semibold block">Sĩ số lớp</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                  {totalStudents} học sinh
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Lớp {currentAsg?.class_name}</span>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80">
                <span className="text-xs text-emerald-700 font-bold block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã nộp bài
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 block">
                  {submittedCount} / {totalStudents}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold">
                  {Math.round((submittedCount / totalStudents) * 100)}% hoàn thành
                </span>
              </div>

              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200/80">
                <span className="text-xs text-rose-700 font-bold block flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Chưa nộp bài
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-800 mt-1 block">
                  {unsubmittedCount} học sinh
                </span>
                <span className="text-[11px] text-rose-600 font-bold">
                  {Math.round((unsubmittedCount / totalStudents) * 100)}% chưa nộp
                </span>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200/80">
                <span className="text-xs text-blue-700 font-bold block flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Đã chấm điểm
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-800 mt-1 block">
                  {gradedCount} / {submittedCount}
                </span>
                <span className="text-[11px] text-blue-600 font-medium">bài đã có điểm</span>
              </div>

              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200/80">
                <span className="text-xs text-purple-700 font-bold block flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  Điểm trung bình
                </span>
                <span className="text-xl sm:text-2xl font-black text-purple-900 mt-1 block">
                  {averageScore} / 10
                </span>
                <span className="text-[11px] text-purple-600 font-medium">điểm TB cả lớp</span>
              </div>
            </div>

            {/* Quick reminder action */}
            {unsubmittedCount > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Hiện có <b>{unsubmittedCount}</b> học sinh chưa nộp bài tập này.
                  </span>
                </div>
                <button
                  onClick={handleSendReminder}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
                >
                  Gửi thông báo nhắc nhở nộp bài
                </button>
              </div>
            )}

            {reminderMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{reminderMessage}</span>
              </div>
            )}
          </div>

          {/* Student Submissions List / Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Danh sách học sinh & Trạng thái nộp bài ({currentClassStudents.length})</span>
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Lọc:</span>
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setSubFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      subFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({currentClassStudents.length})
                  </button>
                  <button
                    onClick={() => setSubFilter('submitted')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      subFilter === 'submitted' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Đã nộp ({submittedCount})
                  </button>
                  <button
                    onClick={() => setSubFilter('unsubmitted')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      subFilter === 'unsubmitted' ? 'bg-white text-rose-700 shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Chưa nộp ({unsubmittedCount})
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Học sinh</th>
                    <th className="py-3 px-4">Mã số</th>
                    <th className="py-3 px-4">Trạng thái nộp bài</th>
                    <th className="py-3 px-4">Thời gian nộp</th>
                    <th className="py-3 px-4">Điểm số</th>
                    <th className="py-3 px-4">Nhận xét của GV</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {currentClassStudents
                    .filter((stu) => {
                      const hasSub = submittedStudentMap.has(stu.id);
                      if (subFilter === 'submitted') return hasSub;
                      if (subFilter === 'unsubmitted') return !hasSub;
                      return true;
                    })
                    .map((stu, idx) => {
                      const sub = submittedStudentMap.get(stu.id);
                      const isSubmitted = !!sub;

                      return (
                        <tr key={stu.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-400">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={stu.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stu.student_code}`}
                                alt={stu.full_name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block">{stu.full_name}</span>
                                <span className="text-[11px] text-slate-400">{stu.class_name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                            {stu.student_code}
                          </td>
                          <td className="py-3.5 px-4">
                            {isSubmitted ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="text-emerald-600">🟢</span>
                                <span>Đã nộp bài</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="text-rose-600">🔴</span>
                                <span>Chưa nộp bài</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {isSubmitted && sub.submitted_at
                              ? new Date(sub.submitted_at).toLocaleString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit'
                                })
                              : '--'}
                          </td>
                          <td className="py-3.5 px-4">
                            {isSubmitted && sub.score !== undefined ? (
                              <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                                {sub.score} / 10đ
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa chấm</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                            {isSubmitted && sub.feedback ? sub.feedback : '--'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenGrading(stu, sub)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors"
                            >
                              {isSubmitted ? (sub.score !== undefined ? 'Sửa điểm' : 'Chấm điểm') : 'Nhập điểm'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Grading / Review Modal */}
      {activeGradingStudent && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActiveGradingStudent(null);
            setGradingSub(null);
          }}
          title={`Chấm bài: ${activeGradingStudent.full_name} (${activeGradingStudent.student_code})`}
        >
          <form onSubmit={handleSaveGrade} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Bài tập:</span>
                <span className="font-bold text-slate-800">{currentAsg?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lớp:</span>
                <span className="font-semibold text-slate-700">{currentAsg?.class_name}</span>
              </div>
              {gradingSub && gradingSub.content && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <span className="text-slate-500 block mb-1">Nội dung bài làm của học sinh:</span>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap">
                    {gradingSub.content}
                  </div>
                </div>
              )}
            </div>

            {/* Score Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Điểm số (Thang điểm 10) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                placeholder="Ví dụ: 9.5"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Feedback & AI Suggestion */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Lời nhận xét & Đánh giá của giáo viên
                </label>
                <button
                  type="button"
                  onClick={handleAiFeedbackSuggest}
                  disabled={isAiGrading}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiGrading ? 'Đang tạo...' : 'AI gợi ý nhận xét'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                placeholder="Nhập lời khen ngợi, điểm cần khắc phục hoặc hướng dẫn học sinh..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActiveGradingStudent(null);
                  setGradingSub(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Lưu điểm & Nhận xét
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
