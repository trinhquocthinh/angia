import { useEffect, useState } from 'react';
import { AuthLayout } from './components/AuthLayout';
import { LoginPanel } from './components/LoginPanel';

export function LoginPage({ hasAuthError }: { hasAuthError: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    // Nút trở lại của trình duyệt có thể phục hồi trang từ bfcache.
    const resetSubmitting = () => setIsSubmitting(false);
    window.addEventListener('pageshow', resetSubmitting);
    return () => window.removeEventListener('pageshow', resetSubmitting);
  }, []);

  const startLogin = () => {
    setIsSubmitting(true);
    window.location.assign('/api/auth/login');
  };

  return (
    <AuthLayout>
      <LoginPanel hasAuthError={hasAuthError} isSubmitting={isSubmitting} onLogin={startLogin} />
    </AuthLayout>
  );
}
