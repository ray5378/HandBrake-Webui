import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

function Loading() {
  const { t } = useTranslation();
  return (
    <div className='min-h-screen bg-dark-900 flex items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='w-12 h-12 text-primary animate-spin mx-auto mb-4' />
        <p className='text-gray-400'>{t('common.loading')}</p>
      </div>
    </div>
  );
}

export default Loading;
