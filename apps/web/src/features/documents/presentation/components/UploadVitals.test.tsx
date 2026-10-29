import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type * as ProfileChoicesModule from './ProfileChoices';
import type { UploadQueuePanel } from './UploadQueuePanel';
import { UploadWorkspace } from './UploadWorkspace';

const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  cursor: 0,
  submit: vi.fn(),
  choices: null as React.ComponentProps<typeof ProfileChoicesModule.ProfileChoices> | null,
  panel: null as React.ComponentProps<typeof UploadQueuePanel> | null,
}));
vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useState: (initial: unknown) => {
    const slot = harness.cursor++;
    if (!(slot in harness.slots)) harness.slots[slot] = initial;
    return [
      harness.slots[slot],
      (value: unknown) => {
        harness.slots[slot] = value;
      },
    ];
  },
}));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../application/useUploadQueue', () => ({
  useUploadQueue: () => ({
    items: [],
    submit: harness.submit,
    summary: { total: 1, ready: 1, done: 0, active: 0, needsRedaction: 0, failed: 0 },
  }),
}));
vi.mock('./ProfileChoices', async (original) => {
  const actual = await original<typeof ProfileChoicesModule>();
  return {
    ProfileChoices: (props: React.ComponentProps<typeof ProfileChoicesModule.ProfileChoices>) => {
      harness.choices = props;
      return <actual.ProfileChoices {...props} />;
    },
  };
});
vi.mock('./UploadQueuePanel', () => ({
  UploadQueuePanel: (props: React.ComponentProps<typeof UploadQueuePanel>) => {
    harness.panel = props;
    return null;
  },
}));
const adult = {
  id: 'adult',
  displayName: 'Mẹ',
  birthYear: 1986,
  vitalsEnabled: null,
  consentStatus: 'confirmed',
} as HealthProfile;
const child = { ...adult, id: 'child', displayName: 'Bé', birthYear: new Date().getFullYear() - 5 };
const props = {
  uploader: {} as React.ComponentProps<typeof UploadWorkspace>['uploader'],
  csrfToken: 'csrf',
  usage: null,
  profiles: [adult, child],
  scanQuota: {
    data: undefined,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as React.ComponentProps<typeof UploadWorkspace>['scanQuota'],
  loading: false,
  error: false,
  retry: vi.fn(),
};
function render(profiles = props.profiles) {
  harness.cursor = 0;
  return renderToStaticMarkup(<UploadWorkspace {...props} profiles={profiles} />);
}
afterEach(() => {
  harness.slots = [];
  harness.submit.mockClear();
});

describe('TC-447 — đổi hồ sơ khi tải ảnh', () => {
  it('bỏ Máy đo cá nhân khi chọn trẻ và gửi null; quay về người lớn không khôi phục loại cũ', () => {
    render();
    harness.choices!.onProfile('adult');
    render();
    harness.choices!.onType('device_reading');
    render();
    harness.choices!.onProfile('child');
    expect(render()).not.toContain('Máy đo cá nhân');
    expect(harness.choices!.declaredType).toBeNull();
    harness.panel!.onSubmit();
    expect(harness.submit).toHaveBeenCalledExactlyOnceWith('child', null);
    harness.choices!.onProfile('adult');
    expect(render()).toContain('Máy đo cá nhân');
    expect(harness.choices!.declaredType).toBeNull();
  });
  it('giữ đơn thuốc khi đổi hồ sơ; trẻ bật theo dõi cho chọn máy đo', () => {
    render();
    harness.choices!.onProfile('adult');
    render();
    harness.choices!.onType('prescription');
    render();
    harness.choices!.onProfile('child');
    render();
    expect(harness.choices!.declaredType).toBe('prescription');
    expect(render([adult, { ...child, vitalsEnabled: true }])).toContain('Máy đo cá nhân');
  });
  it('hồ sơ cập nhật từ nền không gửi lựa chọn máy đo đã bị ẩn', () => {
    render();
    harness.choices!.onProfile('adult');
    render();
    harness.choices!.onType('device_reading');
    render();
    const html = render([{ ...adult, birthYear: child.birthYear }]);
    expect(html).not.toContain('Máy đo cá nhân');
    harness.panel!.onSubmit();
    expect(harness.submit).toHaveBeenCalledExactlyOnceWith('adult', null);
  });
});

it('TC-447 — trẻ bật theo dõi giữ lựa chọn máy đo và gửi đúng loại', () => {
  const profiles = [adult, { ...child, vitalsEnabled: true }];
  render(profiles);
  harness.choices!.onProfile('adult');
  render(profiles);
  harness.choices!.onType('device_reading');
  render(profiles);
  harness.choices!.onProfile('child');
  expect(render(profiles)).toContain('Máy đo cá nhân');
  expect(harness.choices!.declaredType).toBe('device_reading');
  harness.panel!.onSubmit();
  expect(harness.submit).toHaveBeenCalledExactlyOnceWith('child', 'device_reading');
});
