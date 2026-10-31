import React, { useState } from 'react';
import { Student } from '../../types';
import { X, Phone, ExternalLink, Copy, Check, Send, Smartphone, CheckCircle2 } from 'lucide-react';

interface ParentContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccessToast?: (msg: string) => void;
}

export const ParentContactModal: React.FC<ParentContactModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccessToast
}) => {
  const [copied, setCopied] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const parentName = student.parent_name || 'Nguyễn Văn Hùng';
  const parentRelationship = student.parent_relationship || 'Bố';
  const parentPhone = student.parent_phone || '0913 556 778';
  const cleanPhone = parentPhone.replace(/\D/g, '');
  const parentEmail =
    student.parent_email ||
    `${parentName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')}@smartclass.edu.vn`;
  const isConnected = student.app_connected !== false;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(parentPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      setErrorMessage('Vui lòng nhập nội dung tin nhắn gửi tới phụ huynh!');
      return;
    }
    setErrorMessage(null);
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setMessageText('');
      onClose();
      if (onSuccessToast) {
        onSuccessToast(
          `Đã gửi tin nhắn thông báo đến Sổ liên lạc điện tử của phụ huynh ${parentName} thành công!`
        );
      }
    }, 600);
  };

  const quickTemplates = [
    { label: 'Chuyên cần hôm nay', text: `Kính gửi Phụ huynh em ${student.full_name}, hôm nay em đi học đúng giờ, tham gia phát biểu tích cực trong giờ học.` },
    { label: 'Nhắc bài tập về nhà', text: `Kính gửi Phụ huynh em ${student.full_name}, em có 2 bài tập môn Toán & Tiếng Anh cần hoàn thành trước 20h00 tối nay.` },
    { label: 'Lịch họp CMHS', text: `Kính mời Phụ huynh em ${student.full_name} tham dự buổi họp Ban đại diện CMHS học kỳ vào 8h30 sáng Chủ Nhật tuần này.` },
    { label: 'Mời trao đổi riêng', text: `GVCN kính mời Phụ huynh em ${student.full_name} bớt chút thời gian trao đổi ngắn qua điện thoại vào 17h30 chiều nay.` }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden space-y-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Liên hệ Phụ huynh</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phụ huynh em:{' '}
              <span className="font-semibold text-slate-700">{student.full_name}</span> (
              {student.class_name || 'Lớp 10/1'})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parent Summary Card */}
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-semibold">
                Phụ huynh đại diện
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-base text-slate-900">{parentName}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                    parentRelationship === 'Bố'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {parentRelationship}
                </span>
              </div>
            </div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đã kết nối app
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Chưa kết nối app
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
            <div>
              <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
              <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">
                {parentPhone}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Email:</span>
              <span className="font-medium text-slate-700 truncate block text-[11px]" title={parentEmail}>
                {parentEmail}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Large Action Buttons */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <a
            href={`tel:${cleanPhone}`}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-blue-700 font-bold transition-all shadow-2xs group text-center"
          >
            <Phone className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Gọi điện</span>
          </a>

          <a
            href={`https://zalo.me/${cleanPhone}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-blue-700 font-bold transition-all shadow-2xs group text-center"
          >
            <ExternalLink className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Mở Zalo</span>
          </a>

          <button
            type="button"
            onClick={handleCopyPhone}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-3 px-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold transition-all cursor-pointer shadow-2xs group"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 text-[11px]">Đã chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
                <span>Sao chép SĐT</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Message Templates */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
            Mẫu tin nhắn nhanh gửi phụ huynh:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickTemplates.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setMessageText(t.text);
                  setErrorMessage(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer border border-slate-200/60"
              >
                + {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message composer */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 block">
            Nội dung tin nhắn gửi đến Sổ liên lạc SmartClass:
          </label>
          <textarea
            rows={3}
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={`Nhập nội dung nhắn gửi tới phụ huynh em ${student.full_name}...`}
            className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden resize-none transition-all placeholder:text-slate-400"
          />
          {errorMessage && (
            <p className="text-xs font-semibold text-rose-600">{errorMessage}</p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={isSending}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Đang gửi...' : 'Gửi tin nhắn'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
