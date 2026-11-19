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
      accentText: 'text-[#00D4FF]',
      iconBg: 'bg-[#009ED0]/15 text-[#00D4FF] border-[#009ED0]/30',
      activeRing: 'border-[#009ED0] ring-1 ring-[#009ED0]/40 bg-[#052740]'
    },
    {
      id: 'open' as const,
      label: 'Đang nhận bài',
      value: kpi.openAssignments,
      sub: 'Học sinh có thể nộp',
      icon: Clock,
      active: isOpenActive,
      accentText: 'text-emerald-300',
      iconBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      activeRing: 'border-emerald-400 ring-1 ring-emerald-400/40 bg-[#052740]'
    },
    {
      id: 'overdue' as const,
      label: 'Quá hạn / Chưa nộp',
      value: kpi.overdueOrUnsubmittedCount,
      sub: 'Cần nhắc hoặc gia hạn',
      icon: AlertTriangle,
      active: isOverdueActive,
      accentText: 'text-rose-300',
      iconBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      activeRing: 'border-rose-400 ring-1 ring-rose-400/40 bg-[#052740]'
    },
    {
      id: 'pending_grade' as const,
      label: 'Bài chưa chấm',
      value: kpi.pendingGradeTotal,
      sub: 'Bài đã nộp chưa có điểm',
      icon: ClipboardCheck,
      active: isPendingActive,
      accentText: 'text-amber-300',
      iconBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      activeRing: 'border-amber-400 ring-1 ring-amber-400/40 bg-[#052740]'
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
            className={`text-left rounded-[12px] border p-3.5 sm:p-4 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#009ED0] ${
              card.active
                ? card.activeRing
                : 'bg-[#031C2E] border-[#064966] hover:border-[#009ED0]/70 hover:bg-[#042338]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-300 truncate">{card.label}</p>
                {isLoading ? (
                  <div className="h-7 w-14 mt-1.5 rounded bg-slate-700/60 animate-pulse" />
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
            <p className="text-[11px] text-slate-400 mt-1.5 truncate">{card.sub}</p>
          </button>
        );
      })}
    </div>
  );
};
