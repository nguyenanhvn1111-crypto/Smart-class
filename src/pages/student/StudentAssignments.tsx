import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/dataService';
import { Assignment, Submission } from '../../types';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';
import {
  FileText,
  Clock,
  CheckCircle2,
  Upload,
  Download,
  Send,
  MessageSquare
} from 'lucide-react';

export const StudentAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Selected assignment for submit modal
  const [selectedAsg, setSelectedAsg] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadData = async () => {
    const asgs = await DataService.getAssignments('cls-10a1');
    const subs = await DataService.getSubmissions('asg-001');
    setAssignments(asgs);
    setSubmissions(subs);
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsg) return;

    setIsSubmitting(true);
    await DataService.submitAssignment({
      assignment_id: selectedAsg.id,
      student_id: 'stu-001',
      student_name: 'Lê Hoàng Long',
      student_code: 'HS10001',
      content: submissionContent,
      files: [{ name: 'Bai_lam_toan_LeHoangLong.pdf', url: '#' }]
    });

    setIsSubmitting(false);
    setSelectedAsg(null);
    setSubmissionContent('');
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Bài tập & Nhiệm vụ học tập
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Theo dõi các bài tập được giao, thời hạn hoàn thành và nhận xét từ thầy cô
        </p>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Bài tập đã được nộp thành công! Thầy cô sẽ sớm chấm và phản hồi nhận xét.</span>
        </div>
      )}

      {/* Assignment List */}
      <div className="space-y-4">
        {assignments.map((asg) => {
          // Check if current student submitted
          const mySub = submissions.find(
            (s) => s.assignment_id === asg.id && s.student_id === 'stu-001'
          );

          return (
            <div
              key={asg.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {asg.subject_name}
                  </span>
                  <span className="text-xs text-slate-500">{asg.teacher_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {mySub ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {mySub.status === 'graded' ? `Đã chấm: ${mySub.score}/10đ` : 'Đã nộp bài'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 font-semibold text-xs rounded-xl border border-amber-200">
                      Chưa nộp bài
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{asg.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                  {asg.description}
                </p>
              </div>

              {/* Deadline & files */}
              <div className="p-3 bg-slate-50 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Hạn nộp: <strong className="text-slate-800">{new Date(asg.due_date).toLocaleString('vi-VN')}</strong>
                </span>
                <span>Thang điểm: {asg.points_max} điểm</span>
              </div>

              {/* Feedback if graded */}
              {mySub && mySub.feedback && (
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/80 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Nhận xét của Giáo viên ({mySub.graded_by}):</span>
                  </div>
                  <p className="text-blue-800 pl-5">{mySub.feedback}</p>
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedAsg(asg)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
                >
                  {mySub ? 'Nộp lại bài' : 'Làm & Nộp bài tập'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Modal */}
      {selectedAsg && (
        <Modal
          isOpen={Boolean(selectedAsg)}
          onClose={() => setSelectedAsg(null)}
          title={`Nộp bài: ${selectedAsg.title}`}
          subtitle={`Hạn cuối: ${new Date(selectedAsg.due_date).toLocaleString('vi-VN')}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nội dung câu trả lời / Bài làm
              </label>
              <textarea
                rows={5}
                required
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Nhập phần giải thích, câu trả lời hoặc tóm tắt bài giải tại đây..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tệp đính kèm (Ảnh chụp bài làm, file PDF/Word)
              </label>
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:border-blue-500 text-slate-500 text-xs">
                <Upload className="w-4 h-4" />
                <span>Nhấp để tải lên tệp bài làm của bạn</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAsg(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                {isSubmitting ? 'Đang gửi bài...' : 'Xác nhận nộp bài'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
