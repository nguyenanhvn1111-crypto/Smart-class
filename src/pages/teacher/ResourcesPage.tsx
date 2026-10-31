import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/dataService';
import { ResourceItem } from '../../types';
import { SearchBox } from '../../components/common/SearchBox';
import { Modal } from '../../components/common/Modal';
import {
  FolderArchive,
  Upload,
  Download,
  Share2,
  Trash2,
  FileText,
  Video,
  FileSpreadsheet,
  Link as LinkIcon,
  ExternalLink,
  Plus,
  BookOpen
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('Đại số & Hình học');
  const [subjectId, setSubjectId] = useState('sub-math');
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'pptx' | 'video' | 'link'>('pdf');
  const [description, setDescription] = useState('');

  const loadResources = async () => {
    const list = await DataService.getResources();
    setResources(list);
  };

  useEffect(() => {
    loadResources();
    const unsub = DataService.subscribe(loadResources);
    return unsub;
  }, []);

  const filtered = resources.filter((res) => {
    const matchSearch =
      res.title.toLowerCase().includes(search.toLowerCase()) ||
      res.topic.toLowerCase().includes(search.toLowerCase());
    const matchSubject = selectedSubject === 'all' || res.subject_id === selectedSubject;
    return matchSearch && matchSubject;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await DataService.uploadResource({
      school_id: 'sch-001',
      subject_id: subjectId,
      subject_name: subjectId === 'sub-math' ? 'Toán Học' : 'Vật Lý',
      uploader_id: 'user-teacher-1',
      uploader_name: 'Cô Trần Thị Mai',
      title,
      description,
      topic,
      file_url: 'https://smartclass-storage.edu.vn/files/sample.pdf',
      file_type: fileType,
      file_size_bytes: 3500000,
      is_public: true
    });

    setIsUploadOpen(false);
    setTitle('');
    setDescription('');
    loadResources();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      await DataService.deleteResource(id);
      loadResources();
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-rose-500" />;
      case 'pptx':
        return <FileSpreadsheet className="w-5 h-5 text-orange-500" />;
      case 'link':
        return <LinkIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kho Học liệu số & Bài giảng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý tài liệu học tập, giáo trình điện tử, slide bài giảng và video tham khảo
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs self-start sm:self-auto active:scale-95"
        >
          <Upload className="w-4 h-4" />
          <span>Tải lên tài liệu mới</span>
        </button>
      </div>

      {/* Toolbar filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tiêu đề, chuyên đề..."
          className="w-full sm:max-w-md"
        />

        <div className="flex items-center gap-3">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm rounded-xl px-3 py-2 outline-hidden"
          >
            <option value="all">Tất cả môn học</option>
            <option value="sub-math">Toán Học</option>
            <option value="sub-phys">Vật Lý</option>
            <option value="sub-lit">Ngữ Văn</option>
          </select>
        </div>
      </div>

      {/* Resource Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((res) => (
          <div
            key={res.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  {getFileIcon(res.file_type)}
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-slate-100 text-slate-600">
                  {res.file_type}
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{res.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{res.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{res.subject_name} • {res.topic}</span>
                <span>{res.downloads_count} lượt tải</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Đăng bởi {res.uploader_name}
              </span>
              <div className="flex items-center gap-1">
                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Tải xuống tài liệu"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(res.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Xóa tài liệu"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Tải lên tài liệu học liệu mới"
        subtitle="Hỗ trợ các định dạng PDF, PPTX, Video hoặc liên kết ngoài"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tiêu đề tài liệu *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Chuyên đề Đại số nâng cao 2026"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
              >
                <option value="sub-math">Toán Học</option>
                <option value="sub-phys">Vật Lý</option>
                <option value="sub-lit">Ngữ Văn</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Định dạng file</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
              >
                <option value="pdf">Tài liệu PDF</option>
                <option value="pptx">Slide PowerPoint (PPTX)</option>
                <option value="video">Video bài giảng (MP4)</option>
                <option value="link">Liên kết web ngoài</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chủ đề / Chương bài</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Chương 1 - Mệnh đề & Tập hợp"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả tóm tắt</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú về nội dung và cách thức học sinh khai thác tài liệu..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              Tải lên ngay
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
