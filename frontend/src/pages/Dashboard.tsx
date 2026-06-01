import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video, FolderOpen, ArrowRight, Layers, Settings } from 'lucide-react';
import api from '../services/api';
import { formatFileSize, formatETA } from '../utils/format';
import { SystemInfo, Job } from '../types';

function Dashboard() {
  const { t } = useTranslation();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasProcessingTasks = useMemo(() => {
    return activeJobs.some(j => j.status === 'processing');
  }, [activeJobs]);

  const hasQueuedTasks = useMemo(() => {
    return activeJobs.some(j => j.status === 'queued');
  }, [activeJobs]);

  useEffect(() => {
    fetchDashboardData();

    let intervalTime = 120000;
    if (hasProcessingTasks) {
      intervalTime = 2000;
    } else if (hasQueuedTasks) {
      intervalTime = 30000;
    }

    intervalRef.current = setInterval(fetchDashboardData, intervalTime);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [hasProcessingTasks, hasQueuedTasks]);

  const fetchDashboardData = async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    try {
      const [systemRes, jobsRes] = await Promise.all([
        api.get('/system/info', { signal }),
        api.get('/jobs', { params: { limit: 9999 }, signal })
      ]);

      setSystemInfo(systemRes.data.data);
      setActiveJobs(
        (jobsRes.data.data.jobs || [])
          .filter((j: Job) => j.status === 'processing' || j.status === 'queued')
          .sort((a: Job, b: Job) => {
            if (a.status === 'processing' && b.status !== 'processing') return -1;
            if (a.status !== 'processing' && b.status === 'processing') return 1;
            return 0;
          })
      );
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const formatBytes = formatFileSize;

  const getJobStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      queued: t('jobs.queue'),
      processing: t('transcode.transcoding'),
      completed: t('common.success'),
      failed: t('common.error'),
      cancelled: t('common.cancel'),
      skipped: t('jobs.skipped', '已跳过')
    };
    return statusMap[status] || status;
  };

  return (
    <>
      <div className='space-y-8'>
        <div>
          <h1 className='text-3xl font-bold text-white'>{t('dashboard.title')}</h1>
          <p className='text-gray-400 mt-1'>{t('dashboard.subtitle')}</p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='card'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold text-white'>
                {t('dashboard.activeJobs', '进行中的任务')}
              </h2>
              <Link
                to='/jobs'
                className='text-primary hover:text-primary/80 text-sm flex items-center space-x-1'
              >
                <span>{t('jobs.viewDetails')}</span>
                <ArrowRight className='w-4 h-4' />
              </Link>
            </div>

            {activeJobs.length > 0 ? (
              <div className='space-y-3 max-h-[420px] overflow-y-auto p-1 -m-1 scrollbar-hide'>
                {activeJobs.map(job => (
                  <div
                    key={job.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      job.status === 'processing' ? 'bg-[#fbbf24]/20' : 'bg-dark-700'
                    }`}
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-white truncate'>
                        {job.source_file.split('/').pop()}
                      </p>
                      <p className='text-xs text-gray-400 truncate'>
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                      {job.status === 'processing' && (
                        <div className='mt-2'>
                          <div className='flex items-center justify-between text-sm'>
                            <span className='text-white font-mono text-xs'>
                              {job.progress.toFixed(1)}%
                            </span>
                            {formatETA(job.eta_seconds) && (
                              <span className='text-white text-xs'>
                                {formatETA(job.eta_seconds)}
                              </span>
                            )}
                          </div>
                          <div className='w-full bg-dark-600 rounded-full h-1.5 mt-1 overflow-hidden'>
                            <div
                              className='h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000'
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className='flex items-center space-x-2 shrink-0'>
                      {job.status !== 'processing' && (
                        <span className={`badge badge-${job.status}`}>
                          {getJobStatusLabel(job.status)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 text-gray-400'>
                <Video className='w-12 h-12 mx-auto mb-2 opacity-50' />
                <p>{t('dashboard.noActiveJobs', '当前没有进行中的任务')}</p>
              </div>
            )}
          </div>

          <div className='card'>
            <h2 className='text-xl font-semibold text-white mb-4'>{t('settings.about')}</h2>

            {systemInfo ? (
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-gray-400'>
                      {t('app.name', 'HandBrake')} {t('settings.version')}
                    </p>
                    <p className='text-white font-mono'>{systemInfo.handbrakeVersion}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-400'>
                      {t('app.webUI', 'Web UI')} {t('settings.version')}
                    </p>
                    <p className='text-white font-mono'>
                      {import.meta.env.VITE_GIT_COMMIT || 'unknown'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className='text-sm text-gray-400 mb-2'>{t('dashboard.diskUsage')}</p>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-300'>{t('common.used') || 'Used'}</span>
                      <span className='text-white font-mono'>
                        {formatBytes(systemInfo.diskUsage?.used || 0)}
                      </span>
                    </div>
                    <div className='w-full bg-dark-700 rounded-full h-2 overflow-hidden'>
                      <div
                        className='h-full bg-gradient-to-r from-primary to-secondary rounded-full'
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
                    <p className='text-xs text-gray-400'>
                      {t('common.total') || 'Total'}:{' '}
                      {formatBytes(systemInfo.diskUsage?.total || 0)}, {t('common.free') || 'Free'}:{' '}
                      {formatBytes(systemInfo.diskUsage?.free || 0)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className='text-sm text-gray-400 mb-2'>{t('common.uptime') || 'Uptime'}</p>
                  <p className='text-white font-mono'>
                    {Math.floor(systemInfo.uptime / 3600)} h{' '}
                    {Math.floor((systemInfo.uptime % 3600) / 60)} m
                  </p>
                </div>
              </div>
            ) : (
              <div className='text-center py-8 text-gray-400'>{t('common.loading')}</div>
            )}
          </div>
        </div>

        <div className='card'>
          <h2 className='text-xl font-semibold text-white mb-4'>
            {t('common.quickActions') || 'Quick Actions'}
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <Link
              to='/files'
              className='flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors'
            >
              <FolderOpen className='w-8 h-8 text-primary' />
              <div>
                <p className='text-white font-medium'>{t('files.title')}</p>
                <p className='text-sm text-gray-400'>{t('files.subtitle')}</p>
              </div>
            </Link>

            <Link
              to='/presets'
              className='flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors'
            >
              <Layers className='w-8 h-8 text-secondary' />
              <div>
                <p className='text-white font-medium'>{t('presets.title')}</p>
                <p className='text-sm text-gray-400'>{t('presets.subtitle')}</p>
              </div>
            </Link>

            <Link
              to='/settings'
              className='flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors'
            >
              <Settings className='w-8 h-8 text-warning' />
              <div>
                <p className='text-white font-medium'>{t('settings.title')}</p>
                <p className='text-sm text-gray-400'>
                  {t('dashboard.settingsDesc', '缓存目录、线程数、通用设置')}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
