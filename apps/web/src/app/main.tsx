import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { isConsentInvitationRoute } from '@src/features/auth/application/isConsentInvitationRoute';
import { prefetchCurrentSession } from '@src/features/auth/application/prefetchCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { hideSplash } from './hideSplash';
import { routeTree } from './routeTree.gen';
import './styles.css';

const queryClient = new QueryClient();
// Trang mời đồng thuận không cần phiên (SessionBoundary bỏ qua AuthBoundary) nên không gọi /api/me.
if (!isConsentInvitationRoute(window.location.pathname)) {
  void prefetchCurrentSession(queryClient, fetchCurrentSession);
}
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  // Số ảnh vừa gửi từ /upload để Trang chủ hiển thị thông báo (không đưa vào URL).
  interface HistoryState {
    uploadedCount?: number;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Không tìm thấy phần tử #root');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
hideSplash();
