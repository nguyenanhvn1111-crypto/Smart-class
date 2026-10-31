import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Question, QuestionType, QuestionDifficulty } from '../../../types';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  RefreshCw,
  FileCheck
} from 'lucide-react';

interface ImportQuestionsWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (questions: Partial<Question>[]) => Promise<{ success: number; failed: number }>;
  existingQuestions: Question[];
}

interface ParsedRow {
  index: number;
  code: string;
  question_text: string;
  question_type: QuestionType;
  difficulty: QuestionDifficulty;
  subject_name: string;
  options: { id: string; text: string }[];
  correct_answer: any;
  explanation: string;
  points: number;
  isValid: boolean;
  isDuplicate: boolean;
  error?: string;
}

export const ImportQuestionsWizardModal: React.FC<ImportQuestionsWizardModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingQuestions
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite' | 'add_new'>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  if (!isOpen) return null;

  // Download sample templates
  const handleDownloadTemplate = (type: 'excel' | 'json') => {
    if (type === 'excel') {
      const sampleData = [
        {
          'Mã câu': 'CH-TOAN-SAMPLE-01',
          'Nội dung câu hỏi': 'Cho tam giác ABC có góc A = 90 độ, AB = 3cm, AC = 4cm. Độ dài cạnh huyền BC là:',
          'Dạng câu hỏi': 'single_choice',
          'Mức độ': 'thong_hieu',
          'Môn học': 'Toán Học',
          'Khối lớp': 'Khối 10',
          'Phương án A': '5 cm',
          'Phương án B': '6 cm',
          'Phương án C': '7 cm',
          'Phương án D': '8 cm',
          'Đáp án đúng': 'A',
          'Lời giải chi tiết': 'Áp dụng định lý Pythagoras: BC^2 = AB^2 + AC^2 = 9 + 16 = 25 => BC = 5cm.',
          'Điểm': 1.0
        },
        {
          'Mã câu': 'CH-HOA-SAMPLE-02',
          'Nội dung câu hỏi': 'Nguyên tố Natri (Na) thuộc nhóm IA trong bảng tuần hoàn và có tính kim loại mạnh.',
          'Dạng câu hỏi': 'true_false',
          'Mức độ': 'nhan_biet',
          'Môn học': 'Hóa Học',
          'Khối lớp': 'Khối 10',
          'Phương án A': 'Đúng',
          'Phương án B': 'Sai',
          'Phương án C': '',
          'Phương án D': '',
          'Đáp án đúng': 'A',
          'Lời giải chi tiết': 'Natri có số hiệu nguyên tử Z=11, thuộc nhóm kim loại kiềm IA.',
          'Điểm': 1.0
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Questions');
      XLSX.writeFile(wb, 'Mau_Import_Ngan_Hang_Cau_Hoi_SmartClass.xlsx');
    } else {
      const sampleJson = [
        {
          code: 'CH-SAMPLE-01',
          question_text: 'Vectơ không cùng phương với vectơ nào?',
          question_type: 'single_choice',
          difficulty: 'nhan_biet',
          subject_name: 'Toán Học',
          options: [
            { id: 'A', text: 'Mọi vectơ' },
            { id: 'B', text: 'Chính nó' }
          ],
          correct_answer: 'A',
          explanation: 'Vectơ-không cùng phương và cùng hướng với mọi vectơ.',
          points: 1.0
        }
      ];
      const blob = new Blob([JSON.stringify(sampleJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Mau_Import_Ngan_Hang_Cau_Hoi.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle file select and parse
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    parseFile(file);
  };

  const parseFile = async (file: File) => {
    setIsProcessing(true);
    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        processParsedData(Array.isArray(json) ? json : [json]);
      } else {
        // Excel or CSV via xlsx
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        processParsedData(jsonData);
      }
    } catch {
      alert('Không thể đọc tệp dữ liệu. Vui lòng kiểm tra định dạng tệp chuẩn.');
      setIsProcessing(false);
    }
  };

  const processParsedData = (data: any[]) => {
    const rows: ParsedRow[] = data.map((item, index) => {
      const qText = item['Nội dung câu hỏi'] || item.question_text || item['Nội dung'] || item.stem || '';
      const code = item['Mã câu'] || item.code || `CH-IMP-${index + 1}`;
      const qType: QuestionType = item['Dạng câu hỏi'] || item.question_type || 'single_choice';
      const diff: QuestionDifficulty = item['Mức độ'] || item.difficulty || 'thong_hieu';
      const subj = item['Môn học'] || item.subject_name || 'Toán Học';
      const explanation = item['Lời giải chi tiết'] || item.explanation || '';
      const points = Number(item['Điểm'] || item.points) || 1.0;

      // Extract options if standard format
      const options = item.options || [
        { id: 'A', text: String(item['Phương án A'] || item.optionA || '') },
        { id: 'B', text: String(item['Phương án B'] || item.optionB || '') },
        { id: 'C', text: String(item['Phương án C'] || item.optionC || '') },
        { id: 'D', text: String(item['Phương án D'] || item.optionD || '') }
      ].filter((o) => o.text.trim());

      const correctAnswer = item['Đáp án đúng'] || item.correct_answer || 'A';

      // Validate
      let isValid = true;
      let error = '';
      if (!qText.trim()) {
        isValid = false;
        error = 'Thiếu nội dung câu hỏi';
      } else if (qType === 'single_choice' && options.length < 2) {
        isValid = false;
        error = 'Cần ít nhất 2 phương án trả lời';
      }

      // Check duplicate
      const isDuplicate = existingQuestions.some(
        (eq) =>
          eq.code?.toLowerCase() === code.toLowerCase() ||
          eq.question_text.trim().toLowerCase() === qText.trim().toLowerCase()
      );

      return {
        index: index + 1,
        code,
        question_text: qText,
        question_type: qType,
        difficulty: diff,
        subject_name: subj,
        options,
        correct_answer: correctAnswer,
        explanation,
        points,
        isValid,
        isDuplicate,
        error
      };
    });

    setParsedRows(rows);
    setIsProcessing(false);
    setStep(2);
  };

  const handleExecuteImport = async () => {
    setIsProcessing(true);
    let eligibleRows = parsedRows.filter((r) => r.isValid);

    if (duplicateAction === 'skip') {
      eligibleRows = eligibleRows.filter((r) => !r.isDuplicate);
    }

    const payload: Partial<Question>[] = eligibleRows.map((r) => ({
      code: duplicateAction === 'add_new' && r.isDuplicate ? `${r.code}-NEW` : r.code,
      question_text: r.question_text,
      question_type: r.question_type,
      difficulty: r.difficulty,
      subject_name: r.subject_name,
      options: r.options,
      correct_answer: r.correct_answer,
      explanation: r.explanation,
      points: r.points,
      status: 'approved',
      source_type: 'imported_file',
      tags: ['Nhập từ file', r.subject_name]
    }));

    const res = await onImportComplete(payload);
    setImportResult(res);
    setIsProcessing(false);
    setStep(4);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const errorCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Wizard Import câu hỏi từ Excel, Word hoặc JSON
              </h2>
              <p className="text-xs text-slate-500">
                Tự động kiểm tra cấu trúc, phát hiện câu trùng và import số lượng lớn an toàn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs font-semibold">
          {[
            { s: 1, label: '1. Chọn tệp & Tải template' },
            { s: 2, label: '2. Kiểm tra dữ liệu & Trùng lặp' },
            { s: 3, label: '3. Cấu hình nhập' },
            { s: 4, label: '4. Kết quả' }
          ].map((item) => (
            <div
              key={item.s}
              className={`flex items-center gap-1.5 ${
                step === item.s ? 'text-emerald-600 font-bold' : step > item.s ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
                  step === item.s ? 'bg-emerald-600 text-white' : step > item.s ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > item.s ? '✓' : item.s}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: Upload & Download Templates */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Templates */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Chưa có tệp dữ liệu chuẩn? Tải file mẫu tại đây:
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    File mẫu chứa sẵn các cột Mã câu, Nội dung, Dạng, Mức độ, Phương án A/B/C/D và Lời giải.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('excel')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>File mẫu Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('json')}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Mẫu JSON</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-10 text-center bg-slate-50/50 transition-colors">
                <Upload className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">
                  Kéo thả tệp dữ liệu câu hỏi vào đây hoặc bấm để chọn tệp
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hỗ trợ định dạng Excel (.xlsx, .xls), CSV hoặc JSON (Tối đa 15MB)
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  onChange={handleFileChange}
                  className="mt-4 text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                />
              </div>

              {isProcessing && (
                <div className="text-center py-4 text-xs text-emerald-600 font-bold flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang đọc và tiền xử lý cấu trúc tệp...</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Preview & Validation */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-slate-500 block">Hợp lệ để nhập:</span>
                  <span className="text-lg font-extrabold text-emerald-700">{validCount} câu</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <span className="text-slate-500 block">Trùng lặp nội dung/mã:</span>
                  <span className="text-lg font-extrabold text-amber-700">{duplicateCount} câu</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                  <span className="text-slate-500 block">Lỗi định dạng:</span>
                  <span className="text-lg font-extrabold text-rose-700">{errorCount} câu</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 font-bold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">STT</th>
                        <th className="p-2.5 w-28">Mã câu</th>
                        <th className="p-2.5">Nội dung câu hỏi</th>
                        <th className="p-2.5 w-24">Loại</th>
                        <th className="p-2.5 w-28">Trạng thái kiểm tra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((r) => (
                        <tr key={r.index} className={`hover:bg-slate-50/70 ${!r.isValid ? 'bg-rose-50/40' : r.isDuplicate ? 'bg-amber-50/30' : ''}`}>
                          <td className="p-2.5 text-center text-slate-400">{r.index}</td>
                          <td className="p-2.5 font-mono font-semibold text-slate-800">{r.code}</td>
                          <td className="p-2.5 font-medium text-slate-900 line-clamp-1 max-w-md">{r.question_text}</td>
                          <td className="p-2.5 text-slate-500">{r.question_type}</td>
                          <td className="p-2.5">
                            {!r.isValid ? (
                              <span className="text-rose-700 font-bold text-[11px] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> {r.error}
                              </span>
                            ) : r.isDuplicate ? (
                              <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Trùng câu
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Duplicate handling configuration */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800">
                Cấu hình xử lý cho {duplicateCount} câu hỏi trùng lặp:
              </h3>

              <div className="space-y-3 text-xs">
                {[
                  {
                    id: 'skip',
                    title: 'Bỏ qua các câu trùng lặp (Khuyên dùng)',
                    desc: 'Chỉ nhập những câu hoàn toàn mới vào Ngân hàng để tránh làm xáo trộn các đề thi đã phát hành.'
                  },
                  {
                    id: 'add_new',
                    title: 'Tự động đổi mã và nhập thành bản mới',
                    desc: 'Thêm hậu tố -NEW vào mã câu và nhập vào kho dưới dạng bản sao độc lập.'
                  },
                  {
                    id: 'overwrite',
                    title: 'Ghi đè và nâng version câu hỏi cũ',
                    desc: 'Cập nhật lại nội dung câu cũ và lưu vào lịch sử phiên bản (Revisions).'
                  }
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      duplicateAction === opt.id ? 'bg-emerald-50/70 border-emerald-400 shadow-xs' : 'bg-white border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dup"
                      checked={duplicateAction === opt.id}
                      onChange={() => setDuplicateAction(opt.id as any)}
                      className="w-4 h-4 text-emerald-600 mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{opt.title}</div>
                      <div className="text-slate-500 mt-0.5 leading-relaxed">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Completed */}
          {step === 4 && importResult && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                <FileCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Nhập dữ liệu thành công!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đã thêm thành công <strong className="text-emerald-600 text-sm">{importResult.success}</strong> câu hỏi vào Ngân hàng câu hỏi
                </p>
              </div>

              {importResult.failed > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl text-amber-800 text-xs max-w-sm mx-auto">
                  Có {importResult.failed} câu bị bỏ qua do lỗi cú pháp hoặc trùng lặp theo lựa chọn.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div>
            {step > 1 && step < 4 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
              >
                <span>Tiếp tục: Xử lý trùng lặp</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessing ? 'Đang nhập...' : 'Xác nhận nhập vào Ngân hàng'}</span>
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
              >
                Đóng & Quay lại danh sách
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
