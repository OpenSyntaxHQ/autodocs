export interface MarkdownPluginOptions {
  sourceDir: string;
}

export function markdownPlugin(options: MarkdownPluginOptions) {
  return {
    name: 'autodocs-plugin-markdown',
    load() {
      // Implementation stub
      console.log('Loading markdown from', options.sourceDir);
      return [];
    }
  };
}
