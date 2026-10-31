import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataService } from '../../services/dataService';
import { Question, QuestionType, QuestionDifficulty, QuestionStatus } from '../../types';
import { MathRenderer } from '../../components/common/MathRenderer';
import { QuestionDetailDrawer } from './question-bank/QuestionDetailDrawer';
import { QuestionEditorModal } from './question-bank/QuestionEditorModal';
import { AIQuestionWizardModal } from './question-bank/AIQuestionWizardModal';
import { ImportQuestionsWizardModal } from './question-bank/ImportQuestionsWizardModal';
import { ExportQuestionsModal } from './question-bank/ExportQuestionsModal';
import { TabImportQuestions } from './question-bank/TabImportQuestions';
import { TabAIQuestions } from './question-bank/TabAIQuestions';
import { TabManualQuestion } from './question-bank/TabManualQuestion';
import {
  HelpCircle,
  Plus,
  Sparkles,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Edit3,
  Archive,
  Trash2,
  Layers,
  BookOpen,
  Eye,
  Copy,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List,
  FileQuestion,
  Tag,
  Award,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  FolderPlus,
  PenTool,
  Check
} from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const navigate = useNavigate();

  // Main 3 Tabs + Repository tab
  const [mainBankTab, setMainBankTab] = useState<'tab1_import' | 'tab2_ai' | 'tab3_manual' | 'tab4_repository'>('tab3_manual');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending_review' | 'draft' | 'archived'>('all');

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals and Drawers
  const [detailQuestion, setDetailQuestion] = useState<Question | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  const [isAIWizardOpen, setIsAIWizardOpen] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Load questions
  const loadData = async () => {
    setLoading(true);
    const qs = await DataService.getQuestions();
    setQuestions(qs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = DataService.subscribe(loadData);
    return unsub;
  }, []);

  // Filtered list
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Tab filter
      if (activeTab === 'approved' && q.status !== 'approved') return false;
      if (activeTab === 'pending_review' && q.status !== 'pending_review') return false;
      if (activeTab === 'draft' && q.status !== 'draft') return false;
      if (activeTab === 'archived' && q.status !== 'archived' && q.status !== 'rejected') return false;
      // In 'all' tab, hide archived by default unless searched
      if (activeTab === 'all' && q.status === 'archived' && !searchQuery.trim()) return false;

      // Dropdown filters
      if (selectedSubject !== 'all' && q.subject_name !== selectedSubject) return false;
      if (selectedGrade !== 'all' && q.grade_name !== selectedGrade) return false;
      if (selectedType !== 'all' && q.question_type !== selectedType) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;

      // Search keyword
      if (searchQuery.trim()) {
        const kw = searchQuery.toLowerCase().trim();
        const inStem = q.question_text.toLowerCase().includes(kw);
        const inCode = q.code?.toLowerCase().includes(kw);
        const inExplanation = q.explanation?.toLowerCase().includes(kw);
        const inTags = q.tags?.some((t) => t.toLowerCase().includes(kw));
        const inTopic = q.topic_name?.toLowerCase().includes(kw) || q.chapter_name?.toLowerCase().includes(kw);
        if (!inStem && !inCode && !inExplanation && !inTags && !inTopic) return false;
      }

      return true;
    });
  }, [questions, activeTab, selectedSubject, selectedGrade, selectedType, selectedDifficulty, searchQuery]);

  // Paginated list
  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage]);

  // KPI counts
  const totalCount = questions.length;
  const approvedCount = questions.filter((q) => q.status === 'approved').length;
  const pendingCount = questions.filter((q) => q.status === 'pending_review').length;
  const draftOrArchivedCount = questions.filter((q) => q.status === 'draft' || q.status === 'archived' || q.status === 'rejected').length;

  // Bulk selection toggles
  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedQuestions.length && paginatedQuestions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedQuestions.map((q) => q.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Actions
  const handleOpenDetail = (q: Question) => {
    setDetailQuestion(q);
    setIsDetailDrawerOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setIsEditorModalOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    await DataService.duplicateQuestion(id);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn chuyển câu hỏi này vào mục lưu trữ không?')) {
      await DataService.deleteQuestion(id, true);
      setIsDetailDrawerOpen(false);
      loadData();
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    await DataService.updateQuestion(id, { status }, `Chuyển trạng thái sang ${status}`);
    if (detailQuestion && detailQuestion.id === id) {
      setDetailQuestion({ ...detailQuestion, status });
    }
    loadData();
  };

  const handleSaveQuestion = async (payload: Partial<Question>) => {
    if (editingQuestion) {
      await DataService.updateQuestion(editingQuestion.id, payload, 'Giáo viên chỉnh sửa');
    } else {
      await DataService.createQuestion(payload);
    }
    loadData();
  };

  const handleSaveAIQuestions = async (newQs: Partial<Question>[]) => {
    await DataService.batchCreateQuestions(newQs);
    loadData();
  };

  const handleImportComplete = async (importedQs: Partial<Question>[]) => {
    const res = await DataService.batchCreateQuestions(importedQs);
    loadData();
    return res;
  };

  // Bulk actions
  const handleBulkApprove = async () => {
    await DataService.batchUpdateQuestionStatus(selectedIds, 'approved');
    setSelectedIds([]);
    loadData();
  };

  const handleBulkArchive = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn lưu trữ ${selectedIds.length} câu hỏi đã chọn?`)) {
      await DataService.batchUpdateQuestionStatus(selectedIds, 'archived');
      setSelectedIds([]);
      loadData();
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Xóa vĩnh viễn ${selectedIds.length} câu hỏi đã chọn khỏi hệ thống?`)) {
      await DataService.batchDeleteQuestions(selectedIds, false);
      setSelectedIds([]);
      loadData();
    }
  };

  const handleCreateQuizFromSelected = () => {
    const selectedQuestionsList = questions.filter((q) => selectedIds.includes(q.id));
    navigate('/teacher/quizzes/create', { state: { preSelectedQuestions: selectedQuestionsList } });
  };

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case 'nhan_biet':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Nhận biết</span>;
      case 'thong_hieu':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Thông hiểu</span>;
      case 'van_dung':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Vận dụng</span>;
      case 'van_dung_cao':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Vận dụng cao</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">Thông hiểu</span>;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'single_choice': return '1 đáp án';
      case 'multiple_choice': return 'Nhiều đáp án';
      case 'true_false': return 'Đúng / Sai';
      case 'matching': return 'Ghép đôi';
      case 'ordering': return 'Sắp xếp';
      case 'fill_blank': return 'Điền khuyết';
      case 'short_answer': return 'Trả lời ngắn';
      case 'essay': return 'Tự luận';
      case 'passage': return 'Đoạn văn';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/teacher/dashboard')}>
          Trang chủ
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-600 font-medium">Dạy và Học</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-blue-600 font-bold">Ngân hàng câu hỏi thông minh</span>
      </div>

      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Ngân Hàng Câu Hỏi Thông Minh
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Quản lý kho học liệu chuẩn 9 dạng, kiểm duyệt chất lượng, tạo câu hỏi AI và xuất đề thi A4
            </p>
          </div>
        </div>
      </div>

      {/* 4 MAIN QUESTION BANK TABS */}
      <div className="bg-white p-2.5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Tab 1: Import */}
          <button
            type="button"
            onClick={() => setMainBankTab('tab1_import')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all ${
              mainBankTab === 'tab1_import'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                mainBankTab === 'tab1_import' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
              }`}
            >
              <Upload className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm truncate">Tab 1: Nhập bằng Import</div>
              <div
                className={`text-[11px] truncate ${
                  mainBankTab === 'tab1_import' ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                Word / Excel / CSV
              </div>
            </div>
          </button>

          {/* Tab 2: AI */}
          <button
            type="button"
            onClick={() => setMainBankTab('tab2_ai')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all ${
              mainBankTab === 'tab2_ai'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                mainBankTab === 'tab2_ai' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm truncate">Tab 2: Tạo bằng AI Thông Minh</div>
              <div
                className={`text-[11px] truncate ${
                  mainBankTab === 'tab2_ai' ? 'text-purple-100' : 'text-slate-500'
                }`}
              >
                Giáo án, PDF/Word, Web, Ảnh
              </div>
            </div>
          </button>

          {/* Tab 3: Manual */}
          <button
            type="button"
            onClick={() => setMainBankTab('tab3_manual')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all ${
              mainBankTab === 'tab3_manual'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                mainBankTab === 'tab3_manual' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              <PenTool className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm truncate">Tab 3: Tạo câu hỏi bằng tay</div>
              <div
                className={`text-[11px] truncate ${
                  mainBankTab === 'tab3_manual' ? 'text-emerald-100' : 'text-slate-500'
                }`}
              >
                Môn, Khối & Combobox 5 dạng
              </div>
            </div>
          </button>

          {/* Tab 4: Repository */}
          <button
            type="button"
            onClick={() => setMainBankTab('tab4_repository')}
            className={`flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all ${
              mainBankTab === 'tab4_repository'
                ? 'bg-slate-800 text-white shadow-md shadow-slate-900/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                mainBankTab === 'tab4_repository' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm truncate flex items-center gap-1.5">
                <span>Kho câu hỏi đã có</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    mainBankTab === 'tab4_repository' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {totalCount}
                </span>
              </div>
              <div
                className={`text-[11px] truncate ${
                  mainBankTab === 'tab4_repository' ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                Xem danh sách, lọc & xuất đề
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {mainBankTab === 'tab1_import' && (
        <TabImportQuestions
          existingQuestions={questions}
          onImportSuccess={handleImportComplete}
          onViewRepository={() => setMainBankTab('tab4_repository')}
        />
      )}

      {mainBankTab === 'tab2_ai' && (
        <TabAIQuestions
          onSaveQuestions={handleSaveAIQuestions}
          onViewRepository={() => setMainBankTab('tab4_repository')}
          defaultSubject={selectedSubject !== 'all' ? selectedSubject : 'Toán Học'}
          defaultGrade={selectedGrade !== 'all' ? selectedGrade : 'Khối 10'}
        />
      )}

      {mainBankTab === 'tab3_manual' && (
        <TabManualQuestion
          onSaveQuestion={handleSaveQuestion}
          onViewRepository={() => setMainBankTab('tab4_repository')}
          defaultSubject={selectedSubject !== 'all' ? selectedSubject : 'Toán Học'}
          defaultGrade={selectedGrade !== 'all' ? selectedGrade : 'Khối 10'}
        />
      )}

      {mainBankTab === 'tab4_repository' && (
        <>
          {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Tổng số câu hỏi
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{totalCount}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Trong kho học liệu</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileQuestion className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              Đã duyệt (Approved)
            </span>
            <div className="text-2xl font-extrabold text-emerald-700">{approvedCount}</div>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block">Sẵn sàng ra đề thi</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
              Chờ duyệt
            </span>
            <div className="text-2xl font-extrabold text-amber-700">{pendingCount}</div>
            <span className="text-[11px] text-amber-600/80 mt-0.5 block">Do AI / GV soạn</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Bản nháp / Cần sửa
            </span>
            <div className="text-2xl font-extrabold text-slate-800">{draftOrArchivedCount}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Đang chỉnh sửa/lưu trữ</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Tabs Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {[
              { id: 'all', label: 'Tất cả câu hỏi', count: totalCount },
              { id: 'approved', label: 'Đã duyệt', count: approvedCount },
              { id: 'pending_review', label: 'Chờ duyệt', count: pendingCount },
              { id: 'draft', label: 'Bản nháp', count: questions.filter((q) => q.status === 'draft').length },
              { id: 'archived', label: 'Lưu trữ / Cần sửa', count: questions.filter((q) => q.status === 'archived' || q.status === 'rejected').length }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Actions & View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-all"
              title="Xuất file câu hỏi"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất file</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/teacher/quizzes')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 transition-all"
              title="Xem danh sách đề kiểm tra"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xem đề thi</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-500'
                }`}
                title="Dạng bảng"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'card' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-500'
                }`}
                title="Dạng thẻ"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Thẻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search box */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo mã, nội dung, tag..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Subject filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700"
            >
              <option value="all">Tất cả Môn học</option>
              <option value="Toán Học">Toán Học</option>
              <option value="Vật Lý">Vật Lý</option>
              <option value="Hóa Học">Hóa Học</option>
              <option value="Sinh Học">Sinh Học</option>
              <option value="Ngữ Văn">Ngữ Văn</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Lịch Sử">Lịch Sử</option>
            </select>
          </div>

          {/* Grade filter */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700"
            >
              <option value="all">Tất cả Khối lớp</option>
              <option value="Khối 10">Khối 10</option>
              <option value="Khối 11">Khối 11</option>
              <option value="Khối 12">Khối 12</option>
            </select>
          </div>

          {/* 9 Types filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700"
            >
              <option value="all">Tất cả 9 Dạng câu hỏi</option>
              <option value="single_choice">1. Một đáp án đúng</option>
              <option value="multiple_choice">2. Nhiều đáp án đúng</option>
              <option value="true_false">3. Đúng / Sai từng ý</option>
              <option value="matching">4. Ghép đôi</option>
              <option value="ordering">5. Sắp xếp thứ tự</option>
              <option value="fill_blank">6. Điền khuyết</option>
              <option value="short_answer">7. Trả lời ngắn</option>
              <option value="essay">8. Tự luận & Rubric</option>
              <option value="passage">9. Tình huống / Đoạn văn</option>
            </select>
          </div>

          {/* Cognitive Difficulty filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-slate-700"
            >
              <option value="all">Tất cả Mức độ</option>
              <option value="nhan_biet">1. Nhận biết</option>
              <option value="thong_hieu">2. Thông hiểu</option>
              <option value="van_dung">3. Vận dụng</option>
              <option value="van_dung_cao">4. Vận dụng cao</option>
            </select>
          </div>
        </div>

        {/* Bulk Selection Floating Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                {selectedIds.length}
              </span>
              <span className="font-bold text-blue-900">
                Đã chọn {selectedIds.length} câu hỏi
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCreateQuizFromSelected}
                className="px-3 py-1.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Tạo đề thi từ các câu đã chọn</span>
              </button>

              <button
                type="button"
                onClick={handleBulkApprove}
                className="px-3 py-1.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Duyệt câu hỏi</span>
              </button>

              <button
                type="button"
                onClick={handleBulkArchive}
                className="px-3 py-1.5 rounded-xl font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center gap-1"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Lưu trữ</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-100"
                title="Xóa vĩnh viễn"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-slate-500 hover:underline px-2"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Questions Data Display */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Không tìm thấy câu hỏi nào phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử thay đổi bộ lọc, từ khóa tìm kiếm hoặc bấm nút "Tạo thủ công" / "Tạo bằng AI" để bổ sung câu hỏi mới vào ngân hàng.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedSubject('all');
              setSelectedGrade('all');
              setSelectedType('all');
              setSelectedDifficulty('all');
              setActiveTab('all');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-horizontal-scrollbar">
            <table className="w-full min-w-[980px] text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === paginatedQuestions.length && paginatedQuestions.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5 w-32">Mã câu</th>
                  <th className="p-3.5">Nội dung câu hỏi & Công thức</th>
                  <th className="p-3.5 w-28">Dạng câu</th>
                  <th className="p-3.5 w-28">Mức độ</th>
                  <th className="p-3.5 w-28">Môn / Khối</th>
                  <th className="p-3.5 w-24">Trạng thái</th>
                  <th className="p-3.5 w-28 text-right pr-5">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedQuestions.map((q) => {
                  const isChecked = selectedIds.includes(q.id);
                  return (
                    <tr
                      key={q.id}
                      onClick={() => handleOpenDetail(q)}
                      className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${
                        isChecked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(q.id)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5 font-mono font-bold text-blue-700">
                        {q.code || q.id}
                        {q.source_type === 'ai_generated' && (
                          <span className="block text-[10px] text-purple-600 font-sans font-medium flex items-center gap-0.5 mt-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> AI sinh
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 max-w-md">
                        <div className="font-semibold text-slate-900 line-clamp-2 leading-relaxed">
                          <MathRenderer content={q.question_text} />
                        </div>
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            {q.tags.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {getTypeName(q.question_type)}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {getDifficultyBadge(q.difficulty)}
                      </td>

                      <td className="p-3.5 text-slate-600">
                        <div className="font-semibold text-slate-800">{q.subject_name}</div>
                        <div className="text-[11px] text-slate-400">{q.grade_name}</div>
                      </td>

                      <td className="p-3.5">
                        {q.status === 'approved' ? (
                          <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt
                          </span>
                        ) : q.status === 'pending_review' ? (
                          <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Chờ duyệt
                          </span>
                        ) : q.status === 'draft' ? (
                          <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" /> Bản nháp
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold text-[11px]">Lưu trữ</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(q)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(q)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(q.id)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Nhân bản"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(q.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa/Lưu trữ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredQuestions.length)} trong tổng số {filteredQuestions.length} câu hỏi
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-bold text-slate-800">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (

        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedQuestions.map((q) => {
            const isChecked = selectedIds.includes(q.id);
            return (
              <div
                key={q.id}
                onClick={() => handleOpenDetail(q)}
                className={`bg-white rounded-3xl border p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                  isChecked ? 'border-blue-400 bg-blue-50/20' : 'border-slate-200/80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">
                      {q.code || q.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getDifficultyBadge(q.difficulty)}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => handleToggleSelectOne(q.id)}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                    <MathRenderer content={q.question_text} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">{q.subject_name}</span>
                    <span>•</span>
                    <span>{q.grade_name}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{getTypeName(q.question_type)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] font-bold text-emerald-600">
                    {q.points || 1.0} điểm
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(q)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      title="Sửa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(q.id)}
                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                      title="Nhân bản"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* DETAIL DRAWER */}
      <QuestionDetailDrawer
        question={detailQuestion}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onEdit={(q) => {
          setIsDetailDrawerOpen(false);
          handleOpenEdit(q);
        }}
        onDuplicate={handleDuplicate}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
      />

      {/* QUESTION EDITOR MODAL */}
      <QuestionEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
      />

      {/* AI GENERATOR WIZARD */}
      <AIQuestionWizardModal
        isOpen={isAIWizardOpen}
        onClose={() => setIsAIWizardOpen(false)}
        onSaveApprovedQuestions={handleSaveAIQuestions}
        defaultSubject={selectedSubject !== 'all' ? selectedSubject : 'Toán Học'}
        defaultGrade={selectedGrade !== 'all' ? selectedGrade : 'Khối 10'}
      />

      {/* IMPORT WIZARD */}
      <ImportQuestionsWizardModal
        isOpen={isImportWizardOpen}
        onClose={() => setIsImportWizardOpen(false)}
        onImportComplete={handleImportComplete}
        existingQuestions={questions}
      />

      {/* EXPORT MODAL */}
      <ExportQuestionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        questions={selectedIds.length > 0 ? questions.filter((q) => selectedIds.includes(q.id)) : filteredQuestions}
        selectedSubject={selectedSubject !== 'all' ? selectedSubject : 'Toán Học'}
        selectedGrade={selectedGrade !== 'all' ? selectedGrade : 'Khối 10'}
      />

    </div>
  );
};
