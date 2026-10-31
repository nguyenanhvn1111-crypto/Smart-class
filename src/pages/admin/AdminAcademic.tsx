import React, { useState } from 'react';
import {
  INITIAL_SCHOOL,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_GRADE_LEVELS,
  INITIAL_SUBJECTS
} from '../../services/seedData';
import { Building2, Layers, BookOpen, Plus, Edit } from 'lucide-react';

export const AdminAcademic: React.FC = () => {
  const [school] = useState(INITIAL_SCHOOL);
  const [academicYears] = useState(INITIAL_ACADEMIC_YEARS);
  const [grades] = useState(INITIAL_GRADE_LEVELS);
  const [subjects] = useState(INITIAL_SUBJECTS);

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
          <button className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">
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
            <button className="text-xs text-blue-600 font-semibold flex items-center gap-1">
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
            <button className="text-xs text-blue-600 font-semibold flex items-center gap-1">
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
    </div>
  );
};
