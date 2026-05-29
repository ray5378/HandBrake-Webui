import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon,
  User,
  FolderOpen,
  HardDrive,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

function Settings() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [systemInfo, setSystemInfo] = useState(null);
  const [directories, setDirectories] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const [infoRes, dirsRes] = await Promise.all([
        api.get('/system/info'),
        api.get('/system/directories')
      ]);

      setSystemInfo(infoRes.data.data);
      setDirectories(dirsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch system info:', error);
    }
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
    { id: 'general', label: t('settings.general'), icon: SettingsIcon },
    { id: 'account', label: t('settings.account') || 'Account', icon: User },
    { id: 'storage', label: t('settings.storage'), icon: HardDrive }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('settings.title')}</h1>
        <p className="text-gray-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">{t('settings.about')}</h2>

              {systemInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">HandBrake {t('settings.version')}</p>
                      <p className="text-white font-mono">{systemInfo.handbrakeVersion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Node.js {t('settings.version')}</p>
                      <p className="text-white font-mono">{systemInfo.nodeVersion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        {t('settings.platform') || 'Platform'}
                      </p>
                      <p className="text-white">
                        {systemInfo.platform} ({systemInfo.arch})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">{t('common.uptime') || 'Uptime'}</p>
                      <p className="text-white font-mono">
                        {Math.floor(systemInfo.uptime / 3600)} h{' '}
                        {Math.floor((systemInfo.uptime % 3600) / 60)} m
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-2">
                      {t('settings.memoryUsage') || 'Memory Usage'}
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">RSS</p>
                        <p className="text-white font-mono">
                          {formatBytes(systemInfo.memoryUsage?.rss)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          {t('common.heapTotal') || 'Heap Total'}
                        </p>
                        <p className="text-white font-mono">
                          {formatBytes(systemInfo.memoryUsage?.heapTotal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          {t('common.heapUsed') || 'Heap Used'}
                        </p>
                        <p className="text-white font-mono">
                          {formatBytes(systemInfo.memoryUsage?.heapUsed)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">{t('common.loading')}</p>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {t('settings.accountInfo') || 'Account Information'}
                </h2>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">{t('auth.username')}</p>
                    <p className="text-white text-lg">{user?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{t('settings.role') || 'Role'}</p>
                    <p className="text-white capitalize">{user?.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-400">{t('settings.commit')}</p>
                      <p className="text-white font-mono text-xs">
                        {import.meta.env.VITE_GIT_COMMIT || 'unknown'}
                      </p>
                    </div>
                  </div>
                </div>

              <div className="card">
                <h2 className="text-xl font-semibold text-white mb-4">
                  {t('settings.changePassword') || 'Change Password'}
                </h2>

                {error && (
                  <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 text-error text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center space-x-2 text-success text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>{success}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="label">
                      {t('settings.currentPassword') || 'Current Password'}
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value
                        })
                      }
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">{t('settings.newPassword') || 'New Password'}</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value
                        })
                      }
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">
                      {t('settings.confirmPassword') || 'Confirm Password'}
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value
                        })
                      }
                      className="input"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary inline-flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('common.saving') || 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{t('common.save')}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">{t('settings.storage')}</h2>

              {directories && systemInfo ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">
                      {t('settings.directoryMapping') || 'Directory Mapping'}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FolderOpen className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-white">{t('files.sourceFiles')}</p>
                            <p className="text-xs text-gray-400 font-mono">{directories.source}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FolderOpen className="w-5 h-5 text-success" />
                          <div>
                            <p className="text-white">{t('files.outputFiles')}</p>
                            <p className="text-xs text-gray-400 font-mono">{directories.output}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FolderOpen className="w-5 h-5 text-warning" />
                          <div>
                            <p className="text-white">{t('settings.configDir')}</p>
                            <p className="text-xs text-gray-400 font-mono">{directories.config}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">
                      {t('dashboard.diskUsage')}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{t('common.used') || 'Used'}</span>
                        <span className="text-white font-mono">
                          {formatBytes(systemInfo.diskUsage?.used || 0)}
                        </span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          style={{
                            width: `${
                              systemInfo.diskUsage?.total > 0
                                ? (
                                    (systemInfo.diskUsage.used / systemInfo.diskUsage.total) *
                                    100
                                  ).toFixed(1)
                                : 0
                            }%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{t('common.total') || 'Total'}</span>
                        <span className="text-gray-300 font-mono">
                          {formatBytes(systemInfo.diskUsage?.total || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{t('common.free') || 'Free'}</span>
                        <span className="text-gray-300 font-mono">
                          {formatBytes(systemInfo.diskUsage?.free || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">{t('common.loading')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
