import { InteractiveTimeline } from './components/InteractiveTimeline';
import { DailyDuaaCard } from './components/DailyDuaaCard';
import { DailyPartnerStats } from './components/DailyPartnerStats';
import { AudioCenter } from './components/AudioCenter';
import { ReadingsCenter } from './components/ReadingsCenter';
import { DuaaJournal } from './components/DuaaJournal';
import { FloatingMenu } from './components/FloatingMenu';
import { SendGiftModal } from './components/SendGiftModal';
import { ReceiveGiftModal } from './components/ReceiveGiftModal';
import { NotificationBanner } from './components/NotificationBanner';
import { SettingsModal } from './components/SettingsModal';
import { ChallengesModal } from './components/ChallengesModal';
import { ChallengesCard, UserChallengeData } from './components/ChallengesCard';
import { DailyHeader } from './components/DailyHeader';
import { supabase } from './utils/supabase';
import { LoginScreen } from './components/LoginScreen';
import { Toaster } from './components/ui/sonner';
import { useState, useEffect } from 'react';
import { useTimeOfDay, timeOfDayConfig } from './hooks/useTimeOfDay';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useNotifications } from './hooks/useNotifications';
import { usePartnerActivity } from './hooks/usePartnerActivity';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useGiftNotifications } from './hooks/useGiftNotifications';
import { notificationService } from './utils/notifications';

const logoImage = 'https://raw.githubusercontent.com/yaznhijazii/personalsfiles/refs/heads/main/norna.png';

interface User {
  username: string;
  name: string;
  userId: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showDuaaJournal, setShowDuaaJournal] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<UserChallengeData[]>([]);
  const [showSendGift, setShowSendGift] = useState(false);
  const [receivedGift, setReceivedGift] = useState<any>(null);
  const [partnerName, setPartnerName] = useState('');
  const [themeMode, setThemeMode] = useState<'auto' | 'light' | 'dark'>('auto');
  const [partnerId, setPartnerId] = useState<string | undefined>(undefined);
  const [showPartnerStats, setShowPartnerStats] = useState(false);
  const systemTimeOfDay = useTimeOfDay();

  // Load theme mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') as 'auto' | 'light' | 'dark' | null;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('nooruna_user');
        const storedToken = localStorage.getItem('nooruna_token');

        console.log('🔐 Checking authentication...');
        console.log('  - Stored user:', storedUser ? 'Found' : 'Not found');
        console.log('  - Stored token:', storedToken ? 'Found' : 'Not found');

        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          console.log('✅ User logged in:', user.username);
          console.log('📋 User object from localStorage:', user);

          // Fix: Check if userId exists, otherwise use id
          if (!user.userId && user.id) {
            console.log('⚠️ Fixing userId field - converting id to userId');
            user.userId = user.id;
          }

          setCurrentUser(user);

          // Load partner ID if exists
          const { data: userData, error: partnerError } = await supabase
            .from('users')
            .select('partner_id, partner_nickname')
            .eq('id', user.userId || user.id)
            .single();

          console.log('👀 Partner query result:', { userData, partnerError });

          if (partnerError) {
            console.error('❌ Partner query error:', partnerError);
          }

          if (userData?.partner_id) {
            console.log('👫 Partner found:', userData.partner_id);

            // ✅ Validate that partner_id is different from current user
            if (userData.partner_id === user.userId || userData.partner_id === user.id) {
              console.error('❌ CRITICAL ERROR: partner_id is same as current user!');
              console.error('   Current User ID:', user.userId || user.id);
              console.error('   Partner ID:', userData.partner_id);
              console.error('   This will cause "different_users" constraint error!');
              console.error('   Setting partner to null...');
              setPartnerId(undefined);
              setPartnerName('');
            } else {
              setPartnerId(userData.partner_id);

              // Load partner name
              const { data: partnerData } = await supabase
                .from('users')
                .select('name')
                .eq('id', userData.partner_id)
                .single();

              console.log('👤 Partner data:', partnerData);

              if (partnerData) {
                setPartnerName(partnerData.name);
              }
            }
          } else {
            console.log('⚠️ No partner found for user');
          }
        } else {
          console.log('ℹ️ No stored credentials - showing login screen');
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
      } finally {
        setIsLoading(false);
        console.log('✅ Auth check complete');
      }
    };

    checkAuth();
  }, []);

  // Log environment info once
  useEffect(() => {
    console.log('🌍 App Environment Info:');
    console.log('  - Hostname:', window.location.hostname);
    console.log('  - Is Figma preview:', window.location.hostname.includes('figma'));
    console.log('  - Is iframe:', window.self !== window.top);
    console.log('  - Service Worker supported:', 'serviceWorker' in navigator);
    console.log('  - Push notifications supported:', 'PushManager' in window && 'Notification' in window);
  }, []);

  // Fetch prayer times
  const prayerTimes = usePrayerTimes();

  // Setup notifications
  useNotifications({ prayerTimes, enabled: !!currentUser });

  // Setup partner activity notifications with partner name
  usePartnerActivity(currentUser?.userId || null, partnerId || null, partnerName);

  // Setup PWA push notifications
  usePushNotifications({
    userId: currentUser?.userId || null,
    enabled: !!currentUser
  });

  // 🎁 Setup Gift Notifications (Push + Realtime)
  useGiftNotifications({
    userId: currentUser?.userId || null,
    enabled: !!currentUser,
    onGiftReceived: (gift) => {
      console.log('🎁 Gift received in App.tsx:', gift);
      setReceivedGift(gift);
    }
  });

  // 🎁 Check for unread gifts on mount and periodically
  useEffect(() => {
    if (!currentUser?.userId) return;

    const checkForUnreadGifts = async () => {
      try {
        console.log('========================================');
        console.log('🔍 CHECKING FOR UNREAD GIFTS');
        console.log('  Current User ID:', currentUser.userId);
        console.log('  Timestamp:', new Date().toLocaleTimeString('ar-SA'));

        const { data, error } = await supabase
          .from('gifts')
          .select('*')
          .eq('to_user_id', currentUser.userId)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('❌ Error checking gifts:', error);
          return;
        }

        console.log('  📦 Query result:', data);
        console.log('  📊 Found', data?.length || 0, 'unread gift(s)');

        if (data && data.length > 0) {
          const gift = data[0];
          console.log('🎁 FOUND UNREAD GIFT!');
          console.log('  Gift ID:', gift.id);
          console.log('  Type:', gift.gift_type);
          console.log('  From:', gift.from_user_id);
          console.log('  Created:', gift.created_at);
          console.log('  Opening modal...');
          setReceivedGift(gift);
        } else {
          console.log('✅ No unread gifts found');
        }
        console.log('========================================');
      } catch (err) {
        console.error('❌ Error in checkForUnreadGifts:', err);
      }
    };

    // Check immediately on mount
    console.log('🚀 Setting up gift polling...');
    checkForUnreadGifts();

    // Check every 10 seconds
    const interval = setInterval(checkForUnreadGifts, 10000);
    console.log('⏰ Polling interval set to 10 seconds');

    return () => {
      console.log('🛑 Cleaning up gift polling');
      clearInterval(interval);
    };
  }, [currentUser?.userId]);

  // Set document title
  useEffect(() => {
    document.title = 'نورنا - يضيء بالإيمان';

    // Set favicon
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = logoImage;
    document.getElementsByTagName('head')[0].appendChild(link);

    // Add PWA manifest link
    const manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement || document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    if (!document.querySelector("link[rel='manifest']")) {
      document.getElementsByTagName('head')[0].appendChild(manifestLink);
    }

    // Add Apple-specific meta tags for iOS PWA support
    const addMetaTag = (name: string, content: string, property?: boolean) => {
      const existingMeta = document.querySelector(`meta[${property ? 'property' : 'name'}="${name}"]`);
      if (!existingMeta) {
        const meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        meta.setAttribute('content', content);
        document.getElementsByTagName('head')[0].appendChild(meta);
      }
    };

    // iOS PWA meta tags
    addMetaTag('apple-mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    addMetaTag('apple-mobile-web-app-title', 'نورنا');
    addMetaTag('mobile-web-app-capable', 'yes');

    // Theme color
    addMetaTag('theme-color', '#10b981');
    addMetaTag('msapplication-TileColor', '#10b981');

    // Apple touch icon
    const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement || document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    appleTouchIcon.href = '/icon-180.png'; // iOS requires 180x180
    if (!document.querySelector("link[rel='apple-touch-icon']")) {
      document.getElementsByTagName('head')[0].appendChild(appleTouchIcon);
    }

    // Viewport meta tag (ensure it's set correctly for PWA)
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }

    console.log('✅ PWA meta tags added for iOS support');
  }, []);

  const handleLogin = (username: string, name: string, userId: string) => {
    console.log('📱 handleLogin called:', { username, name, userId });
    const user = { username, name, userId };
    setCurrentUser(user);
    console.log('✅ User logged in');
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('nooruna_token');

      if (token) {
        // استدعاء دالة logout في Supabase
        await supabase.rpc('logout_user', { p_token: token });
      }

      // مسح localStorage
      localStorage.removeItem('nooruna_token');
      localStorage.removeItem('nooruna_user');

      setCurrentUser(null);
      console.log('✅ User logged out');
    } catch (err) {
      console.error('Logout error:', err);
      // مسح localStorage حتى لو فشل الـ RPC call
      localStorage.removeItem('nooruna_token');
      localStorage.removeItem('nooruna_user');
      setCurrentUser(null);
    }
  };

  const toggleTheme = () => {
    const themes: ('auto' | 'light' | 'dark')[] = ['auto', 'light', 'dark'];
    const currentIndex = themes.indexOf(themeMode);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setThemeMode(nextTheme);
    localStorage.setItem('themeMode', nextTheme);
  };

  // Show loading screen while checking auth
  // Challenges Logic with Supabase Sync
  const fetchChallenges = async () => {
    if (!currentUser?.userId) return;

    const { data, error } = await supabase
      .from('user_challenges')
      .select('*')
      .or(`user_id.eq.${currentUser.userId},partner_id.eq.${currentUser.userId}`)
      .eq('status', 'active');

    if (error) return;

    const mapped: UserChallengeData[] = (data || []).map(c => {
      const isCreator = c.user_id === currentUser.userId;
      return {
        id: c.id,
        type: c.challenge_type as 'quran' | 'charity',
        title: c.challenge_type === 'quran' ? 'تحدي حفظ القرآن' : 'تحدي الصدقة اليومية',
        details: {
          surah: c.surah_name || '',
          from_page: c.start_page?.toString() || '',
          to_page: c.end_page?.toString() || '',
          amount: c.charity_amount || '',
          intent: c.charity_intention || ''
        },
        progress: isCreator ? (c.progress_percent || 0) : (c.partner_progress_percent || 0),
        partnerProgress: isCreator ? (c.partner_progress_percent || 0) : (c.progress_percent || 0),
        startDate: c.created_at,
      };
    });

    setActiveChallenges(mapped);
  };

  useEffect(() => {
    if (currentUser?.userId) {
      fetchChallenges();
      const interval = setInterval(fetchChallenges, 10000); // Poll every 10 seconds for partner sync
      return () => clearInterval(interval);
    }
  }, [currentUser?.userId, partnerId]);

  const handleAddChallenge = async (challenge: UserChallengeData) => {
    if (!currentUser?.userId) {
      console.error('No current user found');
      return;
    }

    const { data, error } = await supabase
      .from('user_challenges')
      .insert([{
        user_id: currentUser.userId,
        partner_id: partnerId || null, // Critical: Ensuring partnerId is passed
        challenge_type: challenge.type,
        surah_name: challenge.details.surah,
        start_page: challenge.details.from_page ? parseInt(challenge.details.from_page) : null,
        end_page: challenge.details.to_page ? parseInt(challenge.details.to_page) : null,
        charity_amount: challenge.details.amount,
        charity_intention: challenge.details.intent,
        progress_percent: 0,
        status: 'active'
      }])
      .select();

    if (error) {
      console.error('Error adding challenge:', error.message);
    } else {
      console.log('Challenge added successfully:', data);
      fetchChallenges();
    }
  };

  const handleUpdateChallenge = async (challengeId: string, progress: number) => {
    const { error } = await supabase
      .from('user_challenges')
      .update({ progress_percent: progress })
      .eq('id', challengeId);

    if (!error) fetchChallenges();
  };

  const handleCompleteChallenge = async (challengeId: string) => {
    const { error } = await supabase
      .from('user_challenges')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', challengeId);

    if (!error) fetchChallenges();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="text-center">
          <img
            src={logoImage}
            alt="نورنا"
            className="w-20 h-20 rounded-2xl shadow-2xl mx-auto mb-4 animate-pulse"
          />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not logged in
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const activeTimeOfDay = themeMode === 'auto' ? systemTimeOfDay : themeMode;
  const timeConfig = timeOfDayConfig[activeTimeOfDay];

  console.log('🎨 App render state:', {
    currentUser: currentUser?.username,
    partnerId: partnerId,
    partnerName: partnerName,
    hasPartner: !!partnerId,
    isLoading
  });

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${timeConfig.gradient} animate-gradient pb-safe relative overflow-hidden`}
      style={{
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        direction: 'rtl'
      }}
    >
      {/* Toast notifications */}
      <Toaster position="top-center" richColors closeButton />

      {/* Floating particles for ambiance */}
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>
      <div className="floating-particle"></div>

      {/* Notification Banner */}
      <NotificationBanner />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        themeMode={themeMode}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
      />

      {/* Duaa Journal Modal */}
      <DuaaJournal isOpen={showDuaaJournal} onClose={() => setShowDuaaJournal(false)} />

      {/* Send Gift Modal */}
      <SendGiftModal
        isOpen={showSendGift}
        onClose={() => setShowSendGift(false)}
        currentUserId={currentUser.userId}
        partnerId={partnerId || ''}
        partnerName={partnerName}
      />

      {/* Receive Gift Modal */}
      <ReceiveGiftModal
        gift={receivedGift}
        senderName={partnerName}
        onClose={() => setReceivedGift(null)}
      />

      {/* Challenges Modal */}
      <ChallengesModal
        isOpen={showChallenges}
        onClose={() => setShowChallenges(false)}
        currentUserId={currentUser.userId}
        partnerId={partnerId}
        partnerName={partnerName}
        activeChallenges={activeChallenges}
        onAddChallenge={handleAddChallenge}
        onUpdateChallenge={handleUpdateChallenge}
        onCompleteChallenge={handleCompleteChallenge}
      />

      {/* Floating Menu */}
      <FloatingMenu
        onSettingsClick={() => setShowSettings(true)}
        onDuaaClick={() => setShowDuaaJournal(true)}
        onChallengesClick={() => setShowChallenges(true)}
        onGiftClick={() => setShowSendGift(true)}
        onLogout={handleLogout}
        hasPartner={!!partnerId}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 relative z-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <DailyHeader
            userName={currentUser.name}
            onPartnerStatsClick={() => setShowPartnerStats(true)}
            hasPartner={!!partnerId}
          />
        </div>

        {/* Partner Stats Overlay */}
        {showPartnerStats && partnerId && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setShowPartnerStats(false)}
          >
            <div
              className="mt-20 mb-4 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <DailyPartnerStats
                currentUserId={currentUser.userId}
                partnerId={partnerId}
                onClose={() => setShowPartnerStats(false)}
                isOverlay={true}
              />
            </div>
          </div>
        )}

        {/* Main Content: Timeline + Reader */}
        <div className="mb-6 sm:mb-8 grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Timeline - 25% on desktop */}
          <div className="lg:col-span-1 space-y-4">
            <InteractiveTimeline />
            <DailyDuaaCard
              userId={currentUser.userId}
              onChallengesClick={() => setShowChallenges(true)}
            />
            <ChallengesCard
              onChallengesClick={() => setShowChallenges(true)}
              partnerId={partnerId}
              partnerName={partnerName}
              activeChallenges={activeChallenges}
            />
          </div>

          {/* Right Column - Readings + Audio */}
          <div className="lg:col-span-3 space-y-4">
            {/* Readings Center - Combined: Quran + Athkar */}
            <ReadingsCenter />

            {/* Audio Center - Combined: Podcast + Radio + Quran */}
            <AudioCenter />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 sm:mt-12 text-center pb-6 sm:pb-8">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
            جعل الله هذا العمل خالصاً لوجهه الكريم
          </p>
          <p
            className="text-sm sm:text-base text-emerald-700 dark:text-emerald-300"
            style={{ fontFamily: "'IBM Plex Sans Arabic', serif" }}
          >
            ﴿وَذَكِّرْ فَإِنَّ الذِّكْرَىٰ تَنفَعُ الْمُؤْمِنِينَ﴾
          </p>
        </div>
      </div>
    </div>
  );
}