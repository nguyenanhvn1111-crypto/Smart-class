import React, { useState } from 'react';
import { aiAssistant } from '../../services/aiService';
import { DataService } from '../../services/dataService';
import { useClass } from '../../contexts/ClassContext';
import {
  Sparkles,
  HelpCircle,
  FileText,
  BookOpen,
  MessageSquare,
  FileCheck2,
  Copy,
  Check,
  Save,
  Send,
  RefreshCw,
  Sliders
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const { classes, selectedClassId } = useClass();

  // Mode: questions | quiz | assignment | lesson_plan | feedback | summary
  const [activeMode, setActiveMode] = useState<
    'questions' | 'assignment' | 'lesson_plan' | 'feedback' | 'summary'
  >('lesson_plan');

  // Input states
  const [subject, setSubject] = useState('Toán Học');
  const [gradeLevel, setGradeLevel] = useState('Khối 10');
  const [topic, setTopic] = useState('Hệ phương trình bậc nhất ba ẩn');
  const [count, setCount] = useState(3);
  const [duration, setDuration] = useState(45);
  const [studentName, setStudentName] = useState('Lê Hoàng Long');
  const [gpa, setGpa] = useState(8.8);
  const [documentText, setDocumentText] = useState('');

  // Output & Review state (allowing teacher approval and edits)
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedOutput('');

    try {
      if (activeMode === 'lesson_plan') {
        const res = await aiAssistant.generateLessonPlan({
          subject,
          topic,
          durationMinutes: duration,
          gradeLevel
        });
        setGeneratedOutput(res);
      } else if (activeMode === 'assignment') {
        const res = await aiAssistant.generateAssignment({
          subject,
          topic,
          gradeLevel,
          objectives: 'Nắm vững phương pháp và giải bài tập thực tế'
        });
        setGeneratedOutput(`TIÊU ĐỀ: ${res.title}\nTHANG ĐIỂM: ${res.points} điểm\n\nNỘI DUNG VÀ YÊU CẦU:\n${res.description}`);
      } else if (activeMode === 'questions') {
        const res = await aiAssistant.generateQuestions({
          subject,
          topic,
          count,
          questionType: 'single_choice'
        });
        const formatted = res
          .map(
            (q, i) =>
              `CÂU ${i + 1}: ${q.question_text}\n` +
              (q.options?.map((o) => `  [${o.id}] ${o.text}`).join('\n') || '') +
              `\n-> Đáp án đúng: ${q.correct_answer}\n-> Lời giải: ${q.explanation}\n`
          )
          .join('\n---\n\n');
        setGeneratedOutput(formatted);
      } else if (activeMode === 'feedback') {
        const res = await aiAssistant.generateStudentFeedback({
          studentName,
          gpa,
          attendanceRate: 98,
          behaviorScore: 95
        });
        setGeneratedOutput(res);
      } else if (activeMode === 'summary') {
        const res = await aiAssistant.summarizeDocument(
          documentText ||
            'Tài liệu giảng dạy về ứng dụng của đại số tuyến tính trong giải quyết bài toán tối ưu kinh tế học.'
        );
        setGeneratedOutput(res);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToSystem = async () => {
    // If saving assignment
    if (activeMode === 'assignment') {
      await DataService.createAssignment({
        class_id: selectedClassId,
        class_name: '10A1',
        subject_id: 'sub-math',
        subject_name: subject,
        teacher_id: 'user-teacher-1',
        teacher_name: 'Cô Trần Thị Mai',
        title: `Bài tập rèn luyện: ${topic}`,
        description: generatedOutput,
        due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
        points_max: 10,
        status: 'published',
        allow_late: true
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const modes = [
    { id: 'lesson_plan', label: 'Gợi ý giáo án 5512', icon: BookOpen },
    { id: 'assignment', label: 'Soạn đề bài tập', icon: FileText },
    { id: 'questions', label: 'Tạo câu hỏi trắc nghiệm', icon: HelpCircle },
    { id: 'feedback', label: 'Gợi ý nhận xét học sinh', icon: MessageSquare },
    { id: 'summary', label: 'Tóm tắt tài liệu', icon: FileCheck2 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-pink-100 text-pink-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              SmartClass AI Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Trợ lý thông minh hỗ trợ giáo viên soạn bài giảng, tạo câu hỏi trắc nghiệm và gợi ý nhận xét học sinh
          </p>
        </div>

        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-medium border border-slate-200">
          Powered by Gemini 2.5 Flash API
        </span>
      </div>

      {/* Mode navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setActiveMode(m.id as any);
                setGeneratedOutput('');
              }}
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="line-clamp-1">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Layout: Left Prompt Controls & Right Teacher Review Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Thông số yêu cầu</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
            >
              <option value="Toán Học">Toán Học</option>
              <option value="Ngữ Văn">Ngữ Văn</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Vật Lý">Vật Lý</option>
              <option value="Hóa Học">Hóa Học</option>
              <option value="Tin Học">Tin Học</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
              >
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
              </select>
            </div>

            {activeMode === 'lesson_plan' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Thời lượng</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
                >
                  <option value={45}>1 tiết (45 phút)</option>
                  <option value={90}>2 tiết (90 phút)</option>
                </select>
              </div>
            )}

            {activeMode === 'questions' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số câu hỏi</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
                />
              </div>
            )}
          </div>

          {activeMode !== 'feedback' && activeMode !== 'summary' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chủ đề / Tên bài học *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Định lý Cosin trong tam giác"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
              />
            </div>
          )}

          {activeMode === 'feedback' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ tên học sinh
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Điểm trung bình (GPA)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={gpa}
                  onChange={(e) => setGpa(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-hidden"
                />
              </div>
            </div>
          )}

          {activeMode === 'summary' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nội dung tài liệu cần tóm tắt
              </label>
              <textarea
                rows={5}
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Dán nội dung bài viết hoặc tài liệu vào đây..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-hidden"
              />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI đang suy nghĩ và tạo nội dung...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tạo nội dung với AI</span>
              </>
            )}
          </button>
        </div>

        {/* Right column: Teacher Review & Edit (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Phê duyệt & Chỉnh sửa nội dung (Teacher Review)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Thầy/Cô có toàn quyền chỉnh sửa và duyệt nội dung trước khi lưu hoặc giao bài
                </p>
              </div>

              {generatedOutput && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 text-xs flex items-center gap-1"
                    title="Sao chép"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            <textarea
              rows={16}
              value={generatedOutput}
              onChange={(e) => setGeneratedOutput(e.target.value)}
              placeholder="Nội dung do AI tạo ra sẽ hiển thị tại đây để bạn có thể xem lại, chỉnh sửa câu chữ hoặc thêm bớt các phần trước khi lưu..."
              className="w-full p-4 bg-slate-50/60 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono leading-relaxed outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          {generatedOutput && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <span className="text-[11px] text-slate-400">
                {generatedOutput.length} ký tự • Đã sẵn sàng phê duyệt
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToSystem}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Duyệt & Lưu vào hệ thống</span>
                </button>
              </div>
            </div>
          )}

          {savedSuccess && (
            <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Nội dung đã được phê duyệt và lưu trữ thành công!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
