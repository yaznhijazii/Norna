import { useEffect, useState } from 'react';
import { 
  subscribeToPushNotifications, 
  isPushNotificationSupported,
  getNotificationPermissionStatus,
  registerServiceWorker
} from '../utils/pushNotifications';

interface UsePushNotificationsProps {
  userId: string | null;
  enabled?: boolean;
}

export function usePushNotifications({ userId, enabled = true }: UsePushNotificationsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported(isPushNotificationSupported());
    setPermission(getNotificationPermissionStatus());
  }, []);

  useEffect(() => {
    if (!userId || !enabled || !isSupported) return;

    // Auto-subscribe if permission is granted
    if (permission === 'granted' && !isSubscribed) {
      subscribeToPushNotifications(userId).then((success) => {
        setIsSubscribed(success);
      });
    }

    // Register service worker (will skip in Figma preview)
    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log('✅ Service Worker ready for push notifications');
      } else {
        console.log('ℹ️ Service Worker not available (expected in Figma preview)');
      }
    });
  }, [userId, enabled, isSupported, permission, isSubscribed]);

  const requestPermission = async () => {
    if (!userId || !isSupported) return false;

    const newPermission = await Notification.requestPermission();
    setPermission(newPermission);

    if (newPermission === 'granted') {
      const success = await subscribeToPushNotifications(userId);
      setIsSubscribed(success);
      return success;
    }

    return false;
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
  };
}