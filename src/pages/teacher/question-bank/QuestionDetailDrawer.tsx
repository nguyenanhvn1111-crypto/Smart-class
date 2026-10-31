import React, { useState } from 'react';
import { Question } from '../../../types';
import { MathRenderer } from '../../../components/common/MathRenderer';
import {
  X,
  CheckCircle2,
  XCircle,
  Edit3,
  Copy,
  Archive,
  Trash2,
  Clock,
  Tag,
  BookOpen,
  Award,
  Layers,
  History,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';

interface QuestionDetailDrawerProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (q: Question) => void;
  onDuplicate: (id: string) => void;
  onUpdateStatus: (id: string, status: any) => void;
  onDelete: (id: string) => void;
}

export const QuestionDetailDrawer: React.FC<QuestionDetailDrawerProps> = ({
  question,
  isOpen,
  onClose,
  onEdit,
  onDuplicate,
  onUpdateStatus,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'revisions' | 'metadata'>('content');

  if (!isOpen || !question) return null;

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case 'nhan_biet':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Nhận biết</span>;
      case 'thong_hieu':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Thông hiểu</span>;
      case 'van_dung':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Vận dụng</span>;
      case 'van_dung_cao':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Vận dụng cao</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Thông hiểu</span>;
    }
  };

  const getStatusBadge = (st?: string) => {
    switch (st) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt</span>;
      case 'pending_review':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Chờ duyệt</span>;
      case 'draft':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" /> Bản nháp</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Cần sửa</span>;
      case 'archived':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600 flex items-center gap-1"><Archive className="w-3.5 h-3.5" /> Đã lưu trữ</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Đã duyệt</span>;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'single_choice': return 'Một đáp án đúng (Single Choice)';
      case 'multiple_choice': return 'Nhiều đáp án đúng (Multiple Choice)';
      case 'true_false': return 'Đúng / Sai theo từng ý';
      case 'matching': return 'Ghép đôi (Matching)';
      case 'ordering': return 'Sắp xếp thứ tự (Ordering)';
      case 'fill_blank': return 'Điền khuyết (Fill-in-the-blank)';
      case 'short_answer': return 'Trả lời ngắn (Short Answer)';
      case 'essay': return 'Tự luận (Essay with Rubric)';
      case 'passage': return 'Đoạn văn / Tình huống (Passage-based)';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-250">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-xs">
              {question.code || question.id}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {question.subject_name || 'Môn học'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {question.grade_name || 'Khối lớp'}
                </span>
                {getStatusBadge(question.status)}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Navigation Tabs */}
        <div className="px-5 border-b border-slate-200 flex gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Nội dung & Lời giải</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('revisions')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'revisions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử phiên bản ({question.revisions?.length || 1})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'metadata'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Metadata & Thông tin</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'content' && (
            <div className="space-y-6">
              
              {/* Type & Difficulty banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Dạng câu hỏi</span>
                  <span className="font-semibold text-slate-800">{getTypeName(question.question_type)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Mức độ</span>
                  {getDifficultyBadge(question.difficulty)}
                </div>
              </div>

              {/* Passage Stimulus (nếu là dạng passage) */}
              {question.question_type === 'passage' && question.passage_text && (
                <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>Đoạn văn / Ngữ cảnh chung:</span>
                  </div>
                  <MathRenderer content={question.passage_text} className="text-xs sm:text-sm text-purple-950 leading-relaxed italic" />
                </div>
              )}

              {/* Question Stem */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đề bài câu hỏi:</span>
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <MathRenderer content={question.question_text} className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed" />
                </div>
              </div>

              {/* 1. Single Choice & 2. Multiple Choice Options */}
              {(question.question_type === 'single_choice' || question.question_type === 'multiple_choice') && question.options && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Các phương án trả lời:</span>
                  <div className="space-y-2">
                    {question.options.map((opt) => {
                      const isCorrect = Array.isArray(question.correct_answer)
                        ? question.correct_answer.includes(opt.id)
                        : question.correct_answer === opt.id;

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-colors ${
                            isCorrect
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg text-center font-bold text-xs flex items-center justify-center shrink-0 border ${
                              isCorrect
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {opt.id}
                          </span>
                          <div className="flex-1">
                            <MathRenderer content={opt.text} />
                          </div>
                          {isCorrect && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đáp án đúng
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. True / False statements */}
              {question.question_type === 'true_false' && question.statements && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Các ý mệnh đề:</span>
                  <div className="space-y-2">
                    {question.statements.map((st, i) => (
                      <div key={st.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-blue-600 shrink-0">Ý {i + 1}:</span>
                          <MathRenderer content={st.text} />
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 ${st.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {st.is_correct ? 'ĐÚNG' : 'SAI'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Matching Pairs */}
              {question.question_type === 'matching' && question.matching_pairs && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cặp ghép đôi chuẩn:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {question.matching_pairs.map((pair, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-3">
                        <div className="font-medium text-slate-800 flex-1">{pair.left_text}</div>
                        <span className="text-slate-400 font-bold">➔</span>
                        <div className="font-semibold text-blue-700 flex-1">{pair.right_text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Ordering */}
              {question.question_type === 'ordering' && question.ordering_items && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thứ tự các phần tử chính xác:</span>
                  <div className="space-y-1.5">
                    {[...question.ordering_items]
                      .sort((a, b) => a.correct_order - b.correct_order)
                      .map((item, index) => (
                        <div key={item.id} className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-slate-800">{item.text}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 6. Fill in blanks */}
              {question.question_type === 'fill_blank' && question.blanks && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đáp án cho các ô trống:</span>
                  <div className="space-y-2">
                    {question.blanks.map((b) => (
                      <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div className="font-bold text-slate-700 mb-1">{b.label || b.id}:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {b.accepted_answers.map((ans, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-semibold">
                              "{ans}"
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Short answer */}
              {question.question_type === 'short_answer' && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đáp án mẫu & Biến thể:</span>
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-0.5">Đáp án chuẩn:</span>
                      <span className="font-mono font-bold text-sm text-emerald-900">
                        {question.short_answer_config?.sample_answer || question.correct_answer}
                      </span>
                      {question.short_answer_config?.unit && (
                        <span className="ml-1 text-slate-600">({question.short_answer_config.unit})</span>
                      )}
                    </div>
                    {question.short_answer_config?.variants && question.short_answer_config.variants.length > 0 && (
                      <div>
                        <span className="text-slate-500 block mb-1">Các biến thể chấp nhận:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {question.short_answer_config.variants.map((v, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white border border-emerald-200 font-mono text-emerald-800">
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 8. Essay Rubric */}
              {question.question_type === 'essay' && question.rubric && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rubric thang điểm chi tiết:</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Tiêu chí đánh giá</th>
                          <th className="p-2.5 w-24 text-center">Điểm tối đa</th>
                          <th className="p-2.5">Mô tả chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {question.rubric.map((rb) => (
                          <tr key={rb.id} className="hover:bg-slate-50/60">
                            <td className="p-2.5 font-medium text-slate-800">{rb.criteria}</td>
                            <td className="p-2.5 text-center font-bold text-blue-600">{rb.max_points}đ</td>
                            <td className="p-2.5 text-slate-500">{rb.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 9. Passage Sub-questions */}
              {question.question_type === 'passage' && question.sub_questions && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                    Danh sách các câu hỏi con ({question.sub_questions.length} câu):
                  </span>
                  {question.sub_questions.map((sub, idx) => (
                    <div key={sub.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-700">{sub.code || `Câu con #${idx + 1}`}</span>
                        <span className="px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">{sub.question_type}</span>
                      </div>
                      <MathRenderer content={sub.question_text} className="font-medium text-slate-900" />
                      {sub.options && sub.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 pl-2">
                          {sub.options.map((o) => (
                            <div key={o.id} className={`p-1.5 rounded-lg border text-[11px] ${o.id === sub.correct_answer ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800' : 'bg-white border-slate-200'}`}>
                              {o.id}. {o.text}
                            </div>
                          ))}
                        </div>
                      )}
                      {sub.explanation && (
                        <div className="text-slate-500 italic bg-white/70 p-2 rounded-lg border border-slate-100">
                          {sub.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Detailed Explanation */}
              {question.explanation && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lời giải chi tiết:</span>
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/70 text-xs sm:text-sm text-slate-800">
                    <MathRenderer content={question.explanation} />
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'revisions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Lịch sử thay đổi nội dung</span>
                <span className="text-xs text-slate-400">Phiên bản hiện tại: v{question.version || 1}</span>
              </div>

              {question.revisions && question.revisions.length > 0 ? (
                <div className="relative border-l-2 border-blue-200 ml-3 space-y-5 py-2">
                  {question.revisions.map((rev, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-2 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100" />
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Phiên bản v{rev.version}</span>
                          <span className="text-slate-400 text-[11px]">
                            {new Date(rev.updated_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-slate-600">{rev.change_summary}</p>
                        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60 mt-1">
                          <span>Người thực hiện: <strong className="text-slate-600">{rev.updated_by}</strong></span>
                          <span>Trạng thái: <strong>{rev.status}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">Chưa ghi nhận phiên bản sửa đổi nào khác.</div>
              )}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Chương bài</span>
                  <span className="font-semibold text-slate-800">{question.chapter_name || 'Chương 1'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Chủ đề bài học</span>
                  <span className="font-semibold text-slate-800">{question.topic_name || question.lesson_name || 'Chủ đề chung'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Người biên soạn</span>
                  <span className="font-semibold text-slate-800">{question.teacher_name || 'Giáo viên'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Số lần được dùng</span>
                  <span className="font-bold text-blue-600 text-sm">{question.usage_count || 0} lần</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Nguồn câu hỏi</span>
                  <span className="font-semibold text-slate-800">
                    {question.source_type === 'ai_generated' ? 'AI Trợ Giảng' : question.source_type === 'exam_archive' ? 'Kho đề thi' : 'Giáo viên tự soạn'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Điểm mặc định</span>
                  <span className="font-bold text-emerald-600 text-sm">{question.points || 1.0} điểm</span>
                </div>
              </div>

              {question.tags && question.tags.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-slate-400 block text-[11px] font-bold uppercase">Thẻ phân loại (Tags):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {question.tags.map((t, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50/60 rounded-xl text-blue-900 text-xs border border-blue-200/80 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Câu hỏi này được bảo vệ bởi Row Level Security (RLS). Học sinh chỉ có thể xem nội dung trong bài kiểm tra được giao và không thể xem đáp án/lời giải trước khi công bố.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {question.status !== 'approved' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(question.id, 'approved')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Duyệt câu này</span>
              </button>
            )}

            {question.status === 'pending_review' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(question.id, 'rejected')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Yêu cầu sửa</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onDuplicate(question.id)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5"
              title="Tạo bản sao"
            >
              <Copy className="w-4 h-4" />
              <span>Nhân bản</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(question)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh sửa</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(question.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Xóa / Lưu trữ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
