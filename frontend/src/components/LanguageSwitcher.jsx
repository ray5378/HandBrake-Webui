import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import clsx from 'clsx';

const languages = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'English' }
];

export default function LanguageSwitcher({ className }) {
  const { i18n } = useTranslation();

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleChange = code => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  return (
    <div className={clsx('relative', className)}>
      <div className="flex items-center space-x-2">
        <Globe className="w-4 h-4 text-gray-400" />
        <select
          value={i18n.language}
          onChange={e => handleChange(e.target.value)}
          className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
