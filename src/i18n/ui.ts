export const languages = {
  en: 'English',
  zh: '中文',
} as const;

export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'site.title': 'Personal Site',
    'site.description': 'Mathematics, architecture, photography, and notes.',
    'nav.home': 'Home',
    'nav.writing': 'Writing',
    'nav.notes': 'Notes',
    'nav.photography': 'Photography',
    'theme.toggle': 'Toggle theme',
    'writing.description': 'Essays and articles.',
    'notes.description': 'Mathematical notes and proofs.',
    'photography.description': 'Architecture and photography.',
    'post.zhihu': 'Read on Zhihu ↗',
    'post.toc': 'Contents',
    'post.back.writing': '← All Writing',
    'post.back.notes': '← All Notes',
    'post.empty': 'No entries yet.',
  },
  zh: {
    'site.title': '个人网站',
    'site.description': '数学、建筑、摄影与札记。',
    'nav.home': '首页',
    'nav.writing': '文章',
    'nav.notes': '笔记',
    'nav.photography': '摄影',
    'theme.toggle': '切换主题',
    'writing.description': '随笔与文章。',
    'notes.description': '数学笔记与证明。',
    'photography.description': '建筑与摄影。',
    'post.zhihu': '在知乎阅读 ↗',
    'post.toc': '目录',
    'post.back.writing': '← 返回文章列表',
    'post.back.notes': '← 返回笔记列表',
    'post.empty': '暂无内容。',
  },
} as const;

export function useTranslations(lang: Lang = defaultLang) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}
