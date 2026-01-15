// ═══════════════════════════════════════════════════════════════════
// 🔔 PUSH NOTIFICATIONS UTILITY
// ═══════════════════════════════════════════════════════════════════

import { supabase } from './supabase';

// VAPID Public Key - يجب تغييرها بمفتاحك الخاص
// يمكنك توليده من: https://web-push-codelab.glitch.me/
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Check if Service Worker is supported
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Worker not supported in this browser');
    return null;
  }

  // Skip Service Worker in Figma preview (iframe context)
  const isFigmaPreview = window.location.hostname.includes('figma');
  const isIframe = window.self !== window.top;
  
  if (isFigmaPreview || isIframe) {
    console.log('⚠️ Service Worker skipped (running in Figma preview/iframe)');
    return null;
  }

  // Check if sw.js is accessible
  try {
    const swResponse = await fetch('/sw.js', { method: 'HEAD' });
    if (!swResponse.ok) {
      console.warn('⚠️ Service Worker file not found at /sw.js');
      return null;
    }
  } catch (error) {
    console.warn('⚠️ Cannot check Service Worker file:', error);
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.warn('⚠️ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('Notification permission:', permission);
  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    // 1. Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('No service worker registration');
      return false;
    }

    // 2. Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // 3. Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('✅ Push subscription:', subscription);

    // 4. Save subscription to Supabase
    const subscriptionJSON = subscription.toJSON();
    
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscriptionJSON.endpoint || '',
        p256dh: subscriptionJSON.keys?.p256dh || '',
        auth: subscriptionJSON.keys?.auth || '',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('Error saving subscription:', error);
      return false;
    }

    console.log('✅ Subscription saved to database');
    return true;

  } catch (error) {
    console.error('Error subscribing to push:', error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push');

      // Remove from database
      const subscriptionJSON = subscription.toJSON();
      await supabase
        .from('push_subscriptions')
        .delete()
        .match({ 
          user_id: userId,
          endpoint: subscriptionJSON.endpoint 
        });
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
}

/**
 * Check if push notifications are supported and enabled
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Show local notification (without push)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png',
      badge: 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png',
      vibrate: [200, 100, 200],
      ...options
    });
  } else if (Notification.permission === 'default') {
    // Request permission if not decided yet
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png',
        badge: 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png',
        vibrate: [200, 100, 200],
        ...options
      });
    }
  }
}

/**
 * Test push notification
 */
export async function testPushNotification(): Promise<void> {
  await showLocalNotification('نورنا - اختبار', {
    body: 'الإشعارات تعمل بنجاح! 🎉',
    tag: 'test-notification',
    requireInteraction: false,
  });
}