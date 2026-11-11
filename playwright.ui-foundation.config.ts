import base from './playwright.body-map.config';
export default {
  ...base,
  testMatch: '**/uiFoundation.spec.ts',
  webServer: {
    ...base.webServer,
    command: 'yarn workspace @angia/web exec vite --config vite.body-map.config.ts --configLoader runner',
  },
};
