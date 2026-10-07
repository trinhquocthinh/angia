import { describe, expect, it } from 'vitest';
import { createStubApp } from './createStubApp.js';
import { HEALTH_DATA_ROUTES, NON_HEALTH_DATA_ROUTES } from './healthDataRoutes.js';

const registered = () =>
  [
    ...new Set(
      createStubApp()
        .routes.filter((route) => route.method !== 'ALL')
        .map((route) => `${route.method} ${route.path}`),
    ),
  ].sort();

describe('Kiểm kê route cho NFR-4', () => {
  it('TC-107: mọi route của app được phân loại đúng một lần, không có mục thừa', () => {
    const healthData = Object.keys(HEALTH_DATA_ROUTES);
    expect(healthData.filter((route) => NON_HEALTH_DATA_ROUTES.includes(route))).toEqual([]);
    expect([...healthData, ...NON_HEALTH_DATA_ROUTES].sort()).toEqual(registered());
  });
});
