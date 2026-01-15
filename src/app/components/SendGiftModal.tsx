import { useState } from 'react';
import { X, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { RoseIcon } from './RoseIcon';

interface SendGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  partnerId: string;
  partnerName: string;
}

type GiftType = 'rose' | 'heart' | 'message';

export function SendGiftModal({ isOpen, onClose, currentUserId, partnerId, partnerName }: SendGiftModalProps) {
  const [selectedType, setSelectedType] = useState<GiftType | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!selectedType) return;
    if (selectedType === 'message' && !messageText.trim()) return;
    
    // ✅ Strong validation before sending
    if (!partnerId || partnerId === '') {
      alert('❌ لا يوجد شريك مرتبط!\n\nيجب ربط حساب شريك أولاً من الإعدادات.');
      return;
    }
    
    if (!currentUserId || currentUserId === '') {
      alert('❌ خطأ في معرف المستخدم!\n\nيرجى تسجيل الدخول مرة أخرى.');
      return;
    }

    // ⚠️ CRITICAL: Check if trying to send to self
    if (currentUserId === partnerId) {
      console.error('========================================');
      console.error('❌ CRITICAL ERROR: Attempting to send gift to self!');
      console.error('Current User ID:', currentUserId);
      console.error('Partner ID:', partnerId);
      console.error('========================================');
      alert('❌ خطأ في بيانات الشريك!\n\nلا يمكنك إرسال هدية لنفسك!\n\nيرجى الذهاب للإعدادات وإعادة ربط حساب شريك مختلف.');
      return;
    }

    console.log('========================================');
    console.log('📤 SENDING GIFT - FULL DEBUG INFO');
    console.log('========================================');
    console.log('From User ID:', currentUserId);
    console.log('To User ID (Partner):', partnerId);
    console.log('Gift Type:', selectedType);
    console.log('Message:', selectedType === 'message' ? messageText.trim() : null);
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================');

    setIsSending(true);
    try {
      // استخدام Direct Insert (أبسط وأضمن!)
      const giftData = {
        from_user_id: currentUserId,
        to_user_id: partnerId,
        gift_type: selectedType,
        message_text: selectedType === 'message' ? messageText.trim() : null,
        is_read: false,
        created_at: new Date().toISOString()
      };

      console.log('📦 Gift data to insert:', JSON.stringify(giftData, null, 2));

      const { data, error } = await supabase
        .from('gifts')
        .insert(giftData)
        .select()
        .single();

      if (error) {
        console.error('❌ SUPABASE ERROR DETAILS:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ Gift sent successfully!');
      console.log('Response data:', JSON.stringify(data, null, 2));
      console.log('========================================');
      console.log('');
      console.log('🎯 NEXT STEPS:');
      console.log('1. افتح تبويب ثاني (Tab) بنفس التطبيق');
      console.log('2. سجل دخول كـ Partner (المستخدم الثاني)');
      console.log('3. شوف Console - المفروض تشوف:');
      console.log('   🎁 NEW GIFT RECEIVED');
      console.log('   🎁 Gift received in App.tsx');
      console.log('4. الـ Modal بيطلع تلقائياً!');
      console.log('');
      console.log('⚠️ ملاحظة: Push Notifications ما بتشتغل في Figma preview!');
      console.log('   لازم تعمل Deploy على Vercel عشان الإشعارات تشتغل.');
      console.log('========================================');
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setSelectedType(null);
        setMessageText('');
      }, 2000);
    } catch (error: any) {
      console.error('========================================');
      console.error('❌ ERROR SENDING GIFT');
      console.error('========================================');
      console.error('Error type:', typeof error);
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('========================================');
      
      // رسائل خطأ واضحة
      const errorMessage = error.message || error.toString();
      const errorCode = error.code || 'UNKNOWN';
      
      console.log('Error Code:', errorCode);
      console.log('Error Message:', errorMessage);
      
      if (errorMessage.includes('violates row-level security') || errorCode === '42501') {
        alert('❌ خطأ RLS\n\nالحل:\n1. افتح Supabase SQL Editor\n2. نفذ محتوى ملف:\nQUICK_FIX_DISABLE_RLS.sql\n3. جرب مرة ثانية');
      } else if (errorMessage.includes('violates foreign key')) {
        alert('❌ معرّف المستخدم أو الشريك غير صحيح\n\nتحقق من:\n- currentUserId: ' + currentUserId + '\n- partnerId: ' + partnerId);
      } else if (errorMessage.includes('duplicate key')) {
        alert('هذه الهدية تم إرسالها مسبقاً');
      } else if (errorMessage.includes('not authenticated') || errorMessage.includes('JWT')) {
        alert('❌ مشكلة في تسجيل الدخول\n\nالحل: سجل خروج ثم سجل دخول من جديد');
      } else {
        alert(`❌ خطأ في الإرسال\n\nالكود: ${errorCode}\nالرسالة: ${errorMessage}\n\nشوف Console للتفاصيل الكاملة (F12)`);
      }
    } finally {
      setIsSending(false);
    }
  };

  const giftOptions = [
    {
      type: 'rose' as GiftType,
      icon: <RoseIcon size={80} animate={true} />,
      label: 'وردة',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
      borderColor: 'border-pink-300',
    },
    {
      type: 'heart' as GiftType,
      icon: <Heart className="w-20 h-20 text-red-500" fill="currentColor" />,
      label: 'قلب',
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-red-50 to-pink-50',
      borderColor: 'border-red-300',
    },
    {
      type: 'message' as GiftType,
      icon: <MessageCircle className="w-20 h-20 text-blue-500" fill="currentColor" />,
      label: 'رسالة',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      borderColor: 'border-blue-300',
    },
  ];

  const selectedOption = giftOptions.find(opt => opt.type === selectedType);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {showSuccess ? (
          <div className="p-12 text-center">
            <div className="mb-6 flex justify-center scale-125">
              {selectedOption?.icon}
            </div>
            <div className="relative">
              {/* Sparkle animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                      animation: `sparkle 1s ease-out ${i * 0.1}s`,
                      transform: `rotate(${i * 30}deg) translateY(-60px)`,
                      opacity: 0
                    }}
                  />
                ))}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">تم الإرسال! ✨</h3>
            </div>
            <p className="text-lg text-gray-600">وصلت لـ {partnerName}</p>
          </div>
        ) : !selectedType ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">إرسال هدية</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">اختر هدية لـ {partnerName}</p>
            </div>

            {/* Gift Options */}
            <div className="p-6 space-y-3">
              {giftOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setSelectedType(option.type)}
                  className={`w-full p-5 rounded-2xl border-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${option.bgColor} ${option.borderColor} hover:shadow-lg`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 transform hover:scale-110 transition-transform">
                      {option.icon}
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{option.label}</h3>
                      <p className="text-sm text-gray-600">
                        {option.type === 'rose' && 'أرسل وردة جميلة'}
                        {option.type === 'heart' && 'عبّر عن حبك'}
                        {option.type === 'message' && 'اكتب رسالة مخصصة'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : selectedType === 'message' ? (
          <>
            {/* Message Input */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">رسالتك</h2>
                <button
                  onClick={() => setSelectedType(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6 flex justify-center">
                <MessageCircle className="w-24 h-24 text-blue-500" fill="currentColor" />
              </div>

              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`اكتب رسالتك لـ ${partnerName}...`}
                className="w-full p-4 rounded-2xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:outline-none resize-none text-lg leading-relaxed transition-colors mb-2"
                rows={5}
                autoFocus
              />
              <p className="text-xs text-gray-500 text-left mb-6">
                {messageText.length} حرف
              </p>

              <button
                onClick={handleSend}
                disabled={isSending || !messageText.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all flex items-center justify-center gap-2 ${
                  isSending || !messageText.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                }`}
              >
                {isSending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جارٍ الإرسال...
                  </>
                ) : (
                  <>إرسال الرسالة</>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">تأكيد الإرسال</h2>
                <button
                  onClick={() => setSelectedType(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-8 flex justify-center scale-125">
                {selectedOption?.icon}
              </div>

              <p className="text-center text-xl text-gray-700 mb-8">
                إرسال <span className="font-bold">{selectedOption?.label}</span> لـ <span className="font-bold">{partnerName}</span>؟
              </p>

              <button
                onClick={handleSend}
                disabled={isSending}
                className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all flex items-center justify-center gap-2 ${
                  isSending
                    ? 'bg-gray-400 cursor-not-allowed'
                    : `bg-gradient-to-r ${selectedOption?.color} hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl`
                }`}
              >
                {isSending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جارٍ الإرسال...
                  </>
                ) : (
                  <>إرسال الآن</>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes sparkle {
          0% {
            transform: rotate(var(--rotation)) translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation)) translateY(-80px) scale(1);
            opacity: 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}