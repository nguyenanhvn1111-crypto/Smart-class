# SmartClass - Hệ Thống Quản Lý Lớp Học Thông Minh

Hệ thống quản lý lớp học số toàn diện, hiện đại phục vụ 4 vai trò chính: **Admin (Quản trị viên)**, **Giáo viên**, **Học sinh** và **Phụ huynh**.

---

## 🚀 Giới Thiệu & Tính Năng Nổi Bật

SmartClass được thiết kế và kiến trúc theo tiêu chuẩn Modern Education SaaS, tối ưu trải nghiệm người dùng, trực quan trên cả Desktop, Tablet và Mobile:

### 1. Phân Quyền 4 Vai Trò (RBAC & RLS)
- **Quản trị viên (Admin):** Quản lý toàn trường, phân quyền người dùng, cấp/khóa tài khoản, cấu hình năm học, khối lớp, môn học và tra cứu nhật ký hoạt động bất biến (Security Audit Log).
- **Giáo viên (Teacher):**
  - **Dashboard:** KPI sĩ số, có mặt, vắng, đi muộn, lịch dạy hôm nay, cảnh báo chuyên cần, bài tập cần chấm.
  - **Quản lý Lớp học:** Quản lý danh sách lớp, tạo mã tham gia lớp (Join code), chi tiết lớp với 8 tabs chức năng.
  - **Học sinh & Hồ sơ 360°:** Tìm kiếm, lọc, xem hồ sơ học tập, lịch sử chuyên cần, hạnh kiểm, liên hệ phụ huynh.
  - **Wizard Import Học sinh 10 bước:** Tải file mẫu, upload, kiểm tra cột, mapping, preview, validate từng dòng, phát hiện lỗi và import an toàn.
  - **Điểm danh:** Đánh dấu có mặt/vắng phép/không phép/đi muộn/về sớm, ghi chú, cập nhật tỷ lệ tức thời, sticky bar mobile, lịch sử điểm danh.
  - **Bài tập & Chấm bài:** Soạn đề bài, hạn nộp, auto-save nháp, chấm điểm thang 10, nhận xét với sự hỗ trợ của AI.
  - **Kiểm tra & Ngân hàng câu hỏi:** Hỗ trợ 6 dạng câu hỏi (trắc nghiệm, nhiều đáp án, đúng/sai, tự luận...), tạo đề thi đếm ngược có tính năng đảo câu hỏi và đáp án.
  - **Sổ điểm Spreadsheet:** Nhập điểm nhanh như Excel, cố định cột học sinh (Sticky column), kiểm tra hợp lệ thang điểm 0 - 10, tính điểm TB và xuất Excel.
  - **Học liệu số:** Quản lý kho tài liệu, slide, video theo khối và môn học.
  - **Hộp công cụ lớp học (Tools Hub):** Vòng quay may mắn (với hiệu ứng pháo hoa Confetti), chọn ngẫu nhiên không trùng lặp, chia nhóm tự động, đồng hồ đếm ngược lớp học.
  - **AI Studio:** Tích hợp mô hình Gemini AI hỗ trợ soạn giáo án 5512, tạo câu hỏi trắc nghiệm, viết nhận xét học bạ và phân tích kết quả học tập.
  - **Hành vi, Thi đua & Cảnh báo:** Hệ thống cộng/trừ điểm rèn luyện, trao huy hiệu, quy trình xử lý cảnh báo (Mới → Đã xem → Đang xử lý → Đã giải quyết).
- **Học sinh (Student):**
  - Xem thời khóa biểu, làm bài tập về nhà, nộp bài trực tuyến kèm tệp đính kèm.
  - Làm bài kiểm tra trực tuyến có đồng hồ đếm ngược và chấm điểm tự động.
  - Tra cứu bảng điểm cá nhân, lịch sử chuyên cần và bộ sưu tập huy hiệu thành tích.
- **Phụ huynh (Parent):**
  - Tính năng **Child Switcher** hỗ trợ theo dõi nhiều con trong cùng một tài khoản.
  - Nắm bắt tức thời tình hình điểm danh hôm nay của con khi đến trường.
  - Tra cứu điểm số, nhận xét của giáo viên chủ nhiệm và bài tập về nhà.
  - Nhận thông báo từ nhà trường với tính năng xác nhận **"Tôi đã đọc"**.
  - Kênh nhắn tin trao đổi trực tiếp với giáo viên chủ nhiệm.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4.
- **Icons & Visuals:** Lucide React, Canvas Confetti.
- **Biểu đồ thống kê:** Recharts.
- **Backend & Database:** Supabase (Authentication, PostgreSQL Database, Row Level Security - RLS, Storage Buckets).
- **Trí tuệ nhân tạo:** `@google/genai` (Google Gemini 2.5 Flash API) kèm bộ sinh thông minh đa ngữ cảnh sư phạm.

---

## 📁 Cấu Trúc Dự Án (Project Structure)

```
smartclass/
├── supabase/
│   ├── schema.sql           # Schema PostgreSQL, quan hệ bảng và RLS policies
│   └── seed.sql             # Dữ liệu mẫu khởi tạo (Trường, Khối, Môn học, Điểm)
├── src/
│   ├── components/
│   │   ├── common/          # Component dùng chung: StatusChip, StatCard, ChartCard,
│   │   │                    # Modal, Drawer, ConfirmDialog, Tabs, SearchBox, Pagination...
│   │   └── layout/          # AppLayout, Header (Role switcher, Search), Sidebar, Breadcrumb
│   ├── contexts/
│   │   ├── AuthContext.tsx  # Quản lý phiên đăng nhập, RBAC và Demo Role Switcher
│   │   └── ClassContext.tsx # Giữ trạng thái lớp đang chọn (Context-aware)
│   ├── pages/
│   │   ├── auth/            # Trang đăng nhập & quên mật khẩu
│   │   ├── teacher/         # Toàn bộ màn hình chức năng của Giáo viên
│   │   ├── student/         # Cổng thông tin Học sinh (Dashboard, Nộp bài, Làm quiz, Điểm)
│   │   ├── parent/          # Cổng thông tin Phụ huynh (Child Switcher, Trao đổi giáo viên)
│   │   ├── admin/           # Cổng Quản trị viên (Users, Academic, Audit Logs)
│   │   └── common/          # Hồ sơ cá nhân & Bảo mật tài khoản
│   ├── routes/
│   │   └── index.tsx        # Cấu hình định tuyến và RoleGuard bảo vệ theo vai trò
│   ├── services/
│   │   ├── supabase.ts      # Khởi tạo Supabase Client
│   │   ├── seedData.ts      # Dữ liệu mẫu phong phú bằng tiếng Việt
│   │   ├── dataService.ts   # Tầng truy xuất dữ liệu phản ứng (Reactive Data Access Layer)
│   │   └── aiService.ts     # Trợ lý giáo dục AI (Gemini Provider + Fallback)
│   ├── types/
│   │   └── index.ts         # Khai báo TypeScript Interfaces & Types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
└── README.md
```

---

## 🔑 Tài Khoản Demo Thử Nghiệm Nhanh

Hệ thống tích hợp sẵn thanh công cụ **"⚡ Demo Role Switcher"** ở góc trên thanh Header và tại trang Đăng nhập giúp bạn chuyển đổi tức thì chỉ với **1 cú nhấp chuột**:

| Vai trò | Họ và tên | Email đăng nhập | Mật khẩu mẫu |
| :--- | :--- | :--- | :--- |
| **Giáo viên** | Cô Trần Thị Mai (GVCN 10A1) | `teacher@smartclass.edu.vn` | `password123` |
| **Học sinh** | Lê Hoàng Long (HS10001) | `student@smartclass.edu.vn` | `password123` |
| **Phụ huynh** | Ông Lê Văn Minh (Bố em Long) | `parent@smartclass.edu.vn` | `password123` |
| **Quản trị viên** | TS. Nguyễn Văn Bình (Hiệu trưởng)| `admin@smartclass.edu.vn` | `password123` |

---

## 💻 Hướng Dẫn Chạy Cục Bộ (Local Development)

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Thiết lập Biến môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```
Cấu hình các giá trị cần thiết:
```env
# Gemini API Key (được AI Studio tự động nạp hoặc lấy từ Google AI Studio)
GEMINI_API_KEY="AIzaSy..."

# Cấu hình Supabase (Tùy chọn kết nối tới Supabase Cloud của bạn)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"
```

### 3. Chạy môi trường Dev Server
```bash
npm run dev
```
Truy cập ứng dụng tại địa chỉ: `http://localhost:3000`

### 4. Build kiểm tra sản phẩm
```bash
npm run build
```

---

## 🗄️ Cấu Hình Supabase (Database, RLS & Storage)

Khi bạn muốn kết nối với cơ sở dữ liệu Supabase Cloud thực tế:

1. Đăng ký tài khoản tại [supabase.com](https://supabase.com) và tạo một dự án mới (New Project).
2. Mở mục **SQL Editor** trong trang quản trị Supabase.
3. Sao chép và dán toàn bộ nội dung file `/supabase/schema.sql` vào SQL Editor rồi bấm **Run** để khởi tạo các bảng, quan hệ khóa ngoại và chính sách Row Level Security (RLS).
4. Tiếp tục chạy file `/supabase/seed.sql` để nạp dữ liệu trường học, môn học và thang điểm ban đầu.
5. Tạo các Storage Bucket trong mục **Storage**:
   - `avatars` (Ảnh đại diện người dùng)
   - `assignments` (Đề bài tập và tài liệu đính kèm)
   - `submissions` (Bài nộp của học sinh)
   - `resources` (Học liệu số và slide bài giảng)
6. Lấy `URL` và `anon public key` trong mục **Project Settings -> API** rồi điền vào file `.env`.

---

## 🚀 Triển Khai Lên Vercel & Netlify

### Triển khai lên Vercel:
1. Đẩy mã nguồn lên kho lưu trữ GitHub / GitLab.
2. Đăng nhập [vercel.com](https://vercel.com) và chọn **Add New Project**.
3. Import kho lưu trữ chứa project SmartClass.
4. Cấu hình:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Thêm các Environment Variables (`GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
6. Bấm **Deploy**.

### Triển khai lên Netlify:
1. Đăng nhập [netlify.com](https://netlify.com) và chọn **Add new site -> Import an existing project**.
2. Chọn repository SmartClass từ Git provider.
3. Build command: `npm run build`, Publish directory: `dist`.
4. Điền các biến môi trường trong phần **Environment variables**.
5. Nhấn **Deploy site**.
