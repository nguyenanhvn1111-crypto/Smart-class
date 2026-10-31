import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import {
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Check,
  X
} from 'lucide-react';

interface RowValidation {
  rowNumber: number;
  student_code: string;
  full_name: string;
  gender: string;
  email: string;
  phone: string;
  parent_name: string;
  parent_phone: string;
  isValid: boolean;
  errors: string[];
}

export const StudentImportWizard: React.FC = () => {
  const { classes, selectedClassId } = useClass();
  const navigate = useNavigate();

  // Wizard current step: 1 to 10
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [targetClassId, setTargetClassId] = useState<string>(selectedClassId || 'cls-10a1');
  const [fileName, setFileName] = useState<string>('danh_sach_hoc_sinh_mau.xlsx');

  // Column mappings
  const [columnsDetected, setColumnsDetected] = useState<string[]>([
    'Mã học sinh',
    'Họ và tên',
    'Giới tính',
    'Email',
    'Số điện thoại',
    'Họ tên phụ huynh',
    'SĐT phụ huynh'
  ]);

  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    student_code: 'Mã học sinh',
    full_name: 'Họ và tên',
    gender: 'Giới tính',
    email: 'Email',
    phone: 'Số điện thoại',
    parent_name: 'Họ tên phụ huynh',
    parent_phone: 'SĐT phụ huynh'
  });

  // Validated rows
  const [rows, setRows] = useState<RowValidation[]>([
    {
      rowNumber: 2,
      student_code: 'HS10026',
      full_name: 'Lương Thế Vinh',
      gender: 'Nam',
      email: 'vinh.lt@student.edu.vn',
      phone: '0981 123 456',
      parent_name: 'Lương Thế Hưng',
      parent_phone: '0903 111 222',
      isValid: true,
      errors: []
    },
    {
      rowNumber: 3,
      student_code: 'HS10027',
      full_name: 'Võ Thị Sáu',
      gender: 'Nữ',
      email: 'sau.vt@student.edu.vn',
      phone: '0981 234 567',
      parent_name: 'Võ Văn Quyết',
      parent_phone: '0903 222 333',
      isValid: true,
      errors: []
    },
    {
      rowNumber: 4,
      student_code: 'HS10028',
      full_name: '', // Error: missing name
      gender: 'Nam',
      email: 'khong_hop_le_email',
      phone: '0981 345 678',
      parent_name: 'Nguyễn Văn Nam',
      parent_phone: '0903 333 444',
      isValid: false,
      errors: ['Thiếu họ tên học sinh', 'Email không đúng định dạng']
    },
    {
      rowNumber: 5,
      student_code: 'HS10029',
      full_name: 'Nguyễn Trãi',
      gender: 'Nam',
      email: 'trai.nt@student.edu.vn',
      phone: '0981 456 789',
      parent_name: 'Nguyễn Phi Khanh',
      parent_phone: '0903 444 555',
      isValid: true,
      errors: []
    },
    {
      rowNumber: 6,
      student_code: '', // Error: missing student code
      full_name: 'Đoàn Thị Điểm',
      gender: 'Nữ',
      email: 'diem.dt@student.edu.vn',
      phone: '0981 567 890',
      parent_name: 'Đoàn Doãn Nghi',
      parent_phone: '0903 555 666',
      isValid: false,
      errors: ['Thiếu mã số học sinh']
    }
  ]);

  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.filter((r) => !r.isValid).length;

  const downloadSampleTemplate = () => {
    // Generates simulated CSV
    const csvContent =
      'Mã học sinh,Họ và tên,Giới tính,Email,Số điện thoại,Họ tên phụ huynh,SĐT phụ huynh\n' +
      'HS10030,Trần Hưng Đạo,Nam,dao.th@student.edu.vn,0981111222,Trần Liễu,0903888777\n' +
      'HS10031,Lê Lợi,Nam,loi.le@student.edu.vn,0982222333,Lê Khoáng,0903777666';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_danh_sach_hoc_sinh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteImport = async () => {
    setIsProcessing(true);
    // Only import valid rows!
    const validRows = rows.filter((r) => r.isValid);
    const result = await DataService.batchCreateStudents(
      targetClassId,
      validRows.map((r) => ({
        student_code: r.student_code,
        full_name: r.full_name,
        email: r.email,
        phone: r.phone,
        gender: r.gender === 'Nữ' ? 'female' : 'male',
        parent_name: r.parent_name,
        parent_phone: r.parent_phone
      }))
    );
    setImportResult({ success: result.success, failed: invalidCount });
    setIsProcessing(false);
    setCurrentStep(10);
  };

  const stepsList = [
    'Tải file mẫu',
    'Upload',
    'Kiểm tra cột',
    'Mapping cột',
    'Preview',
    'Validate',
    'Lỗi dòng',
    'Xác nhận',
    'Import',
    'Kết quả'
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/teacher/students')}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Quy trình nhập dữ liệu học sinh (Wizard)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Nhập danh sách học sinh hàng loạt từ Excel / CSV với kiểm tra và validate chặt chẽ
          </p>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[700px]">
          {stepsList.map((stepName, idx) => {
            const stepNum = idx + 1;
            const isCompleted = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <div key={stepNum} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {stepName}
                </span>
                {idx < stepsList.length - 1 && (
                  <div className="w-4 h-0.5 bg-slate-200 mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP CONTAINER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs min-h-[420px] flex flex-col justify-between">
        {/* Step 1: Download Template */}
        {currentStep === 1 && (
          <div className="space-y-6 text-center max-w-lg mx-auto py-8">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto ring-8 ring-blue-50/50">
              <Download className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bước 1: Tải về file mẫu Excel chuẩn</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Sử dụng mẫu chuẩn của SmartClass để đảm bảo dữ liệu được nhận diện và kiểm tra chính xác
                nhất (bao gồm mã HS, họ tên, ngày sinh, số điện thoại phụ huynh).
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-2">
              <p className="font-semibold text-slate-700">Các cột bắt buộc trong file:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>Mã học sinh (duy nhất, không trùng)</li>
                <li>Họ và tên học sinh (không để trống)</li>
                <li>Giới tính (Nam / Nữ)</li>
                <li>Họ tên & Số điện thoại phụ huynh để nhận thông báo</li>
              </ul>
            </div>
            <button
              onClick={downloadSampleTemplate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Tải file Excel mẫu (.CSV)</span>
            </button>
          </div>
        )}

        {/* Step 2: Upload File */}
        {currentStep === 2 && (
          <div className="space-y-6 max-w-lg mx-auto text-center py-8">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto ring-8 ring-indigo-50/50">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bước 2: Tải lên danh sách học sinh</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kéo thả file .xlsx hoặc .csv chứa danh sách cần thêm vào hệ thống
              </p>
            </div>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-8 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nhấp để chọn file hoặc kéo thả vào đây</p>
              <p className="text-xs text-slate-400 mt-1">Hỗ trợ file .xlsx, .csv tối đa 10MB</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã nạp file mẫu thử nghiệm: {fileName} (5 bản ghi)</span>
            </div>
          </div>
        )}

        {/* Step 3: Check Columns */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-xl mx-auto py-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bước 3: Kiểm tra các cột trong file</h3>
              <p className="text-xs text-slate-500 mt-1">
                Hệ thống tự động phát hiện 7 tiêu đề cột từ dòng đầu tiên của file
              </p>
            </div>
            <div className="space-y-2">
              {columnsDetected.map((col, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                      {i + 1}
                    </span>
                    <span>{col}</span>
                  </div>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Hợp lệ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Column Mapping */}
        {currentStep === 4 && (
          <div className="space-y-6 max-w-xl mx-auto py-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bước 4: Ánh xạ cột (Column Mapping)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Xác nhận trường dữ liệu của SmartClass tương ứng với cột trong file của bạn
              </p>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">Mã học sinh *</span>
                <select
                  value={columnMapping.student_code}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-hidden"
                >
                  <option>Mã học sinh</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">Họ và tên *</span>
                <select
                  value={columnMapping.full_name}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-hidden"
                >
                  <option>Họ và tên</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">Họ tên phụ huynh</span>
                <select
                  value={columnMapping.parent_name}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-hidden"
                >
                  <option>Họ tên phụ huynh</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">Số điện thoại phụ huynh</span>
                <select
                  value={columnMapping.parent_phone}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-hidden"
                >
                  <option>SĐT phụ huynh</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Preview Raw Data */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bước 5: Xem trước dữ liệu thô (Preview)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Kiểm tra các dòng dữ liệu trước khi tiến hành bước phân tích và kiểm tra tính hợp lệ
              </p>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="p-3">Dòng</th>
                    <th className="p-3">Mã HS</th>
                    <th className="p-3">Họ và tên</th>
                    <th className="p-3">Giới tính</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phụ huynh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.rowNumber}>
                      <td className="p-3 text-slate-400">#{r.rowNumber}</td>
                      <td className="p-3 font-mono font-semibold">{r.student_code || '—'}</td>
                      <td className="p-3">{r.full_name || '—'}</td>
                      <td className="p-3">{r.gender}</td>
                      <td className="p-3 text-slate-500">{r.email}</td>
                      <td className="p-3">{r.parent_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 6 & 7: Validate per Row & Display Errors */}
        {(currentStep === 6 || currentStep === 7) && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {currentStep === 6 ? 'Bước 6: Validate từng dòng' : 'Bước 7: Danh sách dòng và cột lỗi'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Phát hiện <span className="font-semibold text-emerald-600">{validCount} dòng hợp lệ</span> và{' '}
                <span className="font-semibold text-rose-600">{invalidCount} dòng có lỗi</span>. Hệ thống cam
                kết <strong className="text-slate-800">không âm thầm nhập dòng lỗi</strong>.
              </p>
            </div>

            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.rowNumber}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    r.isValid
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/60 border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        r.isValid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {r.rowNumber}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">
                        {r.full_name || '<Trống tên học sinh>'} • Mã: {r.student_code || '<Trống mã>'}
                      </p>
                      {r.errors.length > 0 && (
                        <p className="text-rose-600 font-medium mt-0.5">
                          Lỗi: {r.errors.join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {r.isValid ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                        Sẵn sàng import
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-semibold">
                        Bị loại bỏ
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Confirmation */}
        {currentStep === 8 && (
          <div className="space-y-6 max-w-lg mx-auto text-center py-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto ring-8 ring-blue-50/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bước 8: Xác nhận nhập dữ liệu</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Bạn chuẩn bị nhập <strong className="text-emerald-600">{validCount} học sinh hợp lệ</strong>{' '}
                vào lớp học được chọn. Các dòng có lỗi ({invalidCount} dòng) sẽ bị bỏ qua.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-3">
              <div>
                <label className="block text-slate-500 mb-1">Lớp tiếp nhận học sinh:</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-hidden"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Hiện có: {c.student_count} HS)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Processing */}
        {currentStep === 9 && (
          <div className="space-y-6 max-w-lg mx-auto text-center py-12">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Bước 9: Đang nhập dữ liệu vào lớp...</h3>
            <p className="text-xs text-slate-500">
              Hệ thống đang đồng bộ hồ sơ học sinh, tài khoản người dùng và nhật ký audit log.
            </p>
          </div>
        )}

        {/* Step 10: Import Result Summary */}
        {currentStep === 10 && (
          <div className="space-y-6 max-w-lg mx-auto text-center py-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Bước 10: Kết quả nhập dữ liệu</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Quá trình nhập dữ liệu học sinh đã hoàn tất an toàn
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-xs text-emerald-600 block">Thành công</span>
                <span className="text-3xl font-extrabold text-emerald-900 block mt-1">
                  {importResult?.success || validCount}
                </span>
                <span className="text-[11px] text-emerald-600/80">Đã thêm vào lớp</span>
              </div>
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <span className="text-xs text-rose-600 block">Thất bại / Bị loại</span>
                <span className="text-3xl font-extrabold text-rose-900 block mt-1">
                  {importResult?.failed || invalidCount}
                </span>
                <span className="text-[11px] text-rose-600/80">Lỗi định dạng</span>
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate('/teacher/students')}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
              >
                Về danh sách học sinh
              </button>
            </div>
          </div>
        )}

        {/* Action button controls */}
        {currentStep < 10 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>

            {currentStep < 8 && (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 8 && (
              <button
                onClick={() => {
                  setCurrentStep(9);
                  handleExecuteImport();
                }}
                disabled={isProcessing}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <span>Tiến hành Import ({validCount} học sinh)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
