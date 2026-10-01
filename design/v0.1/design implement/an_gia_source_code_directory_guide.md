# 📦 AN GIA — HƯỚNG DẪN TRÍCH XUẤT SOURCE CODE & CẤU TRÚC PROJECT (MOBILE · TABLET · DESKTOP)

> **Dự án:** AN GIA — Sổ sức khỏe gia đình  
> **Phiên bản:** v1.0.0 (Production Codebase)  
> **Lưu ý kỹ thuật:** Môi trường Stitch là nền tảng thiết kế & render trực tiếp trên web (in-browser sandbox) nên không hỗ trợ tải trực tiếp file nén nhị phân `.zip`. Thay vào đó, toàn bộ mã nguồn HTML/Tailwind, CSS Tokens, cấu hình cấu trúc thư mục và template component đều được tổ chức sẵn sàng để copy hoặc copy vào repository frontend (Next.js / React / Vite / Vue / HTML).

---

## 🗂️ 1. CẤU TRÚC THƯ MỤC DỰ ÁN KHUYẾN NGHỊ (PROJECT DIRECTORY)

```
an-gia-frontend/
├── public/
│   ├── assets/
│   │   ├── logo-3d-squircle.png     # Logo AN GIA (IMAGE_49)
│   │   └── sample-prescriptions/    # Ảnh chứng từ gốc mẫu
│   └── fonts/                       # Be Vietnam Pro self-hosted
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AGSidebar.tsx        # Sidebar Desktop 240px
│   │   │   ├── AGRail.tsx           # Navigation Rail Tablet 72px
│   │   │   ├── AGNav.tsx            # Bottom Navigation Mobile 3 tabs
│   │   │   └── AGProfileHeader.tsx  # Header hồ sơ & tab ngang
│   │   ├── ui/
│   │   │   ├── Button.tsx           # Primary (52px), Secondary, Ghost
│   │   │   ├── TimeSlotChips.tsx    # Chip Sáng / Trưa / Chiều / Tối
│   │   │   ├── InlineAlert.tsx      # Cảnh báo trùng lặp thuốc
│   │   │   └── BloodPressureChart.tsx # SVG Chart chuẩn BR-033
│   ├── views/
│   │   ├── mobile/
│   │   │   ├── HomeScreen.tsx       # 3a. Nhà / Gia đình
│   │   │   ├── ReviewPrescription.tsx # 1a. Duyệt đơn thuốc
│   │   │   ├── HealthTrends.tsx     # 2a. Diễn biến huyết áp
│   │   │   ├── UploadDocument.tsx   # 4a. Thêm giấy tờ
│   │   │   ├── MedicationList.tsx   # 5a. Danh mục thuốc Mẹ
│   │   │   ├── PendingQueue.tsx     # 6a. Hàng chờ duyệt
│   │   │   ├── SummaryA4.tsx        # 7a. Bản tóm tắt đi khám A4
│   │   │   └── LockScreenReminder.tsx # 8a. Màn khóa nhắc thuốc
│   │   ├── tablet/
│   │   │   ├── TabletSplitReview.tsx # Duyệt đơn chia đôi (272px | Form)
│   │   │   └── TabletTrends.tsx     # Diễn biến huyết áp khổ rộng
│   │   └── desktop/
│   │       ├── DesktopHome.tsx      # Dashboard tổng quan gia đình
│   │       ├── MasterDetailReview.tsx # Master-detail 3 cột
│   │       ├── DesktopTrends.tsx    # Biểu đồ 640px + Bảng cuộn độc lập
│   │       ├── DragDropUpload.tsx   # Vùng kéo thả nhiều file
│   │       ├── LabRecords.tsx       # Hồ sơ xét nghiệm & soi ảnh
│   │       └── AdminSettings.tsx    # Quản trị & trần chi phí AI
│   ├── styles/
│   │   └── globals.css              # Tokens CSS & font-face
│   └── tailwind.config.js           # Cấu hình Tokens Tailwind
├── package.json
└── README.md
```

---

## 🎨 2. FILE CẤU HÌNH `tailwind.config.js`
Đưa cấu hình này vào thư mục gốc dự án:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx,vue,svelte}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#FAF8F5',
          dark: '#121716',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F0FCFB',
          container: '#FAF8F5',
          dark: '#1A2120',
        },
        border: {
          DEFAULT: '#E4E0DA',
          divider: '#F1ECE4',
          dark: '#2C3533',
        },
        text: {
          primary: '#1F2A2A',
          secondary: '#55615F',
          placeholder: '#9AA3A1',
        },
        accent: {
          DEFAULT: '#2F6F5E',
          hover: '#255A4C',
          soft: '#E3EFEA',
          on: '#FFFFFF',
        },
        series: {
          diastolic: '#6B4FA8',
          glucose: '#B54708',
        },
        state: {
          danger: '#B42318',
          dangerBg: '#FBEDEB',
          warning: '#B54708',
          warningBg: '#FCF0E7',
          success: '#2E7D4F',
          successBg: '#EAF6EE',
          skeleton: '#EFEBE5',
        }
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '28px',
        '3xl': '32px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(31, 42, 42, 0.06)',
        'sheet': '0 -4px 16px rgba(31, 42, 42, 0.10)',
        'float': '0 12px 32px rgba(31, 42, 42, 0.10)',
      },
      minHeight: {
        'touch': '44px',
        'btn': '52px',
      }
    },
  },
  plugins: [],
}
```

---

## 💻 3. VỊ TRÍ CÁC FILE SOURCE CODE CÓ SẴN TRÊN CANVAS ĐỂ LẤY VỀ

Bạn có thể mở trực tiếp các file source code HTML/Component đã được lưu sẵn trong hệ thống Canvas:
1. `An Gia - Web.dc.html` (DOCUMENT_38): Mã nguồn hoàn chỉnh 5 màn hình Desktop (Master-detail duyệt đơn, Diễn biến sức khỏe, Trang chủ gia đình, Kéo-thả upload, Quản trị).
2. `An Gia - Màn hình.dc.html` (DOCUMENT_40 / 75): Trọn bộ mã nguồn 8 màn hình Mobile 390px chuẩn xác từng pixel.
3. `An Gia - So sánh breakpoint.dc.html` (DOCUMENT_39): Mã nguồn đối chiếu responsive 360px · 768px · 1440px.
4. `An Gia - Components.dc.html` (DOCUMENT_41 / 74): Trọn bộ mã nguồn UI kit, nút bấm, input, badge, bảng số liệu, biểu đồ.
5. `AGSidebar.dc.html` (DOCUMENT_42): Component Sidebar 240px cho Desktop.
6. `AGRail.dc.html` (DOCUMENT_45): Component Navigation Rail 72px cho Tablet.
7. `AGNav.dc.html` (DOCUMENT_48 / 72): Component Bottom Tab Navigation cho Mobile.
8. `AGScreenDuyet.dc.html` (DOCUMENT_43): Mã nguồn màn Duyệt đơn thuốc hỗ trợ tham số `bp="mobile|tablet|desktop"`.
9. `AGScreenDienBien.dc.html` (DOCUMENT_44): Mã nguồn màn Diễn biến huyết áp hỗ trợ tham số `bp="mobile|tablet|desktop"`.
10. `AN GIA - Developer Handoff Guide` (DOCUMENT_2): Tài liệu hướng dẫn bàn giao kiến trúc Frontend chi tiết.
