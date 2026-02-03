import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DocEntry {
  id: string;
  name: string;
  kind: string;
  fileName: string;
  signature: string;
  documentation?: {
    summary: string;
    examples?: Array<{ code: string; language: string }>;
  };
  members?: Array<{
    name: string;
    type: string;
    optional: boolean;
    readonly: boolean;
    documentation?: string;
  }>;
  parameters?: Array<{
    name: string;
    type: string;
    optional: boolean;
    documentation?: string;
  }>;
  returnType?: {
    text: string;
  };
}

interface AppState {
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Documentation
  docs: DocEntry[];
  setDocs: (docs: DocEntry[]) => void;

  // Current entry
  currentEntry: DocEntry | null;
  setCurrentEntry: (entry: DocEntry | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),

      docs: [],
      setDocs: (docs) => set({ docs }),

      currentEntry: null,
      setCurrentEntry: (entry) => set({ currentEntry: entry }),
    }),
    {
      name: 'autodocs-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
