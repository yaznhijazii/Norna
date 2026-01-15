import { useState, useEffect } from 'react';
import { Plus, Trash2, Heart, User, BookHeart, Send, X, Edit2, Check } from 'lucide-react';
import { getUserDuaas, getSharedDuaas, addDuaa as addDuaaDB, deleteDuaa as deleteDuaaDB, getPartner } from '../utils/db';

interface Duaa {
  id: string;
  user_id: string;
  content: string;
  is_shared: boolean;
  partner_id: string | null;
  created_at: string;
  category?: string;
}

interface DuaaJournalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuaaJournal({ isOpen, onClose }: DuaaJournalProps) {
  const [duaas, setDuaas] = useState<Duaa[]>([]);
  const [newDuaa, setNewDuaa] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [partnerId, setPartnerId] = useState<string | null>(null);

  // Get current user and partner
  useEffect(() => {
    const user = localStorage.getItem('nooruna_user');
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUserId(userData.id);  // Changed from userData.userId to userData.id
      loadDuaas(userData.id);  // Changed from userData.userId to userData.id
    }
  }, []);

  const loadDuaas = async (userId: string) => {
    setLoading(true);
    try {
      const [myDuaas, sharedDuaas, partner] = await Promise.all([
        getUserDuaas(userId),
        getSharedDuaas(userId),
        getPartner(userId),
      ]);

      // Combine my duaas and shared duaas
      const allDuaas = [...myDuaas, ...sharedDuaas].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setDuaas(allDuaas);
      setPartnerId(partner?.id || null);
    } catch (error) {
      console.error('Error loading duaas:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDuaa = async () => {
    if (!newDuaa.trim() || !currentUserId) return;

    try {
      const category = isShared ? 'partner_shared' : 'personal';
      await addDuaaDB(
        currentUserId,
        newDuaa.trim(),
        category,
        isShared,
        isShared ? partnerId || undefined : undefined
      );

      // Reload duaas
      await loadDuaas(currentUserId);

      // Trigger update for DailyDuaaCard
      window.dispatchEvent(new CustomEvent('duaasUpdated', { detail: { userId: currentUserId } }));

      setNewDuaa('');
      setIsShared(false);
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding duaa:', error);
    }
  };

  const deleteDuaa = async (id: string) => {
    if (!currentUserId) return;

    try {
      await deleteDuaaDB(id);

      // Reload duaas
      await loadDuaas(currentUserId);

      // Trigger update for DailyDuaaCard
      window.dispatchEvent(new CustomEvent('duaasUpdated', { detail: { userId: currentUserId } }));
    } catch (error) {
      console.error('Error deleting duaa:', error);
    }
  };

  const updateDuaa = (id: string, newContent: string) => {
    if (!currentUserId) return;

    const updatedDuaas = duaas.map(d =>
      d.id === id ? { ...d, content: newContent.trim() } : d
    );
    setDuaas(updatedDuaas);

    // Save to localStorage
    localStorage.setItem(`duaas-${currentUserId}`, JSON.stringify(updatedDuaas));

    // Trigger update for DailyDuaaCard
    window.dispatchEvent(new CustomEvent('duaasUpdated', { detail: { userId: currentUserId } }));
  };

  if (!isOpen) return null;

  const personalDuaas = duaas.filter(d => d.user_id === currentUserId && !d.is_shared);
  const sharedDuaas = duaas.filter(d => d.is_shared);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookHeart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">دفتر الأدعية</h2>
              <p className="text-sm text-white/80">أدعيتك وأدعيتكم المشتركة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Add Button */}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`
              w-full mb-6 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all
              ${isAdding
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              }
            `}
          >
            <Plus className={`w-5 h-5 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
            <span className="font-medium">{isAdding ? 'إلغاء' : 'إضافة دعاء جديد'}</span>
          </button>

          {/* Add New Duaa Form */}
          {isAdding && (
            <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
              <textarea
                value={newDuaa}
                onChange={(e) => setNewDuaa(e.target.value)}
                placeholder="اكتب دعائك هنا..."
                className="w-full p-3 rounded-lg border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:border-purple-500 transition-all"
                rows={3}
              />

              {partnerId && (
                <label className="flex items-center gap-2 mt-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <Heart className={`w-4 h-4 transition-colors ${isShared ? 'text-pink-500 fill-pink-500' : 'text-gray-400'}`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    دعاء مشترك مع شريكي
                  </span>
                </label>
              )}

              <button
                onClick={addDuaa}
                disabled={!newDuaa.trim()}
                className="mt-3 w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>حفظ الدعاء</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* My Personal Duaas */}
              {personalDuaas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">أدعيتي الشخصية</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({personalDuaas.length})</span>
                  </div>
                  <div className="space-y-2">
                    {personalDuaas.map((duaa) => (
                      <DuaaCard key={duaa.id} duaa={duaa} onDelete={deleteDuaa} onUpdate={updateDuaa} isOwner={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Shared Duaas */}
              {sharedDuaas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">أدعيتنا المشتركة</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({sharedDuaas.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {sharedDuaas.map((duaa) => (
                      <DuaaCard key={duaa.id} duaa={duaa} onDelete={deleteDuaa} onUpdate={updateDuaa} isOwner={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {duaas.length === 0 && (
                <div className="text-center py-12">
                  <BookHeart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">لا توجد أدعية بعد</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">ابدأ بإضافة أدعيتك الخاصة</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DuaaCardProps {
  duaa: Duaa;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newContent: string) => void;
  isOwner: boolean;
}

function DuaaCard({ duaa, onDelete, onUpdate, isOwner }: DuaaCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(duaa.content);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  const handleSave = () => {
    if (editedContent.trim() && editedContent !== duaa.content) {
      onUpdate(duaa.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(duaa.content);
    setIsEditing(false);
  };

  return (
    <div className={`
      p-4 rounded-xl border-2 transition-all group
      ${duaa.is_shared
        ? 'bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-pink-900/10 dark:to-purple-900/10 border-pink-200 dark:border-pink-800'
        : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
      }
    `}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 rounded-lg border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:border-purple-500"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  حفظ
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-900 dark:text-white leading-relaxed mb-2">
                {duaa.content}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(duaa.created_at)}
                </span>
                {duaa.is_shared && (
                  <span className="flex items-center gap-1 text-xs text-pink-600 dark:text-pink-400">
                    <Heart className="w-3 h-3 fill-current" />
                    مشترك
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {isOwner && !isEditing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
              title="تعديل"
            >
              <Edit2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </button>
            <button
              onClick={() => onDelete(duaa.id)}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="حذف"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}