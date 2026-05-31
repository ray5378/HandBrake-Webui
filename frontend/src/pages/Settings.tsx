import { useEffect, useState, useRef, Fragment, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Save, Loader2, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import api from '../services/api';

interface FileDirectory {
  name: string;
  path: string;
}

function Settings() {
  const { t } = useTranslation();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [cacheDir, setCacheDir] = useState('');
  const [maxConcurrentJobs, setMaxConcurrentJobs] = useState(2);
  const [browsePath, setBrowsePath] = useState('/drive');
  const [browseDirs, setBrowseDirs] = useState<FileDirectory[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [savingCacheDir, setSavingCacheDir] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchCacheDir = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const res = await api.get('/system/cache-dir', { signal: abortRef.current.signal });
      const dir = res.data.data.cacheDir;
      const jobs = res.data.data.maxConcurrentJobs;
      if (dir) {
        setCacheDir(dir);
        setBrowsePath(dir);
        fetchBrowseDirs(dir);
      } else {
        fetchBrowseDirs('/drive');
      }
      if (jobs) {
        setMaxConcurrentJobs(jobs);
      }
    } catch (err) {
      console.error('Failed to fetch cache dir:', err);
    }
  }, []);

  useEffect(() => {
    fetchCacheDir();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchCacheDir]);

  const fetchBrowseDirs = async (path: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setBrowseLoading(true);
    try {
      const res = await api.get('/files', {
        params: { directory: path },
        signal: abortRef.current.signal
      });
      setBrowseDirs(res.data.data.directories);
    } catch (err) {
      console.error('Failed to fetch directories:', err);
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleSaveCacheDir = async () => {
    if (!cacheDir) {
      setError(t('settings.selectCacheDir', '请选择缓存目录'));
      return;
    }

    setSavingCacheDir(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/system/cache-dir', { path: cacheDir, maxConcurrentJobs });
      setSuccess(t('settings.saveSuccess', '转码配置保存成功'));
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t('settings.saveFailed', '保存配置失败'));
    } finally {
      setSavingCacheDir(false);
    }
  };

  const handleBrowse = (path: string) => {
    setBrowsePath(path);
    setCacheDir(path);
    fetchBrowseDirs(path);
  };

  const pathParts = (browsePath || '/drive').split('/').filter(Boolean);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-white'>{t('settings.title')}</h1>
        <p className='text-gray-400 mt-1'>{t('settings.subtitle')}</p>
      </div>

      <div className='card'>
        <h2 className='text-xl font-semibold text-white mb-4'>
          {t('settings.transcodeConfig') || '转码配置'}
        </h2>

        {error && (
          <div className='mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 text-error text-sm'>
            <AlertCircle className='w-4 h-4' />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className='mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center space-x-2 text-success text-sm'>
            <CheckCircle className='w-4 h-4' />
            <span>{success}</span>
          </div>
        )}

        <div className='space-y-6'>
          <div>
            <h3 className='text-sm font-medium text-gray-400 mb-2'>
              {t('settings.cacheDir') || '缓存目录'}
            </h3>
            <p className='text-gray-500 text-xs mb-3'>
              {t('settings.cacheDirDesc') ||
                '选择一个目录作为转码临时缓存目录。转码时中间文件会先写入此目录，完成后移动到输出目录。'}
            </p>

            <div className='mb-4'>
              <label className='label'>{t('settings.currentCacheDir') || '当前缓存目录'}</label>
              <p className='text-white font-mono text-sm bg-dark-700 rounded-lg p-3 mt-1 truncate'>
                {cacheDir || t('settings.notSet') || '（未设置）'}
              </p>
            </div>

            <div className='mb-4'>
              <label className='label'>{t('settings.browseDir') || '浏览目录'}</label>

              {browseLoading ? (
                <div className='flex items-center space-x-2 text-gray-400 py-2'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span className='text-sm'>{t('common.loading')}</span>
                </div>
              ) : (
                <>
                  <div className='flex flex-wrap items-center gap-1 text-sm mb-3'>
                    <button
                      type='button'
                      onClick={() => handleBrowse('/drive')}
                      className={`hover:underline truncate max-w-[100px] ${
                        browsePath === '/drive' ? 'text-white font-medium' : 'text-primary'
                      }`}
                    >
                      drive
                    </button>
                    {pathParts.slice(1).map((part, i) => {
                      const fullPath = '/drive/' + pathParts.slice(1, i + 2).join('/');
                      return (
                        <Fragment key={i}>
                          <ChevronRight className='w-3 h-3 text-gray-500 shrink-0' />
                          <button
                            type='button'
                            onClick={() => handleBrowse(fullPath)}
                            className={`hover:underline truncate max-w-[100px] ${
                              browsePath === fullPath ? 'text-white font-medium' : 'text-primary'
                            }`}
                          >
                            {part}
                          </button>
                        </Fragment>
                      );
                    })}
                  </div>

                  <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3 max-h-48 overflow-y-auto overflow-x-auto'>
                    {browseDirs.map(dir => (
                      <button
                        type='button'
                        key={dir.path}
                        onClick={() => handleBrowse(dir.path)}
                        className={`flex items-center space-x-2 p-2 rounded-lg transition-colors text-left ${
                          cacheDir === dir.path
                            ? 'bg-primary/20 border border-primary'
                            : 'bg-dark-600 hover:bg-dark-500 border border-transparent'
                        }`}
                      >
                        <FolderOpen className='w-4 h-4 text-warning shrink-0' />
                        <span className='text-white text-xs truncate'>{dir.name}</span>
                      </button>
                    ))}
                    {browseDirs.length === 0 && (
                      <p className='col-span-full text-gray-500 text-xs py-2'>
                        {t('common.empty') || '空目录'}
                      </p>
                    )}
                  </div>
                </>
              )}

              <p className='text-xs text-gray-400'>
                {t('settings.selected') || '已选'}:{' '}
                <span className='text-primary truncate'>
                  {cacheDir || t('settings.notSelected') || '（未选择）'}
                </span>
              </p>
            </div>
          </div>

          <div className='border-t border-dark-700 pt-6'>
            <h3 className='text-sm font-medium text-gray-400 mb-2'>
              {t('settings.concurrentJobs') || '同时转码任务数'}
            </h3>
            <p className='text-gray-500 text-xs mb-3'>
              {t('settings.concurrentJobsDesc') ||
                '设置同时运行的转码任务数量，数值越大 CPU 占用越高。'}
            </p>
            <div className='flex items-center space-x-3'>
              <input
                type='number'
                min={1}
                max={10}
                value={maxConcurrentJobs}
                onChange={e => {
                  const val = parseInt(e.target.value) || 1;
                  setMaxConcurrentJobs(Math.min(10, Math.max(1, val)));
                }}
                className='input w-24 text-center font-mono text-lg'
              />
              <span className='text-gray-400 text-sm'>{t('settings.tasks') || '个任务'}</span>
            </div>
          </div>
        </div>

        <div className='mt-6 pt-6 border-t border-dark-700'>
          <button
            type='button'
            onClick={handleSaveCacheDir}
            disabled={savingCacheDir || !cacheDir}
            className='btn btn-primary inline-flex items-center space-x-2'
          >
            {savingCacheDir ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>{t('common.saving')}</span>
              </>
            ) : (
              <>
                <Save className='w-4 h-4' />
                <span>{t('common.save')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
