import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@src/shared/theme/ThemeProvider';
import { isConsentInvitationRoute } from '@src/features/auth/application/isConsentInvitationRoute';
import { prefetchCurrentSession } from '@src/features/auth/application/prefetchCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
// Nạp sớm để bắt `beforeinstallprompt` của Android ngay khi trang tải, trước khi mở trang Thông báo.
import '@src/features/pushSubscriptions/infrastructure/browserInstallPrompt';
import { hideSplash } from './hideSplash';
import { routeTree } from './routeTree.gen';
import './styles.css';

const queryClient = new QueryClient();
// Trang mời đồng thuận không cần phiên (SessionBoundary bỏ qua AuthBoundary) nên không gọi /api/me.
if (!isConsentInvitationRoute(window.location.pathname)) {
  void prefetchCurrentSession(queryClient, fetchCurrentSession);
}
// Design §11.4.1: chuyển trang mờ dần qua View Transitions; trình duyệt không hỗ trợ thì đổi trang tức thì.
const router = createRouter({ routeTree, defaultViewTransition: true });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  // Số ảnh vừa gửi từ /upload để Trang chủ hiển thị thông báo (không đưa vào URL).
  interface HistoryState {
    uploadedCount?: number;
    deletedDocument?: boolean;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Không tìm thấy phần tử #root');

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
hideSplash();
