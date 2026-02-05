import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DocKind = 'interface' | 'type' | 'class' | 'function' | 'enum' | 'variable' | 'guide';

export interface DocParam {
  name: string;
  type?: string;
  text: string;
}

export interface DocComment {
  summary: string;
  description?: string;
  tags: Array<{ name: string; text: string; type?: string; paramName?: string }>;
  examples?: Array<{ code: string; language: string }>;
  params?: DocParam[];
  returns?: string;
  deprecated?: string;
}

export interface DocEntry {
  id: string;
  name: string;
  kind: DocKind;
  fileName: string;
  module?: string;
  source?: {
    file: string;
    line: number;
    column: number;
  };
  position: {
    line: number;
    column: number;
  };
  signature: string;
  documentation?: DocComment;
  metadata?: Record<string, unknown>;
  typeParameters?: Array<{
    name: string;
    constraint?: string;
    default?: string;
  }>;
  members?: Array<{
    name: string;
    type: string;
    optional: boolean;
    readonly: boolean;
    documentation?: string;
    kind?: 'property' | 'method' | 'enum';
    value?: string;
  }>;
  parameters?: Array<{
    name: string;
    type: string;
    optional: boolean;
    defaultValue?: string;
    rest: boolean;
    documentation?: string;
  }>;
  returnType?: {
    text: string;
    kind: string;
  };
  heritage?: Array<{
    id: string;
    name: string;
    kind: 'extends' | 'implements';
  }>;
}

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
