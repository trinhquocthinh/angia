import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../src/shared/theme/ThemeProvider';
import { ThemeSwitch } from '../src/shared/theme/ThemeSwitch';
import { SummaryPreview } from '../src/features/visitSummary/presentation/SummaryPreview';
import '../src/app/styles.css';
import '../src/features/visitSummary/presentation/visit-summary.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ThemeSwitch />
      <SummaryPreview
        summary={{
          profile: { id: 'p', displayName: 'Hồ sơ thử', birthYear: null },
          showsVitals: true,
          createdAt: '2026-11-11T00:00:00.000Z',
          from: '2026-10-11',
          to: '2026-11-11',
          currentMedications: [],
          measurements: [],
          latestLabResults: [],
          adherencePeriods: [],
          painIssues: [],
          disclaimer: 'Tài liệu tổng hợp từ gia đình, không phải chỉ định y khoa.',
        }}
      />
    </ThemeProvider>
  </StrictMode>,
);
