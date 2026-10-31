import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { Assignment } from '../../types';
import { StatusChip } from '../../components/common/StatusChip';
import { SearchBox } from '../../components/common/SearchBox';
import { Tabs } from '../../components/common/Tabs';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  ExternalLink,
  Users
} from 'lucide-react';

export const AssignmentList: React.FC = () => {
  const { classes, selectedClassId } = useClass();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const loadAssignments = async () => {
    const list = await DataService.getAssignments();
    setAssignments(list);
  };

  useEffect(() => {
    loadAssignments();
    const unsub = DataService.subscribe(loadAssignments);
    return unsub;
  }, []);

  const tabs = [
    { id: 'all', label: 'Tất cả bài tập', badge: assignments.length },
    {
      id: 'published',
      label: 'Đang giao',
      badge: assignments.filter((a) => a.status === 'published').length
    },
    {
      id: 'draft',
      label: 'Bản nháp',
      badge: assignments.filter((a) => a.status === 'draft').length
    },
    {
      id: 'closed',
      label: 'Đã đóng / Hết hạn',
      badge: assignments.filter((a) => a.status === 'closed').length
    }
  ];

  const filtered = assignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      a.class_name.toLowerCase().includes(search.toLowerCase());

    const matchTab = activeTab === 'all' || a.status === activeTab;
    return matchSearch && matchTab;
  });

  const handleDuplicate = async (asg: Assignment) => {
    await DataService.createAssignment({
      class_id: asg.class_id,
      class_name: asg.class_name,
      subject_id: asg.subject_id,
      subject_name: asg.subject_name,
      teacher_id: asg.teacher_id,
      teacher_name: asg.teacher_name,
      title: `${asg.title} (Bản sao)`,
      description: asg.description,
      due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      points_max: asg.points_max,
      status: 'draft',
      allow_late: asg.allow_late
    });
    loadAssignments();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài tập này?')) {
      await DataService.deleteAssignment(id);
      loadAssignments();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Bài tập</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Giao bài tập, theo dõi tiến độ nộp bài, chấm điểm và phản hồi nhận xét học sinh
          </p>
        </div>

        <button
          onClick={() => navigate('/teacher/assignments/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Giao bài tập mới</span>
        </button>
      </div>

      {/* Tabs and Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-1">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Tìm bài tập theo tiêu đề, môn, lớp..."
          className="w-full sm:max-w-md"
        />
      </div>

      {/* Assignments Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((asg) => {
          const progress = Math.round((asg.submitted_count / (asg.total_students || 1)) * 100);
          const isPendingGrading = asg.submitted_count > asg.graded_count;

          return (
            <div
              key={asg.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {asg.subject_name}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{asg.class_name}</span>
                  </div>
                  <StatusChip status={asg.status} size="sm" />
                </div>

                <h3
                  onClick={() => navigate(`/teacher/assignments/${asg.id}`)}
                  className="font-bold text-base text-slate-900 hover:text-blue-600 cursor-pointer transition-colors line-clamp-1"
                >
                  {asg.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{asg.description}</p>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Tiến độ nộp bài:</span>
                    <span className="font-bold text-slate-800">
                      {asg.submitted_count}/{asg.total_students} ({progress}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Hạn: {new Date(asg.due_date).toLocaleDateString('vi-VN')}
                  </span>
                  {isPendingGrading && (
                    <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                      Chờ chấm {asg.submitted_count - asg.graded_count} bài
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(asg)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Nhân bản bài tập"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(asg.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Xóa bài tập"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => navigate(`/teacher/assignments/${asg.id}`)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-2xs"
                >
                  Chấm bài & Chi tiết
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
