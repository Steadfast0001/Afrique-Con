import { useState, useRef, useEffect, useCallback } from 'react';

export function usePaymentPolling({ onSuccess, onFailed }) {
  const [status, setStatus] = useState('idle'); // idle, pending, success, failed
  const [error, setError] = useState('');
  const pollingRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((ref) => {
    stopPolling();
    setStatus('pending');
    setError('');

    pollingRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/campay-status?ref=${ref}`, { method: 'GET' });
        const statusText = await statusRes.text();
        let statusData;
        try {
          statusData = JSON.parse(statusText);
        } catch {
          console.warn('Status endpoint returned non-JSON:', statusText);
          return;
        }

        const resStatus = (statusData.status || '').toUpperCase();
        if (resStatus === 'SUCCESSFUL' || resStatus === 'SUCCESS') {
          stopPolling();
          setStatus('success');
          if (onSuccess) onSuccess(statusData);
        } else if (resStatus === 'FAILED') {
          stopPolling();
          setStatus('failed');
          const errMsg = statusData.description || 'Transaction declined or failed on phone.';
          setError(errMsg);
          if (onFailed) onFailed(errMsg);
        }
      } catch (err) {
        console.error('Error polling transaction status:', err);
      }
    }, 3000);
  }, [stopPolling, onSuccess, onFailed]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    status,
    setStatus,
    error,
    setError,
    startPolling,
    stopPolling,
    isPolling: !!pollingRef.current
  };
}
