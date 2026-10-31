import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Pencil,
  Trash2,
  Undo2,
  Redo2,
  FileSpreadsheet,
  Download,
  Plus,
  Check,
  AlertTriangle,
  School,
  UserCheck,
  Building,
  Printer,
  Palette,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Day titles mapping (strictly system managed, max 7 days)
const DAY_TITLES = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

// Default time generator: starts at 07:00, 45 minutes per period, cumulative
export const getDefaultTimeForPeriod = (periodIndex: number): string => {
  const startMinutes = 7 * 60 + periodIndex * 45;
  const endMinutes = startMinutes + 45;
  const formatTime = (totalMin: number) => {
    const h = Math.floor(totalMin / 60)
      .toString()
      .padStart(2, '0');
    const m = (totalMin % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };
  return `${formatTime(startMinutes)} - ${formatTime(endMinutes)}`;
};

export interface RowColorOption {
  id: string;
  name: string;
  rowBg: string; // row or cell background
  headerBg: string; // period column background
  badgeBg: string; // period badge background/text
  borderColor: string;
  dotColor: string;
}

export const ROW_COLOR_OPTIONS: RowColorOption[] = [
  {
    id: 'blue',
    name: 'Xanh lam',
    rowBg: 'bg-blue-50/40 hover:bg-blue-50/60',
    headerBg: 'bg-blue-100/70',
    badgeBg: 'bg-blue-600 text-white',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500'
  },
  {
    id: 'emerald',
    name: 'Xanh lá',
    rowBg: 'bg-emerald-50/40 hover:bg-emerald-50/60',
    headerBg: 'bg-emerald-100/70',
    badgeBg: 'bg-emerald-600 text-white',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 'amber',
    name: 'Vàng cam',
    rowBg: 'bg-amber-50/40 hover:bg-amber-50/60',
    headerBg: 'bg-amber-100/70',
    badgeBg: 'bg-amber-600 text-white',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500'
  },
  {
    id: 'purple',
    name: 'Tím',
    rowBg: 'bg-purple-50/40 hover:bg-purple-50/60',
    headerBg: 'bg-purple-100/70',
    badgeBg: 'bg-purple-600 text-white',
    borderColor: 'border-purple-200',
    dotColor: 'bg-purple-500'
  },
  {
    id: 'rose',
    name: 'Hồng phấn',
    rowBg: 'bg-rose-50/40 hover:bg-rose-50/60',
    headerBg: 'bg-rose-100/70',
    badgeBg: 'bg-rose-600 text-white',
    borderColor: 'border-rose-200',
    dotColor: 'bg-rose-500'
  },
  {
    id: 'teal',
    name: 'Xanh ngọc',
    rowBg: 'bg-teal-50/40 hover:bg-teal-50/60',
    headerBg: 'bg-teal-100/70',
    badgeBg: 'bg-teal-600 text-white',
    borderColor: 'border-teal-200',
    dotColor: 'bg-teal-500'
  },
  {
    id: 'indigo',
    name: 'Chàm',
    rowBg: 'bg-indigo-50/40 hover:bg-indigo-50/60',
    headerBg: 'bg-indigo-100/70',
    badgeBg: 'bg-indigo-600 text-white',
    borderColor: 'border-indigo-200',
    dotColor: 'bg-indigo-500'
  },
  {
    id: 'orange',
    name: 'Cam',
    rowBg: 'bg-orange-50/40 hover:bg-orange-50/60',
    headerBg: 'bg-orange-100/70',
    badgeBg: 'bg-orange-600 text-white',
    borderColor: 'border-orange-200',
    dotColor: 'bg-orange-500'
  },
  {
    id: 'slate',
    name: 'Xám ghi',
    rowBg: 'bg-slate-50/50 hover:bg-slate-100/50',
    headerBg: 'bg-slate-100/80',
    badgeBg: 'bg-slate-700 text-white',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-500'
  }
];

export interface TimetableRow {
  id: string;
  name: string; // e.g. "Tiết 1", "Tiết 2", ...
  time: string;
  color?: string; // id from ROW_COLOR_OPTIONS
}

export interface TimetableState {
  rows: TimetableRow[];
  days: string[]; // e.g. ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6']
  colsCount: number; // days.length for compatibility
  data: string[][]; // rows.length x days.length
}

// 3 Schedule categories
export type ScheduleCategory = 'class' | 'teacher' | 'room';

interface ScheduleTarget {
  id: string;
  name: string;
  subText?: string;
}

const CLASS_TARGETS: ScheduleTarget[] = [
  { id: '10A1', name: 'Lớp 10A1', subText: 'Khối 10 - Ban Tự nhiên' },
  { id: '10A2', name: 'Lớp 10A2', subText: 'Khối 10 - Ban Xã hội' },
  { id: '10A3', name: 'Lớp 10A3', subText: 'Khối 10 - Cơ bản' },
  { id: '11A1', name: 'Lớp 11A1', subText: 'Khối 11 - Ban Tự nhiên' },
  { id: '12A1', name: 'Lớp 12A1', subText: 'Khối 12 - Ôn thi THPT' }
];

const TEACHER_TARGETS: ScheduleTarget[] = [
  { id: 'GV01', name: 'Thầy Nguyễn Văn Nam', subText: 'Bộ môn Toán' },
  { id: 'GV02', name: 'Cô Trần Thị Hương', subText: 'Bộ môn Ngữ Văn' },
  { id: 'GV03', name: 'Thầy Lê Minh Tuấn', subText: 'Bộ môn Tiếng Anh' },
  { id: 'GV04', name: 'Cô Phạm Thu Hà', subText: 'Bộ môn Vật Lý' },
  { id: 'GV05', name: 'Thầy Hoàng Minh Đức', subText: 'Bộ môn Hóa Học' }
];

const ROOM_TARGETS: ScheduleTarget[] = [
  { id: 'P101', name: 'Phòng 101', subText: 'Khu A - Tầng 1' },
  { id: 'P102', name: 'Phòng 102', subText: 'Khu A - Tầng 1' },
  { id: 'P201', name: 'Phòng 201', subText: 'Khu B - Tầng 2' },
  { id: 'PTIN', name: 'Phòng Tin học 1', subText: 'Khu C - Thực hành máy tính' },
  { id: 'PLAB', name: 'Phòng Thí nghiệm', subText: 'Khu C - Lý - Hóa - Sinh' }
];

const createDefaultTimetable = (isSample10A1 = false): TimetableState => {
  const rowsCount = 5;
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
  const rows: TimetableRow[] = Array.from({ length: rowsCount }, (_, i) => ({
    id: `row-${i + 1}`,
    name: `Tiết ${i + 1}`,
    time: getDefaultTimeForPeriod(i),
    color: ROW_COLOR_OPTIONS[i % ROW_COLOR_OPTIONS.length].id
  }));

  const sample10A1 = [
    ['Chào cờ', 'Toán', 'Ngữ Văn', 'Tiếng Anh', 'Vật Lý'],
    ['Toán', 'Toán', 'Ngữ Văn', 'Tiếng Anh', 'Hóa Học'],
    ['Toán', 'Tin Học', 'Lịch Sử', 'Sinh Học', 'Địa Lý'],
    ['Tiếng Anh', 'Vật Lý', 'GDCD', 'Tin Học', 'Thể Dục'],
    ['Sinh Hoạt', 'Hóa Học', 'Thể Dục', 'Công Nghệ', 'HĐ Trải Nghiệm']
  ];

  const data: string[][] = Array.from({ length: rowsCount }, (_, r) =>
    Array.from({ length: days.length }, (_, c) => {
      if (isSample10A1 && sample10A1[r] && sample10A1[r][c]) {
        return sample10A1[r][c];
      }
      return '';
    })
  );

  return { rows, days, colsCount: days.length, data };
};

export const normalizeTimetable = (raw: any, isSample10A1 = false): TimetableState => {
  if (!raw) return createDefaultTimetable(isSample10A1);
  const days: string[] = Array.isArray(raw.days) && raw.days.length > 0
    ? raw.days
    : DAY_TITLES.slice(0, typeof raw.colsCount === 'number' ? raw.colsCount : 5);

  const rawRows = Array.isArray(raw.rows) && raw.rows.length > 0 ? raw.rows : [];
  const rows: TimetableRow[] = rawRows.length > 0
    ? rawRows.map((r: any, idx: number) => ({
        id: r.id || `row-${idx + 1}`,
        name: r.name || `Tiết ${idx + 1}`,
        time: r.time || getDefaultTimeForPeriod(idx),
        color: r.color || ROW_COLOR_OPTIONS[idx % ROW_COLOR_OPTIONS.length].id
      }))
    : Array.from({ length: 5 }, (_, i) => ({
        id: `row-${i + 1}`,
        name: `Tiết ${i + 1}`,
        time: getDefaultTimeForPeriod(i),
        color: ROW_COLOR_OPTIONS[i % ROW_COLOR_OPTIONS.length].id
      }));

  const data: string[][] = rows.map((_, rIdx) => {
    const existingRow = Array.isArray(raw.data?.[rIdx]) ? raw.data[rIdx] : [];
    return days.map((_, cIdx) => existingRow[cIdx] || '');
  });

  return { rows, days, colsCount: days.length, data };
};

export const SchedulePage: React.FC = () => {
  // Category & target selection
  const [category, setCategory] = useState<ScheduleCategory>('class');
  const [targetId, setTargetId] = useState<string>('10A1');

  // Timetable core state
  const [timetable, setTimetable] = useState<TimetableState>(() => {
    const saved = localStorage.getItem('timetable_class_10A1');
    if (saved) {
      try {
        return normalizeTimetable(JSON.parse(saved), true);
      } catch {
        return createDefaultTimetable(true);
      }
    }
    return createDefaultTimetable(true);
  });

  // Saved state for reverting and tracking dirty state
  const [savedTimetable, setSavedTimetable] = useState<TimetableState>(timetable);

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<TimetableState[]>([]);
  const [redoStack, setRedoStack] = useState<TimetableState[]>([]);

  // Mode toggles
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);

  // Modals & Popovers
  const [showMaxDaysModal, setShowMaxDaysModal] = useState<boolean>(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [activeColorPickerRow, setActiveColorPickerRow] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if changes exist compared to saved state
  const hasUnsavedChanges = JSON.stringify(timetable) !== JSON.stringify(savedTimetable);

  // Load timetable on category / target switch
  const loadScheduleForTarget = useCallback((cat: ScheduleCategory, id: string) => {
    const key = `timetable_${cat}_${id}`;
    const raw = localStorage.getItem(key);
    let newState: TimetableState;
    if (raw) {
      try {
        newState = normalizeTimetable(JSON.parse(raw), cat === 'class' && id === '10A1');
      } catch {
        newState = createDefaultTimetable(cat === 'class' && id === '10A1');
      }
    } else {
      newState = createDefaultTimetable(cat === 'class' && id === '10A1');
    }
    setTimetable(newState);
    setSavedTimetable(newState);
    setUndoStack([]);
    setRedoStack([]);
    setIsEditMode(false);
    setIsDeleteMode(false);
  }, []);

  const handleCategoryChange = (newCat: ScheduleCategory) => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      return;
    }
    setCategory(newCat);
    const newTargetId =
      newCat === 'class' ? CLASS_TARGETS[0].id : newCat === 'teacher' ? TEACHER_TARGETS[0].id : ROOM_TARGETS[0].id;
    setTargetId(newTargetId);
    loadScheduleForTarget(newCat, newTargetId);
  };

  const handleTargetChange = (newId: string) => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
      return;
    }
    setTargetId(newId);
    loadScheduleForTarget(category, newId);
  };

  const notify = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Push snapshot to undo stack
  const pushState = (currentState: TimetableState) => {
    setUndoStack((prev) => [...prev.slice(-40), JSON.parse(JSON.stringify(currentState))]);
    setRedoStack([]);
  };

  // 1. Chỉnh sửa toggle
  const toggleEditMode = () => {
    if (isEditMode) {
      // If turning off edit mode and there are unsaved changes
      if (hasUnsavedChanges) {
        setShowUnsavedModal(true);
      } else {
        setIsEditMode(false);
        setIsDeleteMode(false);
      }
    } else {
      setIsEditMode(true);
      setIsDeleteMode(false);
    }
  };

  // Save changes
  const handleSave = () => {
    const key = `timetable_${category}_${targetId}`;
    localStorage.setItem(key, JSON.stringify(timetable));
    setSavedTimetable(JSON.parse(JSON.stringify(timetable)));
    setIsEditMode(false);
    setIsDeleteMode(false);
    setUndoStack([]);
    setRedoStack([]);
    setShowUnsavedModal(false);
    notify('Đã lưu thời khóa biểu thành công!');
  };

  // Discard changes
  const handleDiscard = () => {
    setTimetable(JSON.parse(JSON.stringify(savedTimetable)));
    setIsEditMode(false);
    setIsDeleteMode(false);
    setUndoStack([]);
    setRedoStack([]);
    setShowUnsavedModal(false);
    notify('Đã hủy các thay đổi chưa lưu', 'info');
  };

  // 2. Xóa button toggle
  const toggleDeleteMode = () => {
    setIsDeleteMode((prev) => !prev);
  };

  // 3. Hoàn tác (Undo)
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(timetable))]);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setTimetable(previous);
  }, [undoStack, timetable]);

  // 4. Làm lại (Redo)
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(timetable))]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setTimetable(next);
  }, [redoStack, timetable]);

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isZ = e.key === 'z' || e.key === 'Z';
      const isY = e.key === 'y' || e.key === 'Y';
      if ((e.ctrlKey || e.metaKey) && isZ) {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && isY) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Add column at index (with intelligent day picking)
  const handleAddColumn = (insertIndex: number, specificDay?: string) => {
    const daysList = timetable.days || DAY_TITLES.slice(0, timetable.colsCount);
    if (daysList.length >= 7) {
      setShowMaxDaysModal(true);
      return;
    }

    let dayToAdd = specificDay;
    if (!dayToAdd) {
      const missingDays = DAY_TITLES.filter((d) => !daysList.includes(d));
      if (missingDays.length === 0) {
        setShowMaxDaysModal(true);
        return;
      }

      // Check if there is a missing day between prevDay and nextDay
      const prevDay = insertIndex > 0 ? daysList[insertIndex - 1] : null;
      const nextDay = insertIndex < daysList.length ? daysList[insertIndex] : null;
      const prevIdx = prevDay ? DAY_TITLES.indexOf(prevDay) : -1;
      const nextIdx = nextDay ? DAY_TITLES.indexOf(nextDay) : 8;

      const betweenCandidate = missingDays.find((d) => {
        const idx = DAY_TITLES.indexOf(d);
        return idx > prevIdx && idx < nextIdx;
      });

      dayToAdd = betweenCandidate || missingDays[0];
    }

    pushState(timetable);
    const newDays = [...daysList];
    newDays.splice(insertIndex, 0, dayToAdd);

    const newData = timetable.data.map((row) => {
      const copy = [...row];
      copy.splice(insertIndex, 0, '');
      return copy;
    });

    setTimetable({
      ...timetable,
      days: newDays,
      colsCount: newDays.length,
      data: newData
    });
    notify(`Đã thêm cột ${dayToAdd}!`);
  };

  // Delete column at index (REMOVES THE EXACT DAY AT THAT COLUMN)
  const handleDeleteColumn = (colIndex: number) => {
    const daysList = timetable.days || DAY_TITLES.slice(0, timetable.colsCount);
    if (daysList.length <= 1) {
      notify('Thời khóa biểu cần có ít nhất 1 cột ngày', 'info');
      return;
    }
    pushState(timetable);
    const targetDayName = daysList[colIndex];
    const newDays = daysList.filter((_, idx) => idx !== colIndex);
    const newData = timetable.data.map((row) => row.filter((_, idx) => idx !== colIndex));

    setTimetable({
      ...timetable,
      days: newDays,
      colsCount: newDays.length,
      data: newData
    });
    notify(`Đã xóa cột ${targetDayName}!`);
  };

  // Clear all periods (empty content) for a specific day column
  const handleClearDayColumn = (colIndex: number) => {
    const daysList = timetable.days || DAY_TITLES.slice(0, timetable.colsCount);
    const targetDayName = daysList[colIndex] || `Cột ${colIndex + 1}`;
    pushState(timetable);
    const newData = timetable.data.map((row) =>
      row.map((cell, c) => (c === colIndex ? '' : cell))
    );
    setTimetable({
      ...timetable,
      data: newData
    });
    notify(`Đã xóa sạch nội dung các tiết của ${targetDayName}!`);
  };

  // Add row at index (with intelligent period naming)
  const handleAddRow = (insertIndex: number, specificName?: string) => {
    pushState(timetable);
    const newRows = [...timetable.rows];
    const daysList = timetable.days || DAY_TITLES.slice(0, timetable.colsCount);

    let periodName = specificName;
    if (!periodName) {
      const existingNumbers = newRows
        .map((r, i) => {
          const m = (r.name || `Tiết ${i + 1}`).match(/\d+/);
          return m ? parseInt(m[0], 10) : null;
        })
        .filter((n): n is number => n !== null);

      const prevNum = insertIndex > 0 ? existingNumbers[insertIndex - 1] : 0;
      const nextNum = insertIndex < newRows.length ? existingNumbers[insertIndex] : 999;

      let candidateNum: number | null = null;
      if (prevNum !== undefined && nextNum !== undefined && nextNum - prevNum > 1) {
        candidateNum = prevNum + 1;
      } else {
        const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
        candidateNum = maxNum + 1;
      }
      periodName = `Tiết ${candidateNum}`;
    }

    newRows.splice(insertIndex, 0, {
      id: `row-${Date.now()}`,
      name: periodName,
      time: getDefaultTimeForPeriod(insertIndex),
      color: ROW_COLOR_OPTIONS[insertIndex % ROW_COLOR_OPTIONS.length].id
    });

    const newData = [...timetable.data];
    newData.splice(
      insertIndex,
      0,
      Array.from({ length: daysList.length }, () => '')
    );

    setTimetable({
      ...timetable,
      rows: newRows,
      data: newData
    });
    notify(`Đã thêm ${periodName}!`);
  };

  // Change color for a specific row
  const handleRowColorChange = (rowIndex: number, colorId: string) => {
    pushState(timetable);
    const newRows = timetable.rows.map((r, idx) =>
      idx === rowIndex ? { ...r, color: colorId } : r
    );
    setTimetable({
      ...timetable,
      rows: newRows
    });
    const colorOpt = ROW_COLOR_OPTIONS.find((c) => c.id === colorId);
    notify(`Đã đổi màu dòng ${timetable.rows[rowIndex]?.name || `Tiết ${rowIndex + 1}`} sang ${colorOpt?.name || colorId}!`);
  };

  // Delete row at index (REMOVES THE EXACT PERIOD AT THAT ROW)
  const handleDeleteRow = (rowIndex: number) => {
    if (timetable.rows.length <= 1) {
      notify('Thời khóa biểu cần có ít nhất 1 hàng tiết', 'info');
      return;
    }
    pushState(timetable);
    const targetRow = timetable.rows[rowIndex];
    const rowName = targetRow?.name || `Tiết ${rowIndex + 1}`;
    const newRows = timetable.rows.filter((_, idx) => idx !== rowIndex);
    const newData = timetable.data.filter((_, idx) => idx !== rowIndex);

    setTimetable({
      ...timetable,
      rows: newRows,
      data: newData
    });
    notify(`Đã xóa ${rowName} của tất cả các ngày trong tuần!`);
  };

  // Clear all cell contents for a row (clear period across all days)
  const handleClearRow = (rowIndex: number) => {
    pushState(timetable);
    const targetRow = timetable.rows[rowIndex];
    const rowName = targetRow?.name || `Tiết ${rowIndex + 1}`;
    const newData = timetable.data.map((row, r) =>
      r === rowIndex ? row.map(() => '') : [...row]
    );
    setTimetable({
      ...timetable,
      data: newData
    });
    notify(`Đã xóa trắng nội dung ${rowName} cho cả tuần!`);
  };

  // Append a new period (row) at the bottom for the whole week
  const handleAppendPeriodForWholeWeek = () => {
    handleAddRow(timetable.rows.length);
  };

  // Renumber periods sequentially (Tiết 1, 2, 3...)
  const handleRenumberPeriods = () => {
    pushState(timetable);
    const newRows = timetable.rows.map((row, idx) => ({
      ...row,
      name: `Tiết ${idx + 1}`
    }));
    setTimetable({ ...timetable, rows: newRows });
    notify('Đã đánh số lại các tiết liên tục (Tiết 1, 2, 3...)');
  };

  // Sort and arrange days by Monday to Sunday order
  const handleSortDays = () => {
    const daysList = timetable.days || DAY_TITLES.slice(0, timetable.colsCount);
    pushState(timetable);
    const indexed = daysList.map((d, colIdx) => ({
      name: d,
      colIdx,
      order: DAY_TITLES.indexOf(d)
    }));
    indexed.sort((a, b) => a.order - b.order);

    const newDays = indexed.map((x) => x.name);
    const newData = timetable.data.map((row) => indexed.map((x) => row[x.colIdx]));

    setTimetable({
      ...timetable,
      days: newDays,
      colsCount: newDays.length,
      data: newData
    });
    notify('Đã sắp xếp lại các ngày theo đúng thứ tự tuần!');
  };

  // Delete specific cell
  const handleDeleteCell = (rowIndex: number, colIndex: number) => {
    if (timetable.data[rowIndex][colIndex] === '') return;
    pushState(timetable);
    const newData = timetable.data.map((row, r) =>
      r === rowIndex ? row.map((cell, c) => (c === colIndex ? '' : cell)) : [...row]
    );
    setTimetable({
      ...timetable,
      data: newData
    });
  };

  // Update cell text
  const handleCellChange = (rowIndex: number, colIndex: number, newText: string) => {
    const currentText = timetable.data[rowIndex][colIndex];
    if (currentText === newText) return;
    pushState(timetable);
    const newData = timetable.data.map((row, r) =>
      r === rowIndex ? row.map((cell, c) => (c === colIndex ? newText : cell)) : [...row]
    );
    setTimetable({
      ...timetable,
      data: newData
    });
  };

  // Update row time
  const handleRowTimeChange = (rowIndex: number, newTime: string) => {
    if (timetable.rows[rowIndex].time === newTime) return;
    pushState(timetable);
    const newRows = timetable.rows.map((row, r) => (r === rowIndex ? { ...row, time: newTime } : row));
    setTimetable({
      ...timetable,
      rows: newRows
    });
  };

  // 5. Import Excel
  const handleImportExcelClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length === 0) {
          notify('File Excel không có dữ liệu', 'info');
          return;
        }

        pushState(timetable);

        // Find how many days/cols (max 7)
        // Check if row 0 has headers (Thứ 2...)
        const firstRow = rows[0] || [];
        let dataStartRow = 0;
        let dayCols = 5;

        // Detect if row 0 is header
        const hasHeader = firstRow.some(
          (cell) => typeof cell === 'string' && (cell.includes('Thứ') || cell.toLowerCase().includes('tiết'))
        );
        if (hasHeader) {
          dataStartRow = 1;
          const candidateCols = firstRow.filter(
            (c) => typeof c === 'string' && (c.includes('Thứ') || c.includes('Chủ Nhật'))
          ).length;
          if (candidateCols >= 1 && candidateCols <= 7) {
            dayCols = candidateCols;
          }
        }

        const dataRows = rows.slice(dataStartRow).filter((r) => r.length > 0);
        const newRowCount = Math.max(5, dataRows.length);
        const newColsCount = Math.min(7, Math.max(5, dayCols));

        const importedDays = DAY_TITLES.slice(0, newColsCount);
        const newTimetableRows: TimetableRow[] = Array.from({ length: newRowCount }, (_, i) => {
          let timeVal = getDefaultTimeForPeriod(i);
          const rawRow = dataRows[i];
          if (rawRow && rawRow[0] && typeof rawRow[0] === 'string' && rawRow[0].includes('-')) {
            timeVal = rawRow[0].replace(/Tiết\s*\d+/gi, '').trim();
          }
          return {
            id: `row-${i + 1}`,
            name: `Tiết ${i + 1}`,
            time: timeVal || getDefaultTimeForPeriod(i)
          };
        });

        const newTimetableData: string[][] = Array.from({ length: newRowCount }, (_, r) =>
          Array.from({ length: newColsCount }, (_, c) => {
            const rawRow = dataRows[r];
            if (!rawRow) return '';
            // If col 0 is Period/Time, data starts at index 1
            const cellVal = rawRow[c + 1] !== undefined ? rawRow[c + 1] : rawRow[c];
            if (cellVal === null || cellVal === undefined || cellVal === '-trống-') return '';
            return String(cellVal).trim();
          })
        );

        setTimetable({
          rows: newTimetableRows,
          days: importedDays,
          colsCount: newColsCount,
          data: newTimetableData
        });
        setIsEditMode(true);
        notify('Nhập Excel thành công! Bạn có thể chỉnh sửa và Lưu.');
      } catch (err) {
        console.error(err);
        notify('Định dạng file không hợp lệ hoặc bị lỗi đọc', 'info');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 6. Xuất file (Excel)
  const handleExportExcel = () => {
    const currentTarget =
      category === 'class'
        ? CLASS_TARGETS.find((c) => c.id === targetId)?.name
        : category === 'teacher'
        ? TEACHER_TARGETS.find((t) => t.id === targetId)?.name
        : ROOM_TARGETS.find((r) => r.id === targetId)?.name;

    const currentDays = timetable.days || DAY_TITLES.slice(0, timetable.colsCount);
    const headers = ['Tiết / Giờ', ...currentDays];
    const excelRows = timetable.rows.map((row, r) => [
      `${row.name || `Tiết ${r + 1}`} (${row.time})`,
      ...timetable.data[r].map((cell) => cell || '-trống-')
    ]);

    const worksheetData = [
      [`THỜI KHÓA BIỂU - ${currentTarget?.toUpperCase() || ''}`],
      [],
      headers,
      ...excelRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ThoiKhoaBieu');

    const fileName = `Thoi_Khoa_Bieu_${currentTarget?.replace(/\s+/g, '_') || 'Lop'}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportModal(false);
    notify(`Đã xuất file: ${fileName}`);
  };

  const handlePrint = () => {
    window.print();
    setShowExportModal(false);
  };

  // Current entity object
  const currentEntityList =
    category === 'class' ? CLASS_TARGETS : category === 'teacher' ? TEACHER_TARGETS : ROOM_TARGETS;
  const currentEntity = currentEntityList.find((item) => item.id === targetId) || currentEntityList[0];

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Excel Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* HEADER & PHÂN LOẠI LỊCH (Lớp học / Giáo viên / Phòng học) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Thời Khóa Biểu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và lập lịch học tập thông minh cho Lớp học, Giáo viên và Phòng học
          </p>
        </div>

        {/* 3 LOẠI LỊCH & ĐỐI TƯỢNG */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented control for 3 categories */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => handleCategoryChange('class')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                category === 'class'
                  ? 'bg-white text-blue-700 shadow-xs border border-gray-200/60'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <School className="w-4 h-4" />
              <span>Lớp học</span>
            </button>
            <button
              onClick={() => handleCategoryChange('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                category === 'teacher'
                  ? 'bg-white text-blue-700 shadow-xs border border-gray-200/60'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Giáo viên</span>
            </button>
            <button
              onClick={() => handleCategoryChange('room')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                category === 'room'
                  ? 'bg-white text-blue-700 shadow-xs border border-gray-200/60'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Phòng học</span>
            </button>
          </div>

          {/* Target select dropdown */}
          <select
            value={targetId}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer min-w-[160px]"
          >
            {currentEntityList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} {item.subText ? `(${item.subText})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. KHU VỰC THANH CHỨC NĂNG (TOP BAR) - ĐÚNG 6 NÚT CHÍNH TRÊN CÙNG MỘT THANH NGANG */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. NÚT CHỈNH SỬA (Bật/Tắt chế độ sửa, khi bật xuất hiện thêm nút Lưu) */}
          <button
            onClick={toggleEditMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs ${
              isEditMode
                ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-300'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            title="Bật/tắt chế độ sửa"
          >
            <Pencil className="w-4 h-4" />
            <span>{isEditMode ? 'Đang sửa' : 'Chỉnh sửa'}</span>
          </button>

          {/* NÚT LƯU - CHỈ XUẤT HIỆN KHI ĐANG BẬT CHẾ ĐỘ CHỈNH SỬA */}
          {isEditMode && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all animate-in fade-in"
              title="Lưu toàn bộ thay đổi"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Lưu</span>
            </button>
          )}

          {/* 2. NÚT XÓA (MÀU ĐỎ, NẰM CẠNH NÚT CHỈNH SỬA) */}
          <button
            onClick={toggleDeleteMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer ${
              isDeleteMode
                ? 'bg-red-600 text-white ring-2 ring-red-400 hover:bg-red-700'
                : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            }`}
            title="Bật/tắt chế độ xóa để hiển thị các nút xóa hàng, cột và ô"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleteMode ? 'Chế độ Xóa: BẬT' : 'Bật chế độ xóa'}</span>
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

          {/* 3. NÚT HOÀN TÁC (ICON MŨI TÊN TRÁI - Ctrl+Z) */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all shadow-xs ${
              undoStack.length > 0
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Hoàn tác</span>
          </button>

          {/* 4. NÚT LÀM LẠI (ICON MŨI TÊN PHẢI - Ctrl+Y, disabled khi không thể tiến tới) */}
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all shadow-xs ${
              redoStack.length > 0
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
            title="Làm lại (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Làm lại</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* 5. IMPORT EXCEL */}
          <button
            onClick={handleImportExcelClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-xs transition-all"
            title="Import Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          {/* 6. XUẤT FILE */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-xs transition-all"
            title="Xuất file"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Xuất file</span>
          </button>
        </div>
      </div>

      {/* DELETE MODE ACTIVE BANNER */}
      {isDeleteMode && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>Chế độ Xóa đang BẬT:</strong> Các nút xóa cột (<em>Xóa hết tiết</em>, <em>Xóa cột</em>), xóa hàng (<em>Xóa chữ</em>, <em>Xóa tiết</em>) và nút xóa ô đã hiển thị. Click để thực hiện xóa!
            </span>
          </div>
          <button
            onClick={() => setIsDeleteMode(false)}
            className="text-xs font-bold bg-white text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100 shadow-2xs transition-colors cursor-pointer shrink-0 ml-3"
          >
            Tắt chế độ Xóa
          </button>
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div
          className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-md transition-all flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* BẢNG THỜI KHÓA BIỂU - NHẬP LIỆU GIỐNG MS WORD & AUTO GIÃN DÒNG */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">{currentEntity.name}</span>
            {currentEntity.subText && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                {currentEntity.subText}
              </span>
            )}
          </div>
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Có thay đổi chưa lưu
            </span>
          )}
        </div>

        {/* Helper info bar when days or periods were deleted */}
        {(() => {
          const currentDaysList = timetable.days || DAY_TITLES.slice(0, timetable.colsCount);
          const missingDaysList = DAY_TITLES.filter((d) => !currentDaysList.includes(d));
          const hasNonSeqPeriods = timetable.rows.some((r, i) => r.name !== `Tiết ${i + 1}`);
          if (missingDaysList.length === 0 && !hasNonSeqPeriods) return null;

          return (
            <div className="px-4 py-2 bg-blue-50/60 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {missingDaysList.length > 0 && (
                  <span className="text-gray-600">
                    Các ngày chưa có trong lịch:{' '}
                    <span className="font-semibold text-blue-700">{missingDaysList.join(', ')}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasNonSeqPeriods && (
                  <button
                    type="button"
                    onClick={handleRenumberPeriods}
                    className="px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 font-medium transition-colors shadow-2xs"
                    title="Đánh lại số thứ tự các tiết theo liên tục (Tiết 1, 2, 3...)"
                  >
                    Đánh số lại các tiết (1, 2, 3...)
                  </button>
                )}
                {missingDaysList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSortDays}
                    className="px-2 py-0.5 rounded bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 font-medium transition-colors shadow-2xs"
                    title="Sắp xếp lại các ngày theo thứ tự Thứ 2 đến Chủ Nhật"
                  >
                    Sắp xếp lại Thứ 2 - CN
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        <table className="w-full border-collapse select-text table-fixed">
          {/* TABLE HEADER (THỨ 2 ĐẾN THỨ X) */}
          <thead>
            <tr className="bg-gray-100/80 border-b border-gray-300">
              {/* CỘT 1: TIẾT / GIỜ & THÊM TIẾT CẢ TUẦN */}
              <th className="w-44 min-w-[160px] p-2.5 text-center border-r border-gray-300 text-xs font-bold uppercase tracking-wider text-gray-700 select-none bg-gray-100">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="font-bold">Tiết / Giờ</span>
                  {/* Button thêm tiết cho cả tuần - luôn có sẵn */}
                  <button
                    type="button"
                    onClick={handleAppendPeriodForWholeWeek}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
                    title="Thêm 1 tiết học cho tất cả các ngày trong tuần"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>Thêm tiết cả tuần</span>
                  </button>
                </div>
              </th>

              {/* TỪ CỘT 2 ĐẾN N: CÁC NGÀY TRONG TUẦN (BẤM VÀO THỨ NÀO XÓA THỨ NẤY, KHÔNG CẦN BẬT CHẾ ĐỘ XÓA) */}
              {(timetable.days || DAY_TITLES.slice(0, timetable.colsCount)).map((dayName, colIdx) => (
                <th
                  key={`col-header-${dayName}-${colIdx}`}
                  onClick={isDeleteMode ? () => handleDeleteColumn(colIdx) : undefined}
                  className={`relative p-2.5 text-center border-r border-gray-300 select-none transition-colors group/col ${
                    isDeleteMode
                      ? 'bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-sm font-bold text-gray-800">{dayName}</span>

                    {/* Action buttons cho từng Thứ (CHỈ HIỂN THỊ KHI BẬT CHẾ ĐỘ XÓA) */}
                    {isDeleteMode && (
                      <div className="flex items-center gap-1 mt-1 animate-in fade-in zoom-in-95 duration-150">
                        {/* Nút xóa hết tiết của Thứ này */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearDayColumn(colIdx);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors shadow-2xs"
                          title={`Xóa sạch tất cả các tiết của ${dayName}`}
                        >
                          Xóa hết tiết
                        </button>

                        {/* Nút xóa cột Thứ này */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteColumn(colIdx);
                          }}
                          className="p-1 rounded text-white bg-red-600 hover:bg-red-700 shadow-2xs transition-colors"
                          title={`Xóa hẳn cột ${dayName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* VẠCH NGĂN CÁCH GIỮA CÁC CỘT: KHI RÊ CHUỘT HIỂN THỊ ICON DẤU + ĐỂ THÊM CỘT */}
                  {!isDeleteMode && (
                    <div
                      className="absolute top-0 right-0 h-full w-4 -mr-2 z-20 group/divider flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddColumn(colIdx + 1);
                      }}
                      title={`Thêm cột ngày vào sau ${dayName}`}
                    >
                      <div className="w-0.5 h-full bg-transparent group-hover/divider:bg-blue-400 transition-colors" />
                      <button
                        type="button"
                        className="opacity-0 group-hover/divider:opacity-100 absolute w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:scale-110 transition-all text-xs"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </button>
                    </div>
                  )}
                </th>
              ))}

              {/* NÚT THÊM CỘT NGÀY TIẾP THEO HOẶC CÁC NGÀY CÒN THIẾU */}
              {!isDeleteMode && (() => {
                const currentDaysList = timetable.days || DAY_TITLES.slice(0, timetable.colsCount);
                const missingDaysList = DAY_TITLES.filter((d) => !currentDaysList.includes(d));
                if (missingDaysList.length === 0) return null;

                return (
                  <th className="p-2 text-center bg-gray-50/60 border-r border-gray-300 min-w-[90px]">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAddColumn(currentDaysList.length)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-2xs"
                        title={`Thêm ${missingDaysList[0]}`}
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Thêm {missingDaysList[0]}</span>
                      </button>
                    </div>
                  </th>
                );
              })()}
            </tr>
          </thead>

          {/* TABLE BODY (HÀNG TIẾT) */}
          <tbody className="divide-y divide-gray-300">
            {timetable.rows.map((row, rowIdx) => {
              const currentDaysList = timetable.days || DAY_TITLES.slice(0, timetable.colsCount);
              const missingDaysList = DAY_TITLES.filter((d) => !currentDaysList.includes(d));
              const periodName = row.name || `Tiết ${rowIdx + 1}`;

              const rowColorOpt =
                ROW_COLOR_OPTIONS.find((c) => c.id === row.color) ||
                ROW_COLOR_OPTIONS[rowIdx % ROW_COLOR_OPTIONS.length];

              return (
                <tr
                  key={row.id}
                  className={`divide-x divide-gray-300 transition-colors ${rowColorOpt.rowBg}`}
                >
                  {/* CỘT 1: TIẾT / GIỜ (BẤM VÀO TIẾT NÀO XÓA TIẾT ĐÓ, KHÔNG CẦN BẬT CHẾ ĐỘ XÓA) */}
                  <td
                    onClick={isDeleteMode ? () => handleDeleteRow(rowIdx) : undefined}
                    className={`relative p-2.5 text-center align-top select-none transition-colors group/row ${rowColorOpt.headerBg} ${
                      isDeleteMode
                        ? 'hover:bg-red-50 cursor-pointer text-red-700'
                        : ''
                    }`}
                  >
                    {/* TIÊU ĐỀ TIẾT + BADGE MÀU SẮC ĐỒNG BỘ */}
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold shadow-2xs ${rowColorOpt.badgeBg}`}>
                        {periodName}
                      </span>
                    </div>

                    {/* THỜI GIAN TIẾT: CLICK SỬA TRỰC TIẾP THỜI GIAN */}
                    <EditableTime
                      value={row.time}
                      isEditable={!isDeleteMode}
                      onChange={(newTime) => handleRowTimeChange(rowIdx, newTime)}
                    />

                    {/* NÚT HÀNH ĐỘNG DÀNH CHO TIẾT: CHỌN MÀU DÒNG, XÓA CHỮ, XÓA TIẾT */}
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {/* Nút chọn màu cho dòng */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveColorPickerRow(activeColorPickerRow === rowIdx ? null : rowIdx);
                          }}
                          className="p-1 rounded-md bg-white/90 text-gray-700 hover:text-blue-600 hover:bg-white border border-gray-300 shadow-2xs transition-all hover:scale-105"
                          title="Đổi màu sắc cho dòng này"
                        >
                          <Palette className="w-3.5 h-3.5" />
                        </button>

                        {/* POPOVER BẢNG CHỌN MÀU CHO DÒNG NÀY */}
                        {activeColorPickerRow === rowIdx && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 bottom-full mb-1 z-40 bg-white rounded-xl shadow-xl border border-gray-200 p-2 w-48 text-left animate-in fade-in"
                          >
                            <div className="text-[11px] font-bold text-gray-600 mb-1.5 px-1 flex items-center justify-between">
                              <span>Màu cho {periodName}:</span>
                              <button
                                type="button"
                                onClick={() => setActiveColorPickerRow(null)}
                                className="text-gray-400 hover:text-gray-600 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {ROW_COLOR_OPTIONS.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    handleRowColorChange(rowIdx, c.id);
                                    setActiveColorPickerRow(null);
                                  }}
                                  className={`flex items-center gap-1.5 p-1 rounded-md text-[11px] font-medium transition-all border ${
                                    (row.color || ROW_COLOR_OPTIONS[rowIdx % ROW_COLOR_OPTIONS.length].id) === c.id
                                      ? 'border-blue-500 bg-blue-50/50 shadow-2xs font-bold'
                                      : 'border-transparent hover:bg-gray-100'
                                  }`}
                                  title={c.name}
                                >
                                  <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${c.dotColor}`} />
                                  <span className="truncate text-gray-700">{c.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CHỈ HIỂN THỊ CÁC NÚT XÓA KHI BẬT CHẾ ĐỘ XÓA */}
                      {isDeleteMode && (
                        <>
                          {/* Xóa trắng nội dung tiết này trên tất cả các ngày trong tuần */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearRow(rowIdx);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors shadow-2xs animate-in fade-in duration-150"
                            title={`Xóa trắng nội dung ${periodName} cho tất cả các ngày`}
                          >
                            Xóa chữ
                          </button>

                          {/* Xóa hàng tiết này khỏi thời khóa biểu cả tuần */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRow(rowIdx);
                            }}
                            className="p-1 rounded text-white bg-red-600 hover:bg-red-700 shadow-2xs transition-colors animate-in fade-in duration-150"
                            title={`Xóa hẳn ${periodName} khỏi toàn bộ tuần`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* VẠCH NGĂN CÁCH GIỮA CÁC HÀNG: KHI RÊ CHUỘT HIỂN THỊ ICON DẤU + ĐỂ THÊM HÀNG */}
                    {!isDeleteMode && (
                      <div
                        className="absolute bottom-0 left-0 w-full h-4 -mb-2 z-20 group/rowdivider flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddRow(rowIdx + 1);
                        }}
                        title={`Thêm hàng tiết vào bên dưới ${periodName}`}
                      >
                        <div className="h-0.5 w-full bg-transparent group-hover/rowdivider:bg-blue-400 transition-colors" />
                        <button
                          type="button"
                          className="opacity-0 group-hover/rowdivider:opacity-100 absolute w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md hover:scale-110 transition-all text-xs"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* TỪ CỘT 2 ĐẾN N: CÁC Ô NHẬP LIỆU GIỐNG MS WORD */}
                  {currentDaysList.map((_, colIdx) => {
                    const cellText = timetable.data[rowIdx]?.[colIdx] ?? '';
                    return (
                      <TimetableCell
                        key={`cell-${rowIdx}-${colIdx}`}
                        value={cellText}
                        rowColor={rowColorOpt}
                        isEditMode={isEditMode}
                        isDeleteMode={isDeleteMode}
                        onDelete={() => handleDeleteCell(rowIdx, colIdx)}
                        onChange={(newText) => handleCellChange(rowIdx, colIdx, newText)}
                        onActivateEdit={() => {
                          if (!isEditMode && !isDeleteMode) {
                            setIsEditMode(true);
                          }
                        }}
                      />
                    );
                  })}

                  {/* Ô TRỐNG NẾU CỘT THÊM ĐANG HIỂN THỊ Ở HEADER */}
                  {!isDeleteMode && missingDaysList.length > 0 && (
                    <td className="bg-gray-50/20 border-r border-gray-300 text-center text-xs text-gray-400" />
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* POPUP: GIỚI HẠN 7 NGÀY (CHẶN LẠI KHI THÊM QUÁ CHỦ NHẬT) */}
      {showMaxDaysModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Thông báo</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Không thể thêm cột vì một tuần chỉ có 7 ngày.
            </p>
            <div>
              <button
                onClick={() => setShowMaxDaysModal(false)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: CẢNH BÁO CHƯA LƯU THAY ĐỔI */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Bạn chưa lưu thay đổi</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Bạn có các thay đổi chưa được lưu trong thời khóa biểu. Bạn muốn lưu hay hủy bỏ những thay đổi này?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDiscard}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-xs"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: XUẤT FILE MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Xuất Thời Khóa Biểu</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Chọn định dạng file bạn muốn tải về hoặc in ấn cho đối tượng:{' '}
              <strong>{currentEntity.name}</strong>:
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleExportExcel}
                className="p-4 border border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/40 text-center transition-all group flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm text-gray-800">File Excel (.xlsx)</span>
                <span className="text-xs text-gray-500">Mở với MS Excel / Sheets</span>
              </button>

              <button
                onClick={handlePrint}
                className="p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/40 text-center transition-all group flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm text-gray-800">In / Xuất PDF</span>
                <span className="text-xs text-gray-500">In trực tiếp hoặc lưu PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENT: Ô NHẬP LIỆU GIỐNG MS WORD (CLICK LÀ HIỆN CON TRỎ NHÁY |, ENTER XUỐNG DÒNG, TỰ CO GIÃN HÀNG)
interface TimetableCellProps {
  value: string;
  isEditMode: boolean;
  isDeleteMode: boolean;
  rowColor?: RowColorOption;
  onDelete: () => void;
  onChange: (val: string) => void;
  onActivateEdit: () => void;
}

const TimetableCell: React.FC<TimetableCellProps> = ({
  value,
  isEditMode,
  isDeleteMode,
  rowColor,
  onDelete,
  onChange,
  onActivateEdit
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync content with value prop when not actively focused
  useEffect(() => {
    if (!isFocused && editorRef.current) {
      if (value && value.trim() !== '') {
        if (editorRef.current.innerText !== value) {
          editorRef.current.innerText = value;
        }
      } else {
        editorRef.current.innerText = '';
      }
    }
  }, [value, isFocused]);

  const handleCellClick = () => {
    if (isDeleteMode) {
      onDelete();
      return;
    }
    onActivateEdit();
    editorRef.current?.focus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (editorRef.current) {
      const text = editorRef.current.innerText.trim();
      onChange(text);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const isEmpty = !value || value.trim() === '';

  const cellBgClass = isDeleteMode
    ? 'hover:bg-red-50 cursor-pointer'
    : isEditMode
    ? 'cursor-text hover:bg-white/80'
    : 'cursor-text hover:bg-white/60';

  return (
    <td
      onClick={handleCellClick}
      className={`relative p-3 align-top min-h-[72px] transition-colors border-r border-gray-300 group ${cellBgClass}`}
    >
      {/* MS WORD-LIKE INLINE EDITABLE CONTAINER */}
      <div
        ref={editorRef}
        contentEditable={!isDeleteMode}
        suppressContentEditableWarning
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full min-h-[44px] text-sm text-gray-800 outline-none leading-relaxed whitespace-pre-wrap break-words ${
          isFocused ? 'ring-1 ring-blue-400 bg-blue-50/10 rounded-sm p-1' : 'p-1'
        }`}
      />

      {/* HIỂN THỊ CHỮ "-trống-" MẶC ĐỊNH KHI Ô KHÔNG CÓ DỮ LIỆU VÀ KHÔNG FOCUS */}
      {isEmpty && !isFocused && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-gray-400 italic text-sm"
        >
          -trống-
        </div>
      )}

      {/* NÚT XÓA Ô (CHỈ HIỂN THỊ KHI BẬT CHẾ ĐỘ XÓA) */}
      {isDeleteMode && !isEmpty && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-all shadow-xs z-10 animate-in fade-in cursor-pointer"
          title="Xóa nội dung tiết này"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      {/* ICON TRASH INDICATOR KHI Ô TRỐNG TRONG CHẾ ĐỘ XÓA */}
      {isDeleteMode && isEmpty && (
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </div>
      )}
    </td>
  );
};

// COMPONENT: SỬA TRỰC TIẾP THỜI GIAN TIẾT
interface EditableTimeProps {
  value: string;
  isEditable: boolean;
  onChange: (val: string) => void;
}

const EditableTime: React.FC<EditableTimeProps> = ({ value, isEditable, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [timeText, setTimeText] = useState(value);

  useEffect(() => {
    setTimeText(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(timeText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  if (isEditing && isEditable) {
    return (
      <input
        type="text"
        autoFocus
        value={timeText}
        onChange={(e) => setTimeText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-center text-xs font-medium text-gray-700 mt-1 bg-white border border-blue-400 rounded px-1 py-0.5 focus:outline-none"
      />
    );
  }

  return (
    <div
      onClick={() => isEditable && setIsEditing(true)}
      className={`text-xs text-gray-500 mt-0.5 transition-colors ${
        isEditable ? 'hover:text-blue-600 hover:underline cursor-pointer' : ''
      }`}
      title={isEditable ? 'Click để sửa thời gian' : undefined}
    >
      {value}
    </div>
  );
};
