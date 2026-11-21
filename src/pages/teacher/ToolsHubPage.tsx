import React, { useState, useEffect, useRef } from 'react';
import { useClass } from '../../contexts/ClassContext';
import { DataService } from '../../services/dataService';
import { Student } from '../../types';
import confetti from 'canvas-confetti';
import {
  Dices,
  CircleDot,
  Users,
  Timer,
  Award,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  Shuffle,
  History,
  CheckCircle2,
  Flame,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export const ToolsHubPage: React.FC = () => {
  const { classes, selectedClassId, setSelectedClassId } = useClass();

  // Active Tool: wheel | random | groups | timer | quick_quiz
  const [activeTool, setActiveTool] = useState<'wheel' | 'random' | 'groups' | 'timer' | 'quick_quiz'>('wheel');

  const [students, setStudents] = useState<Student[]>([]);
  const [calledHistory, setCalledHistory] = useState<string[]>([]);
  const [excludeCalled, setExcludeCalled] = useState(true);

  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelWinner, setWheelWinner] = useState<string | null>(null);

  // Random picker state
  const [randomWinner, setRandomWinner] = useState<Student | null>(null);

  // Group generator state
  const [groupMode, setGroupMode] = useState<'by_count' | 'by_size'>('by_count');
  const [groupCount, setGroupCount] = useState(4);
  const [generatedGroups, setGeneratedGroups] = useState<{ id: number; members: Student[] }[]>([]);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins
  const [initialSeconds, setInitialSeconds] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  useEffect(() => {
    DataService.getStudents(selectedClassId).then((stus) => {
      setStudents(stus);
    });
  }, [selectedClassId]);

  // TIMER EFFECT
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            // Play confetti celebration when time's up
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const handleStartTimer = (secs: number) => {
    setIsTimerRunning(false);
    setTimerSeconds(secs);
    setInitialSeconds(secs);
  };

  // WHEEL SPIN
  const handleSpinWheel = () => {
    if (isSpinning) return;
    const pool = excludeCalled
      ? students.filter((s) => !calledHistory.includes(s.id))
      : students;

    if (pool.length === 0) {
      showNotice('Tất cả học sinh trong danh sách đã được gọi! Vui lòng đặt lại lịch sử.');
      return;
    }

    setIsSpinning(true);
    setWheelWinner(null);

    setTimeout(() => {
      const selected = pool[Math.floor(Math.random() * pool.length)];
      setWheelWinner(selected.full_name);
      setCalledHistory((prev) => [...prev, selected.id]);
      setIsSpinning(false);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }, 2500);
  };

  // RANDOM PICKER
  const handlePickRandom = () => {
    const pool = excludeCalled
      ? students.filter((s) => !calledHistory.includes(s.id))
      : students;

    if (pool.length === 0) {
      showNotice('Tất cả học sinh trong danh sách đã được gọi! Vui lòng xóa lịch sử để quay tiếp.');
      return;
    }

    const selected = pool[Math.floor(Math.random() * pool.length)];
    setRandomWinner(selected);
    setCalledHistory((prev) => [...prev, selected.id]);
    confetti({ particleCount: 80, spread: 60 });
  };

  // GROUP GENERATOR
  const handleGenerateGroups = () => {
    if (students.length === 0) {
      showNotice('Lớp hiện chưa có danh sách học sinh để chia nhóm.');
      return;
    }
    const safeInput = Math.max(1, Math.min(20, Math.floor(Number(groupCount)) || 2));
    if (safeInput !== groupCount) setGroupCount(safeInput);

    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const count = Math.max(
      1,
      groupMode === 'by_count' ? Math.min(safeInput, students.length) : Math.ceil(students.length / safeInput)
    );
    const groups: { id: number; members: Student[] }[] = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      members: []
    }));

    shuffled.forEach((stu, index) => {
      groups[index % count].members.push(stu);
    });

    setGeneratedGroups(groups);
  };

  // Format timer MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Hộp Công cụ Lớp học (Tools Hub)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Các tiện ích tương tác trực quan: Vòng quay may mắn, gọi tên ngẫu nhiên, chia nhóm và đồng hồ đếm ngược
          </p>
        </div>

        {/* Class selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lớp:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-transparent outline-hidden cursor-pointer"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id} className="dark:bg-slate-900 dark:text-slate-100">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {noticeMessage && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setNoticeMessage(null)}
            className="text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Tool switcher cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTool('wheel')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTool === 'wheel'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 border-blue-600'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <CircleDot className="w-6 h-6 mb-2" />
          <h3 className="text-sm font-bold">Vòng quay may mắn</h3>
          <p className="text-[11px] opacity-80 mt-0.5">Quay chọn học sinh trả lời</p>
        </button>

        <button
          onClick={() => setActiveTool('random')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTool === 'random'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 border-purple-600'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <Shuffle className="w-6 h-6 mb-2" />
          <h3 className="text-sm font-bold">Chọn ngẫu nhiên</h3>
          <p className="text-[11px] opacity-80 mt-0.5">Bốc thăm không trùng lặp</p>
        </button>

        <button
          onClick={() => setActiveTool('groups')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTool === 'groups'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 border-emerald-600'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <Users className="w-6 h-6 mb-2" />
          <h3 className="text-sm font-bold">Chia nhóm tự động</h3>
          <p className="text-[11px] opacity-80 mt-0.5">Phân chia nhóm thảo luận</p>
        </button>

        <button
          onClick={() => setActiveTool('timer')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTool === 'timer'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 border-amber-600'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <Timer className="w-6 h-6 mb-2" />
          <h3 className="text-sm font-bold">Đồng hồ lớp học</h3>
          <p className="text-[11px] opacity-80 mt-0.5">Đếm ngược bài tập & thuyết trình</p>
        </button>
      </div>

      {/* TOOL 1: LUCKY WHEEL */}
      {activeTool === 'wheel' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
              {/* Outer decorative ring */}
              <div
                className={`w-full h-full rounded-full border-8 border-dashed border-blue-500 flex items-center justify-center transition-transform duration-2500 ease-out ${
                  isSpinning ? 'rotate-[1440deg]' : ''
                }`}
              >
                <div className="w-48 h-48 rounded-full bg-linear-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl">
                  <Flame className="w-16 h-16 animate-pulse" />
                </div>
              </div>
              {/* Center pointer */}
              <div className="absolute -top-3 w-6 h-6 bg-rose-500 rotate-45 rounded-sm shadow-md" />
            </div>

            {/* Winner result */}
            {wheelWinner && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-in zoom-in duration-300">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Người được chọn
                </span>
                <span className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1 block">
                  {wheelWinner} 🎉
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleSpinWheel}
                disabled={isSpinning}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSpinning ? 'Đang quay...' : 'Quay bánh xe'}
              </button>
            </div>

            {/* Options */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={excludeCalled}
                  onChange={(e) => setExcludeCalled(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded-sm"
                />
                <span>Loại bỏ học sinh đã gọi khỏi lượt tiếp</span>
              </label>
              <button
                onClick={() => setCalledHistory([])}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Đặt lại danh sách ({calledHistory.length} đã gọi)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 2: RANDOM PICKER */}
      {activeTool === 'random' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center min-h-[420px]">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto ring-8 ring-purple-50/50 dark:ring-purple-950/30">
              <Shuffle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Bốc thăm học sinh ngẫu nhiên</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lựa chọn công bằng, không lặp lại học sinh trong cùng tiết học
              </p>
            </div>

            {randomWinner && (
              <div className="p-6 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-3xl animate-in zoom-in duration-300">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  Học sinh may mắn
                </span>
                <span className="text-3xl font-extrabold text-purple-900 dark:text-purple-100 mt-1 block">
                  {randomWinner.full_name}
                </span>
                <span className="text-xs text-purple-700/80 dark:text-purple-300 font-mono mt-1 block">
                  Mã số: {randomWinner.student_code}
                </span>
              </div>
            )}

            <button
              onClick={handlePickRandom}
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-500/30 transition-all cursor-pointer"
            >
              Chọn ngẫu nhiên 1 bạn
            </button>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>Đã gọi: {calledHistory.length}/{students.length} học sinh</span>
              <button
                onClick={() => setCalledHistory([])}
                className="text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
              >
                Xóa lịch sử
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOL 3: GROUP GENERATOR */}
      {activeTool === 'groups' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Chia nhóm học tập tự động</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xáo trộn ngẫu nhiên danh sách {students.length} học sinh vào các nhóm đều nhau
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Số lượng nhóm:</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                  className="w-16 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-center font-bold"
                />
              </div>

              <button
                onClick={handleGenerateGroups}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>Chia nhóm ngay</span>
              </button>
            </div>
          </div>

          {generatedGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {generatedGroups.map((grp) => (
                <div
                  key={grp.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Nhóm {grp.id}</span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      {grp.members.length} thành viên
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {grp.members.map((m, i) => (
                      <li key={m.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 font-mono w-4">{i + 1}.</span>
                        <span className="font-medium">{m.full_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nhấn nút "Chia nhóm ngay" để tạo danh sách nhóm ngẫu nhiên
            </div>
          )}
        </div>
      )}

      {/* TOOL 4: COUNTDOWN TIMER */}
      {activeTool === 'timer' && (
        <div
          className={`rounded-3xl p-6 sm:p-12 border shadow-xs flex flex-col items-center justify-center ${
            isFullscreen
              ? 'fixed inset-0 z-50 rounded-none bg-slate-950 border-slate-800 text-white'
              : 'min-h-[460px] bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isFullscreen ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Toàn màn hình"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Huge Time Display */}
            <div
              className={`font-mono text-6xl sm:text-7xl font-extrabold tracking-wider select-none ${
                isFullscreen ? 'text-white' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {formatTime(timerSeconds)}
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[60, 180, 300, 600, 900].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStartTimer(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    initialSeconds === s
                      ? 'bg-amber-600 text-white'
                      : isFullscreen
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {s / 60} phút
                </button>
              ))}
            </div>

            {/* Play/Pause controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-4 rounded-full text-white shadow-xl transition-all active:scale-95 cursor-pointer ${
                  isTimerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isTimerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(initialSeconds);
                }}
                className={`p-4 rounded-full transition-all cursor-pointer ${
                  isFullscreen
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title="Đặt lại"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
