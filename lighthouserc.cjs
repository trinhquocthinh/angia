// eslint-disable-next-line @typescript-eslint/no-require-imports -- LHCI nạp cấu hình CommonJS.
const { chromium } = require('playwright-core');

module.exports = {
  ci: {
    collect: {
      chromePath: chromium.executablePath(),
      startServerCommand: 'yarn tsx apps/web/e2e/a11y/lighthouseServer.ts',
      startServerReadyPattern: 'TODAY_A11Y_READY',
      startServerReadyTimeout: 60000,
      url: ['http://127.0.0.1:5177/?a11yTheme=light', 'http://127.0.0.1:5177/?a11yTheme=dark'],
      numberOfRuns: 1,
      settings: {
        onlyCategories: ['accessibility'],
        screenEmulation: { mobile: true, width: 360, height: 800, deviceScaleFactor: 1, disabled: false },
      },
    },
    assert: {
      assertions: {
        'color-contrast': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.playwright/lighthouse',
    },
  },
};
