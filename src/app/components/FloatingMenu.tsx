import { useState } from 'react';
import { Settings, LogOut, Menu, X, BookHeart, Flower2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingMenuProps {
  onSettingsClick: () => void;
  onDuaaClick: () => void;
  onGiftClick: () => void;
  onChallengesClick: () => void;
  onLogout: () => void;
  hasPartner: boolean;
}

export function FloatingMenu({
  onSettingsClick,
  onDuaaClick,
  onGiftClick,
  onChallengesClick,
  onLogout,
  hasPartner
}: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: Settings,
      label: 'الإعدادات',
      onClick: onSettingsClick,
      color: 'bg-teal-500',
      shadow: 'shadow-teal-500/40',
      show: true
    },
    {
      icon: Trophy,
      label: 'تحديات',
      onClick: onChallengesClick,
      color: 'bg-amber-500',
      shadow: 'shadow-amber-500/40',
      show: true
    },
    {
      icon: BookHeart,
      label: 'دعاء',
      onClick: onDuaaClick,
      color: 'bg-rose-500',
      shadow: 'shadow-rose-500/40',
      show: true
    },
    {
      icon: Flower2,
      label: 'إرسال هدية',
      onClick: onGiftClick,
      color: 'bg-indigo-500',
      shadow: 'shadow-indigo-500/40',
      show: hasPartner
    }
  ].filter(item => item.show);

  return (
    <div className="fixed top-6 left-6 z-[9999] flex flex-col items-center gap-3">
      {/* Main Toggle Button */}
      <motion.button
        onClick={toggleMenu}
        className={`
          w-11 h-11 rounded-full shadow-xl
          flex items-center justify-center
          backdrop-blur-xl border border-white/20
          transition-colors duration-300
          ${isOpen
            ? 'bg-rose-100 text-rose-600'
            : 'bg-white/90 text-slate-700 hover:bg-white'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 90 : 0 }}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </motion.button>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-center gap-3">
            {menuItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -20, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.3 }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                className="relative group"
              >
                {/* Tooltip Label */}
                <motion.span
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 
                    bg-white/90 backdrop-blur-md text-slate-700 text-sm font-bold rounded-lg 
                    shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap
                    pointer-events-none"
                >
                  {item.label}
                </motion.span>

                <motion.button
                  onClick={() => handleAction(item.onClick)}
                  className={`
                    w-10 h-10 rounded-full text-white shadow-lg
                    flex items-center justify-center border-2 border-white/20
                    ${item.color} ${item.shadow}
                  `}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}