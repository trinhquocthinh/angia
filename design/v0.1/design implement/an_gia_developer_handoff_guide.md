# 📘 AN GIA — DEVELOPER HANDOFF & FRONTEND ARCHITECTURE GUIDE (v0.1)

> **Dự án:** AN GIA — Sổ sức khỏe gia đình  
> **Slogan:** *"Chăm chút từng thói quen, chở che từng thế hệ."*  
> **Phiên bản tài liệu:** v1.2.0 (Handoff Ready)  
> **Đối tượng sử dụng:** Đội ngũ Frontend Developers, Tech Leads, UI/UX Engineers.  
> **Công nghệ khuyến nghị:** React / Next.js / Vue / Svelte + Tailwind CSS v3/v4 + Phosphor Icons / Lucide Icons.

---

## 📑 MỤC LỤC
1. [Hệ Thống Thiết Kế & Design Tokens](#1-hệ-thống-thiết-kế--design-tokens)
2. [Cấu Hình Tailwind CSS (Tailwind Config)](#2-cấu-hình-tailwind-css-tailwind-config)
3. [Quy Chuẩn Y Tế & UX Bắt Buộc (Critical Rules)](#3-quy-chuẩn-y-tế--ux-bắt-buộc-critical-rules)
4. [Kiến Trúc Responsive & Breakpoints](#4-kiến-trúc-responsive--breakpoints)
5. [Thư Viện Component Cốt Lõi (Primitives & Molecules)](#5-thư-viện-component-cốt-lõi-primitives--molecules)
6. [Danh Mục Màn Hình & Cấu Trúc Mã Nguồn Mẫu](#6-danh-mục-màn-hình--cấu-trúc-mã-nguồn-mẫu)
7. [Checklist Kiểm Thử Trước Khi Release (QA & A11y)](#7-checklist-kiểm-thử-trước-khi-release-qa--a11y)

---

## 1. HỆ THỐNG THIẾT KẾ & DESIGN TOKENS

### 1.1. Bảng Màu Chuẩn (Color Palette & Tokens)
Toàn bộ màu sắc đều tuân thủ độ tương phản **WCAG 2.1 AA (≥ 4.5:1 với chữ thường, ≥ 3:1 với chữ lớn và giao diện)**:

| Token Name | Hex Code | Vai trò trong giao diện | Tỉ lệ tương phản |
| :--- | :--- | :--- | :--- |
| `color.bg` | `#FAF8F5` | Nền tổng thể trang (trắng ngà ấm áp, chống mỏi mắt) | Nền chính |
| `color.surface` | `#FFFFFF` | Thẻ card, bottom sheet, bảng, header | Bề mặt lớp 1 |
| `color.surface.subtle`| `#F0FCFB` | Nền phụ, hover thẻ, panel phụ | Bề mặt phụ |
| `color.border` | `#E4E0DA` | Viền thẻ, đường phân cách giữa các dòng | 1.5:1 |
| `color.text.primary` | `#1F2A2A` | Tiêu đề, chữ chính, số đo sức khỏe (`tabular-nums`) | **13.9:1** |
| `color.text.secondary`| `#55615F` | Nhãn form, đơn vị (`mmHg`, `mmol/L`), ngày tháng | **6.1:1** |
| `color.placeholder` | `#9AA3A1` | Viền kéo thả ảnh, placeholder input | Phụ trợ |
| `color.accent` | `#2F6F5E` | Nút hành động chính (Primary Button), link, màu tâm thu | **5.6:1** |
| `color.accent.hover` | `#255A4C` | Trạng thái hover/pressed của nút chính | 7.1:1 |
| `color.accent.soft` | `#E3EFEA` | Nền chip chọn thuốc, trạng thái đang chọn | Nền phụ |
| `color.on-accent` | `#FFFFFF` | Màu chữ trên nền nút chính xanh rừng | **5.9:1** |
| `color.series.diastolic`| `#6B4FA8` | Đường tâm trương trên biểu đồ (tím điềm tĩnh) | **6.0:1** |
| `color.series.glucose`| `#B54708` | Đường biểu diễn đường huyết (cam đất) | 5.1:1 |
| `color.danger` | `#B42318` | Lỗi form, nút xóa hồ sơ, tệp bị từ chối | 6.2:1 |
| `color.warning` | `#B54708` | Cảnh báo trùng phác đồ, nhắc nhở y tế | 5.1:1 |
| `color.success` | `#2E7D4F` | Huy hiệu đã lưu thành công, trạng thái đọc xong | 4.8:1 |
| `color.period.stopped`| `#F1ECE4` | Nền sọc gạch chéo giai đoạn ngưng thuốc (**Không dùng màu đỏ**) | Trung tính |

### 1.2. Kiểu Chữ (Typography Scale)
- **Font gia đình:** `Be Vietnam Pro` (OFL, tự host qua `@fontsource/be-vietnam-pro`).
- **Font subsets:** `latin`, `vietnamese`. Trọng lượng: `400 (Regular)`, `500 (Medium)`, `600 (SemiBold)`.
- **Quy tắc số học:** Tất cả số đo, liều lượng, ngày tháng bắt buộc bật: `font-variant-numeric: tabular-nums` (Tailwind class: `tabular-nums`).

| Cấp độ | Cỡ chữ / Line Height | Trọng lượng | Ứng dụng |
| :--- | :--- | :--- | :--- |
| `display` | 34px / 40px | 600 | Số đo huyết áp, đường huyết chính (`152/94`) |
| `h1` | 24px / 32px | 600 | Tiêu đề trang, tiêu đề màn hình chính |
| `h2` | 20px / 28px | 600 | Tiêu đề nhóm, tên người trên thẻ (`Mẹ · 72 tuổi`) |
| `body` | 17px / 26px | 400 | Nội dung văn bản, tên thuốc, lời dặn bác sĩ |
| `body-strong` | 17px / 26px | 600 | Liều dùng, điểm nhấn trong đoạn |
| `label` | 15px / 22px | 500 | Nhãn input, nhãn ngày tháng, đơn vị đo |
| `caption` | 14px / 20px | 400/500 | Ghi chú phụ, nguồn chứng từ, badge trạng thái |
| `print-body` | 11pt / 15pt | 400 | Bảng tóm tắt in giấy khổ A4 |

---

## 2. CẤU HÌNH TAILWIND CSS (TAILWIND CONFIG)

Đưa cấu hình này vào file `tailwind.config.js` của dự án để đảm bảo toàn bộ class tương thích 100%:

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
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
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

## 3. QUY CHUẨN Y TẾ & UX BẮT BUỘC (CRITICAL RULES)

### 🚨 1. Nguyên Tắc Trung Lập Chỉ Số Y Khoa (BR-033)
- **TUYỆT ĐỐI KHÔNG** tô màu đỏ/cam/xanh để phân loại chỉ số sức khỏe là "tốt" hay "xấu", "nguy hiểm" hay "an toàn".
- **KHÔNG DÙNG** mũi tên đánh giá phán xét (như ❌, ⚠️, "Báo động").
- Số đo luôn giữ màu chữ chính `#1F2A2A`.
- Biểu đồ chỉ dùng màu để **phân biệt loại chuỗi** (Tâm thu = Xanh `#2F6F5E`, Tâm trương = Tím `#6B4FA8`) và **giai đoạn dùng thuốc** (Đang dùng = Xanh soft `#E3EFEA`, Ngưng = Nền sọc trung tính `#F1ECE4`, Chưa có số đo = Viền đứt `#9AA3A1`).

### 🔒 2. Nguyên Tắc Minh Bạch & Bảo Mật Dữ Liệu (BR-014)
- **Luôn có nút "Xem ảnh gốc":** Bất kỳ dữ liệu trích xuất nào (đơn thuốc, máy đo, xét nghiệm) đều phải có đường dẫn đối chiếu ảnh tài liệu gốc chất lượng cao.
- **Hộp nhắc quyền riêng tư cố định:** Khi người dùng chụp/tải giấy tờ, luôn có banner: *"Chỉ chụp phần thuốc, chỉ số và ngày khám. Không chụp họ tên, mã bệnh nhân, CCCD."*

### 👆 3. Vùng Chạm & Thao Tác Ngón Cái (Touch Target & Ergonomics)
- Mọi nút bấm, chip chọn buổi, icon bấm được đều phải đạt kích thước tối thiểu **≥ 44×44px**.
- Nút hành động chính trên di động cao **52px**, cố định ở chân màn hình (Sticky Bottom Bar) trong vùng với ngón cái dễ dàng.
- Tôn trọng lề đáy an toàn trên điện thoại tràn viền (`pb-[calc(env(safe-area-inset-bottom)+12px)]`).

---

## 4. KIẾN TRÚC RESPONSIVE & BREAKPOINTS

Dự án áp dụng mô hình 3 bố cục dựa trên cùng hệ thống token và component:

```
[Mobile: 360px – 767px]
 └── Bottom Tab Navigation Bar (3 mục: Nhà, Thêm +, Chờ duyệt)
 └── Single Column Layout (Gutter 16px)
 └── Bottom Sheet (Bo góc 20px)

[Tablet: 768px – 1023px]
 └── Navigation Rail bên trái (Rộng 72px)
 └── Nội dung căn giữa ≤ 720px
 └── Bố cục chia đôi (Split View) cho màn Duyệt

[Desktop: ≥ 1024px, chuẩn 1440px]
 └── Persistent Sidebar bên trái (Rộng 240px, có danh sách hồ sơ)
 └── Chiều rộng tối đa ≤ 1200px (mỗi cột con ≤ 720px)
 └── Master–Detail 3 cột cho màn Duyệt đơn thuốc
 └── Side Panel trượt phải 420px (thay cho Bottom Sheet)
```

---

## 5. THƯ VIỆN COMPONENT CỐT LÕI (PRIMITIVES & MOLECULES)

Dưới đây là mã nguồn HTML / Tailwind mẫu chuẩn hóa cho các component dùng chung:

### 5.1. Nút Bấm Chính (Primary Button) & Nút Phụ (Secondary)
```html
<!-- Primary Button (52px, nền xanh rừng ấm, chữ trắng 5.9:1) -->
<button type="button" class="w-full h-[52px] px-6 rounded-md bg-accent text-accent-on font-semibold text-[17px] leading-[26px] flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
  <span>Lưu vào Sổ Sức Khỏe</span>
</button>

<!-- Secondary Outlined Button (48px) -->
<button type="button" class="h-12 px-4 rounded-md border border-border bg-surface text-accent font-semibold text-[15px] leading-[22px] flex items-center justify-center gap-2 hover:bg-accent-soft transition-colors duration-150">
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
  <span>Khai thuốc bổ</span>
</button>
```

### 5.2. Chip Chọn Buổi Uống Thuốc (Time-of-day Slot Chips)
```html
<div class="grid grid-cols-4 gap-2">
  <!-- Trạng thái BẬT (Active): Nền soft + viền accent + dấu tích (không chỉ dùng màu) -->
  <button type="button" aria-pressed="true" class="h-11 px-2 rounded-sm bg-accent-soft border border-accent text-accent-hover font-semibold text-[15px] flex items-center justify-center gap-1">
    <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
    <span>Sáng</span>
  </button>

  <!-- Trạng thái TẮT (Inactive) -->
  <button type="button" aria-pressed="false" class="h-11 px-2 rounded-sm bg-surface border border-border text-text-primary font-medium text-[15px] flex items-center justify-center hover:bg-accent-soft transition-colors">
    <span>Trưa</span>
  </button>
  <button type="button" aria-pressed="false" class="h-11 px-2 rounded-sm bg-surface border border-border text-text-primary font-medium text-[15px] flex items-center justify-center hover:bg-accent-soft transition-colors">
    <span>Chiều</span>
  </button>

  <!-- Trạng thái BẬT -->
  <button type="button" aria-pressed="true" class="h-11 px-2 rounded-sm bg-accent-soft border border-accent text-accent-hover font-semibold text-[15px] flex items-center justify-center gap-1">
    <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
    <span>Tối</span>
  </button>
</div>
```

### 5.3. Thẻ Cảnh Báo Trùng Phác Đồ Thuốc (Inline Alert)
```html
<div role="alert" class="p-3 rounded-md bg-state-warningBg flex flex-col gap-2.5">
  <div class="flex items-start gap-2.5">
    <svg class="w-5 h-5 text-state-warning flex-none mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
    <p class="text-[15px] leading-[22px] text-text-primary">
      <strong class="font-semibold">Amlodipin đang được dùng</strong> (5mg, sáng, từ đơn 12/06/2026). Đơn mới thay đơn cũ hay dùng song song cả hai?
    </p>
  </div>
  <div class="grid grid-cols-2 gap-2 pl-7">
    <button type="button" class="h-11 px-3 rounded-sm bg-accent-soft border border-accent text-accent-hover font-semibold text-[15px] flex items-center justify-center gap-1">
      <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      <span>Thay thế</span>
    </button>
    <button type="button" class="h-11 px-3 rounded-sm bg-surface border border-border text-accent font-semibold text-[15px] flex items-center justify-center hover:bg-accent-soft">
      <span>Dùng song song</span>
    </button>
  </div>
</div>
```

---

## 6. DANH MỤC MÀN HÌNH & CẤU TRÚC MÃ NGUỒN MẪU

Dưới đây là đặc tả chi tiết và cấu trúc DOM chuẩn của các màn hình chính đã được thiết kế:

### 6.1. Mobile: Duyệt Đơn Thuốc (`/review/:id`)
- **Tệp tương ứng:** `AGScreenDuyet.dc.html` (bp="mobile")
- **Tính năng:**
  1. Header thu gọn: Nút lùi về, tiêu đề và số đếm tiến độ (`1 / 3`).
  2. Nửa trên: Ảnh đơn thuốc gốc (tỉ lệ 3:2, chạm phóng to, xoay ảnh, xem toàn màn hình).
  3. Nửa dưới: Form biên tập trích xuất AI (Ngày kê, Nơi khám, Danh sách thuốc, số ngày/dài hạn).
  4. Thanh cố định đáy: Nút *Lưu* (52px) cách đáy 34px.

```html
<div class="w-[390px] h-[844px] bg-bg border border-border rounded-3xl overflow-hidden relative flex flex-col font-sans shadow-float">
  <!-- Status bar & Header -->
  <div class="h-11 px-4 flex items-center justify-between font-semibold text-sm">
    <span>9:41</span>
    <div class="w-6 h-3 border border-text-primary rounded-sm p-0.5"><div class="h-full bg-text-primary rounded-xs"></div></div>
  </div>
  <div class="px-2 pb-2 flex items-center gap-1">
    <button class="w-11 h-11 flex items-center justify-center text-accent"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg></button>
    <div class="flex-1">
      <h1 class="font-semibold text-lg leading-6">Duyệt đơn thuốc</h1>
      <p class="text-xs text-text-secondary">Mẹ · tải lên 08:12 hôm nay</p>
    </div>
    <span class="px-3 text-sm font-medium text-text-secondary tabular-nums">1 / 3</span>
  </div>

  <!-- Scrollable Form Area -->
  <div class="flex-1 overflow-y-auto px-4 pb-28 space-y-4">
    <!-- Ảnh đơn thuốc -->
    <div class="h-52 rounded-md bg-stone-200 relative flex items-center justify-center overflow-hidden border border-border">
      <span class="text-sm font-medium text-text-secondary">ảnh đơn thuốc · chạm để phóng to</span>
      <div class="absolute right-2 bottom-2 flex gap-2">
        <button class="w-11 h-11 rounded-md bg-surface shadow-sm flex items-center justify-center text-text-primary"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>
        <button class="h-11 px-3 rounded-md bg-surface shadow-sm flex items-center gap-1.5 font-semibold text-sm text-accent"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>Xem ảnh gốc</button>
      </div>
    </div>

    <!-- Thông tin hành chính -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium text-text-primary">Ngày kê <span class="text-state-danger">*</span></label>
      <div class="h-12 px-3 rounded-sm border border-border bg-surface flex items-center justify-between text-base tabular-nums">01/10/2026</div>
    </div>
    <div class="space-y-1.5">
      <label class="text-sm font-medium text-text-primary">Nơi khám</label>
      <div class="h-12 px-3 rounded-sm border border-border bg-surface flex items-center text-base">BV Nhân dân Gia Định</div>
    </div>

    <!-- Thẻ thuốc 1 -->
    <div class="p-3 rounded-md border border-border bg-surface shadow-card space-y-3">
      <div class="flex justify-between items-center">
        <span class="font-semibold text-base">1. Amlodipin</span>
        <button class="w-11 h-11 flex items-center justify-center text-text-secondary"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div><span class="text-xs text-text-secondary">Hàm lượng</span><div class="h-11 px-3 rounded-sm border border-border flex items-center text-sm">5mg</div></div>
        <div><span class="text-xs text-text-secondary">Mỗi lần</span><div class="h-11 px-3 rounded-sm border border-border flex items-center justify-between text-sm">1 <span class="text-text-secondary">viên</span></div></div>
      </div>
      <!-- Slot chips -->
      <div class="grid grid-cols-4 gap-1.5">
        <div class="h-10 rounded-sm bg-accent-soft border border-accent text-accent-hover font-semibold text-xs flex items-center justify-center">✓ Sáng</div>
        <div class="h-10 rounded-sm border border-border text-text-secondary text-xs flex items-center justify-center">Trưa</div>
        <div class="h-10 rounded-sm border border-border text-text-secondary text-xs flex items-center justify-center">Chiều</div>
        <div class="h-10 rounded-sm border border-border text-text-secondary text-xs flex items-center justify-center">Tối</div>
      </div>
    </div>
  </div>

  <!-- Sticky Footer Action -->
  <div class="absolute left-0 right-0 bottom-0 bg-surface shadow-sheet p-4 pb-8 flex gap-2">
    <button class="h-13 px-4 rounded-md border border-border text-accent font-semibold text-[17px]">Loại bỏ</button>
    <button class="flex-1 h-13 rounded-md bg-accent text-accent-on font-semibold text-[17px] flex items-center justify-center hover:bg-accent-hover">Lưu vào Sổ Sức Khỏe</button>
  </div>
</div>
```

---

### 6.2. Desktop: Duyệt Đơn Thuốc Master–Detail (`1440px`)
- **Tệp tương ứng:** `An Gia - Web.dc.html` (#s1, 1a)
- **Cấu trúc 3 phân vùng (Grid):**
  - Cột 1: `Sidebar` 240px.
  - Cột 2: Danh sách giấy tờ chờ duyệt `360px` (cuộn độc lập).
  - Cột 3: Khung soi ảnh chứng từ gốc `300px` (có kính lúp, zoom, xoay).
  - Cột 4: Form biên tập trích xuất `≤ 720px` với phím tắt `Enter` lưu, `←/→` chuyển giấy.

---

### 6.3. Tablet: Duyệt Đơn Thuốc Chia Đôi (`768px`)
- **Tệp tương ứng:** `An Gia - Web.dc.html` (#s1, 1d) & `AGScreenDuyet.dc.html` (bp="tablet")
- **Cấu trúc 2 phân vùng (Split View):**
  - Cột dọc: `AGRail` 72px (icon + chữ 14px).
  - Khung chia đôi: Nửa trái ảnh tài liệu 272px | Nửa phải form biên tập 3 tầng.
  - Thanh chân trang: Nút đôi ghim đáy thuận tiện cho 2 ngón tay cái cầm tablet.

---

### 6.4. Mobile: Diễn Biến Huyết Áp & Biểu Đồ Chuẩn Y Khoa BR-033
- **Tệp tương ứng:** `AGScreenDienBien.dc.html` (bp="mobile")
- **Đặc tả SVG Chart:**
  - Tâm thu (Systolic): Nét liền `#2F6F5E`, độ dày `2.5px`, chấm tròn đặc `r=3.5px` (điểm mới nhất `r=4.5px`).
  - Tâm trương (Diastolic): Nét đứt `#6B4FA8`, `stroke-dasharray="6 4"`, chấm tròn rỗng viền tím `fill="#FFFFFF"`.
  - Nhãn trực tiếp ở cuối mỗi đường (Direct Labeling), không bắt người dùng tra cứu bảng màu.
  - Vùng giai đoạn dùng thuốc: `fill="#E3EFEA"`. Vùng ngưng thuốc: SVG Pattern sọc gạch chéo góc 45 độ trên nền `#F1ECE4`.

---

### 6.5. Mobile: Màn Khóa Nhắc Thuốc (ntfy cho Ông Bà)
- **Tệp tương ứng:** `An Gia - Màn hình.dc.html` (#s8, 8a)
- **Đặc tả UI dành riêng cho người cao tuổi:**
  - Nền tối sẫm `#2A3634` làm nổi bật thông báo.
  - Đồng hồ hiển thị cực lớn: `88px/96px tabular-nums`.
  - Card thông báo bo tròn mềm mại `rounded-2xl` trên nền trắng ngà `#FAF8F5`.
  - Tiêu đề nhắc việc thân thương: *Thuốc buổi sáng — 07:00* (19px SemiBold).
  - Danh sách thuốc gạch đầu dòng rõ ràng, cỡ chữ 17px dễ đọc không cần kính lão:
    - `• Amlodipin 5mg — 1 viên`
    - `• Metformin 500mg — 1 viên`
    - `• Canxi — 1 viên`
  - Không chứa link hay bắt nhập captcha/mã PIN phức tạp.

---

### 6.6. Mobile & Desktop: Hồ Sơ Xét Nghiệm & Giấy Tờ Khám
- **Tệp tương ứng:** `SCREEN_4` (Mobile) & `SCREEN_2` (Desktop)
- **Đặc tả UI chỉ số xét nghiệm:**
  - Thẻ chỉ số hiển thị giá trị lớn `font-semibold text-3xl tabular-nums` (ví dụ `7.4 mmol/L`, `7.1%`).
  - Đi kèm nhãn khoảng tham chiếu tiêu chuẩn in trên phiếu: `Tham chiếu: 3.9 - 6.4`.
  - Sparkline xu hướng 3 đợt gần nhất (ví dụ: `8.2% → 7.5% → 7.1%`, xu hướng giảm dần ổn định).
  - Nút *Xem ảnh gốc* gắn cố định trên góc thẻ phiếu xét nghiệm.

---

## 7. CHECKLIST KIỂM THỬ TRƯỚC KHI RELEASE (QA & A11Y)

Đội ngũ phát triển cần tick đủ các mục sau trước khi merge code lên môi trường Production:

- [ ] **Accessibility (A11y):** Tương phản chữ đạt chuẩn WCAG 2.1 AA (Kiểm tra bằng Lighthouse / axe DevTools, score ≥ 98).
- [ ] **Tabular Nums:** Tất cả các bảng số liệu, huyết áp, đường huyết, ngày tháng đều có class `tabular-nums`.
- [ ] **Touch Target:** Tất cả nút bấm, icon bấm được trên di động và tablet đều có vùng chạm tối thiểu `44×44px`.
- [ ] **Quy tắc BR-033:** Không có bất kỳ badge hoặc chữ cảnh báo màu đỏ nào phán xét chỉ số huyết áp / đường huyết.
- [ ] **Bảo mật ảnh gốc:** Mọi thẻ thuốc / xét nghiệm đều liên kết được về ảnh tài liệu gốc qua modal hoặc tab mới.
- [ ] **Keyboard Navigation:** Trên Desktop, bấm phím `Enter` thực hiện lưu đơn duyệt, phím mũi tên `← / →` chuyển qua lại giữa các chứng từ chờ duyệt.
- [ ] **Print Stylesheet:** Màn hình *Tóm tắt đi khám A4* (`AGProfileHeaderWide` / `7a`) in ra máy in hoặc lưu PDF giữ đúng khổ giấy 1 trang A4 chuẩn (không in kèm thanh Sidebar).

---
*Tài liệu được kết xuất tự động từ hệ thống Design System AN GIA. Mọi thắc mắc kỹ thuật vui lòng liên hệ Lead Designer / Tech Lead dự án.*
