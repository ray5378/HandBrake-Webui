import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ListTodo,
  Play,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  AlertTriangle,
  Trash,
  SkipForward
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatFileSize } from '../utils/format';
import { formatETA } from '../utils/format';

function Jobs() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmJobAction, setConfirmJobAction] = useState(null);
  const abortRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchJobs = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const response = await api.get('/jobs', { signal: abortRef.current.signal });
      setJobs(response.data.data.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 客户端筛选
  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs;
    if (filter === 'active')
      return jobs
        .filter(job => job.status === 'processing' || job.status === 'queued')
        .sort((a, b) => {
          if (a.status === 'processing' && b.status !== 'processing') return -1;
          if (a.status !== 'processing' && b.status === 'processing') return 1;
          return 0;
        });
    if (filter === 'completed')
      return jobs.filter(job => job.status === 'completed' || job.status === 'skipped');
    return jobs.filter(job => job.status === filter);
  }, [jobs, filter]);

  // 各状态数量统计
  const statusCounts = useMemo(() => {
    const counts = {
      all: jobs.length,
      active: 0,
      completed: 0,
      failed: 0,
      skipped: 0
    };
    for (const job of jobs) {
      if (Object.hasOwn(counts, job.status)) counts[job.status]++;
      if (job.status === 'queued' || job.status === 'processing') counts.active++;
      if (job.status === 'skipped') counts.completed++;
    }
    return counts;
  }, [jobs]);

  // 根据是否有活动任务动态调整轮询频率
  const hasProcessing = useMemo(() => {
    return jobs.some(job => job.status === 'processing');
  }, [jobs]);

  const hasQueued = useMemo(() => {
    return jobs.some(job => job.status === 'queued');
  }, [jobs]);

  useEffect(() => {
    fetchJobs();

    // processing 时每2秒轮询，仅有队列时每10秒，无活动时每60秒
    let intervalTime = 60000;
    if (hasProcessing) {
      intervalTime = 2000;
    } else if (hasQueued) {
      intervalTime = 10000;
    }

    intervalRef.current = setInterval(fetchJobs, intervalTime);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchJobs, hasProcessing, hasQueued]);

  const handleCancel = async jobId => {
    setConfirmJobAction({ type: 'cancel', jobId });
  };

  const handleDelete = async jobId => {
    setConfirmJobAction({ type: 'delete', jobId });
  };

  const handleConfirmJobAction = async () => {
    if (!confirmJobAction) return;
    try {
      if (confirmJobAction.type === 'cancel') {
        await api.post(`/jobs/${confirmJobAction.jobId}/cancel`);
      } else {
        await api.delete(`/jobs/${confirmJobAction.jobId}`);
      }
      fetchJobs();
    } catch (error) {
      console.error('Failed to perform job action:', error);
    }
    setConfirmJobAction(null);
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/jobs/all');
      fetchJobs();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
    setConfirmAction(null);
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/jobs/queue');
      fetchJobs();
    } catch (error) {
      console.error('Failed to clear queued jobs:', error);
    }
    setConfirmAction(null);
  };

  const handleClearCache = async () => {
    try {
      const res = await api.post('/system/cache-clear');
      console.log(res.data.message);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
    setConfirmAction(null);
  };

  const getStatusLabel = status => {
    const statusMap = {
      queued: t('jobs.queue'),
      processing: t('transcode.transcoding'),
      completed: t('dashboard.completedJobs'),
      failed: t('dashboard.failedJobs'),
      cancelled: t('common.cancel'),
      skipped: t('jobs.skipped', '已跳过')
    };
    return statusMap[status] || status;
  };

  const filters = [
    { value: 'active', label: t('jobs.active', '进行中'), icon: Play },
    { value: 'all', label: t('common.all') || '全部', icon: ListTodo },
    { value: 'completed', label: t('dashboard.completedJobs'), icon: CheckCircle },
    { value: 'failed', label: t('dashboard.failedJobs'), icon: XCircle },
    { value: 'skipped', label: t('jobs.skipped', '已跳过'), icon: SkipForward }
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-white'>{t('jobs.title')}</h1>
          <p className='text-gray-400 mt-1'>{t('jobs.subtitle')}</p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <button
            onClick={() => setConfirmAction('clearAll')}
            className='btn btn-danger inline-flex items-center space-x-2'
          >
            <AlertTriangle className='w-4 h-4' />
            <span>{t('jobs.clearAll') || '清空任务队列'}</span>
          </button>
          <button
            onClick={() => setConfirmAction('clearHistory')}
            className='btn btn-danger inline-flex items-center space-x-2'
          >
            <Trash2 className='w-4 h-4' />
            <span>{t('jobs.clearHistory')}</span>
          </button>
          <button
            onClick={() => setConfirmAction('clearCache')}
            className='btn btn-danger inline-flex items-center space-x-2'
          >
            <Trash className='w-4 h-4' />
            <span>{t('jobs.clearCache') || '清空转码缓存'}</span>
          </button>
        </div>
      </div>

      <div className='flex flex-wrap gap-2'>
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={clsx(
              'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap',
              filter === f.value
                ? 'bg-primary text-white'
                : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
            )}
          >
            <f.icon className='w-4 h-4' />
            <span>{f.label}</span>
            <span
              className={clsx(
                'ml-1 text-xs font-mono rounded-full px-1.5 py-0.5 min-w-[20px] text-center',
                filter === f.value ? 'bg-white/20 text-white' : 'bg-dark-600 text-gray-400'
              )}
            >
              {statusCounts[f.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className='text-center py-12 text-gray-400'>{t('common.loading')}</div>
      ) : filteredJobs.length > 0 ? (
        <div className='space-y-3'>
          {filteredJobs.map(job => (
            <div
              key={job.id}
              className={`card hover:border-primary/50 transition-colors ${job.status === 'processing' ? 'ring-2 ring-[#fbbf24]/80' : ''}`}
            >
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  <div className='space-y-1 mb-2'>
                    <div className='text-gray-400 font-mono text-sm' title={job.source_file}>
                      <span className='text-gray-500'>{t('jobs.sourceFile', '源文件')}: </span>
                      <span className='break-all'>{job.source_file}</span>
                      {job.source_file_size != null && (
                        <span className='text-gray-500 ml-3'>
                          {t('jobs.originalSize', '原体积')}：{formatFileSize(job.source_file_size)}
                        </span>
                      )}
                    </div>
                    <div className='text-primary font-mono text-sm' title={job.output_file}>
                      <span className='text-primary/60'>{t('jobs.outputFile', '输出文件')}: </span>
                      <span className='break-all'>{job.output_file}</span>
                      {(job.status === 'completed' || job.status === 'skipped') &&
                        job.output_file_size != null && (
                          <span className='text-primary ml-3'>
                            <span className='text-primary/60'>
                              {t('jobs.outputSize', '转码后')}：
                            </span>
                            {formatFileSize(job.output_file_size)}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className='flex items-center space-x-3 mb-1'>
                    {job.status !== 'processing' && (
                      <span className={clsx('badge', `badge-${job.status}`)}>
                        {getStatusLabel(job.status)}
                      </span>
                    )}
                    {job.preset_name && (
                      <span className='text-sm text-gray-400'>
                        {t('jobs.preset')}: {job.preset_name}
                      </span>
                    )}
                    <span className='text-sm text-gray-400'>
                      {t('jobs.startTime')}: {new Date(job.created_at).toLocaleString()}
                    </span>
                  </div>

                  {job.status === 'processing' && (
                    <div className='mt-3'>
                      <div className='flex items-center justify-between text-sm mb-1'>
                        <span className='text-secondary'>{t('jobs.progress')}</span>
                        <span className='text-white font-mono'>
                          {job.progress.toFixed(1)}%
                          {formatETA(job.eta_seconds) && (
                            <span className='text-success font-normal ml-2 text-xs'>
                              {formatETA(job.eta_seconds)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className='w-full bg-dark-700 rounded-full h-2 overflow-hidden'>
                        <div
                          className='h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000'
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  {job.status === 'processing' && (
                    <button onClick={() => handleCancel(job.id)} className='btn btn-danger text-sm'>
                      <XCircle className='w-4 h-4' />
                    </button>
                  )}

                  {(job.status === 'completed' ||
                    job.status === 'failed' ||
                    job.status === 'cancelled' ||
                    job.status === 'skipped') && (
                    <>
                      <Link to={`/jobs/${job.id}`} className='btn btn-secondary text-sm'>
                        <Eye className='w-4 h-4' />
                      </Link>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className='btn btn-danger text-sm'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </>
                  )}

                  {job.status === 'queued' && (
                    <button onClick={() => handleDelete(job.id)} className='btn btn-danger text-sm'>
                      <Trash2 className='w-4 h-4' />
                    </button>
                  )}
                </div>
              </div>

              {job.error_log && job.status === 'failed' && (
                <div className='mt-4 p-3 bg-error/10 border border-error/20 rounded-lg'>
                  <p className='text-sm text-error font-medium mb-1'>{t('jobs.error')}:</p>
                  <pre className='text-xs text-gray-300 font-mono overflow-x-auto'>
                    {job.error_log}
                  </pre>
                </div>
              )}

              {job.status === 'skipped' && (
                <div className='mt-4 p-3 bg-cyan-900/20 border border-cyan-700/30 rounded-lg'>
                  <p className='text-sm text-cyan-400 font-medium'>
                    <SkipForward className='w-4 h-4 inline mr-1' />
                    {t('jobs.outputExists', '输出文件已存在，已自动跳过该任务')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className='card text-center py-12'>
          <ListTodo className='w-16 h-16 text-gray-600 mx-auto mb-4' />
          <p className='text-gray-400 mb-4'>{t('jobs.noJobs')}</p>
          <Link to='/files' className='btn btn-primary inline-flex items-center space-x-2'>
            <Play className='w-4 h-4' />
            <span>{t('files.title')}</span>
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === 'clearAll'}
        title={t('jobs.confirmClearAllTitle', '清空队列')}
        message={t(
          'jobs.confirmClearAll',
          '确定要清空所有等待中的任务吗？正在转码和已完成的任务不受影响。此操作不可撤销。'
        )}
        confirmText={t('common.confirm', '确认清理')}
        cancelText={t('common.cancel', '取消')}
        onConfirm={handleClearAll}
        onCancel={() => setConfirmAction(null)}
        danger
      />
      <ConfirmDialog
        open={confirmAction === 'clearHistory'}
        title={t('jobs.confirmClearHistoryTitle') || '清理任务历史'}
        message={
          t('jobs.confirmClearHistory') ||
          '确定要清理所有已完成、失败和已取消的任务吗？此操作不可撤销。'
        }
        confirmText={t('common.confirm') || '确认清理'}
        cancelText={t('common.cancel') || '取消'}
        onConfirm={handleClearHistory}
        onCancel={() => setConfirmAction(null)}
        danger
      />
      <ConfirmDialog
        open={confirmAction === 'clearCache'}
        title={t('jobs.confirmClearCacheTitle') || '清空转码缓存'}
        message={
          t('jobs.confirmClearCache') ||
          '确定要清空转码缓存目录吗？正在进行的转码任务可能会受到影响。'
        }
        confirmText={t('common.confirm') || '确认清空'}
        cancelText={t('common.cancel') || '取消'}
        onConfirm={handleClearCache}
        onCancel={() => setConfirmAction(null)}
        danger
      />
      <ConfirmDialog
        open={confirmJobAction !== null}
        title={
          confirmJobAction?.type === 'cancel'
            ? t('jobs.confirmCancelTitle', '取消任务')
            : t('jobs.confirmDeleteTitle', '删除任务')
        }
        message={
          confirmJobAction?.type === 'cancel'
            ? t('jobs.confirmCancel', '确定要取消这个任务吗？')
            : t('jobs.confirmDelete', '确定要删除这个任务吗？')
        }
        confirmText={t('common.confirm', '确认')}
        cancelText={t('common.cancel', '取消')}
        onConfirm={handleConfirmJobAction}
        onCancel={() => setConfirmJobAction(null)}
        danger
      />
    </div>
  );
}

export default Jobs;
