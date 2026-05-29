import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Video,
  FolderOpen,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [jobsRes, systemRes] = await Promise.all([
        api.get('/jobs/stats/summary'),
        api.get('/system/info')
      ]);

      setStats(jobsRes.data.data);
      setSystemInfo(systemRes.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const formatBytes = bytes => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const statCards = [
    {
      label: t('dashboard.totalJobs'),
      value: stats?.total || 0,
      icon: Video,
      color: 'text-primary'
    },
    {
      label: t('jobs.queue'),
      value: stats?.queued || 0,
      icon: Clock,
      color: 'text-warning'
    },
    {
      label: t('transcode.transcoding'),
      value: stats?.processing || 0,
      icon: Play,
      color: 'text-secondary'
    },
    {
      label: t('dashboard.completedJobs'),
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'text-success'
    }
  ];

  const getJobStatusLabel = status => {
    const statusMap = {
      queued: t('jobs.queue'),
      processing: t('transcode.transcoding'),
      completed: t('common.success'),
      failed: t('common.error'),
      cancelled: t('common.cancel')
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('dashboard.title')}</h1>
          <p className="text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <Link to="/transcode" className="btn btn-primary inline-flex items-center space-x-2">
          <Play className="w-4 h-4" />
          <span>{t('transcode.startTranscode')}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(stat => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">{t('dashboard.recentJobs')}</h2>
            <Link
              to="/jobs"
              className="text-primary hover:text-primary/80 text-sm flex items-center space-x-1"
            >
              <span>{t('jobs.viewDetails')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {stats?.recentJobs && stats.recentJobs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentJobs.map(job => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="flex items-center justify-between p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {job.source_file.split('/').pop()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(job.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge badge-${job.status}`}>
                      {getJobStatusLabel(job.status)}
                    </span>
                    {job.status === 'processing' && (
                      <div className="text-secondary font-mono text-sm">
                        {job.progress.toFixed(0)}%
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('dashboard.noJobs')}</p>
            </div>
          )}
        </div>

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
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">{t('dashboard.diskUsage')}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{t('common.used') || 'Used'}</span>
                    <span className="text-white font-mono">
                      {formatBytes(systemInfo.diskUsage?.used || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
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
                  <p className="text-xs text-gray-400">
                    {t('common.total') || 'Total'}: {formatBytes(systemInfo.diskUsage?.total || 0)}, {t('common.free') || 'Free'}:{' '}
                    {formatBytes(systemInfo.diskUsage?.free || 0)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">{t('common.uptime') || 'Uptime'}</p>
                <p className="text-white font-mono">
                  {Math.floor(systemInfo.uptime / 3600)} h{' '}
                  {Math.floor((systemInfo.uptime % 3600) / 60)} m
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">{t('common.loading')}</div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">{t('common.quickActions') || 'Quick Actions'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/files"
            className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
          >
            <FolderOpen className="w-8 h-8 text-primary" />
            <div>
              <p className="text-white font-medium">{t('files.title')}</p>
              <p className="text-sm text-gray-400">{t('files.subtitle')}</p>
            </div>
          </Link>

          <Link
            to="/presets"
            className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
          >
            <TrendingUp className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-white font-medium">{t('presets.title')}</p>
              <p className="text-sm text-gray-400">{t('presets.subtitle')}</p>
            </div>
          </Link>

          <Link
            to="/settings"
            className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
          >
            <XCircle className="w-8 h-8 text-warning" />
            <div>
              <p className="text-white font-medium">{t('settings.title')}</p>
              <p className="text-sm text-gray-400">{t('settings.subtitle')}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
