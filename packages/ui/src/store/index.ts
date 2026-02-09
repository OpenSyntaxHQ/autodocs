import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DocEntry as CoreDocEntry,
  DocKind as CoreDocKind,
  DocComment as CoreDocComment,
  DocParam as CoreDocParam,
} from '@autodocs-core/extractor/types';

export type DocKind = CoreDocKind;
export type DocParam = CoreDocParam;
export type DocComment = CoreDocComment;
export type DocEntry = CoreDocEntry;

export interface UiConfig {
  version?: string;
  generatedAt?: string;
  theme?: {
    name?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
    favicon?: string;
    fonts?: {
      sans?: string;
      mono?: string;
      display?: string;
    };
  };
  features?: {
    search?: boolean;
    darkMode?: boolean;
    playground?: boolean;
    examples?: boolean;
    download?: boolean;
    sourceLinks?: boolean;
  };
  sidebar?: Array<{
    title: string;
    path?: string;
    items?: Array<{ title: string; path?: string }>;
    autogenerate?: string;
    collapsed?: boolean;
  }>;
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
  toggleSearch: () => void;

  // Documentation
  docs: DocEntry[];
  setDocs: (docs: DocEntry[]) => void;

  // Config
  config: UiConfig | null;
  setConfig: (config: UiConfig | null) => void;

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
      toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),

      docs: [],
      setDocs: (docs) => set({ docs }),

      config: null,
      setConfig: (config) => set({ config }),

      currentEntry: null,
      setCurrentEntry: (entry) => set({ currentEntry: entry }),
    }),
    {
      name: 'autodocs-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
