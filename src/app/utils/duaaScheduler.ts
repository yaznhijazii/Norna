// Utility functions for daily duaa distribution
export interface Duaa {
  id: string;
  user_id: string;
  content: string;
  is_shared: boolean;
  partner_id: string | null;
  created_at: string;
  category?: string;
}

// Get all duaas from localStorage for current user
export const getAllDuaas = (username: string): Duaa[] => {
  const stored = localStorage.getItem(`duaas-${username}`);
  return stored ? JSON.parse(stored) : [];
};

// Smart distribution algorithm
// Goal: Show each duaa twice per day, distributed evenly throughout the day
export const getDailyDuaaSchedule = (username: string): { time: string; duaa: Duaa }[] => {
  const duaas = getAllDuaas(username);
  if (duaas.length === 0) return [];

  const now = new Date();
  
  // We want to show each duaa twice per day
  const showingsPerDay = 2;
  const totalShowings = duaas.length * showingsPerDay;
  
  // Total minutes in a day (from 6 AM to midnight)
  const startHour = 6;
  const endHour = 24;
  const activeHours = endHour - startHour;
  const totalMinutes = activeHours * 60;
  
  // Calculate interval between showings
  const intervalMinutes = Math.floor(totalMinutes / totalShowings);
  
  // Use day of year as seed for shuffling to keep same order throughout the day
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const shuffledDuaas = shuffleDuaasWithSeed(duaas, dayOfYear);
  
  // Generate schedule
  const schedule: { time: string; duaa: Duaa }[] = [];
  
  for (let i = 0; i < totalShowings; i++) {
    const duaaIndex = Math.floor(i / showingsPerDay);
    const duaa = shuffledDuaas[duaaIndex % shuffledDuaas.length];
    
    // Calculate time for this showing
    const minutesFromStart = i * intervalMinutes;
    const hour = startHour + Math.floor(minutesFromStart / 60);
    const minute = minutesFromStart % 60;
    
    if (hour < endHour) {
      schedule.push({
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        duaa
      });
    }
  }
  
  return schedule;
};

// Shuffle array with consistent seed (same shuffle for same day)
const shuffleDuaasWithSeed = (duaas: Duaa[], seed: number): Duaa[] => {
  const shuffled = [...duaas];
  const random = seededRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

// Seeded random number generator
const seededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};