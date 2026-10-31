import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Question } from '../../../types';
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  Settings2
} from 'lucide-react';

interface ExportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  selectedSubject?: string;
  selectedGrade?: string;
}

export const ExportQuestionsModal: React.FC<ExportQuestionsModalProps> = ({
  isOpen,
  onClose,
  questions,
  selectedSubject = 'Toán Học',
  selectedGrade = 'Khối 10'
}) => {
  const [exportFormat, setExportFormat] = useState<'excel' | 'word' | 'pdf'>('excel');
  const [contentMode, setContentMode] = useState<'questions_only' | 'questions_and_answers' | 'full_explanation'>('questions_and_answers');
  const [separateAnswerKey, setSeparateAnswerKey] = useState(true);
  const [schoolName, setSchoolName] = useState('TRƯỜNG THPT CHUYÊN SMARTCLASS');
  const [examTitle, setExamTitle] = useState('ĐỀ KIỂM TRA ĐÁNH GIÁ ĐỊNH KỲ');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Handle Excel Export
  const exportToExcel = () => {
    // Sheet 1: Questions
    const questionsData = questions.map((q, idx) => ({
      'STT': idx + 1,
      'Mã câu': q.code || q.id,
      'Nội dung đề bài': q.question_text,
      'Dạng câu hỏi': q.question_type,
      'Mức độ': q.difficulty || 'thong_hieu',
      'Môn học': q.subject_name || selectedSubject,
      'Khối lớp': q.grade_name || selectedGrade,
      'Chương': q.chapter_name || '',
      'Phương án A': q.options?.[0]?.text || '',
      'Phương án B': q.options?.[1]?.text || '',
      'Phương án C': q.options?.[2]?.text || '',
      'Phương án D': q.options?.[3]?.text || '',
      'Điểm': q.points || 1.0
    }));

    // Sheet 2: Answers & Explanations
    const answersData = questions.map((q, idx) => ({
      'STT': idx + 1,
      'Mã câu': q.code || q.id,
      'Đáp án chuẩn': Array.isArray(q.correct_answer)
        ? q.correct_answer.join(', ')
        : typeof q.correct_answer === 'object'
        ? JSON.stringify(q.correct_answer)
        : String(q.correct_answer || ''),
      'Lời giải chi tiết': q.explanation || 'Không có ghi chú'
    }));

    // Sheet 3: Metadata
    const metadataData = [
      { 'Thông số': 'Trường học', 'Giá trị': schoolName },
      { 'Thông số': 'Tiêu đề đề thi', 'Giá trị': examTitle },
      { 'Thông số': 'Thời gian làm bài', 'Giá trị': `${durationMinutes} phút` },
      { 'Thông số': 'Tổng số câu hỏi', 'Giá trị': questions.length },
      { 'Thông số': 'Ngày xuất dữ liệu', 'Giá trị': new Date().toLocaleString('vi-VN') }
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(questionsData);
    const ws2 = XLSX.utils.json_to_sheet(answersData);
    const ws3 = XLSX.utils.json_to_sheet(metadataData);

    XLSX.utils.book_append_sheet(wb, ws1, 'Questions');
    XLSX.utils.book_append_sheet(wb, ws2, 'Answers');
    XLSX.utils.book_append_sheet(wb, ws3, 'Metadata');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    XLSX.writeFile(wb, `De_Kiem_Tra_${selectedSubject.replace(/\s+/g, '_')}_${timestamp}.xlsx`);
  };

  // Handle Word (.doc) Export via formatted HTML Blob
  const exportToWord = () => {
    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${examTitle}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; margin: 20mm; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .header-table td { vertical-align: top; font-size: 11pt; }
          .title { text-align: center; font-size: 15pt; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
          .sub-title { text-align: center; font-size: 12pt; font-style: italic; margin-bottom: 25px; }
          .question-item { margin-bottom: 18px; page-break-inside: avoid; }
          .q-stem { font-weight: bold; margin-bottom: 6px; }
          .q-options { margin-left: 20px; display: table; width: 100%; }
          .q-opt { display: inline-block; width: 48%; margin-bottom: 4px; }
          .answer-key { margin-top: 35px; border-top: 2px solid #000; padding-top: 15px; page-break-before: always; }
          .ans-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .ans-table th, .ans-table td { border: 1px solid #000; padding: 6px 10px; text-align: center; font-size: 11pt; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 50%; text-align: center;">
              <strong>${schoolName.toUpperCase()}</strong><br>
              <strong>TỔ CHUYÊN MÔN: ${selectedSubject.toUpperCase()}</strong>
            </td>
            <td style="width: 50%; text-align: center;">
              <strong>KỲ THI ĐÁNH GIÁ CHẤT LƯỢNG</strong><br>
              Năm học: 2025 - 2026
            </td>
          </tr>
        </table>

        <div class="title">${examTitle}</div>
        <div class="sub-title">Môn: ${selectedSubject} • ${selectedGrade} • Thời gian làm bài: ${durationMinutes} phút (Không kể thời gian phát đề)</div>
        <hr style="border: 0; border-top: 1px solid #333; margin-bottom: 20px;">
    `;

    // Questions list
    questions.forEach((q, idx) => {
      html += `
        <div class="question-item">
          <div class="q-stem">Câu ${idx + 1} (${q.points || 1.0} điểm): ${q.question_text}</div>
      `;

      if (q.options && q.options.length > 0) {
        html += `<div class="q-options">`;
        q.options.forEach((opt) => {
          html += `<div class="q-opt"><strong>${opt.id}.</strong> ${opt.text}</div>`;
        });
        html += `</div>`;
      }

      if (contentMode === 'questions_and_answers' || contentMode === 'full_explanation') {
        html += `
          <div style="margin-top: 5px; color: #1e3a8a; font-size: 11pt;">
            <strong>Đáp án:</strong> ${Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : q.correct_answer}
          </div>
        `;
      }

      if (contentMode === 'full_explanation' && q.explanation) {
        html += `
          <div style="margin-top: 3px; color: #475569; font-size: 10.5pt; font-style: italic;">
            <strong>Lời giải:</strong> ${q.explanation}
          </div>
        `;
      }

      html += `</div>`;
    });

    // Answer Key Table at the end
    if (separateAnswerKey) {
      html += `
        <div class="answer-key">
          <h3 style="text-align: center; text-transform: uppercase;">BẢNG ĐÁP ÁN VÀ THANG ĐIỂM</h3>
          <table class="ans-table">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th>Câu</th>
                <th>Đáp án</th>
                <th>Điểm</th>
              </tr>
            </thead>
            <tbody>
      `;

      questions.forEach((q, idx) => {
        const ans = Array.isArray(q.correct_answer)
          ? q.correct_answer.join(', ')
          : typeof q.correct_answer === 'object'
          ? 'Xem chi tiết'
          : String(q.correct_answer || '');

        html += `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${ans}</strong></td>
            <td>${q.points || 1.0}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    html += `</body></html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `De_Thi_${selectedSubject.replace(/\s+/g, '_')}_A4.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle PDF Print
  const exportToPdfPrint = () => {
    window.print();
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      if (exportFormat === 'excel') {
        exportToExcel();
      } else if (exportFormat === 'word') {
        exportToWord();
      } else {
        exportToPdfPrint();
      }
      setIsExporting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Xuất đề thi & Ngân hàng câu hỏi
              </h2>
              <p className="text-xs text-slate-500">
                Đang chọn xuất <strong className="text-blue-600">{questions.length}</strong> câu hỏi
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Format selection */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Định dạng tệp xuất ra:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('excel')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  exportFormat === 'excel'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('word')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  exportFormat === 'word'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <FileText className="w-6 h-6 text-blue-600" />
                <span>Word A4 (.doc)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  exportFormat === 'pdf'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Printer className="w-6 h-6 text-rose-600" />
                <span>In A4 / PDF</span>
              </button>
            </div>
          </div>

          {/* Content Mode */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Nội dung đính kèm:</label>
            <div className="space-y-2">
              {[
                { id: 'questions_only', label: 'Chỉ đề bài câu hỏi (Dùng phát cho học sinh làm bài)' },
                { id: 'questions_and_answers', label: 'Đề bài kèm đáp án đúng (Dùng cho giáo viên đối chiếu)' },
                { id: 'full_explanation', label: 'Đề bài + Đáp án + Lời giải chi tiết toàn bộ' }
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer ${
                    contentMode === opt.id ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="contentMode"
                    checked={contentMode === opt.id}
                    onChange={() => setContentMode(opt.id as any)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Header metadata inputs */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 font-bold">
              <Settings2 className="w-4 h-4" />
              <span>Tiêu đề hiển thị trên bản in:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1">Tên trường học</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Thời gian làm bài</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-20 p-2 border border-slate-200 rounded-xl outline-hidden text-center font-bold"
                  />
                  <span className="text-slate-500">phút</span>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={separateAnswerKey}
                onChange={(e) => setSeparateAnswerKey(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span>In kèm bảng ma trận đáp án riêng biệt ở cuối trang</span>
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Đang tạo tệp...' : 'Tải xuống tệp xuất'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
