// Notification Utilities for Nooruna App

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private audioContext: AudioContext | null = null;

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request permission to show notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show a notification
   */
  async show(options: NotificationOptions & { soundType?: 'default' | 'rose' | 'heart' | 'message' }): Promise<void> {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        badge: options.icon || '/logo.png',
        dir: 'rtl',
        lang: 'ar',
      });

      // Play sound if not silent
      if (!options.silent) {
        this.playNotificationSound(options.soundType || 'default');
      }

      // Auto-close after 10 seconds if not requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Play notification sound using Web Audio API
   */
  private playNotificationSound(type: 'default' | 'rose' | 'heart' | 'message' = 'default'): void {
    try {
      // Create audio context if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const context = this.audioContext;
      
      if (type === 'rose') {
        // Soft, romantic chime for rose
        this.playRoseSound(context);
      } else if (type === 'heart') {
        // Warm, loving tone for heart
        this.playHeartSound(context);
      } else if (type === 'message') {
        // Quick, cheerful notification for message
        this.playMessageSound(context);
      } else {
        // Default bell sound
        this.playDefaultSound(context);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  private playDefaultSound(context: AudioContext): void {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Bell-like sound with multiple frequencies
    oscillator.frequency.setValueAtTime(800, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);

    // Second chime for harmony
    const oscillator2 = context.createOscillator();
    const gainNode2 = context.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(context.destination);
    
    oscillator2.frequency.setValueAtTime(1000, context.currentTime + 0.15);
    oscillator2.frequency.exponentialRampToValueAtTime(500, context.currentTime + 0.25);
    
    gainNode2.gain.setValueAtTime(0.2, context.currentTime + 0.15);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.6);
    
    oscillator2.start(context.currentTime + 0.15);
    oscillator2.stop(context.currentTime + 0.6);
  }

  private playRoseSound(context: AudioContext): void {
    // Soft, romantic ascending chime
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      
      osc.connect(gain);
      gain.connect(context.destination);
      
      osc.frequency.setValueAtTime(freq, context.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.2, context.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + i * 0.15 + 0.5);
      
      osc.start(context.currentTime + i * 0.15);
      osc.stop(context.currentTime + i * 0.15 + 0.5);
    });
  }

  private playHeartSound(context: AudioContext): void {
    // Warm, double-beat like heartbeat
    const notes = [392, 523.25]; // G4, C5
    [0, 0.2].forEach((delay, i) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      
      osc.connect(gain);
      gain.connect(context.destination);
      
      osc.frequency.setValueAtTime(notes[i % 2], context.currentTime + delay);
      gain.gain.setValueAtTime(0.25, context.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + delay + 0.3);
      
      osc.start(context.currentTime + delay);
      osc.stop(context.currentTime + delay + 0.3);
    });
  }

  private playMessageSound(context: AudioContext): void {
    // Quick, cheerful two-tone notification
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.connect(gain);
    gain.connect(context.destination);
    
    osc.frequency.setValueAtTime(600, context.currentTime);
    osc.frequency.setValueAtTime(800, context.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    
    osc.start(context.currentTime);
    osc.stop(context.currentTime + 0.3);
  }

  /**
   * Show prayer time notification
   */
  async notifyPrayerTime(prayerName: string, arabicName: string): Promise<void> {
    await this.show({
      title: `حان الآن وقت ${arabicName}`,
      body: `تذكير بصلاة ${arabicName}. حافظ على صلاتك 🕌`,
      tag: `prayer-${prayerName}`,
      requireInteraction: true,
      silent: false,
    });
  }

  /**
   * Show gift received notification
   */
  async notifyGiftReceived(senderName: string, giftType: 'rose' | 'heart' | 'message'): Promise<void> {
    const giftConfig = {
      rose: { emoji: '🌹', text: 'وردة' },
      heart: { emoji: '❤️', text: 'قلب' },
      message: { emoji: '💌', text: 'رسالة' }
    };
    
    const config = giftConfig[giftType];
    
    await this.show({
      title: `${config.emoji} ${senderName}`,
      body: `أرسل لك ${config.text}`,
      tag: giftType,
      requireInteraction: true,
      silent: false,
      soundType: giftType,
    });
  }

  /**
   * Show athkar reminder notification
   */
  async notifyAthkar(type: 'morning' | 'evening'): Promise<void> {
    const arabicType = type === 'morning' ? 'الصباح' : 'المساء';
    const timeEmoji = type === 'morning' ? '🌅' : '🌙';
    
    await this.show({
      title: `${timeEmoji} تذكير بأذكار ${arabicType}`,
      body: `حان وقت قراءة أذكار ${arabicType}. لا تنسَ أذكارك اليومية!`,
      tag: `athkar-${type}`,
      requireInteraction: false,
      silent: false,
    });
  }

  /**
   * Show Quran reading reminder
   */
  async notifyQuranReading(surahName: string): Promise<void> {
    await this.show({
      title: `📖 تذكير بقراءة القرآن`,
      body: `حان وقت قراءة ${surahName}. اغتنم الأجر!`,
      tag: 'quran-reading',
      requireInteraction: false,
      silent: false,
    });
  }

  /**
   * Check if permission is granted
   */
  isGranted(): boolean {
    return this.permission === 'granted';
  }
}

// Export singleton instance
export const notificationService = new NotificationService();