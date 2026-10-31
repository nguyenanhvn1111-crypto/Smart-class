import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { Student, GradeItem, GradeRecord, GradeCategory } from '../../types';
import {
  FileSpreadsheet,
  Save,
  Download,
  Upload,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';

export const GradebookPage: React.FC = () => {
  const { classes, selectedClassId, setSelectedClassId } = useClass();

  const [students, setStudents] = useState<Student[]>([]);
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([]);
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [semester, setSemester] = useState<1 | 2>(1);
  const [subject, setSubject] = useState('sub-math');

  // Matrix edit state: [studentId_gradeItemId]: score (string for seamless typing)
  const [matrix, setMatrix] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New grade item modal
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('gc-tx');

  const loadData = async () => {
    const stus = await DataService.getStudents(selectedClassId);
    const items = await DataService.getGradeItems(selectedClassId);
    const records = await DataService.getGradeRecords();

    setStudents(stus);
    setGradeItems(items);
    setGradeRecords(records);

    // Populate matrix
    const newMatrix: Record<string, string> = {};
    records.forEach((r) => {
      if (r.score !== null && r.score !== undefined) {
        newMatrix[`${r.student_id}_${r.grade_item_id}`] = String(r.score);
      }
    });
    setMatrix(newMatrix);
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  // Handle cell edit with 0-10 validation
  const handleCellChange = (studentId: string, gradeItemId: string, val: string) => {
    // Validate: only numbers between 0 and 10 or empty
    if (val === '' || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10)) {
      setMatrix((prev) => ({
        ...prev,
        [`${studentId}_${gradeItemId}`]: val
      }));
    }
  };

  // Calculate student average GPA
  const calculateStudentAverage = (studentId: string) => {
    let totalScore = 0;
    let totalWeight = 0;

    gradeItems.forEach((item) => {
      const val = matrix[`${studentId}_${item.id}`];
      if (val !== undefined && val !== '') {
        const weight = item.category_id === 'gc-ck' ? 3 : item.category_id === 'gc-gk' ? 2 : 1;
        totalScore += parseFloat(val) * weight;
        totalWeight += weight;
      }
    });

    if (totalWeight === 0) return '—';
    return (totalScore / totalWeight).toFixed(1);
  };

  // Batch save
  const handleBatchSave = async () => {
    setIsSaving(true);
    const recordsToSave: {
      grade_item_id: string;
      student_id: string;
      score: number | null;
    }[] = [];

    students.forEach((stu) => {
      gradeItems.forEach((item) => {
        const key = `${stu.id}_${item.id}`;
        const val = matrix[key];
        recordsToSave.push({
          student_id: stu.id,
          grade_item_id: item.id,
          score: val !== undefined && val !== '' ? parseFloat(val) : null
        });
      });
    });

    await DataService.batchSaveGradeRecords(recordsToSave);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Add new assessment column
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    await DataService.createGradeItem({
      class_id: selectedClassId,
      subject_id: subject,
      subject_name: 'Toán Học',
      category_id: newItemCategory,
      category_name:
        newItemCategory === 'gc-ck'
          ? 'Đánh giá cuối kỳ'
          : newItemCategory === 'gc-gk'
          ? 'Đánh giá giữa kỳ'
          : 'Đánh giá thường xuyên',
      name: newItemName,
      max_score: 10,
      semester,
      date: new Date().toISOString().split('T')[0]
    });

    setNewItemName('');
    setShowAddColumn(false);
    loadData();
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'Mã HS,Họ và tên,' + gradeItems.map((g) => g.name).join(',') + ',Điểm TB\n';
    students.forEach((stu) => {
      const rowScores = gradeItems.map((g) => matrix[`${stu.id}_${g.id}`] || '').join(',');
      const avg = calculateStudentAverage(stu.id);
      csv += `${stu.student_code},"${stu.full_name}",${rowScores},${avg}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_diem_${selectedClassId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sổ điểm điện tử (Gradebook)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Giao diện bảng tính Spreadsheet trực quan với kiểm tra thang điểm 0-10 và tính điểm TB tự động
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddColumn(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm cột điểm</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel (.CSV)</span>
          </button>
          <button
            onClick={handleBatchSave}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu toàn bộ sổ điểm'}</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Lớp:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3 py-1.5 outline-hidden"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Môn học:</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3 py-1.5 outline-hidden"
          >
            <option value="sub-math">Toán Học</option>
            <option value="sub-lit">Ngữ Văn</option>
            <option value="sub-eng">Tiếng Anh</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Học kỳ:</span>
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3 py-1.5 outline-hidden"
          >
            <option value={1}>Học kỳ I</option>
            <option value={2}>Học kỳ II</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Container with Sticky Student Column */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[600px] relative">
          <table className="w-full text-left text-xs border-collapse">
            {/* Sticky Header */}
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px] sticky top-0 z-20 shadow-2xs">
              <tr>
                <th className="px-3 py-3 w-12 text-center border-r border-b border-slate-200 sticky left-0 bg-slate-100 z-30">
                  STT
                </th>
                <th className="px-4 py-3 min-w-[200px] border-r border-b border-slate-200 sticky left-12 bg-slate-100 z-30 shadow-xs">
                  Học sinh
                </th>
                {gradeItems.map((item) => (
                  <th
                    key={item.id}
                    className="px-3 py-3 min-w-[120px] text-center border-r border-b border-slate-200"
                  >
                    <span className="block font-bold text-slate-800">{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {item.category_name} (Hệ số{' '}
                      {item.category_id === 'gc-ck' ? '3' : item.category_id === 'gc-gk' ? '2' : '1'}
                      )
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 min-w-[90px] text-center border-b border-slate-200 bg-blue-50/80 text-blue-900 font-bold sticky right-0 z-20">
                  Điểm TB
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((stu, index) => {
                const avg = calculateStudentAverage(stu.id);
                return (
                  <tr key={stu.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-400 border-r border-slate-100 sticky left-0 bg-white z-10">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 border-r border-slate-100 sticky left-12 bg-white z-10 shadow-xs">
                      <div>
                        <span>{stu.full_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {stu.student_code}
                        </span>
                      </div>
                    </td>
                    {gradeItems.map((item) => {
                      const key = `${stu.id}_${item.id}`;
                      const val = matrix[key] || '';
                      return (
                        <td key={item.id} className="p-1 border-r border-slate-100 text-center">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => handleCellChange(stu.id, item.id, e.target.value)}
                            placeholder="—"
                            className="w-16 mx-auto text-center py-1.5 px-2 bg-slate-50/70 hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded-lg text-xs font-bold text-slate-800 outline-hidden transition-all"
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-center font-extrabold text-blue-700 bg-blue-50/40 sticky right-0 z-10">
                      {avg}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success alert */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>Toàn bộ điểm số học sinh đã được lưu thành công!</span>
        </div>
      )}

      {/* Add Assessment Column Modal */}
      {showAddColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Thêm cột điểm kiểm tra mới</h3>
            <form onSubmit={handleAddColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên bài kiểm tra *
                </label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="VD: Kiểm tra 15 phút số 3"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loại đánh giá
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
                >
                  <option value="gc-tx">Đánh giá thường xuyên (ĐGTX - Hệ số 1)</option>
                  <option value="gc-gk">Đánh giá giữa kỳ (ĐGGK - Hệ số 2)</option>
                  <option value="gc-ck">Đánh giá cuối kỳ (ĐGCK - Hệ số 3)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddColumn(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Thêm cột ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
