export interface AutodocsConfig {
  include: string[];
  exclude?: string[];
  entryPoints?: string[];

  tsconfig?: string;
  compilerOptions?: Record<string, unknown>;

  output: OutputConfig;

  theme?: ThemeConfig;
  sidebar?: SidebarItem[];

  features?: FeaturesConfig;
  plugins?: Array<string | PluginConfig>;

  ignoreErrors?: boolean;
  verbose?: boolean;
  cache?: boolean;
  cacheDir?: string;
}

export interface OutputConfig {
  dir: string;
  format: 'static' | 'json' | 'markdown';
  clean?: boolean;
  publicPath?: string;
}

export interface ThemeConfig {
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  favicon?: string;
  fonts?: {
    sans?: string;
    mono?: string;
  };
}

export interface SidebarItem {
  title: string;
  path?: string;
  items?: SidebarItem[];
  autogenerate?: string;
  collapsed?: boolean;
}

export interface FeaturesConfig {
  search?: boolean;
  darkMode?: boolean;
  playground?: boolean;
  examples?: boolean;
  download?: boolean;
  sourceLinks?: boolean;
}

export interface PluginConfig {
  name: string;
  options?: Record<string, unknown>;
}
