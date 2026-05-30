import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon,
  User,
  FolderOpen,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Database,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

function Settings() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [systemInfo, setSystemInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('cache');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [cacheDir, setCacheDir] = useState('');
  const [maxConcurrentJobs, setMaxConcurrentJobs] = useState(2);
  const [browsePath, setBrowsePath] = useState('/drive');
  const [browseDirs, setBrowseDirs] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [savingCacheDir, setSavingCacheDir] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    fetchSystemInfo();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'cache') {
      fetchCacheDir();
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [activeTab]);

  const fetchCacheDir = async () => {
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
  };

  const fetchBrowseDirs = async path => {
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

  const fetchSystemInfo = async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    try {
      const infoRes = await api.get('/system/info', { signal });

      setSystemInfo(infoRes.data.data);
    } catch (error) {
      console.error('Failed to fetch system info:', error);
    }
  };

  const handleSaveCacheDir = async () => {
    if (!cacheDir) {
      setError('请选择缓存目录');
      return;
    }

    setSavingCacheDir(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/system/cache-dir', { path: cacheDir, maxConcurrentJobs });
      setSuccess('转码配置保存成功');
    } catch (err) {
      setError(err.response?.data?.error || '保存配置失败');
    } finally {
      setSavingCacheDir(false);
    }
  };

  const handleBrowse = path => {
    setBrowsePath(path);
    setCacheDir(path);
    fetchBrowseDirs(path);
  };

  const handlePasswordChange = async e => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t('settings.passwordMismatch') || 'Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError(t('settings.passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/users/${user.id}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setSuccess(t('settings.passwordChanged') || 'Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError(error.response?.data?.error || t('errors.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = bytes => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const tabs = [
    { id: 'cache', label: t('settings.transcodeConfig') || '转码配置', icon: Database },
    { id: 'account', label: t('settings.account') || 'Account', icon: User },
    { id: 'general', label: t('settings.general'), icon: SettingsIcon }
  ];

  const pathParts = (browsePath || '/drive').split('/').filter(Boolean);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-white'>{t('settings.title')}</h1>
        <p className='text-gray-400 mt-1'>{t('settings.subtitle')}</p>
      </div>

      <div className='flex flex-col lg:flex-row gap-6'>
        <div className='lg:w-64 flex-shrink-0'>
          <nav className='space-y-1'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-700'
                }`}
              >
                <tab.icon className='w-5 h-5' />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className='flex-1'>
          {activeTab === 'general' && (
            <div className='card'>
              <h2 className='text-xl font-semibold text-white mb-4'>{t('settings.about')}</h2>

              {systemInfo ? (
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <p className='text-sm text-gray-400'>HandBrake {t('settings.version')}</p>
                      <p className='text-white font-mono'>{systemInfo.handbrakeVersion}</p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-400'>Web UI {t('settings.version')}</p>
                      <p className='text-white font-mono'>
                        {import.meta.env.VITE_GIT_COMMIT || 'unknown'}
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-400'>
                        {t('settings.platform') || 'Platform'}
                      </p>
                      <p className='text-white'>
                        {systemInfo.platform} ({systemInfo.arch})
                      </p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-400'>{t('common.uptime') || 'Uptime'}</p>
                      <p className='text-white font-mono'>
                        {Math.floor(systemInfo.uptime / 3600)} h{' '}
                        {Math.floor((systemInfo.uptime % 3600) / 60)} m
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className='text-sm text-gray-400 mb-2'>
                      {t('settings.memoryUsage') || 'Memory Usage'}
                    </p>
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                      <div>
                        <p className='text-xs text-gray-500'>RSS</p>
                        <p className='text-white font-mono'>
                          {formatBytes(systemInfo.memoryUsage?.rss)}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>
                          {t('common.heapTotal') || 'Heap Total'}
                        </p>
                        <p className='text-white font-mono'>
                          {formatBytes(systemInfo.memoryUsage?.heapTotal)}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>
                          {t('common.heapUsed') || 'Heap Used'}
                        </p>
                        <p className='text-white font-mono'>
                          {formatBytes(systemInfo.memoryUsage?.heapUsed)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className='text-gray-400'>{t('common.loading')}</p>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div className='space-y-6'>
              <div className='card'>
                <h2 className='text-xl font-semibold text-white mb-4'>
                  {t('settings.accountInfo') || 'Account Information'}
                </h2>

                <div className='space-y-3'>
                  <div>
                    <p className='text-sm text-gray-400'>{t('auth.username')}</p>
                    <p className='text-white text-lg'>{user?.username}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-400'>{t('settings.role') || 'Role'}</p>
                    <p className='text-white capitalize'>{user?.role}</p>
                  </div>
                </div>
              </div>

              <div className='card'>
                <h2 className='text-xl font-semibold text-white mb-4'>
                  {t('settings.changePassword') || 'Change Password'}
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

                <form onSubmit={handlePasswordChange} className='space-y-4'>
                  <div>
                    <label className='label'>
                      {t('settings.currentPassword') || 'Current Password'}
                    </label>
                    <input
                      type='password'
                      value={passwordForm.currentPassword}
                      onChange={e =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value
                        })
                      }
                      className='input'
                      required
                    />
                  </div>

                  <div>
                    <label className='label'>{t('settings.newPassword') || 'New Password'}</label>
                    <input
                      type='password'
                      value={passwordForm.newPassword}
                      onChange={e =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value
                        })
                      }
                      className='input'
                      required
                    />
                  </div>

                  <div>
                    <label className='label'>
                      {t('settings.confirmPassword') || 'Confirm Password'}
                    </label>
                    <input
                      type='password'
                      value={passwordForm.confirmPassword}
                      onChange={e =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value
                        })
                      }
                      className='input'
                      required
                    />
                  </div>

                  <button
                    type='submit'
                    disabled={loading}
                    className='btn btn-primary inline-flex items-center space-x-2'
                  >
                    {loading ? (
                      <>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        <span>{t('common.saving') || 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className='w-4 h-4' />
                        <span>{t('common.save')}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'cache' && (
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
                    <label className='label'>
                      {t('settings.currentCacheDir') || '当前缓存目录'}
                    </label>
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
                              <React.Fragment key={i}>
                                <ChevronRight className='w-3 h-3 text-gray-500 shrink-0' />
                                <button
                                  type='button'
                                  onClick={() => handleBrowse(fullPath)}
                                  className={`hover:underline truncate max-w-[100px] ${
                                    browsePath === fullPath
                                      ? 'text-white font-medium'
                                      : 'text-primary'
                                  }`}
                                >
                                  {part}
                                </button>
                              </React.Fragment>
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
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
