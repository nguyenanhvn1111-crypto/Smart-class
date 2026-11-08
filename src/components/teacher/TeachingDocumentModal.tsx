import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LessonTopic, Question } from '../../types';
import { DataService } from '../../services/dataService';
import { MathRenderer } from '../common/MathRenderer';
import {
  FileText,
  Upload,
  Printer,
  Maximize2,
  Minimize2,
  Sparkles,
  Save,
  X,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  BookOpen,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  ChevronDown,
  Layers,
  Calendar,
  Volume2,
  Play,
  RotateCcw,
  Paperclip,
  Download,
  Share2,
  Zap,
  Target
} from 'lucide-react';

interface TeachingDocumentModalProps {
  topic: LessonTopic;
  allQuestions: Question[];
  isOpen: boolean;
  onClose: () => void;
  onTopicUpdated: (updatedTopic: LessonTopic) => void;
}

export const TeachingDocumentModal: React.FC<TeachingDocumentModalProps> = ({
  topic,
  allQuestions,
  isOpen,
  onClose,
  onTopicUpdated
}) => {
  const navigate = useNavigate();

  // Mode: 'word' (Soạn thảo văn bản A4) vs 'teaching' (Trình chiếu giảng dạy cho học sinh)
  const [viewMode, setViewMode] = useState<'word' | 'teaching'>('word');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lesson Plan Document Data
  const [title, setTitle] = useState(topic.title);
  const [content, setContent] = useState(topic.content);
  const [teacherNotes, setTeacherNotes] = useState(topic.teacher_notes || '');
  const [hideNotesForStudents, setHideNotesForStudents] = useState(true);
  const [attachments, setAttachments] = useState(topic.attachments || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Word Editor Formatting
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');
  const [fontSize, setFontSize] = useState<number>(16); // px
  const [activeTabSection, setActiveTabSection] = useState<'lesson' | 'questions' | 'notes'>('lesson');

  // Teaching Presentation Tools
  const [laserPointerActive, setLaserPointerActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [highlighterColor, setHighlighterColor] = useState<string | null>(null);

  // Classroom Countdown Timer
  const [timerMinutes, setTimerMinutes] = useState<number>(5);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showTimerWidget, setShowTimerWidget] = useState(false);

  // Question Showcase State (cho phép giáo viên phát vấn tại lớp)
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  // Upload modal / file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Auto-resize textarea so background stretches to 100% of the text with natural height
  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(160, textareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    resizeTextarea();
    const timer = setTimeout(resizeTextarea, 50);
    return () => clearTimeout(timer);
  }, [content, viewMode, fontSize, fontFamily, activeTabSection]);

  // Questions linked to this topic
  const linkedQuestions = allQuestions.filter((q) => topic.question_ids?.includes(q.id));

  // Sync state if topic prop changes
  useEffect(() => {
    setTitle(topic.title);
    setContent(topic.content);
    setTeacherNotes(topic.teacher_notes || '');
    setAttachments(topic.attachments || []);
  }, [topic]);

  // Laser pointer mouse move tracker
  useEffect(() => {
    if (!laserPointerActive) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [laserPointerActive]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Play alert sound if available
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch {
        // audio fail silent
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Save changes back to DataService
  const handleSaveDocument = async () => {
    setIsSaving(true);
    try {
      const updated = await DataService.updateLessonTopic(topic.id, {
        title,
        content,
        teacher_notes: teacherNotes,
        attachments
      });
      onTopicUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Không thể lưu giáo án: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsSaving(false);
    }
  };

  // Standard Lesson Plan Template (Mẫu KHBD 5512 Bộ GD&ĐT)
  const handleInsertTemplate = () => {
    if (
      content.trim().length > 50 &&
      !confirm('Nội dung hiện tại sẽ được cập nhật theo mẫu chuẩn KHBD 5512. Bạn có muốn tiếp tục?')
    ) {
      return;
    }

    const template = `I. MỤC TIÊU BÀI HỌC:
1. Kiến thức:
- Nắm vững các khái niệm, định lý và công thức trọng tâm của chủ đề: ${title}.
- Biết cách nhận diện các dạng toán/bài tập cơ bản và nâng cao liên quan.

2. Năng lực:
- Năng lực tư duy và lập luận toán học: giải thích các bước biến đổi logic.
- Năng lực giải quyết vấn đề: vận dụng kiến thức lý thuyết để giải quyết các tình huống thực tế.
- Năng lực tự học và làm việc nhóm trong các hoạt động thảo luận.

3. Phẩm chất:
- Rèn luyện tính cẩn thận, chính xác và kiên trì trong quá trình học tập.

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU:
- Giáo viên: Giáo án điện tử SmartClass, máy chiếu/smartboard, phiếu học tập, ngân hàng câu hỏi trắc nghiệm & tự luận.
- Học sinh: SGK, vở ghi, đồ dùng học tập, máy tính cầm tay.

III. TIẾN TRÌNH DẠY HỌC:
1. Hoạt động 1: Mở đầu & Khởi động (5 phút)
- GV đặt câu hỏi thực tế hoặc bài toán gợi mở tạo hứng thú học tập.
- HS thảo luận nhanh và đưa ra dự đoán ban đầu.

2. Hoạt động 2: Hình thành kiến thức mới (20 phút)
- Trọng tâm lý thuyết và định nghĩa chính xác.
- Giáo viên phân tích ví dụ mẫu và lưu ý các lỗi sai thường gặp.

3. Hoạt động 3: Luyện tập & Vận dụng (15 phút)
- Học sinh làm các câu hỏi trắc nghiệm và bài tập tự luận củng cố.
- Giáo viên phát vấn, gọi học sinh lên bảng và chốt kiến thức.

4. Hoạt động 4: Giao nhiệm vụ về nhà (5 phút)
- Hoàn thành bài tập về nhà được giao trên hệ thống SmartClass.
- Đọc trước nội dung buổi học tiếp theo.`;

    setContent(template);
    if (!teacherNotes) {
      setTeacherNotes(
        `- Lưu ý đặc biệt: Nhấn mạnh sự khác nhau giữa trường hợp a > 0 và a < 0.\n- Chuẩn bị 2 học sinh khá lên chữa câu tự luận khó.\n- Thời gian thảo luận nhóm tối đa 5 phút.`
      );
    }
  };

  // Upload file (txt, docx, md, pdf, images)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase();

    // If it's a text/markdown file, read its content directly into the document
    if (fileExt === 'txt' || fileExt === 'md') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setContent((prev) => (prev ? prev + '\n\n' + text : text));
          setUploadMessage(`Đã trích xuất nội dung từ tệp "${fileName}" thành công!`);
          setTimeout(() => setUploadMessage(null), 4000);
        }
      };
      reader.readAsText(file);
    } else {
      // For images, docx, pdf: add as attachment
      const newAttachment = {
        name: fileName,
        url: URL.createObjectURL(file),
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || fileExt
      };
      setAttachments((prev) => [...prev, newAttachment]);
      setUploadMessage(`Đã tải lên tệp đính kèm "${fileName}"!`);
      setTimeout(() => setUploadMessage(null), 4000);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Insert math snippet into content
  const insertSnippet = (snippet: string) => {
    setContent((prev) => prev + ' ' + snippet);
  };

  // Print document
  const handlePrint = () => {
    window.print();
  };

  // Toggle reveal question solution
  const toggleSolution = (qId: string) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-200"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.doc,.docx,.pdf,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Virtual Laser Pointer in Teaching Mode */}
      {laserPointerActive && viewMode === 'teaching' && (
        <div
          className="pointer-events-none fixed z-50 w-6 h-6 rounded-full bg-rose-500/80 shadow-[0_0_20px_6px_rgba(244,63,94,0.9)] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="w-2 h-2 rounded-full bg-white mx-auto my-2" />
        </div>
      )}

      {/* Top Application Bar */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {topic.class_name} • {topic.subject_name}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Tiết {topic.period_number || 1} • {new Date(topic.session_date).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white truncate max-w-md sm:max-w-xl">
              {title}
            </h2>
          </div>
        </div>

        {/* View Mode Switcher & Top Actions */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => {
                setViewMode('word');
                setLaserPointerActive(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'word'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trang Word / Soạn thảo</span>
            </button>

            <button
              onClick={() => setViewMode('teaching')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'teaching'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Chế độ Giảng dạy (Trình chiếu)</span>
            </button>
          </div>

          {/* Quick Create Assignment from this Topic */}
          <button
            onClick={() => navigate('/teacher/assignments/create-from-bank')}
            title="Tạo bài tập từ chủ đề này"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo bài tập từ chủ đề</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveDocument}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Đang lưu...' : saveSuccess ? 'Đã lưu!' : 'Lưu giáo án'}</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            title="In / Xuất PDF"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Success Notification Banner */}
      {uploadMessage && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{uploadMessage}</span>
          </div>
          <button onClick={() => setUploadMessage(null)} className="text-white/80 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ================= SECONDARY TOOLBAR ================= */}
      {viewMode === 'word' ? (
        // Word Format Ribbon Toolbar
        <div className="h-12 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3 overflow-x-auto shrink-0 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload nội dung / Giáo án</span>
            </button>

            {/* Template KHBD 5512 */}
            <button
              onClick={handleInsertTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold rounded-lg border border-purple-200 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Mẫu KHBD 5512 Bộ GD&ĐT</span>
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Font Style */}
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value as any)}
              className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="serif">Times New Roman (Chuẩn văn bản)</option>
              <option value="sans">Inter Sans (Hiện đại)</option>
              <option value="mono">Monospace (Lập trình/Công thức)</option>
            </select>

            {/* Font Size */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setFontSize(Math.max(13, fontSize - 1))}
                className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-white rounded cursor-pointer"
              >
                A-
              </button>
              <span className="text-[11px] font-bold px-1 text-slate-700">{fontSize}pt</span>
              <button
                onClick={() => setFontSize(Math.min(26, fontSize + 1))}
                className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-white rounded cursor-pointer"
              >
                A+
              </button>
            </div>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Quick Math formula snippets */}
            <div className="hidden xl:flex items-center gap-1">
              <span className="text-[11px] text-slate-400 font-medium">Chèn nhanh:</span>
              {['$\\Delta = b^2 - 4ac$', '$\\sqrt{x}$', '$\\frac{a}{b}$', '$\\le$', '$\\ge$', '$\\alpha$'].map(
                (snip) => (
                  <button
                    key={snip}
                    type="button"
                    onClick={() => insertSnippet(snip)}
                    className="px-2 py-0.5 bg-slate-50 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 text-[11px] font-mono"
                  >
                    {snip.replace(/\$/g, '')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTabSection('lesson')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTabSection === 'lesson'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Nội dung bài học
            </button>
            <button
              onClick={() => setActiveTabSection('questions')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTabSection === 'questions'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Ngân hàng câu hỏi ({linkedQuestions.length})
            </button>
            <button
              onClick={() => setActiveTabSection('notes')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTabSection === 'notes'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Ghi chú GV
            </button>
          </div>
        </div>
      ) : (
        // Teaching Presentation Toolbar
        <div className="h-14 bg-slate-900 text-white px-4 sm:px-6 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Đang trình chiếu lớp học</span>
            </span>

            {/* Virtual Laser Pointer Toggle */}
            <button
              onClick={() => setLaserPointerActive(!laserPointerActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                laserPointerActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-2 ring-rose-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{laserPointerActive ? 'Tắt Laser Pointer' : 'Bật Laser Pointer'}</span>
            </button>

            {/* Classroom Countdown Timer */}
            <button
              onClick={() => setShowTimerWidget(!showTimerWidget)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showTimerWidget || isTimerRunning
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                Đồng hồ thảo luận: {Math.floor(timerSecondsLeft / 60)}:
                {(timerSecondsLeft % 60).toString().padStart(2, '0')}
              </span>
            </button>

            {/* Teacher Notes Privacy Toggle */}
            <button
              onClick={() => setHideNotesForStudents(!hideNotesForStudents)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                hideNotesForStudents
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {hideNotesForStudents ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{hideNotesForStudents ? 'Đã ẩn ghi chú sư phạm' : 'Đang hiện ghi chú'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Cỡ chữ trình chiếu:</span>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="px-2 py-0.5 text-xs font-bold hover:bg-slate-700 rounded text-slate-200"
              >
                A-
              </button>
              <span className="px-2 text-xs font-bold text-amber-300">{fontSize + 4}pt</span>
              <button
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                className="px-2 py-0.5 text-xs font-bold hover:bg-slate-700 rounded text-slate-200"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Timer Control Widget */}
      {showTimerWidget && (
        <div className="bg-slate-950 text-white border border-slate-700 p-4 rounded-2xl shadow-2xl fixed top-32 right-8 z-40 w-72 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Bộ đếm giờ hoạt động lớp
            </span>
            <button
              onClick={() => setShowTimerWidget(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-center py-2">
            <span className="text-4xl font-mono font-black text-white tracking-wider">
              {Math.floor(timerSecondsLeft / 60)
                .toString()
                .padStart(2, '0')}
              :{(timerSecondsLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 3, 5, 10].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setTimerMinutes(mins);
                  setTimerSecondsLeft(mins * 60);
                  setIsTimerRunning(false);
                }}
                className={`py-1 rounded-lg text-xs font-bold ${
                  timerMinutes === mins ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mins}p
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md ${
                isTimerRunning
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isTimerRunning ? 'Tạm dừng' : 'Bắt đầu đếm'}</span>
            </button>

            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSecondsLeft(timerMinutes * 60);
              }}
              title="Đặt lại"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= MAIN DOCUMENT WORKSPACE ================= */}
      <main className="flex-1 overflow-y-auto bg-slate-200/90 p-4 sm:p-8 flex justify-center items-start print:bg-white print:p-0">
        <div
          className={`w-full max-w-4xl h-auto bg-white rounded-2xl shadow-2xl border border-slate-300 p-6 sm:p-12 pb-10 sm:pb-12 print:shadow-none print:border-none print:p-0 transition-all ${
            fontFamily === 'serif'
              ? 'font-serif'
              : fontFamily === 'mono'
              ? 'font-mono'
              : 'font-sans'
          }`}
          style={{
            boxSizing: 'border-box',
            height: 'auto',
            fontSize: `${viewMode === 'teaching' ? fontSize + 4 : fontSize}px`,
            lineHeight: viewMode === 'teaching' ? 1.8 : 1.7
          }}
        >
          {/* Header Quốc huy / Bộ GD&ĐT phong cách văn bản hành chính Việt Nam */}
            <div className="border-b-2 border-slate-800 pb-5 mb-8 text-xs leading-relaxed">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="font-bold uppercase tracking-wider block text-slate-900">
                    TRƯỜNG THPT CHUYÊN • TỔ BỘ MÔN
                  </span>
                  <span className="text-slate-600 font-semibold block">
                    KẾ HOẠCH BÀI DẠY (GIÁO ÁN ĐIỆN TỬ 4.0)
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900 block">
                    Môn: <span className="text-blue-700 uppercase">{topic.subject_name}</span>
                  </span>
                  <span className="text-slate-600 block">
                    Lớp: <span className="font-bold">{topic.class_name}</span> | Tiết: {topic.period_number || 1}
                  </span>
                  <span className="text-slate-500 text-[11px] block">
                    Ngày dạy: {new Date(topic.session_date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
                <span>Người soạn: <b>{topic.created_by_name || 'Giáo viên phụ trách'}</b></span>
                <span>Trạng thái: <b>{topic.status === 'ready' ? 'Đã hoàn thiện' : 'Bản nháp'}</b></span>
                <span>Mã giáo án: <b>{topic.id.toUpperCase()}</b></span>
              </div>
            </div>

            {/* Topic Title */}
            <div className="text-center my-6">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-700 block mb-1">
                CHỦ ĐỀ BÀI HỌC
              </span>
              {viewMode === 'word' ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className="w-full text-center text-xl sm:text-2xl font-black text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-hidden pb-1"
                  placeholder="Nhập tên chủ đề bài học..."
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {title}
                </h1>
              )}
            </div>

            {/* Attached Files List (nếu có) */}
            {attachments.length > 0 && (
              <div className="mb-6 p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 text-xs">
                <span className="font-bold text-blue-900 flex items-center gap-1.5 mb-2">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tài liệu & Tệp đính kèm bài giảng ({attachments.length}):</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      download={file.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>{file.name}</span>
                      <span className="text-[10px] text-slate-400">({file.size})</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 1: NỘI DUNG BÀI HỌC (MAIN BODY) */}
            {(activeTabSection === 'lesson' || viewMode === 'teaching') && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Nội dung bài học & Giáo án (tối đa 8.000 ký tự)</span>
                  <span className={`${content.length > 8000 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                    {content.length} / 8.000 ký tự
                  </span>
                </label>

                {viewMode === 'word' ? (
                  <div className="w-full h-auto bg-slate-50/70 hover:bg-slate-50 focus-within:bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 pb-8 transition-colors shadow-2xs">
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        if (textareaRef.current) {
                          textareaRef.current.style.height = 'auto';
                          textareaRef.current.style.height = `${Math.max(160, textareaRef.current.scrollHeight)}px`;
                        }
                      }}
                      placeholder="Soạn thảo nội dung giáo án, các bước lên lớp, công thức, bài tập ví dụ..."
                      className="w-full h-auto bg-transparent border-none outline-none focus:outline-hidden focus:ring-0 text-slate-900 leading-relaxed font-inherit whitespace-pre-wrap transition-none resize-none overflow-hidden block p-0"
                      style={{
                        boxSizing: 'border-box',
                        height: 'auto',
                        minHeight: '160px'
                      }}
                    />
                  </div>
                ) : (
                  // Teaching presentation render
                  <div className="w-full h-auto p-5 sm:p-6 pb-8 bg-slate-50/70 border border-slate-200 rounded-2xl text-slate-900 leading-relaxed font-inherit whitespace-pre-wrap transition-all shadow-2xs prose max-w-none">
                    {content ? (
                      <MathRenderer content={content} />
                    ) : (
                      <p className="text-slate-400 italic">Chưa có nội dung bài học.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: GHI CHÚ RIÊNG CỦA GIÁO VIÊN */}
            {(activeTabSection === 'notes' || (viewMode === 'teaching' && !hideNotesForStudents)) && (
              <div className="mt-8 pt-6 border-t-2 border-dashed border-amber-300/80 bg-amber-50/40 p-5 rounded-2xl border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-600" />
                    <span>Ghi chú sư phạm & Lưu ý riêng của Giáo viên</span>
                  </h3>
                  {viewMode === 'teaching' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200 text-amber-800">
                      Chỉ giáo viên nhìn thấy
                    </span>
                  )}
                </div>

                {viewMode === 'word' ? (
                  <textarea
                    value={teacherNotes}
                    onChange={(e) => setTeacherNotes(e.target.value)}
                    rows={6}
                    placeholder="Nhập ghi chú giảng dạy, các câu hỏi mẹo, học sinh cần lưu ý..."
                    className="w-full p-4 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 leading-relaxed"
                  />
                ) : (
                  <div className="text-xs text-amber-900 whitespace-pre-wrap font-sans">
                    {teacherNotes || 'Không có ghi chú thêm.'}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: NGÂN HÀNG CÂU HỎI LIÊN KẾT ĐỂ PHÁT VẤN TẠI LỚP */}
            {(activeTabSection === 'questions' || viewMode === 'teaching') && (
              <div className="mt-10 pt-6 border-t-2 border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-blue-600" />
                      <span>Hệ thống câu hỏi luyện tập & phát vấn tại lớp ({linkedQuestions.length} câu)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Câu hỏi trắc nghiệm & tự luận chuẩn hóa thuộc chủ đề để gọi học sinh trả lời trực tiếp.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/teacher/assignments/create-from-bank')}
                    className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs border border-blue-200 transition-colors"
                  >
                    Giao thành đề kiểm tra
                  </button>
                </div>

              {linkedQuestions.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl text-center border border-slate-200 text-xs text-slate-500">
                  Chủ đề này chưa liên kết câu hỏi nào từ ngân hàng. Giáo viên có thể bấm "Chỉnh sửa chủ đề" tại màn hình 111 để gắn thêm câu hỏi.
                </div>
              ) : (
                <div className="space-y-4">
                  {linkedQuestions.map((q, idx) => {
                    const isRevealed = revealedSolutions[q.id];

                    return (
                      <div
                        key={q.id}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs uppercase text-slate-600">
                              {q.question_type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'} •{' '}
                              {q.difficulty === 'nhan_biet'
                                ? 'Nhận biết'
                                : q.difficulty === 'thong_hieu'
                                ? 'Thông hiểu'
                                : q.difficulty === 'van_dung'
                                ? 'Vận dụng'
                                : 'Vận dụng cao'}
                            </span>
                          </div>

                          {/* Reveal Solution Button */}
                          <button
                            type="button"
                            onClick={() => toggleSolution(q.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isRevealed
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            }`}
                          >
                            {isRevealed ? 'Ẩn đáp án' : 'Hiện đáp án & Lời giải'}
                          </button>
                        </div>

                        {/* Question Content */}
                        <div className="font-semibold text-slate-900 leading-relaxed text-sm">
                          <MathRenderer content={q.question_text} />
                        </div>

                        {/* Options if MCQ */}
                        {q.question_type !== 'essay' && q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = isRevealed && opt.is_correct;
                              return (
                                <div
                                  key={opt.id || oIdx}
                                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-colors ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                      : 'bg-white border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  <span>{opt.text}</span>
                                  {isCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Revealed Explanation */}
                        {isRevealed && (
                          <div className="mt-3 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1 animate-in fade-in duration-150">
                            <span className="font-bold block text-emerald-900">
                              Lời giải chi tiết & Đáp án:
                            </span>
                            <div className="leading-relaxed">
                              {q.explanation ? (
                                <MathRenderer content={q.explanation} />
                              ) : (
                                'Đã kiểm duyệt theo ngân hàng câu hỏi chuẩn.'
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bottom Signature Section (Chuẩn văn bản sư phạm - hiển thị khi in) */}
          <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-700 hidden print:grid">
            <div>
              <span className="font-bold block uppercase">DUYỆT CỦA TỔ TRƯỞNG CHUYÊN MÔN</span>
              <span className="text-slate-400 italic block mt-1">(Ký và ghi rõ họ tên)</span>
              <div className="h-16" />
            </div>

            <div>
              <span className="font-bold block uppercase">GIÁO VIÊN SOẠN BÀI</span>
              <span className="text-slate-400 italic block mt-1">(Ký và ghi rõ họ tên)</span>
              <div className="h-16" />
              <span className="font-bold text-slate-900 block">{topic.created_by_name || 'Cô Trần Thị Mai'}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-9 px-6 bg-slate-950 text-slate-400 text-xs flex items-center justify-between border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-4 text-[11px]">
          <span>Chế độ: <b>{viewMode === 'word' ? 'Trang soạn thảo Word A4' : 'Trình chiếu giảng dạy'}</b></span>
          <span>Từ: <b>{content.trim() ? content.trim().split(/\s+/).length : 0} từ</b></span>
          <span>Ký tự: <b>{content.length}</b></span>
          <span>Tệp đính kèm: <b>{attachments.length}</b></span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span>Phím tắt: F11 (Toàn màn hình) • Ctrl + P (In giáo án)</span>
        </div>
      </footer>
    </div>
  );
};
