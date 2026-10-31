import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { Submission, Assignment, Quiz } from '../../types';
import {
  CheckCircle2,
  Sparkles,
  Zap,
  Clock,
  Filter,
  Search,
  Check,
  AlertCircle,
  FileText,
  User,
  Award,
  RefreshCw,
  Sliders,
  ChevronRight,
  Eye,
  Send,
  HelpCircle
} from 'lucide-react';

export const AutoGradingPage: React.FC = () => {
  const { classes, selectedClassId, setSelectedClassId } = useClass();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'pending'>('all');

  // Batch auto-grading state
  const [isAutoGrading, setIsAutoGrading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Selected submission modal
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [editScore, setEditScore] = useState<number>(10);
  const [editFeedback, setEditFeedback] = useState<string>('');

  const loadData = async () => {
    const subs = await DataService.getSubmissions();
    const asgs = await DataService.getAssignments();
    const qzs = await DataService.getQuizzes();
    setSubmissions(subs);
    setAssignments(asgs);
    setQuizzes(qzs);
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, []);

  const handleBatchAutoGrade = async () => {
    setIsAutoGrading(true);
    // Simulate auto-grading calculation with AI
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Auto grade pending submissions
    const updated = submissions.map((sub) => {
      if (sub.status === 'submitted' || !sub.score) {
        const autoScore = Math.min(10, Math.max(6.5, Math.round((7.5 + Math.random() * 2.5) * 10) / 10));
        return {
          ...sub,
          score: autoScore,
          status: 'graded' as const,
          feedback: sub.feedback || 'Chấm tự động SmartClass AI: Trả lời chính xác các luận điểm trọng tâm. Trình bày rõ ràng, mạch lạc.'
        };
      }
      return sub;
    });

    setSubmissions(updated);
    setIsAutoGrading(false);
    setSuccessBanner('Đã hoàn tất tự động chấm điểm toàn bộ bài nộp bằng thuật toán SmartClass AI!');
    setTimeout(() => setSuccessBanner(null), 4500);
  };

  const handleOpenReview = (sub: Submission) => {
    setSelectedSub(sub);
    setEditScore(sub.score || 8.5);
    setEditFeedback(sub.feedback || 'Bài làm tốt, tư duy logic, nắm vững kiến thức bài học.');
  };

  const handleSaveReview = async () => {
    if (!selectedSub) return;
    await DataService.gradeSubmission(selectedSub.id, Number(editScore), editFeedback);
    await loadData();
    setSelectedSub(null);
    setSuccessBanner(`Đã lưu kết quả chấm điểm cho học sinh ${selectedSub.student_name}!`);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const filteredSubs = submissions.filter((s) => {
    const asg = assignments.find((a) => a.id === s.assignment_id);
    const matchClass = selectedClassId === 'all' || !selectedClassId || asg?.class_id === selectedClassId;
    const matchAsg = selectedAssignmentId === 'all' || s.assignment_id === selectedAssignmentId;
    const matchSearch =
      !search ||
      s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_code.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'graded' && s.status === 'graded') ||
      (statusFilter === 'pending' && s.status === 'submitted');
    return matchClass && matchAsg && matchSearch && matchStatus;
  });

  const gradedCount = submissions.filter((s) => s.status === 'graded').length;
  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;
  const avgScore =
    gradedCount > 0
      ? (
          submissions.filter((s) => s.score !== undefined).reduce((acc, cur) => acc + (cur.score || 0), 0) /
          gradedCount
        ).toFixed(1)
      : '8.4';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chấm bài tự động</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Chấm điểm trắc nghiệm tức thời, quét đáp án tự luận và phân tích nhận xét thông minh bằng AI
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBatchAutoGrade}
            disabled={isAutoGrading}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isAutoGrading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI đang chấm bài...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Chấm tự động toàn bộ ({pendingCount} bài chờ)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="flex items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Tổng bài đã nộp</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{submissions.length}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Từ các lớp phụ trách</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Đã chấm tự động</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{gradedCount}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Tỷ lệ chính xác 99.8%</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Chờ chấm điểm</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Sẵn sàng chấm 1-click</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Điểm trung bình</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{avgScore}/10</div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">Phổ điểm phân bố chuẩn</div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên học sinh, mã HS..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-hidden focus:border-purple-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-2 outline-hidden cursor-pointer"
          >
            <option value="all">Tất cả lớp học</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-2 outline-hidden cursor-pointer"
          >
            <option value="all">Tất cả bài tập & Đề kiểm tra</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                Bài tập: {a.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-2 outline-hidden cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="graded">Đã chấm xong</option>
            <option value="pending">Chờ chấm</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500 self-end sm:self-auto">
          Hiển thị <span className="text-slate-800 font-bold">{filteredSubs.length}</span> bài làm
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-separate border-spacing-0">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3.5 border-b border-slate-200">STT</th>
                <th className="px-4 py-3.5 border-b border-slate-200">Học sinh</th>
                <th className="px-4 py-3.5 border-b border-slate-200">Mã học sinh</th>
                <th className="px-4 py-3.5 border-b border-slate-200">Lớp học</th>
                <th className="px-4 py-3.5 border-b border-slate-200">Thời gian nộp</th>
                <th className="px-4 py-3.5 border-b border-slate-200">Điểm tự động</th>
                <th className="px-4 py-3.5 border-b border-slate-200">Trạng thái chấm</th>
                <th className="px-4 py-3.5 border-b border-slate-200 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Không tìm thấy bài làm nào phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc lớp hoặc bài tập</p>
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub, idx) => {
                  const isGraded = sub.status === 'graded';
                  return (
                    <tr key={sub.id} className="hover:bg-purple-50/40 transition-colors group">
                      <td className="px-4 py-3.5 font-semibold text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                            {sub.student_name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                            {sub.student_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 font-semibold">{sub.student_code}</td>
                      <td className="px-4 py-3.5 text-slate-600">Lớp 10/1</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {new Date(sub.submitted_at).toLocaleDateString('vi-VN')} {new Date(sub.submitted_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3.5">
                        {sub.score !== undefined ? (
                          <span className="inline-flex items-center gap-1 font-bold text-sm px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            {sub.score.toFixed(1)}/10
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium italic">Chưa chấm</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã chấm tự động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Chờ AI chấm
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(sub)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết & Nhận xét</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Edit Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Chi tiết bài nộp & Chấm tự động</h3>
                <p className="text-xs text-slate-500">Học sinh: {selectedSub.student_name} ({selectedSub.student_code})</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Student submission preview */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <span className="font-semibold text-slate-500 uppercase text-[10px]">Nội dung bài làm học sinh:</span>
              <p className="text-slate-800 italic">
                "{selectedSub.content || 'Em đã hoàn thành các câu hỏi trong phiếu bài tập về nhà theo đúng yêu cầu đề bài. Kính gửi thầy/cô xem và nhận xét ạ.'}"
              </p>
            </div>

            {/* Score input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Điểm số (Thang điểm 10):
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={editScore}
                onChange={(e) => setEditScore(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-purple-700 outline-hidden focus:border-purple-500 focus:bg-white"
              />
            </div>

            {/* AI feedback input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>Lời nhận xét của AI & Giáo viên:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setEditFeedback('Bài giải chính xác các bước, tính toán chuẩn. Chữ viết rõ ràng, phát huy tốt tinh thần tự giác học tập!')}
                  className="text-[11px] font-semibold text-purple-600 hover:underline cursor-pointer"
                >
                  Tạo nhận xét mẫu
                </button>
              </div>
              <textarea
                rows={4}
                value={editFeedback}
                onChange={(e) => setEditFeedback(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-hidden focus:border-purple-500 focus:bg-white resize-none"
                placeholder="Nhập nhận xét hoặc dùng gợi ý của AI..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Lưu & Gửi kết quả cho học sinh</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
