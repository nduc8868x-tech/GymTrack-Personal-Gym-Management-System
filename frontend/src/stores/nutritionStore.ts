import { create } from 'zustand';

interface FoodLogEntry {
  foodId: string;
  name: string;
  quantityG: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface NutritionState {
  dailyLogs: FoodLogEntry[];
  currentDate: string;
  setDate: (date: string) => void;
  setLogs: (logs: FoodLogEntry[]) => void;
  addLog: (log: FoodLogEntry) => void;
  removeLog: (foodId: string, mealType: string) => void;
  getTotals: () => { calories: number; protein: number; carbs: number; fat: number };
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  dailyLogs: [],
  currentDate: new Date().toISOString().split('T')[0],
  setDate: (date) => set({ currentDate: date }),
  setLogs: (logs) => set({ dailyLogs: logs }),
  addLog: (log) => set((state) => ({ dailyLogs: [...state.dailyLogs, log] })),
  removeLog: (foodId, mealType) =>
    set((state) => ({
      dailyLogs: state.dailyLogs.filter(
        (l) => !(l.foodId === foodId && l.mealType === mealType),
      ),
    })),
  getTotals: () => {
    const logs = get().dailyLogs;
    return logs.reduce(
      (acc, l) => ({
        calories: acc.calories + l.calories,
        protein: acc.protein + l.proteinG,
        carbs: acc.carbs + l.carbsG,
        fat: acc.fat + l.fatG,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  },
}));
