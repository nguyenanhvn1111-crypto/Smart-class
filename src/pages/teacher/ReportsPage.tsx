import React, { useState, useEffect } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { Student } from '../../types';
import { ChartCard } from '../../components/common/ChartCard';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  Award,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { classes, selectedClassId, setSelectedClassId } = useClass();

  const [students, setStudents] = useState<Student[]>([]);
  const [reportType, setReportType] = useState<'academic' | 'attendance' | 'behavior'>('academic');
  const [semester, setSemester] = useState('1');

  useEffect(() => {
    DataService.getStudents(selectedClassId).then(setStudents);
  }, [selectedClassId]);

  // Chart data: Monthly attendance progress
  const attendanceMonthly = [
    { month: 'T9', rate: 97.5 },
    { month: 'T10', rate: 96.2 },
    { month: 'T11', rate: 98.0 },
    { month: 'T12', rate: 95.8 },
    { month: 'T1', rate: 96.9 }
  ];

  // Chart data: Academic breakdown
  const academicData = [
    { subject: 'Toán', avg: 8.4 },
    { subject: 'Văn', avg: 7.9 },
    { subject: 'Anh', avg: 8.2 },
    { subject: 'Lý', avg: 8.1 },
    { subject: 'Hóa', avg: 7.8 }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = 'Mã HS,Họ và tên,Lớp,Điểm TB,Chuyên cần,Điểm rèn luyện\n';
    students.forEach((s) => {
      csv += `${s.student_code},"${s.full_name}",${s.class_name},${s.gpa},${s.attendance_rate}%,${s.behavior_score}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_cao_tong_hop_${selectedClassId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Báo cáo & Thống kê Tổng hợp
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kết xuất thống kê học tập, chuyên cần, thi đua và in phiếu báo cáo gửi Ban giám hiệu và phụ huynh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file Excel (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Lớp:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium outline-hidden"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Loại báo cáo:</span>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium outline-hidden"
          >
            <option value="academic">Kết quả Học tập</option>
            <option value="attendance">Chuyên cần & Điểm danh</option>
            <option value="behavior">Thi đua & Kỷ luật</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Học kỳ:</span>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium outline-hidden"
          >
            <option value="1">Học kỳ 1</option>
            <option value="2">Học kỳ 2</option>
          </select>
        </div>
      </div>

      {/* Printable Report Header for print preview */}
      <div className="hidden print-only text-center mb-6">
        <h2 className="text-lg font-bold">TRƯỜNG THPT CHUYÊN KHOA HỌC THỰC NGHIỆM</h2>
        <h1 className="text-xl font-bold uppercase mt-1">Báo Cáo Tổng Hợp Kết Quả Rèn Luyện & Học Tập</h1>
        <p className="text-xs text-slate-600 mt-1">Lớp: 10A1 • Năm học 2025 - 2026</p>
      </div>

      {/* Report Cards KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Sĩ số lớp"
          value={students.length}
          subtitle="100% hồ sơ hoàn chỉnh"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Điểm TB chung"
          value="8.42"
          subtitle="Học lực Giỏi toàn diện"
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Tỷ lệ chuyên cần"
          value="96.4%"
          subtitle="Tỷ lệ hiện diện TB"
          icon={CheckCircle2}
          color="purple"
        />
        <StatCard
          title="Điểm rèn luyện TB"
          value="94.5đ"
          subtitle="Xếp loại Tốt"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        <ChartCard
          title="Điểm trung bình các bộ môn"
          subtitle="So sánh tương quan giữa các môn học chính"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={academicData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="subject" stroke="#64748B" fontSize={11} />
              <YAxis domain={[0, 10]} stroke="#64748B" fontSize={11} />
              <Tooltip />
              <Bar dataKey="avg" fill="#2563EB" radius={[6, 6, 0, 0]} name="Điểm TB" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Diễn biến chuyên cần theo tháng"
          subtitle="Tỷ lệ phần trăm học sinh đi học đầy đủ"
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={attendanceMonthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
              <YAxis domain={[90, 100]} stroke="#64748B" fontSize={11} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 5 }}
                name="Chuyên cần (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-800">
          Bảng tổng hợp xếp loại học sinh
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
            <tr>
              <th className="px-4 py-3">STT</th>
              <th className="px-4 py-3">Mã số</th>
              <th className="px-4 py-3">Học sinh</th>
              <th className="px-4 py-3">Điểm TB</th>
              <th className="px-4 py-3">Học lực</th>
              <th className="px-4 py-3">Chuyên cần</th>
              <th className="px-4 py-3">Hạnh kiểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((stu, i) => (
              <tr key={stu.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                <td className="px-4 py-3 font-mono font-semibold">{stu.student_code}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{stu.full_name}</td>
                <td className="px-4 py-3 font-bold text-blue-600">{stu.gpa}</td>
                <td className="px-4 py-3 font-medium text-slate-700">
                  {(stu.gpa || 8) >= 8.5 ? 'Xuất sắc' : (stu.gpa || 8) >= 8 ? 'Giỏi' : 'Khá'}
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-600">{stu.attendance_rate}%</td>
                <td className="px-4 py-3 font-semibold text-purple-600">
                  {(stu.behavior_score || 90) >= 90 ? 'Tốt' : 'Khá'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
