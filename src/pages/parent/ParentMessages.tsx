import React, { useState } from 'react';
import { Send, Phone, MessageSquare, User, CheckCircle2 } from 'lucide-react';

export const ParentMessages: React.FC = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Cô Trần Thị Mai (GVCN)',
      content: 'Kính gửi Quý phụ huynh, em Long hôm nay học bài rất tích cực và đạt điểm 10 kiểm tra 15 phút.',
      time: '08:45, 02/10/2026',
      isMe: false
    },
    {
      id: 2,
      sender: 'Phụ huynh',
      content: 'Dạ gia đình cảm ơn cô giáo nhiều ạ. Cháu ở nhà cũng rất hào hứng khi kể về tiết học của cô.',
      time: '09:12, 02/10/2026',
      isMe: true
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'Phụ huynh',
        content: inputMessage,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isMe: true
      }
    ]);
    setInputMessage('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Trao đổi với Giáo viên Chủ nhiệm
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kênh liên lạc trực tiếp hai chiều giữa gia đình và cô Trần Thị Mai (Lớp 10A1)
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[520px]">
        {/* Chat top header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"
              alt="Teacher"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cô Trần Thị Mai</h3>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang trực tuyến
              </span>
            </div>
          </div>

          <a
            href="tel:0988123456"
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Phone className="w-5 h-5" />
          </a>
        </div>

        {/* Message history */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-slate-400 mb-1 px-1">{m.sender} • {m.time}</span>
              <div
                className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  m.isMe
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>

        {/* Chat input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Gửi tin nhắn hoặc lời nhắn xin phép nghỉ cho cô..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-hidden focus:bg-white focus:border-blue-500"
          />
          <button
            type="submit"
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
