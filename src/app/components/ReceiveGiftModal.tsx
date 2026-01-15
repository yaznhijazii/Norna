import { useState, useEffect } from 'react';
import { Heart, MessageCircle, ThumbsUp, Flame, Star, HandHeart, X, Quote } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { RoseIcon } from './RoseIcon';
import { addReactionToGift, ReactionType } from '../utils/db';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface Gift {
  id: string;
  gift_type: 'rose' | 'heart' | 'message';
  message_text?: string;
  from_user_id: string;
  created_at: string;
  reaction?: string | null;
}

interface ReceiveGiftModalProps {
  gift: Gift | null;
  senderName: string;
  onClose: () => void;
}

export function ReceiveGiftModal({ gift, senderName, onClose }: ReceiveGiftModalProps) {
  const [selectedReaction, setSelectedReaction] = useState<ReactionType>(gift?.reaction as ReactionType || null);
  const [isReacting, setIsReacting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (gift) {
      setIsVisible(true);
      // Trigger confetti for roses and hearts
      if (gift.gift_type === 'rose' || gift.gift_type === 'heart') {
        const colors = gift.gift_type === 'rose' ? ['#f43f5e', '#fb7185', '#fda4af'] : ['#ef4444', '#f87171', '#fca5a5'];
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors
        });
      }
    }
  }, [gift]);

  if (!gift) return null;

  const handleClose = async () => {
    setIsVisible(false);
    setTimeout(async () => {
      try {
        await supabase
          .from('gifts')
          .update({
            is_read: true,
            read_at: new Date().toISOString()
          })
          .eq('id', gift.id);
      } catch (error) {
        console.error('Error marking gift as read:', error);
      }
      onClose();
    }, 200);
  };

  const handleReaction = async (reaction: ReactionType) => {
    if (isReacting) return;
    setIsReacting(true);

    try {
      const result = await addReactionToGift(gift.id, reaction);
      if (result) {
        setSelectedReaction(reaction);
        // Simple success haptic feedback feel
        confetti({
          particleCount: 20,
          spread: 30,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#ef4444', '#eab308']
        });
      }
    } catch (error) {
      console.error('Exception adding reaction:', error);
    } finally {
      setIsReacting(false);
    }
  };

  const getGiftConfig = () => {
    switch (gift.gift_type) {
      case 'rose':
        return {
          icon: <RoseIcon size={100} animate={true} />,
          color: 'rose',
          text: 'أرسل لك وردة جميلة',
          emoji: '🌹',
          accent: 'bg-rose-500'
        };
      case 'heart':
        return {
          icon: (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <Heart className="w-24 h-24 text-red-500 drop-shadow-md" fill="currentColor" />
            </motion.div>
          ),
          color: 'red',
          text: 'أرسل لك حباً كثيراً',
          emoji: '❤️',
          accent: 'bg-red-500'
        };
      case 'message':
        return {
          icon: (
            <div className="relative">
              <MessageCircle className="w-24 h-24 text-blue-500 drop-shadow-md" fill="currentColor" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1"
              >
                <Heart className="w-6 h-6 text-blue-300" />
              </motion.div>
            </div>
          ),
          color: 'blue',
          text: 'ترك لك رسالة خاصة',
          emoji: '💌',
          accent: 'bg-blue-500'
        };
    }
  };

  const config = getGiftConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4 overflow-hidden"
          onClick={handleClose}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.2, 0],
                  scale: [0, 1.5, 2],
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200
                }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                className={`absolute top-1/2 left-1/2 w-64 h-64 rounded-full ${config.accent} blur-[100px]`}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="relative w-full max-w-[380px] bg-white rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.4)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 z-50 transition-colors border border-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-7">
              {/* Header Title */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400/20" />
                  مفاجأة جديدة
                </div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">
                  وصلتك هدية من {senderName}
                </h3>
              </div>

              {/* Main Visual */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ rotate: -10, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-current opacity-10 blur-2xl rounded-full" />
                  {config.icon}
                </motion.div>
              </div>

              {/* Gift Message Card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative bg-slate-50/70 rounded-[1.5rem] p-6 border border-slate-100 mb-8"
              >
                <Quote className="absolute -top-3 -right-3 w-7 h-7 text-slate-200" />

                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">{config.text}</p>
                  {gift.message_text && gift.gift_type === 'message' ? (
                    <p className="text-lg font-bold text-slate-800 leading-normal font-amiri">
                      {gift.message_text}
                    </p>
                  ) : (
                    <p className="text-2xl">{config.emoji}</p>
                  )}
                </div>
              </motion.div>

              {/* Reaction Section */}
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">تفاعل مع الهدية</p>
                <div className="flex justify-center gap-3">
                  {[
                    { id: 'like', icon: ThumbsUp, colorClass: 'bg-blue-500 shadow-blue-200' },
                    { id: 'fire', icon: Flame, colorClass: 'bg-orange-500 shadow-orange-200' },
                    { id: 'star', icon: Star, colorClass: 'bg-amber-500 shadow-amber-200' },
                    { id: 'pray', icon: HandHeart, colorClass: 'bg-rose-500 shadow-rose-200' }
                  ].map((item) => (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.1, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReaction(item.id as ReactionType)}
                      disabled={isReacting}
                      className={`
                        w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300
                        ${selectedReaction === item.id
                          ? `${item.colorClass} text-white shadow-md`
                          : 'bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-600 border border-slate-100'
                        }
                      `}
                    >
                      <item.icon className="w-5 h-5" strokeWidth={selectedReaction === item.id ? 2.5 : 2} />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="py-4 bg-slate-50/50 border-t border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400">
                اضغط في أي مكان للعودة
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}