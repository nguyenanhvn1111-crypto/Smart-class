import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataService } from '../../services/dataService';
import { aiAssistant } from '../../services/aiService';
import { Assignment, Submission, Student } from '../../types';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  ArrowLeft,
  FileCheck2,
  Sparkles,
  Download,
  Calendar,
  Users
} from 'lucide-react';

export const AssignmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'submitted' | 'graded' | 'pending'>('all');
  const [remindSent, setRemindSent] = useState(false);

  // Grading Modal
  const [gradingSub, setGradingSub] = useState<Submission | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const asg = await DataService.getAssignmentById(id);
    const subs = await DataService.getSubmissions(id);
    setAssignment(asg || null);
    setSubmissions(subs);

    if (asg) {
      const stus = await DataService.getStudents(asg.class_id);
      setAllStudents(stus);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, [id]);

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Đang tải thông tin bài tập...</p>
      </div>
    );
  }

  // Submitted student IDs
  const submittedStudentIds = new Set(submissions.map((s) => s.student_id));
  const unsubmittedStudents = allStudents.filter((s) => !submittedStudentIds.has(s.id));

  // Handle open grading modal
  const handleOpenGrade = (sub: Submission) => {
    setGradingSub(sub);
    setScoreInput(sub.score !== undefined ? String(sub.score) : '');
    setFeedbackInput(sub.feedback || '');
  };

  // AI Feedback Generator
  const handleAIFeedback = async () => {
    if (!gradingSub) return;
    setIsAiLoading(true);
    try {
      const res = await aiAssistant.generateStudentFeedback({
        studentName: gradingSub.student_name,
        gpa: Number(scoreInput) || 8.5,
        attendanceRate: 98,
        behaviorScore: 95
      });
      setFeedbackInput(res);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save grade
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub) return;
    const numericScore = parseFloat(scoreInput);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 10) {
      alert('Vui lòng nhập điểm số hợp lệ từ 0 đến 10');
      return;
    }

    await DataService.gradeSubmission(
      gradingSub.id,
      numericScore,
      feedbackInput,
      'Cô Trần Thị Mai'
    );
    setGradingSub(null);
    loadData();
  };

  // Remind unsubmitted students
  const handleRemindPending = () => {
    setRemindSent(true);
    setTimeout(() => setRemindSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/teacher/assignments')}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {assignment.subject_name}
                </span>
                <span className="text-xs text-slate-500 font-medium">{assignment.class_name}</span>
                <StatusChip status={assignment.status} size="sm" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {assignment.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRemindPending}
              disabled={unsubmittedStudents.length === 0}
              className="px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>Nhắc học sinh chưa nộp ({unsubmittedStudents.length})</span>
            </button>
          </div>
        </div>

        {/* Due date & description */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Hạn nộp: {new Date(assignment.due_date).toLocaleString('vi-VN')}
            </span>
            <span>Thang điểm: {assignment.points_max} điểm</span>
          </div>
          <p className="text-slate-700 whitespace-pre-line text-sm">{assignment.description}</p>
        </div>

        {/* Remind Sent Toast */}
        {remindSent && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã gửi thông báo nhắc nhở nộp bài tới {unsubmittedStudents.length} học sinh qua hệ thống và app phụ huynh!</span>
          </div>
        )}
      </div>

      {/* Submissions Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            filterTab === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả ({allStudents.length})
        </button>
        <button
          onClick={() => setFilterTab('submitted')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            filterTab === 'submitted' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đã nộp bài ({submissions.length})
        </button>
        <button
          onClick={() => setFilterTab('graded')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            filterTab === 'graded' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đã chấm ({submissions.filter((s) => s.status === 'graded').length})
        </button>
        <button
          onClick={() => setFilterTab('pending')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            filterTab === 'pending' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Chưa nộp ({unsubmittedStudents.length})
        </button>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="px-4 py-3">Học sinh</th>
              <th className="px-4 py-3">Thời gian nộp</th>
              <th className="px-4 py-3">File đính kèm</th>
              <th className="px-4 py-3">Điểm số</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Show Submitted */}
            {filterTab !== 'pending' &&
              submissions
                .filter((s) => {
                  if (filterTab === 'graded') return s.status === 'graded';
                  return true;
                })
                .map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{sub.student_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{sub.student_code}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      {sub.files && sub.files.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-medium text-xs">
                          <FileText className="w-3.5 h-3.5" />
                          {sub.files[0].name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Bài nộp văn bản</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub.score !== undefined ? (
                        <span className="font-extrabold text-blue-600 text-base">
                          {sub.score} / 10
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Chưa chấm</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={sub.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenGrade(sub)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-2xs"
                      >
                        {sub.status === 'graded' ? 'Chấm lại' : 'Chấm điểm'}
                      </button>
                    </td>
                  </tr>
                ))}

            {/* Show Pending Unsubmitted */}
            {(filterTab === 'all' || filterTab === 'pending') &&
              unsubmittedStudents.map((stu) => (
                <tr key={stu.id} className="bg-slate-50/40 hover:bg-slate-100/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-700">{stu.full_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{stu.student_code}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">—</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">—</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">—</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                      Chưa nộp
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={handleRemindPending}
                      className="px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                      Gửi nhắc nhở
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Interactive Grading Modal */}
      {gradingSub && (
        <Modal
          isOpen={Boolean(gradingSub)}
          onClose={() => setGradingSub(null)}
          title={`Chấm bài: ${gradingSub.student_name}`}
          subtitle={`Mã HS: ${gradingSub.student_code} • Nộp lúc: ${new Date(
            gradingSub.submitted_at
          ).toLocaleString('vi-VN')}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveGrade} className="space-y-5">
            {/* Student's answer content */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nội dung bài làm của học sinh:
              </h4>
              <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                {gradingSub.content ||
                  'Học sinh đính kèm file bài làm bên dưới và không để lại văn bản bổ sung.'}
              </p>
              {gradingSub.files && gradingSub.files.length > 0 && (
                <div className="pt-2 flex items-center gap-2">
                  <span className="p-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-blue-600 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>{gradingSub.files[0].name}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Score input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Điểm số (Thang điểm 10) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                placeholder="VD: 9.5"
                className="w-40 px-3.5 py-2.5 border border-slate-200 rounded-xl text-base font-bold text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden font-mono"
              />
            </div>

            {/* Teacher Feedback with AI Assist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Nhận xét & Lời khuyên của Giáo viên
                </label>
                <button
                  type="button"
                  onClick={handleAIFeedback}
                  disabled={isAiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiLoading ? 'AI đang tạo...' : 'Gợi ý nhận xét AI'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                placeholder="Nhập lời khen ngợi hoặc nhắc nhở điểm cần khắc phục..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGradingSub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
              >
                Lưu điểm & Trả bài
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
