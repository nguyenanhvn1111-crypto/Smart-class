import React, { useState } from 'react';
import { Question, QuestionType, QuestionDifficulty } from '../../../types';
import { MathRenderer } from '../../../components/common/MathRenderer';
import { aiAssistant } from '../../../services/aiService';
import {
  Sparkles,
  FileText,
  Upload,
  Globe,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Sliders,
  CheckSquare,
  Square,
  Edit2,
  AlertCircle,
  HelpCircle,
  Layers,
  BookOpen,
  Camera,
  Link as LinkIcon,
  Check,
  Plus
} from 'lucide-react';

interface TabAIQuestionsProps {
  onSaveQuestions: (questions: Partial<Question>[]) => Promise<void>;
  onViewRepository: () => void;
  defaultSubject?: string;
  defaultGrade?: string;
}

export const TabAIQuestions: React.FC<TabAIQuestionsProps> = ({
  onSaveQuestions,
  onViewRepository,
  defaultSubject = 'Toán Học',
  defaultGrade = 'Khối 10'
}) => {
  // 4 AI Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'document' | 'web' | 'image'>('text');

  // Input states
  const [textContent, setTextContent] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFileName, setDocFileName] = useState('');
  const [docExtractedText, setDocExtractedText] = useState('');

  const [webUrl, setWebUrl] = useState('');
  const [webScrapedSummary, setWebScrapedSummary] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [imageOcrText, setImageOcrText] = useState('');

  // AI Configuration Parameters
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState(defaultGrade);
  const [count, setCount] = useState(4);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'single_choice',
    'multiple_choice',
    'true_false'
  ]);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('thong_hieu');

  // Execution state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<Partial<Question>[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Sample templates for quick test
  const sampleLessons = [
    {
      title: 'Toán: Định lý Pytago & Hệ thức lượng',
      subject: 'Toán Học',
      grade: 'Khối 10',
      text: 'Trong tam giác vuông ABC vuông tại A, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông: a^2 = b^2 + c^2. Đường cao AH kẻ từ A thỏa mãn hệ thức: h^2 = b\' * c\' và a * h = b * c. Tỉ số lượng giác: sinB = b/a, cosB = c/a, tanB = b/c, cotB = c/b.'
    },
    {
      title: 'Sinh: Quang hợp ở thực vật',
      subject: 'Sinh Học',
      grade: 'Khối 10',
      text: 'Quang hợp là quá trình sử dụng năng lượng ánh sáng mặt trời đã được diệp lục hấp thụ để tổng hợp cacbohidrat và giải phóng oxi từ khí CO2 và H2O. Phương trình tổng quát: 6CO2 + 12H2O -> C6H12O6 + 6O2 + 6H2O. Quá trình quang hợp diễn ra tại lục lạp, gồm pha sáng ở tilacoit và pha tối ở chất nền stroma.'
    },
    {
      title: 'Sử: Phong trào Cần Vương (1885 - 1896)',
      subject: 'Lịch Sử',
      grade: 'Khối 11',
      text: 'Sau cuộc phản công tại kinh thành Huế thất bại (7/1885), Tôn Thất Thuyết rước vua Hàm Nghi ra sơn phòng Tân Sở (Quảng Trị). Ngày 13/7/1885, nhân danh vua Hàm Nghi, Tôn Thất Thuyết hạ chiếu Cần Vương, kêu gọi văn thân, sĩ phu và nhân dân cả nước đứng lên giúp vua cứu nước. Phong trào trải qua 2 giai đoạn: 1885-1888 và 1888-1896.'
    },
    {
      title: 'Vật Lý: Định luật Ôm cho đoạn mạch',
      subject: 'Vật Lý',
      grade: 'Khối 10',
      text: 'Cường độ dòng điện chạy qua một đoạn mạch tỉ lệ thuận với hiệu điện thế giữa hai đầu đoạn mạch và tỉ lệ nghịch với điện trở của đoạn mạch đó: I = U / R. Trong đó I tính bằng Ampe (A), U tính bằng Vôn (V), R tính bằng Ôm (Omega). Đoạn mạch mắc nối tiếp có R_td = R1 + R2, đoạn mạch mắc song song có 1/R_td = 1/R1 + 1/R2.'
    }
  ];

  // Quick select a sample lesson
  const applySampleLesson = (sample: (typeof sampleLessons)[0]) => {
    setTextContent(sample.text);
    setSubject(sample.subject);
    setGrade(sample.grade);
  };

  // Handle Document upload (PDF / Word)
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setDocFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const raw = evt.target?.result as string;
      setDocExtractedText(
        `[Nội dung trích xuất từ ${file.name}]\n` +
          (raw.slice(0, 500) ||
            'Tài liệu về chuyên đề khảo sát hàm số, cực trị hàm số bậc ba và bài toán tiệm cận đồ thị hàm số theo chuẩn SGK mới.')
      );
    };
    reader.readAsText(file);
  };

  // Quick select sample document
  const applySampleDoc = (docType: 'toan' | 'hoa') => {
    if (docType === 'toan') {
      setDocFileName('Giao_an_Toan_10_Hinh_Hoc_Vecto.docx');
      setDocExtractedText(
        'CHUYÊN ĐỀ HỆ TỌA ĐỘ VÀ VECTƠ TRONG MẶT PHẲNG OXY.\n1. Vectơ là đoạn thẳng có hướng. Hai vectơ cùng phương khi giá của chúng song song hoặc trùng nhau.\n2. Tọa độ của điểm và vectơ: u = (x; y) <=> u = x*i + y*j. Tích vô hướng: u . v = |u| * |v| * cos(u, v) = x1*x2 + y1*y2.\n3. Ứng dụng tích vô hướng để tính góc và chứng minh tính vuông góc.'
      );
      setSubject('Toán Học');
    } else {
      setDocFileName('Tai_lieu_Hoa_10_Bang_Tuan_Hoan.pdf');
      setDocExtractedText(
        'CHUYÊN ĐỀ BẢNG TUẦN HOÀN CÁC NGUYÊN TỐ HÓA HỌC.\n- Bảng tuần hoàn gồm các ô nguyên tố, 7 chu kỳ và 8 nhóm A, 8 nhóm B.\n- Nguyên tắc sắp xếp: Theo chiều tăng dần của điện tích hạt nhân nguyên tử.\n- Quy luật biến đổi tuần hoàn: Trong cùng một chu kỳ từ trái sang phải, bán kính nguyên tử giảm dần, độ âm điện tăng dần, tính kim loại giảm và tính phi kim tăng.'
      );
      setSubject('Hóa Học');
    }
  };

  // Scrape Web URL simulation
  const handleScrapeWeb = () => {
    if (!webUrl.trim()) {
      alert('Vui lòng nhập đường link trang web hợp lệ!');
      return;
    }
    setWebScrapedSummary(
      `[Trích xuất từ ${webUrl}]\nChuyên đề giáo dục trực tuyến: Tổng hợp các dạng bài toán về định lý cosin và định lý sin trong tam giác. Các công thức tính diện tích tam giác: S = 1/2*a*h_a = 1/2*a*b*sinC = abc/(4R) = p*r = căn(p(p-a)(p-b)(p-c)). Công thức độ dài đường trung tuyến.`
    );
  };

  // Handle Image upload & OCR
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);

    // Simulated OCR
    setImageOcrText(
      `[AI OCR Nhận diện từ ảnh ${file.name}]\nCâu 1. Cho hàm số y = ax^2 + bx + c có đồ thị như hình vẽ. Xác định dấu của các hệ số a, b, c.\nCâu 2. Tìm giá trị lớn nhất và nhỏ nhất của hàm số trên đoạn [-1; 3].`
    );
  };

  // Sample images for testing OCR
  const applySampleImage = () => {
    setImagePreviewUrl('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80');
    setImageOcrText(
      `[AI OCR Nhận diện từ ảnh Bài tập Toán học]\nĐề bài: Giải phương trình lượng giác: 2*sin(x) - căn(3) = 0.\nA. x = pi/3 + k2pi hoặc x = 2pi/3 + k2pi\nB. x = pi/6 + k2pi\nC. x = -pi/3 + k2pi\nD. Vô nghiệm.`
    );
    setSubject('Toán Học');
  };

  // Toggle type checkbox
  const toggleType = (t: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter((item) => item !== t) : prev) : [...prev, t]
    );
  };

  // Execute AI Generation
  const handleGenerate = async () => {
    let sourceContent = '';
    let sourceName = '';

    if (activeSubTab === 'text') {
      sourceContent = textContent;
      sourceName = 'Văn bản giáo án nhập tay';
    } else if (activeSubTab === 'document') {
      sourceContent = docExtractedText;
      sourceName = `Tệp tài liệu: ${docFileName || 'PDF/Word'}`;
    } else if (activeSubTab === 'web') {
      sourceContent = webScrapedSummary || webUrl;
      sourceName = `Trang web: ${webUrl}`;
    } else {
      sourceContent = imageOcrText;
      sourceName = `Ảnh đề thi (OCR): ${imageFile?.name || 'Ảnh đề'}`;
    }

    if (!sourceContent.trim()) {
      alert('Vui lòng nhập nội dung, tải tài liệu hoặc quét ảnh trước khi yêu cầu AI tạo câu hỏi!');
      return;
    }

    setIsGenerating(true);
    setProgress(15);
    setIsSavedSuccess(false);

    const timer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 15 : p));
    }, 350);

    try {
      // Call AI Assistant
      const generatedList = await aiAssistant.generateQuestions({
        subject,
        topic: sourceContent.slice(0, 1000),
        count,
        questionType: selectedTypes[0] || 'single_choice',
        difficulty: difficulty === 'nhan_biet' ? 'easy' : difficulty === 'van_dung_cao' ? 'hard' : 'medium'
      });

      clearInterval(timer);
      setProgress(100);

      // Enhance questions with metadata
      const enriched: Partial<Question>[] = generatedList.map((q, idx) => {
        const assignedType = selectedTypes[idx % selectedTypes.length] || 'single_choice';
        return {
          code: `AI-${subject.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${idx + 1}`,
          question_text: q.question_text || `Câu hỏi AI ${idx + 1} về chủ đề ${subject}`,
          question_type: assignedType,
          difficulty: difficulty,
          subject_name: subject,
          grade_name: grade,
          options:
            q.options && q.options.length > 0
              ? q.options
              : [
                  { id: 'A', text: 'Phương án A chuẩn kiến thức' },
                  { id: 'B', text: 'Phương án B nhiễu hợp lý' },
                  { id: 'C', text: 'Phương án C' },
                  { id: 'D', text: 'Phương án D' }
                ],
          correct_answer: q.correct_answer || 'A',
          explanation: q.explanation || 'Lời giải chi tiết được tạo tự động bởi mô hình AI sư phạm.',
          points: 1.0,
          status: 'pending_review',
          source_type: 'ai_generated',
          source_ref: sourceName,
          // Rubric for essay if assigned
          rubric:
            assignedType === 'essay'
              ? [
                  { id: 'rb1', criteria: 'Hiểu đúng yêu cầu bài toán', max_points: 0.5, description: 'Trình bày rõ ràng' },
                  { id: 'rb2', criteria: 'Các bước lập luận logic', max_points: 0.5, description: 'Tính toán chính xác' }
                ]
              : undefined,
          // Statements for true/false
          statements:
            assignedType === 'true_false'
              ? [
                  { id: 'st1', text: 'Mệnh đề khẳng định lý thuyết', is_correct: true },
                  { id: 'st2', text: 'Mệnh đề liên hệ thực tiễn mở rộng', is_correct: false },
                  { id: 'st3', text: 'Hệ quả toán học suy ra từ công thức', is_correct: true },
                  { id: 'st4', text: 'Trường hợp đặc biệt ngoại lệ', is_correct: false }
                ]
              : undefined,
          // Blanks for fill_blank
          blanks:
            assignedType === 'fill_blank'
              ? [{ id: 'blank1', label: 'Ô trống 1', accepted_answers: ['định lý', 'dinh ly'] }]
              : undefined
        };
      });

      setGeneratedQuestions(enriched);
      setSelectedIndices(enriched.map((_, i) => i));
    } catch (err) {
      clearInterval(timer);
      alert('Không thể tạo câu hỏi từ nguồn này. Vui lòng thử lại với nội dung rõ ràng hơn!');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle select
  const toggleSelect = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === generatedQuestions.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(generatedQuestions.map((_, i) => i));
    }
  };

  // Save approved questions
  const handleSaveApproved = async () => {
    const toSave = generatedQuestions.filter((_, idx) => selectedIndices.includes(idx));
    if (toSave.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi để lưu vào Ngân hàng!');
      return;
    }

    try {
      await onSaveQuestions(toSave);
      setSavedCount(toSave.length);
      setIsSavedSuccess(true);
      setGeneratedQuestions([]);
    } catch (e) {
      alert('Có lỗi xảy ra khi lưu câu hỏi vào hệ thống!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Tạo câu hỏi bằng AI Thông Minh từ Đa Nguồn Học Liệu
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Phân tích giáo án, trích xuất file PDF/Word, quét bài viết từ website hoặc nhận diện đề thi qua hình ảnh (OCR) để sinh câu hỏi bám sát chuẩn kiến thức Bộ GD&ĐT.
            </p>
          </div>
        </div>
      </div>

      {/* 4 AI Sub-tabs Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveSubTab('text')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              activeSubTab === 'text'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tab 1: Nhập văn bản giáo án</span>
          </button>

          <button
            onClick={() => setActiveSubTab('document')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              activeSubTab === 'document'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Tab 2: Nhập file PDF / Word</span>
          </button>

          <button
            onClick={() => setActiveSubTab('web')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              activeSubTab === 'web'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Tab 3: Nhập link Web</span>
          </button>

          <button
            onClick={() => setActiveSubTab('image')}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
              activeSubTab === 'image'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Tab 4: Nhập ảnh (OCR)</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout: Input Source on Left, Configuration on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Sub-tab Input */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          {/* Sub-tab 1: Nhập văn bản */}
          {activeSubTab === 'text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Nội dung bài giảng / Giáo án / Giáo trình
                </label>
                <span className="text-xs text-gray-400">{textContent.length} ký tự</span>
              </div>

              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={9}
                placeholder="Dán hoặc nhập nội dung bài học, định nghĩa, định lý, công thức hoặc các ý chính cần kiểm tra vào đây..."
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all placeholder:text-gray-400"
              />

              {/* Sample Lesson Templates */}
              <div>
                <span className="text-xs font-semibold text-gray-500 block mb-2">
                  Hoặc nạp nhanh bài giảng mẫu để thử nghiệm:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleLessons.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applySampleLesson(sample)}
                      className="px-2.5 py-1.5 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Nhập file PDF / Word */}
          {activeSubTab === 'document' && (
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-600" />
                Tải lên tệp tài liệu (PDF, Word DOCX/DOC)
              </label>

              <div className="border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-2xl p-6 text-center bg-gray-50/50">
                <input
                  type="file"
                  id="doc-upload"
                  accept=".pdf, .docx, .doc, .txt"
                  onChange={handleDocUpload}
                  className="hidden"
                />
                <label htmlFor="doc-upload" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {docFileName ? (
                      <span className="text-purple-600">{docFileName}</span>
                    ) : (
                      'Bấm để tải tệp PDF hoặc Word từ máy tính'
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Định dạng hỗ trợ: .pdf, .docx, .doc, .txt</p>
                </label>
              </div>

              {/* Quick sample docs */}
              <div>
                <span className="text-xs font-semibold text-gray-500 block mb-2">
                  Hoặc dùng tệp tài liệu mẫu tích hợp sẵn:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applySampleDoc('toan')}
                    className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors font-medium flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Tài liệu Toán 10: Véctơ (.docx)
                  </button>
                  <button
                    type="button"
                    onClick={() => applySampleDoc('hoa')}
                    className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors font-medium flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Tài liệu Hóa 10: Bảng tuần hoàn (.pdf)
                  </button>
                </div>
              </div>

              {/* Extracted text preview */}
              {docExtractedText && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs text-gray-700 max-h-40 overflow-y-auto font-mono">
                  <div className="font-bold text-gray-800 mb-1">Nội dung trích xuất từ tài liệu:</div>
                  {docExtractedText}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 3: Nhập link trang web */}
          {activeSubTab === 'web' && (
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-600" />
                Đường dẫn liên kết trang web (URL bài giảng / tư liệu)
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    placeholder="https://vietjack.com/toan-10/ly-thuyet-he-thuc-luong.jsp"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleScrapeWeb}
                  className="px-4 py-2.5 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Globe className="w-4 h-4" />
                  <span>Thu thập nội dung</span>
                </button>
              </div>

              {/* Suggested educational links */}
              <div>
                <span className="text-xs font-semibold text-gray-500 block mb-2">
                  Gợi ý liên kết bài học trực tuyến:
                </span>
                <div className="space-y-1.5">
                  {[
                    {
                      label: 'Vietjack - Hệ thức lượng trong tam giác',
                      url: 'https://vietjack.com/toan-10/he-thuc-luong-tam-giac.jsp'
                    },
                    {
                      label: 'Hocmai - Quang hợp và hô hấp ở thực vật',
                      url: 'https://hocmai.vn/sinh-hoc-10/quang-hop-thuc-vat.html'
                    },
                    {
                      label: 'Violet - Phong trào Cần Vương cuối thế kỷ XIX',
                      url: 'https://baigiang.violet.vn/lich-su-11/can-vuong.html'
                    }
                  ].map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setWebUrl(item.url);
                        handleScrapeWeb();
                      }}
                      className="w-full text-left px-3 py-2 text-xs bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 border border-gray-200 rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className="text-[11px] text-gray-400 truncate max-w-xs">{item.url}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scraped summary */}
              {webScrapedSummary && (
                <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-200 text-xs text-gray-800">
                  <div className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    Đã trích xuất nội dung từ trang web:
                  </div>
                  <p className="text-gray-600 line-clamp-3">{webScrapedSummary}</p>
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 4: Nhập ảnh (OCR) */}
          {activeSubTab === 'image' && (
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-600" />
                Tải lên ảnh đề thi / bài tập (OCR nhận diện tự động)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload box */}
                <div className="border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-2xl p-6 text-center bg-gray-50/50 flex flex-col justify-center">
                  <input
                    type="file"
                    id="img-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="img-upload" className="cursor-pointer block">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-2">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800">
                      Chọn ảnh chụp đề từ sách hoặc viết tay
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">Hỗ trợ PNG, JPG, JPEG, WEBP</p>
                  </label>
                  <button
                    type="button"
                    onClick={applySampleImage}
                    className="mt-3 mx-auto px-3 py-1.5 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg font-medium transition-colors"
                  >
                    Dùng ảnh bài tập mẫu
                  </button>
                </div>

                {/* Preview Image */}
                <div className="bg-gray-100 rounded-2xl p-2 border border-gray-200 flex items-center justify-center min-h-[160px] overflow-hidden">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded preview"
                      className="max-h-40 rounded-xl object-contain shadow-sm"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 italic">Chưa có ảnh nào được chọn</span>
                  )}
                </div>
              </div>

              {/* OCR Output */}
              {imageOcrText && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 text-xs text-gray-800">
                  <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Văn bản nhận diện qua OCR:
                  </div>
                  <pre className="font-sans text-gray-700 whitespace-pre-wrap">{imageOcrText}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): AI Generator Configuration */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
            <Sliders className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-gray-900">Thiết lập cấu hình AI</h3>
          </div>

          {/* Subject & Grade */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Môn học</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium text-gray-800"
              >
                <option value="Toán Học">Toán Học</option>
                <option value="Vật Lý">Vật Lý</option>
                <option value="Hóa Học">Hóa Học</option>
                <option value="Sinh Học">Sinh Học</option>
                <option value="Ngữ Văn">Ngữ Văn</option>
                <option value="Lịch Sử">Lịch Sử</option>
                <option value="Địa Lý">Địa Lý</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Tin Học">Tin Học</option>
                <option value="GDCD">GDCD</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Khối lớp</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium text-gray-800"
              >
                <option value="Khối 6">Khối 6</option>
                <option value="Khối 7">Khối 7</option>
                <option value="Khối 8">Khối 8</option>
                <option value="Khối 9">Khối 9</option>
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Số lượng câu cần sinh</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 4, 6, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      count === num
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {num} câu
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Mức độ nhận thức</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-800 font-medium"
              >
                <option value="nhan_biet">Nhận biết (Cơ bản)</option>
                <option value="thong_hieu">Thông hiểu (Vận dụng định lý)</option>
                <option value="van_dung">Vận dụng (Giải quyết bài toán)</option>
                <option value="van_dung_cao">Vận dụng cao (Phân loại giỏi)</option>
              </select>
            </div>

            {/* Question types selection */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Các dạng câu hỏi mong muốn
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { id: 'single_choice' as QuestionType, label: 'Trắc nghiệm 1 đáp án' },
                  { id: 'multiple_choice' as QuestionType, label: 'Nhiều đáp án đúng' },
                  { id: 'true_false' as QuestionType, label: 'Đúng / Sai theo ý' },
                  { id: 'essay' as QuestionType, label: 'Tự luận có thang điểm' },
                  { id: 'fill_blank' as QuestionType, label: 'Điền khuyết từ' }
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(item.id)}
                      onChange={() => toggleType(item.id)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span className="text-gray-800">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI đang phân tích ({progress}%)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Bắt đầu tạo câu hỏi bằng AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {isSavedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-emerald-900">
                Đã thêm {savedCount} câu hỏi AI vào Ngân hàng!
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Các câu hỏi đã sẵn sàng trong kho dữ liệu để sử dụng cho bài tập và đề kiểm tra.
              </p>
            </div>
          </div>
          <button
            onClick={onViewRepository}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Xem trong Kho câu hỏi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Generated Results Review */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Kết quả do AI đề xuất ({generatedQuestions.length} câu)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Giáo viên kiểm tra tính sư phạm, chỉnh sửa nội dung nếu cần và chọn các câu đạt chuẩn để lưu vào kho.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                {selectedIndices.length === generatedQuestions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>

              <button
                onClick={handleSaveApproved}
                disabled={selectedIndices.length === 0}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu {selectedIndices.length} câu đã chọn</span>
              </button>
            </div>
          </div>

          {/* Questions Cards */}
          <div className="space-y-4">
            {generatedQuestions.map((q, idx) => {
              const isChecked = selectedIndices.includes(idx);
              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-4 transition-all ${
                    isChecked
                      ? 'border-purple-300 bg-purple-50/20 shadow-sm'
                      : 'border-gray-200 bg-white opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(idx)}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold text-gray-700">
                        Câu {idx + 1} ({q.code})
                      </span>
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-purple-100 text-purple-800">
                        {q.question_type}
                      </span>
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-gray-100 text-gray-700">
                        {q.subject_name} - {q.grade_name}
                      </span>
                    </div>

                    <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      AI đề xuất
                    </span>
                  </div>

                  {/* Stem */}
                  <div className="text-sm font-medium text-gray-900 mb-3 pl-6">
                    <MathRenderer content={q.question_text || ''} />
                  </div>

                  {/* Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 mb-3">
                      {q.options.map((opt) => {
                        const isCorrect = String(q.correct_answer).includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            className={`p-2 rounded-lg text-xs border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True / False statements */}
                  {q.statements && q.statements.length > 0 && (
                    <div className="space-y-1.5 pl-6 mb-3">
                      {q.statements.map((st, i) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                        >
                          <span className="text-gray-800">
                            Ý {i + 1}: {st.text}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              st.is_correct
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {st.is_correct ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="pl-6 text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                      <strong className="text-gray-700">Lời giải chi tiết: </strong>
                      <MathRenderer content={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              Đã chọn {selectedIndices.length}/{generatedQuestions.length} câu để lưu.
            </span>
            <button
              onClick={handleSaveApproved}
              disabled={selectedIndices.length === 0}
              className="px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Lưu {selectedIndices.length} câu vào Ngân hàng câu hỏi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
