import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  nome: string;
  email: string;
  premium: boolean;
  nivel: number;
  score_geral: number;
}

export interface Atributos {
  energia: number;
  corpo: number;
  foco: number;
  financeiro: number;
  disciplina: number;
}

interface AppState {
  user: User | null;
  atributos: Atributos | null;
  theme: 'dark' | 'light';
  setUser: (user: User | null) => void;
  setAtributos: (atributos: Atributos | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      atributos: null,
      theme: 'dark',
      setUser: (user) => set({ user }),
      setAtributos: (atributos) => set({ atributos }),
      setTheme: (theme) => set({ theme }),
      logout: () => set({ user: null, atributos: null }),
    }),
    {
      name: 'nivel99-storage',
    }
  )
);
