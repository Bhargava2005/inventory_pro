import { useEffect } from 'react';
import { authAPI } from '../../api/auth';
import useAuthStore from '../../store/authStore';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export default function Heartbeat() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial heartbeat
    authAPI.heartbeat().catch(() => {});

    const interval = setInterval(() => {
      authAPI.heartbeat().catch((err) => {
        console.error('Heartbeat failed', err);
      });
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return null;
}
