import { useState, useEffect } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { getUserDuaas, getSharedDuaas } from '../utils/db';

interface Duaa {
  id: string;
  user_id: string;
  content: string;
  is_shared: boolean;
  partner_id: string | null;
  created_at: string;
  category?: string;
}

interface DailyDuaaCardProps {
  userId: string;
  onChallengesClick: () => void;
}

export function DailyDuaaCard({ userId }: DailyDuaaCardProps) {
  const [currentDuaa, setCurrentDuaa] = useState<Duaa | null>(null);
  const [allDuaas, setAllDuaas] = useState<Duaa[]>([]);

  const loadDuaas = async () => {
    if (!userId) return;

    try {
      const [myDuaas, sharedDuaas] = await Promise.all([
        getUserDuaas(userId),
        getSharedDuaas(userId),
      ]);

      const combined = [...myDuaas, ...sharedDuaas];
      setAllDuaas(combined);

      if (combined.length > 0 && !currentDuaa) {
        updateDuaa(combined, false);
      }
    } catch (error) {
      console.error('Error loading duaas:', error);
    }
  };

  const updateDuaa = (duaas: Duaa[], forceRandom = false) => {
    if (duaas.length === 0) {
      setCurrentDuaa(null);
      return;
    }

    if (forceRandom) {
      const randomIndex = Math.floor(Math.random() * duaas.length);
      setCurrentDuaa(duaas[randomIndex]);
    } else {
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      const index = dayOfYear % duaas.length;
      setCurrentDuaa(duaas[index]);
    }
  };

  useEffect(() => {
    if (userId) {
      loadDuaas();
    }
  }, [userId]);

  if (!currentDuaa) {
    return null;
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-5 border border-border/50 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">دعاء اليوم</h3>
            <p className="text-xs text-muted-foreground">من دفترك الشخصي</p>
          </div>
        </div>
        <button
          onClick={() => updateDuaa(allDuaas, true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="دعاء عشوائي"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Duaa Content */}
      <div className="mb-3">
        <p className="text-foreground leading-relaxed italic text-sm">
          "{currentDuaa.content}"
        </p>
      </div>

      {/* Footer */}
      {currentDuaa.is_shared && (
        <div className="text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold">
            دعاء مشترك
          </span>
        </div>
      )}
    </div>
  );
}