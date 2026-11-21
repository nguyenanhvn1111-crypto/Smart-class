import React from 'react';
import { BookOpen, Clock, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { AssignmentKpiSummary, AssignmentQueryFilters } from '../../../services/assignmentManagementService';

interface AssignmentKpiBarProps {
  kpi: AssignmentKpiSummary;
  receiveStatusFilter: AssignmentQueryFilters['receiveStatus'];
  gradingFilter: AssignmentQueryFilters['gradingFilter'];
  onApplyKpiFilter: (preset: 'all' | 'open' | 'overdue' | 'pending_grade') => void;
  isLoading?: boolean;
}

export const AssignmentKpiBar: React.FC<AssignmentKpiBarProps> = ({
  kpi,
  receiveStatusFilter,
  gradingFilter,
  onApplyKpiFilter,
  isLoading
}) => {
  const isAllActive = receiveStatusFilter === 'all' && gradingFilter === 'all';
  const isOpenActive = receiveStatusFilter === 'open' && gradingFilter === 'all';
  const isOverdueActive = receiveStatusFilter === 'overdue_unsubmitted';
  const isPendingActive = gradingFilter === 'pending_grade';

  const cards = [
    {
      id: 'all' as const,
      label: 'Tổng lượt giao',
      value: kpi.totalAssignments,
      sub: 'Trong phạm vi phụ trách',
      icon: BookOpen,
      active: isAllActive,
      accentText: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
      activeRing: 'border-blue-500 ring-1 ring-blue-500/30 bg-blue-50/40 dark:bg-blue-950/40 shadow-xs'
    },
    {
      id: 'open' as const,
      label: 'Đang nhận bài',
      value: kpi.openAssignments,
      sub: 'Học sinh có thể nộp',
      icon: Clock,
      active: isOpenActive,
      accentText: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
      activeRing: 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/40 shadow-xs'
    },
    {
      id: 'overdue' as const,
      label: 'Quá hạn / Chưa nộp',
      value: kpi.overdueOrUnsubmittedCount,
      sub: 'Cần nhắc hoặc gia hạn',
      icon: AlertTriangle,
      active: isOverdueActive,
      accentText: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
      activeRing: 'border-rose-500 ring-1 ring-rose-500/30 bg-rose-50/40 dark:bg-rose-950/40 shadow-xs'
    },
    {
      id: 'pending_grade' as const,
      label: 'Bài chưa chấm',
      value: kpi.pendingGradeTotal,
      sub: 'Bài đã nộp chưa có điểm',
      icon: ClipboardCheck,
      active: isPendingActive,
      accentText: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
      activeRing: 'border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/40 dark:bg-amber-950/40 shadow-xs'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="region" aria-label="Chỉ số tổng quan bài tập">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onApplyKpiFilter(card.id)}
            aria-pressed={card.active}
            className={`text-left rounded-[12px] border p-3.5 sm:p-4 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
              card.active
                ? card.activeRing
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-500/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">{card.label}</p>
                {isLoading ? (
                  <div className="h-7 w-14 mt-1.5 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ) : (
                  <p className={`text-2xl font-bold mt-1 tabular-nums ${card.accentText}`}>
                    {card.value}
                  </p>
                )}
              </div>
              <span
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${card.iconBg}`}
                aria-hidden="true"
              >
                <Icon className="w-4 h-4" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 truncate">{card.sub}</p>
          </button>
        );
      })}
    </div>
  );
};
