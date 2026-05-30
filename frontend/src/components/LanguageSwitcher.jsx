import { useTranslation } from 'react-i18next';
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
      className={clsx('flex items-center space-x-1 text-sm font-medium transition-colors', className)}
    >
      <span className={clsx(isZh ? 'text-white' : 'text-gray-500')}>中文</span>
      <span className='text-gray-500'>/</span>
      <span className={clsx(!isZh ? 'text-white' : 'text-gray-500')}>EN</span>
    </button>
  );
}
