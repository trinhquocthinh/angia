import { useEffect, useState } from 'react';
import { ENROLL_REAUTH_KEY, readAccountStorage, writeAccountStorage } from './accountSessionStorage';
import { enrollmentStage } from './enrollmentStage';
export function useEnrollmentVerification() {
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function expire() {
    writeAccountStorage(ENROLL_REAUTH_KEY, null);
    setVerified(false);
    setError('Phiên xác minh đã hết hạn. Vui lòng xác minh lại.');
  }
  useEffect(() => {
    function check() {
      const now = Date.now();
      const marker = readAccountStorage(ENROLL_REAUTH_KEY);
      const stage = enrollmentStage(marker, now);
      if (stage === 'returning') {
        writeAccountStorage(ENROLL_REAUTH_KEY, JSON.stringify({ verifiedAt: now }));
        setVerified(true);
      } else if (stage === 'verified') setVerified(true);
      else {
        writeAccountStorage(ENROLL_REAUTH_KEY, null);
        setVerified(false);
      }
    }
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, []);
  function reauthenticate() {
    writeAccountStorage(ENROLL_REAUTH_KEY, String(Date.now()));
    window.location.assign('/api/auth/login?reauth=1');
  }
  return { verified, error, expire, reauthenticate };
}
