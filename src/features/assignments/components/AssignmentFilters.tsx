import React from 'react';
import { Search, RotateCcw, RefreshCw, X, SlidersHorizontal, Calendar } from 'lucide-react';
import { ClassModel, Subject } from '../../../types';
import { AssignmentQueryFilters } from '../../../services/assignmentManagementService';

interface AssignmentFiltersProps {
  searchInput: string;
  onSearchChange: (val: string) => void;
  classIds: string[];
  onClassIdsChange: (ids: string[]) => void;
  subjectIds: string[];
  onSubjectIdsChange: (ids: string[]) => void;
  typeFilter: AssignmentQueryFilters['type'];
  onTypeFilterChange: (val: AssignmentQueryFilters['type']) => void;
  receiveStatusFilter: AssignmentQueryFilters['receiveStatus'];
  onReceiveStatusChange: (val: AssignmentQueryFilters['receiveStatus']) => void;
  gradingFilter: AssignmentQueryFilters['gradingFilter'];
  onGradingFilterChange: (val: AssignmentQueryFilters['gradingFilter']) => void;
  dateFrom: string;
  dateTo: string;
  onDateRangeChange: (from: string, to: string) => void;
  sortMode: NonNullable<AssignmentQueryFilters['sort']>;
  onSortChange: (val: NonNullable<AssignmentQueryFilters['sort']>) => void;
  authorizedClasses: ClassModel[];
  subjects: Subject[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onRefresh: () => void;
}

export const AssignmentFilters: React.FC<AssignmentFiltersProps> = ({
  searchInput,
  onSearchChange,
  classIds,
  onClassIdsChange,
  subjectIds,
  onSubjectIdsChange,
  typeFilter,
  onTypeFilterChange,
  receiveStatusFilter,
  onReceiveStatusChange,
  gradingFilter,
  onGradingFilterChange,
  dateFrom,
  dateTo,
  onDateRangeChange,
  sortMode,
  onSortChange,
  authorizedClasses,
  subjects,
  hasActiveFilters,
  onResetFilters,
  onRefresh
}) => {
  const dateRangeInvalid =
    Boolean(dateFrom && dateTo && new Date(dateFrom).getTime() > new Date(dateTo).getTime());

  const applyDatePreset = (preset: 'week' | 'month') => {
    const now = new Date();
    const toLocalISO = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    if (preset === 'week') {
      const start = new Date(now);
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      onDateRangeChange(toLocalISO(start), toLocalISO(end));
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onDateRangeChange(toLocalISO(start), toLocalISO(end));
    }
  };

  return (
    <div
      className="bg-[#031C2E] border border-[#064966] rounded-[12px] p-3.5 space-y-3"
      role="search"
      aria-label="Bộ lọc và tìm kiếm bài tập đã giao"
    >
      {/* Row 1: Search, Class, Subject, Type, Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
        {/* Keyword Search (max 100 chars, debounce 300ms handled in hook) */}
        <div className="lg:col-span-4 relative">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            maxLength={100}
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value.slice(0, 100))}
            placeholder="Tìm tên bài, chủ đề, mã bài..."
            aria-label="Tìm kiếm theo tên bài, chủ đề hoặc mã bài"
            className="w-full pl-9 pr-8 py-2 bg-[#00121F] border border-[#064966] rounded-lg text-[13px] text-slate-100 placeholder-slate-400 focus:border-[#009ED0] focus:outline-hidden"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Class filter */}
        <div className="lg:col-span-2">
          <select
            aria-label="Lọc theo lớp học"
            value={classIds[0] || 'all'}
            onChange={(e) => onClassIdsChange(e.target.value === 'all' ? [] : [e.target.value])}
            className="w-full px-3 py-2 bg-[#00121F] border border-[#064966] rounded-lg text-[13px] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
          >
            <option value="all">Tất cả lớp phụ trách</option>
            {authorizedClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject filter */}
        <div className="lg:col-span-2">
          <select
            aria-label="Lọc theo môn học"
            value={subjectIds[0] || 'all'}
            onChange={(e) => onSubjectIdsChange(e.target.value === 'all' ? [] : [e.target.value])}
            className="w-full px-3 py-2 bg-[#00121F] border border-[#064966] rounded-lg text-[13px] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
          >
            <option value="all">Tất cả môn học</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignment Type */}
        <div className="lg:col-span-2">
          <select
            aria-label="Lọc theo loại bài tập"
            value={typeFilter || 'all'}
            onChange={(e) => onTypeFilterChange(e.target.value as AssignmentQueryFilters['type'])}
            className="w-full px-3 py-2 bg-[#00121F] border border-[#064966] rounded-lg text-[13px] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
          >
            <option value="all">Mọi loại bài</option>
            <option value="homework">Bài tập về nhà</option>
            <option value="exam">Bài kiểm tra</option>
            <option value="classwork">Bài trên lớp</option>
          </select>
        </div>

        {/* Sort */}
        <div className="lg:col-span-2">
          <select
            aria-label="Sắp xếp danh sách bài tập"
            value={sortMode}
            onChange={(e) => onSortChange(e.target.value as NonNullable<AssignmentQueryFilters['sort']>)}
            className="w-full px-3 py-2 bg-[#00121F] border border-[#064966] rounded-lg text-[13px] text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
          >
            <option value="newest_assigned">Ngày giao mới nhất</option>
            <option value="nearest_due">Hạn nộp gần nhất</option>
            <option value="lowest_submission_rate">Tỷ lệ nộp thấp nhất</option>
            <option value="highest_pending_grade">Chờ chấm nhiều nhất</option>
          </select>
        </div>
      </div>

      {/* Row 2: Receive status, Grading status, Date range + Presets, Reset & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-[#064966]/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#009ED0]" aria-hidden="true" />
            <span>Trạng thái:</span>
          </span>

          <select
            aria-label="Lọc trạng thái nhận bài"
            value={receiveStatusFilter || 'all'}
            onChange={(e) =>
              onReceiveStatusChange(e.target.value as AssignmentQueryFilters['receiveStatus'])
            }
            className="px-2.5 py-1.5 bg-[#00121F] border border-[#064966] rounded-lg text-xs text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
          >
            <option value="all">Nhận bài: Tất cả</option>
            <option value="open">Đang nhận bài</option>
            <option value="scheduled">Chưa mở</option>
            <option value="closed">Đã đóng nhận bài</option>
            <option value="overdue_unsubmitted">Quá hạn còn chưa nộp</option>
            <option value="draft">Bản nháp</option>
            <option value="withdrawn">Đã thu hồi</option>
          </select>

          <select
            aria-label="Lọc trạng thái chấm bài"
            value={gradingFilter || 'all'}
            onChange={(e) =>
              onGradingFilterChange(e.target.value as AssignmentQueryFilters['gradingFilter'])
            }
            className="px-2.5 py-1.5 bg-[#00121F] border border-[#064966] rounded-lg text-xs text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
          >
            <option value="all">Chấm điểm: Tất cả</option>
            <option value="pending_grade">Còn bài chưa chấm</option>
            <option value="partially_graded">Đang chấm dở</option>
            <option value="fully_graded">Đã chấm đủ</option>
            <option value="published">Đã công bố toàn bộ</option>
          </select>

          {/* Date range */}
          <div className="flex flex-wrap items-center gap-1.5 pl-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 hidden sm:block" aria-hidden="true" />
            <input
              type="date"
              aria-label="Từ ngày hạn nộp"
              value={dateFrom}
              onChange={(e) => onDateRangeChange(e.target.value, dateTo)}
              className="px-2 py-1 bg-[#00121F] border border-[#064966] rounded-lg text-xs text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
            />
            <span className="text-slate-400 text-xs">đến</span>
            <input
              type="date"
              aria-label="Đến ngày hạn nộp"
              value={dateTo}
              onChange={(e) => onDateRangeChange(dateFrom, e.target.value)}
              className="px-2 py-1 bg-[#00121F] border border-[#064966] rounded-lg text-xs text-slate-100 focus:border-[#009ED0] focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => applyDatePreset('week')}
              className="px-2.5 py-1 rounded-md border border-[#064966] bg-[#00121F] hover:border-[#009ED0] text-[11px] font-medium text-slate-200 whitespace-nowrap transition-colors"
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('month')}
              className="px-2.5 py-1 rounded-md border border-[#064966] bg-[#00121F] hover:border-[#009ED0] text-[11px] font-medium text-slate-200 whitespace-nowrap transition-colors"
            >
              Tháng này
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset bộ lọc</span>
            </button>
          )}
          <button
            type="button"
            onClick={onRefresh}
            aria-label="Làm mới số liệu từ hệ thống"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#064966] bg-[#00121F] hover:border-[#009ED0] text-slate-200 hover:text-[#00D4FF] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {dateRangeInvalid && (
        <p role="alert" className="text-xs font-medium text-rose-300">
          Khoảng ngày không hợp lệ: ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.
        </p>
      )}
    </div>
  );
};
