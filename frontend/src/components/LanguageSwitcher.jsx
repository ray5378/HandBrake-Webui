import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import clsx from 'clsx';

export default function LanguageSwitcher({ className }) {
  const { i18n } = useTranslation();

  const isZh = i18n.language?.startsWith('zh');

  const toggle = () => {
    const code = isZh ? 'en-US' : 'zh-CN';
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  return (
    <button
      onClick={toggle}
      className={clsx(
        'flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors',
        isZh ? 'bg-[#fbbf24]/20 border-[#fbbf24]/40' : 'bg-dark-700 border-dark-600',
        className
      )}
    >
      <Globe className={clsx('w-4 h-4', isZh ? 'text-[#fbbf24]' : 'text-gray-400')} />
      <div className='flex items-center space-x-1 text-sm font-medium'>
        <span className={clsx(isZh ? 'text-white' : 'text-gray-500')}>中文</span>
        <span className='text-gray-500'>/</span>
        <span className={clsx(!isZh ? 'text-white' : 'text-gray-500')}>EN</span>
      </div>
    </button>
  );
}
