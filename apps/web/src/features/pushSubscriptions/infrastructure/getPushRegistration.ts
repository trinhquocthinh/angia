export async function getPushRegistration(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none',
  });
  if (registration.active) return registration;
  await new Promise<void>((resolve, reject) => {
    const worker = registration.installing ?? registration.waiting;
    if (!worker) {
      reject(new Error('Chưa chuẩn bị được thông báo. Vui lòng tải lại trang.'));
      return;
    }
    const timer = setTimeout(() => {
      worker.removeEventListener('statechange', check);
      reject(new Error('Chuẩn bị thông báo quá lâu. Vui lòng thử lại.'));
    }, 15_000);
    const check = () => {
      if (worker.state === 'activated' || worker.state === 'redundant') {
        clearTimeout(timer);
        worker.removeEventListener('statechange', check);
        if (worker.state === 'activated') resolve();
        else reject(new Error('Không kích hoạt được thông báo.'));
      }
    };
    worker.addEventListener('statechange', check);
    check();
  });
  return registration;
}
