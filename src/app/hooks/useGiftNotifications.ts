// ═══════════════════════════════════════════════════════════════════
// 🎁 GIFT NOTIFICATIONS HOOK
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { showLocalNotification } from '../utils/pushNotifications';
import { toast } from 'sonner';

interface UseGiftNotificationsProps {
  userId: string | null;
  enabled?: boolean;
  onGiftReceived?: (gift: any) => void; // Callback للـ modal
}

export function useGiftNotifications({ userId, enabled = true, onGiftReceived }: UseGiftNotificationsProps) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId || !enabled) {
      console.log('🎁 Gift notifications disabled:', { userId, enabled });
      return;
    }

    console.log('🎁 Setting up gift notifications for user:', userId);

    // Subscribe to new gifts in realtime
    const channel = supabase
      .channel(`gifts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gifts',
          filter: `to_user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('🎁 NEW GIFT RECEIVED:', payload);

          const gift = payload.new as any;

          // Get partner name from localStorage (faster and simpler!)
          let senderName = 'شريكك';
          try {
            const userStr = localStorage.getItem('nooruna_user');
            if (userStr) {
              const userData = JSON.parse(userStr);
              // We already have partner name in localStorage!
              senderName = userData.partnerName || userData.partner_name || 'شريكك';
            }
          } catch (e) {
            console.error('Error reading partner name from localStorage:', e);
          }

          // Prepare notification
          let title = '🎁 هدية جديدة!';
          let body = '';
          let icon = 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png';

          if (gift.gift_type === 'rose') {
            title = '🌹 وردة من ' + senderName;
            body = 'أرسل لك وردة جميلة';
          } else if (gift.gift_type === 'heart') {
            title = '❤️ قلب من ' + senderName;
            body = 'أرسل لك قلباً';
          } else if (gift.gift_type === 'message') {
            title = '💌 رسالة من ' + senderName;
            body = gift.message_text || 'أرسل لك رسالة';
          }

          // Show notification
          try {
            await showLocalNotification(title, {
              body,
              icon,
              tag: `gift-${gift.id}`,
              requireInteraction: true,
              vibrate: [200, 100, 200, 100, 200],
              data: {
                url: '/',
                giftId: gift.id,
                type: 'gift'
              }
            } as any);

            console.log('✅ Gift notification sent successfully');

            // Play sound (if supported)
            if ('Audio' in window) {
              try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+mdryyHYnBSx+zPDajkAJE2S36+mjUBALTKXh8bllHAU2jdXzzn0pBSl6yO/bk0QKFF+16OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhdr');
                audio.volume = 0.3;
                audio.play().catch(() => { });
              } catch (e) {
                // Ignore audio errors
              }
            }

            // Haptic feedback (if supported on mobile)
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }

            // Trigger the callback if provided
            if (onGiftReceived) {
              onGiftReceived(gift);
            }

          } catch (error) {
            console.error('❌ Error showing gift notification:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gifts'
        },
        async (payload) => {
          console.log('🔄 UPDATE ON GIFTS TABLE:', payload);

          const gift = payload.new as any;
          const oldGift = payload.old as any;

          // 1. التأكد أن الهديّة مرسلة مني أنا (عشان أعرف تفاعل شريكي)
          if (gift.from_user_id !== userId) {
            console.log('⏩ Skipping update: Not my gift');
            return;
          }

          // 2. التأكد أن هناك تفاعل جديد
          // إذا كانت REPLICA IDENTITY FULL مفعلة، سنقارن الجديد بالقديم
          // إذا لم تكن مفعلة، سنكتفي بالتأكد من وجود تفاعل حالي وأن الحدث ليس مجرد "قراءة" للهديّة
          const hasNewReaction = gift.reaction && (!oldGift || gift.reaction !== oldGift.reaction);

          if (hasNewReaction) {
            console.log('✨ REACTION RECEIVED FOR SENT GIFT:', gift);

            // Get reaction label
            const reactionIcons: Record<string, string> = {
              like: '👍',
              love: '❤️',
              fire: '🔥',
              star: '⭐',
              pray: '🤲'
            };

            const reactionIcon = reactionIcons[gift.reaction] || '✨';

            // Show toast to the sender
            toast.success(`تفاعل شريكك مع هديتك! ${reactionIcon}`, {
              description: 'شريكك رأى هديتك وتفاعل معها الآن.',
              duration: 5000,
              position: 'top-center'
            });

            // Optional: Show push notification if app is in background
            if (document.hidden) {
              await showLocalNotification('✨ تفاعل جديد!', {
                body: `تفاعل شريكك مع هديتك ${reactionIcon}`,
                icon: 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png',
                data: { url: '/' }
              });
            }
          } else {
            console.log('ℹ️ No change in reaction found in this update');
          }
        }
      )
      .subscribe((status) => {
        console.log('🎁 Gift channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription for gifts is ACTIVE');
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log('🎁 Cleaning up gift notifications');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, enabled, onGiftReceived]);

  return {
    isListening: !!channelRef.current
  };
}