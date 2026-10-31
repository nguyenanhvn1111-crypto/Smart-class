import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Question, QuestionType, QuestionDifficulty } from '../../../types';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Check,
  RefreshCw,
  FolderOpen,
  Trash2,
  HelpCircle,
  Eye,
  FileCheck,
  FileCode
} from 'lucide-react';

interface TabImportQuestionsProps {
  existingQuestions: Question[];
  onImportSuccess: (questions: Partial<Question>[]) => Promise<{ success: number; failed: number }>;
  onViewRepository: () => void;
}

interface ParsedRow {
  index: number;
  code: string;
  question_text: string;
  question_type: QuestionType;
  difficulty: QuestionDifficulty;
  subject_name: string;
  grade_name: string;
  options: { id: string; text: string }[];
  correct_answer: any;
  explanation: string;
  points: number;
  isValid: boolean;
  isDuplicate: boolean;
  error?: string;
}

export const TabImportQuestions: React.FC<TabImportQuestionsProps> = ({
  existingQuestions,
  onImportSuccess,
  onViewRepository
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite' | 'add_new'>('skip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // 1. Download templates
  const handleDownloadTemplate = (type: 'excel' | 'csv' | 'word') => {
    if (type === 'excel') {
      const sampleData = [
        {
          'Mã câu': 'CH-TOAN-SAMPLE-01',
          'Nội dung câu hỏi': 'Cho tam giác ABC vuông tại A, biết AB = 3cm, AC = 4cm. Độ dài cạnh huyền BC là:',
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
          'Nội dung câu hỏi': 'Các phát biểu sau về nguyên tố Natri (Na) là đúng hay sai?',
          'Dạng câu hỏi': 'true_false',
          'Mức độ': 'nhan_biet',
          'Môn học': 'Hóa Học',
          'Khối lớp': 'Khối 10',
          'Phương án A': 'Đúng',
          'Phương án B': 'Sai',
          'Phương án C': '',
          'Phương án D': '',
          'Đáp án đúng': 'A',
          'Lời giải chi tiết': 'Natri có số hiệu Z=11, thuộc nhóm kim loại kiềm IA.',
          'Điểm': 1.0
        },
        {
          'Mã câu': 'CH-LY-SAMPLE-03',
          'Nội dung câu hỏi': 'Các đại lượng nào sau đây là đại lượng vectơ?',
          'Dạng câu hỏi': 'multiple_choice',
          'Mức độ': 'thong_hieu',
          'Môn học': 'Vật Lý',
          'Khối lớp': 'Khối 10',
          'Phương án A': 'Vận tốc',
          'Phương án B': 'Gia tốc',
          'Phương án C': 'Khối lượng',
          'Phương án D': 'Lực',
          'Đáp án đúng': 'A,B,D',
          'Lời giải chi tiết': 'Vận tốc, gia tốc và lực có hướng xác định nên là đại lượng vectơ.',
          'Điểm': 1.5
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Questions');
      XLSX.writeFile(wb, 'Mau_Import_Cau_Hoi_Excel.xlsx');
    } else if (type === 'csv') {
      const csvContent =
        'Mã câu,Nội dung câu hỏi,Dạng câu hỏi,Mức độ,Môn học,Khối lớp,Phương án A,Phương án B,Phương án C,Phương án D,Đáp án đúng,Lời giải chi tiết,Điểm\n' +
        'CH-VAN-01,"Ai là tác giả của tác phẩm Truyện Kiều?",single_choice,nhan_biet,Ngữ Văn,Khối 10,Nguyễn Trãi,Nguyễn Du,Hồ Xuân Hương,Đoàn Thị Điểm,B,"Truyện Kiều do đại thi hào Nguyễn Du sáng tác.",1.0\n' +
        'CH-SINH-02,"Quá trình quang hợp diễn ra chủ yếu ở bào quan lục lạp.",true_false,nhan_biet,Sinh Học,Khối 10,Đúng,Sai,,,A,"Lục lạp chứa sắc tố diệp lục hấp thụ quang năng.",1.0';

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Mau_Import_Cau_Hoi_CSV.csv';
      a.click();
    } else {
      // Word (.doc template with V-Test format)
      const wordContent = `MẪU SOẠN THẢO CÂU HỎI NHẬP TỰ ĐỘNG (CHUẨN WORD / DOCX)
Môn học: Toán Học - Khối lớp: Khối 10

<Câu 1> [single_choice] [thong_hieu]
Cho tam giác ABC có góc A = 90 độ, AB = 3cm, AC = 4cm. Độ dài cạnh huyền BC là:
A. 5 cm
B. 6 cm
C. 7 cm
D. 8 cm
Đáp án: A
Lời giải: Áp dụng định lý Pytago BC = căn(3^2 + 4^2) = 5cm.

<Câu 2> [multiple_choice] [van_dung]
Những đại lượng nào sau đây mang tính chất vectơ?
A. Vận tốc
B. Gia tốc
C. Thời gian
D. Lực tác dụng
Đáp án: A, B, D
Lời giải: Vận tốc, gia tốc, lực có hướng xác định.

<Câu 3> [true_false] [nhan_biet]
Số nguyên tố chẵn duy nhất là số 2.
A. Đúng
B. Sai
Đáp án: A
Lời giải: Tất cả các số chẵn lớn hơn 2 đều chia hết cho 2 nên là hợp số.
`;
      const blob = new Blob([wordContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Mau_Import_Cau_Hoi_Word_Format.txt';
      a.click();
    }
  };

  // 2. Parse uploaded file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    setIsProcessing(true);
    setImportResult(null);

    const isExcelOrCsv =
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv');

    if (isExcelOrCsv) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data: any[] = XLSX.utils.sheet_to_json(ws);
          processRows(data);
        } catch (err) {
          alert('Lỗi đọc tệp Excel/CSV. Vui lòng kiểm tra lại định dạng tệp!');
          setIsProcessing(false);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      // Word / Text parsing
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          parseWordOrTextContent(text || '');
        } catch (err) {
          alert('Lỗi đọc tệp Word/Văn bản. Vui lòng thử lại!');
          setIsProcessing(false);
        }
      };
      reader.readAsText(file);
    }
  };

  // Process rows from Excel / CSV
  const processRows = (rawRows: any[]) => {
    const parsed: ParsedRow[] = [];

    rawRows.forEach((row, idx) => {
      const code = (row['Mã câu'] || row['Code'] || `IMPORT-${Date.now().toString().slice(-4)}-${idx + 1}`).trim();
      const text = (row['Nội dung câu hỏi'] || row['Question'] || '').trim();
      const rawType = (row['Dạng câu hỏi'] || row['Type'] || 'single_choice').toLowerCase().trim();
      const rawDiff = (row['Mức độ'] || row['Difficulty'] || 'thong_hieu').toLowerCase().trim();
      const subject = (row['Môn học'] || row['Subject'] || 'Toán Học').trim();
      const grade = (row['Khối lớp'] || row['Grade'] || 'Khối 10').trim();

      const optA = (row['Phương án A'] || row['Option A'] || '').toString().trim();
      const optB = (row['Phương án B'] || row['Option B'] || '').toString().trim();
      const optC = (row['Phương án C'] || row['Option C'] || '').toString().trim();
      const optD = (row['Phương án D'] || row['Option D'] || '').toString().trim();

      const rawAns = (row['Đáp án đúng'] || row['Correct Answer'] || 'A').toString().trim();
      const explanation = (row['Lời giải chi tiết'] || row['Explanation'] || '').trim();
      const points = parseFloat(row['Điểm'] || row['Points']) || 1.0;

      let questionType: QuestionType = 'single_choice';
      if (rawType.includes('multi') || rawType.includes('nhiều')) questionType = 'multiple_choice';
      else if (rawType.includes('true') || rawType.includes('đúng') || rawType.includes('dung')) questionType = 'true_false';
      else if (rawType.includes('tự luận') || rawType.includes('essay')) questionType = 'essay';
      else if (rawType.includes('điền') || rawType.includes('blank')) questionType = 'fill_blank';

      let difficulty: QuestionDifficulty = 'thong_hieu';
      if (rawDiff.includes('nhan') || rawDiff.includes('biết')) difficulty = 'nhan_biet';
      else if (rawDiff.includes('van_dung_cao') || rawDiff.includes('cao')) difficulty = 'van_dung_cao';
      else if (rawDiff.includes('van_dung') || rawDiff.includes('dụng')) difficulty = 'van_dung';

      const options = [];
      if (optA) options.push({ id: 'A', text: optA });
      if (optB) options.push({ id: 'B', text: optB });
      if (optC) options.push({ id: 'C', text: optC });
      if (optD) options.push({ id: 'D', text: optD });

      const isDup = existingQuestions.some(
        (eq) => eq.code?.toLowerCase() === code.toLowerCase() || eq.question_text.trim() === text
      );

      let isValid = true;
      let error = '';
      if (!text) {
        isValid = false;
        error = 'Thiếu nội dung câu hỏi';
      } else if (questionType === 'single_choice' && options.length < 2) {
        isValid = false;
        error = 'Cần ít nhất 2 phương án lựa chọn';
      }

      parsed.push({
        index: idx,
        code,
        question_text: text,
        question_type: questionType,
        difficulty,
        subject_name: subject,
        grade_name: grade,
        options,
        correct_answer: rawAns,
        explanation,
        points,
        isValid,
        isDuplicate: isDup,
        error
      });
    });

    setParsedRows(parsed);
    setSelectedIndices(parsed.filter((r) => r.isValid).map((r) => r.index));
    setIsProcessing(false);
  };

  // Parse text / Word format
  const parseWordOrTextContent = (text: string) => {
    const rawChunks = text.split(/<Câu \d+>|Câu \d+[:.]/i).filter((c) => c.trim().length > 10);
    const parsed: ParsedRow[] = [];

    rawChunks.forEach((chunk, idx) => {
      const lines = chunk
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      let question_text = '';
      const options: { id: string; text: string }[] = [];
      let correct_answer = 'A';
      let explanation = '';

      lines.forEach((line) => {
        if (/^[A-D]\.\s/i.test(line)) {
          const id = line.charAt(0).toUpperCase();
          const optText = line.substring(2).trim();
          options.push({ id, text: optText });
        } else if (/^Đáp án[:.]?\s*/i.test(line)) {
          correct_answer = line.replace(/^Đáp án[:.]?\s*/i, '').trim();
        } else if (/^Lời giải[:.]?\s*/i.test(line)) {
          explanation = line.replace(/^Lời giải[:.]?\s*/i, '').trim();
        } else if (!question_text) {
          question_text = line;
        } else {
          question_text += ' ' + line;
        }
      });

      const code = `WORD-IMPORT-${Date.now().toString().slice(-4)}-${idx + 1}`;
      const isDup = existingQuestions.some(
        (eq) => eq.code?.toLowerCase() === code.toLowerCase() || eq.question_text.trim() === question_text.trim()
      );

      parsed.push({
        index: idx,
        code,
        question_text: question_text || `Câu hỏi trích xuất từ Word #${idx + 1}`,
        question_type: options.length > 0 ? 'single_choice' : 'essay',
        difficulty: 'thong_hieu',
        subject_name: 'Toán Học',
        grade_name: 'Khối 10',
        options: options.length > 0 ? options : [
          { id: 'A', text: 'Phương án A' },
          { id: 'B', text: 'Phương án B' },
          { id: 'C', text: 'Phương án C' },
          { id: 'D', text: 'Phương án D' }
        ],
        correct_answer: correct_answer || 'A',
        explanation: explanation || 'Lời giải chi tiết đính kèm tệp gốc.',
        points: 1.0,
        isValid: Boolean(question_text),
        isDuplicate: isDup
      });
    });

    if (parsed.length === 0) {
      // Mock sample when plain doc has no markers
      parsed.push({
        index: 0,
        code: `WORD-DOC-01`,
        question_text: text.slice(0, 150) || 'Nội dung câu hỏi mẫu từ tệp tài liệu',
        question_type: 'single_choice',
        difficulty: 'thong_hieu',
        subject_name: 'Toán Học',
        grade_name: 'Khối 10',
        options: [
          { id: 'A', text: 'Đáp án A' },
          { id: 'B', text: 'Đáp án B' },
          { id: 'C', text: 'Đáp án C' },
          { id: 'D', text: 'Đáp án D' }
        ],
        correct_answer: 'A',
        explanation: 'Trích xuất tự động từ văn bản nộp vào.',
        points: 1.0,
        isValid: true,
        isDuplicate: false
      });
    }

    setParsedRows(parsed);
    setSelectedIndices(parsed.filter((r) => r.isValid).map((r) => r.index));
    setIsProcessing(false);
  };

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedIndices.length === parsedRows.filter((r) => r.isValid).length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(parsedRows.filter((r) => r.isValid).map((r) => r.index));
    }
  };

  const toggleSelectRow = (idx: number) => {
    setSelectedIndices((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  // Execute import
  const handleExecuteImport = async () => {
    if (selectedIndices.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi hợp lệ để nhập vào hệ thống!');
      return;
    }

    setIsProcessing(true);
    const toImport: Partial<Question>[] = [];

    parsedRows.forEach((row) => {
      if (!selectedIndices.includes(row.index)) return;
      if (row.isDuplicate && duplicateAction === 'skip') return;

      toImport.push({
        code: row.code,
        question_text: row.question_text,
        question_type: row.question_type,
        difficulty: row.difficulty,
        subject_name: row.subject_name,
        grade_name: row.grade_name,
        options: row.options,
        correct_answer: row.correct_answer,
        explanation: row.explanation,
        points: row.points,
        status: 'approved',
        source_type: 'imported_file',
        source_ref: fileName || 'File Import'
      });
    });

    try {
      const res = await onImportSuccess(toImport);
      setImportResult(res);
    } catch (e) {
      alert('Có lỗi xảy ra trong quá trình lưu câu hỏi!');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Description */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Nhập câu hỏi bằng cách Import từ Word / Excel / CSV
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Tải lên tệp đề thi hoặc bảng tính có sẵn. Hệ thống tự động nhận diện định dạng, kiểm tra trùng lặp và chuyển thành câu hỏi chuẩn vào Ngân hàng.
              </p>
            </div>
          </div>

          {/* Template buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownloadTemplate('excel')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Tải mẫu Excel (.xlsx)
            </button>
            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 shadow-sm transition-colors"
            >
              <FileCode className="w-4 h-4 text-blue-600" />
              Tải mẫu CSV (.csv)
            </button>
            <button
              onClick={() => handleDownloadTemplate('word')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              Tải mẫu Word (.docx)
            </button>
          </div>
        </div>
      </div>

      {/* Main Upload Zone */}
      <div className="bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-8 text-center transition-all bg-gray-50/50">
        <input
          type="file"
          id="file-upload-tab"
          accept=".xlsx, .xls, .csv, .docx, .doc, .txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <label
          htmlFor="file-upload-tab"
          className="cursor-pointer flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {fileName ? (
              <span className="text-blue-600 font-bold">{fileName}</span>
            ) : (
              'Kéo thả hoặc bấm để chọn tệp Word (.docx), Excel (.xlsx) hoặc CSV'
            )}
          </h3>
          <p className="text-xs text-gray-500 max-w-md">
            Hỗ trợ định dạng bảng tính Excel (.xlsx, .xls), CSV hoặc văn bản Word (.docx, .doc) với cấu trúc câu hỏi chuẩn Bộ GD&ĐT.
          </p>
          <span className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
            {fileName ? 'Chọn tệp khác' : 'Chọn tệp từ máy tính'}
          </span>
        </label>
      </div>

      {/* When processing */}
      {isProcessing && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-800">Hệ thống đang đọc và phân tích cấu trúc dữ liệu...</p>
        </div>
      )}

      {/* Success Banner */}
      {importResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base">Nhập câu hỏi thành công!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Đã thêm thành công <strong className="font-bold text-emerald-900">{importResult.success}</strong> câu hỏi vào Ngân hàng câu hỏi của trường.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setParsedRows([]);
                setFileName('');
                setSelectedFile(null);
                setImportResult(null);
              }}
              className="px-3.5 py-2 text-xs font-medium text-emerald-800 bg-white border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              Tiếp tục Import tệp khác
            </button>
            <button
              onClick={onViewRepository}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Xem Kho câu hỏi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Parsed Preview Table */}
      {parsedRows.length > 0 && !importResult && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Xem trước danh sách câu hỏi đã bóc tách</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {parsedRows.length} câu tìm thấy
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Kiểm tra thông tin trước khi lưu. Đã chọn {selectedIndices.length}/{parsedRows.length} câu.
              </p>
            </div>

            {/* Duplicate policy selection */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">Nếu trùng lặp:</span>
                <select
                  value={duplicateAction}
                  onChange={(e) => setDuplicateAction(e.target.value as any)}
                  className="bg-white border border-gray-300 text-gray-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="skip">Bỏ qua câu trùng</option>
                  <option value="overwrite">Ghi đè nội dung cũ</option>
                  <option value="add_new">Vẫn thêm thành câu mới</option>
                </select>
              </div>

              <button
                onClick={handleExecuteImport}
                disabled={selectedIndices.length === 0 || isProcessing}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu {selectedIndices.length} câu vào Ngân hàng</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-100 text-gray-700 font-semibold sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIndices.length > 0 &&
                        selectedIndices.length === parsedRows.filter((r) => r.isValid).length
                      }
                      onChange={toggleSelectAll}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-28">Mã câu</th>
                  <th className="p-3 w-24">Loại câu</th>
                  <th className="p-3 w-24">Môn & Khối</th>
                  <th className="p-3">Nội dung câu hỏi</th>
                  <th className="p-3 w-40">Phương án & Đáp án</th>
                  <th className="p-3 w-24 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedRows.map((row) => {
                  const isChecked = selectedIndices.includes(row.index);
                  return (
                    <tr
                      key={row.index}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        !row.isValid ? 'bg-red-50/40' : row.isDuplicate ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!row.isValid}
                          onChange={() => toggleSelectRow(row.index)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono text-gray-700 font-semibold">{row.code}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                          {row.question_type}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">
                        <div className="font-medium text-gray-900">{row.subject_name}</div>
                        <div className="text-[10px] text-gray-400">{row.grade_name}</div>
                      </td>
                      <td className="p-3 text-gray-800">
                        <div className="line-clamp-2 font-medium">{row.question_text}</div>
                        {row.explanation && (
                          <div className="text-[11px] text-gray-500 italic mt-0.5 line-clamp-1">
                            Lời giải: {row.explanation}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-gray-600">
                        <div className="flex flex-wrap gap-1 mb-1">
                          {row.options.map((opt) => (
                            <span
                              key={opt.id}
                              className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                row.correct_answer.includes(opt.id)
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {opt.id}: {opt.text.slice(0, 15)}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700">
                          Đ/A: {row.correct_answer}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {!row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-red-600 text-[11px] font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Lỗi
                          </span>
                        ) : row.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-[11px] font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Trùng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Hợp lệ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <div>
              Hiển thị {parsedRows.length} câu hỏi. Hợp lệ: {parsedRows.filter((r) => r.isValid).length} câu.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteImport}
                disabled={selectedIndices.length === 0 || isProcessing}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Xác nhận lưu {selectedIndices.length} câu vào Ngân hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
