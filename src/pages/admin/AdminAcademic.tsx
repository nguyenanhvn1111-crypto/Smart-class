import React, { useState } from 'react';
import {
  INITIAL_SCHOOL,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_SUBJECTS
} from '../../services/seedData';
import { Modal } from '../../components/common/Modal';
import { Building2, Plus, CheckCircle2 } from 'lucide-react';

export const AdminAcademic: React.FC = () => {
  const [school, setSchool] = useState(INITIAL_SCHOOL);
  const [academicYears, setAcademicYears] = useState(INITIAL_ACADEMIC_YEARS);
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [notice, setNotice] = useState<string | null>(null);

  // Edit School Modal
  const [isEditSchoolOpen, setIsEditSchoolOpen] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    name: INITIAL_SCHOOL.name || '',
    principal_name: INITIAL_SCHOOL.principal_name || '',
    phone: INITIAL_SCHOOL.phone || '',
    address: INITIAL_SCHOOL.address || ''
  });

  // Add Academic Year Modal
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [yearForm, setYearForm] = useState({
    name: '',
    start_date: '2027-09-05',
    end_date: '2028-05-31',
    is_current: false
  });

  // Add Subject Modal
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    color: '#2563eb'
  });

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolForm.name.trim()) return;
    setSchool((prev) => ({
      ...prev,
      name: schoolForm.name.trim(),
      principal_name: (schoolForm.principal_name || '').trim(),
      phone: (schoolForm.phone || '').trim(),
      address: (schoolForm.address || '').trim()
    }));
    setIsEditSchoolOpen(false);
    showNotice('Đã cập nhật thông tin nhà trường.');
  };

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.name.trim()) return;
    setAcademicYears((prev) => [
      ...(yearForm.is_current ? prev.map((y) => ({ ...y, is_current: false })) : prev),
      {
        id: 'ay-' + Date.now(),
        school_id: school.id,
        name: yearForm.name.trim(),
        start_date: yearForm.start_date,
        end_date: yearForm.end_date,
        is_current: yearForm.is_current
      }
    ]);
    setYearForm({ name: '', start_date: '2027-09-05', end_date: '2028-05-31', is_current: false });
    setIsAddYearOpen(false);
    showNotice('Đã thêm năm học mới vào hệ thống.');
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) return;
    setSubjects((prev) => [
      ...prev,
      {
        id: 'sub-' + Date.now(),
        school_id: school.id,
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim().toUpperCase(),
        color: subjectForm.color
      }
    ]);
    setSubjectForm({ name: '', code: '', color: '#2563eb' });
    setIsAddSubjectOpen(false);
    showNotice('Đã thêm bộ môn mới vào danh mục toàn trường.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Năm học, Khối lớp & Bộ môn
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Thiết lập cấu trúc chương trình giáo dục toàn trường và phân bổ bộ môn
        </p>
      </div>

      {notice && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* School Information Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-bold text-base text-slate-900">{school.name}</h3>
              <p className="text-xs text-slate-400 font-mono">Mã đơn vị: {school.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSchoolForm({
                name: school.name,
                principal_name: school.principal_name || '',
                phone: school.phone || '',
                address: school.address || ''
              });
              setIsEditSchoolOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Chỉnh sửa
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Hiệu trưởng</span>
            <span className="font-bold text-slate-800 text-sm">{school.principal_name}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Số điện thoại</span>
            <span className="font-bold text-slate-800 text-sm font-mono">{school.phone}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-1">Địa chỉ</span>
            <span className="font-bold text-slate-800 text-sm">{school.address}</span>
          </div>
        </div>
      </div>

      {/* Academic years and Grades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic years */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Năm học</h3>
            <button
              type="button"
              onClick={() => setIsAddYearOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm năm học
            </button>
          </div>
          <div className="space-y-2">
            {academicYears.map((ay) => (
              <div
                key={ay.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 text-sm">{ay.name}</span>
                  <p className="text-slate-400 mt-0.5">
                    {ay.start_date} đến {ay.end_date}
                  </p>
                </div>
                {ay.is_current && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
                    Hiện tại
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Danh mục Môn học</h3>
            <button
              type="button"
              onClick={() => setIsAddSubjectOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm môn học
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: sub.color }}
                  />
                  <span className="font-bold text-slate-800">{sub.name}</span>
                </div>
                <span className="font-mono text-slate-400 text-[10px]">{sub.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Chỉnh sửa trường */}
      <Modal
        isOpen={isEditSchoolOpen}
        onClose={() => setIsEditSchoolOpen(false)}
        title="Chỉnh sửa thông tin trường học"
        subtitle="Cập nhật thông tin hành chính đơn vị"
      >
        <form onSubmit={handleSaveSchool} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên trường *</label>
            <input
              type="text"
              required
              value={schoolForm.name}
              onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hiệu trưởng</label>
              <input
                type="text"
                required
                value={schoolForm.principal_name}
                onChange={(e) => setSchoolForm({ ...schoolForm, principal_name: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                required
                value={schoolForm.phone}
                onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ</label>
            <input
              type="text"
              required
              value={schoolForm.address}
              onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditSchoolOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Thêm năm học */}
      <Modal
        isOpen={isAddYearOpen}
        onClose={() => setIsAddYearOpen(false)}
        title="Thêm năm học mới"
        subtitle="Thiết lập khung thời gian niên khóa"
      >
        <form onSubmit={handleAddYear} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên năm học *</label>
            <input
              type="text"
              required
              placeholder="VD: Năm học 2027 - 2028"
              value={yearForm.name}
              onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                required
                value={yearForm.start_date}
                onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
              <input
                type="date"
                required
                value={yearForm.end_date}
                onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={yearForm.is_current}
              onChange={(e) => setYearForm({ ...yearForm, is_current: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span>Đặt làm năm học hiện tại</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddYearOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Thêm năm học
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Thêm môn học */}
      <Modal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        title="Thêm môn học mới"
        subtitle="Bổ sung bộ môn vào chương trình đào tạo"
      >
        <form onSubmit={handleAddSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên môn học *</label>
            <input
              type="text"
              required
              placeholder="VD: Tin Học"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã môn học *</label>
              <input
                type="text"
                required
                placeholder="VD: TIN"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Màu nhận diện</label>
              <input
                type="color"
                value={subjectForm.color}
                onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                className="w-full h-10 p-1 border border-slate-200 rounded-xl cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddSubjectOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              Thêm môn học
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

