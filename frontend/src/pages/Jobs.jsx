import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ListTodo,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  Trash
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';
import ConfirmDialog from '../components/common/ConfirmDialog';

function Jobs() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const abortRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchJobs = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/jobs', { params, signal: abortRef.current.signal });
      setJobs(response.data.data.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  // 根据是否有活动任务动态调整轮询频率
  const hasActiveTasks = useMemo(() => {
    return jobs.some(job => job.status === 'processing' || job.status === 'queued');
  }, [jobs]);

  useEffect(() => {
    fetchJobs();

    // 有活动任务时每10秒轮询，无活动任务时每60秒轮询
    const intervalTime = hasActiveTasks ? 10000 : 60000;

    intervalRef.current = setInterval(fetchJobs, intervalTime);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchJobs, hasActiveTasks]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleCancel = async jobId => {
    if (!confirm(t('jobs.confirmDelete'))) return;

    try {
      await api.post(`/jobs/${jobId}/cancel`);
      fetchJobs();
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handleDelete = async jobId => {
    if (!confirm(t('jobs.confirmDelete'))) return;

    try {
      await api.delete(`/jobs/${jobId}`);
      fetchJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
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
      await api.delete('/jobs/all-force');
      fetchJobs();
    } catch (error) {
      console.error('Failed to clear all jobs:', error);
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
      cancelled: t('common.cancel')
    };
    return statusMap[status] || status;
  };

  const filters = [
    { value: 'all', label: t('common.all') || 'All', icon: ListTodo },
    { value: 'queued', label: t('jobs.queue'), icon: Clock },
    { value: 'processing', label: t('transcode.transcoding'), icon: Play },
    { value: 'completed', label: t('dashboard.completedJobs'), icon: CheckCircle },
    { value: 'failed', label: t('dashboard.failedJobs'), icon: XCircle }
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
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className='btn btn-secondary inline-flex items-center space-x-2'
          >
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
            <span>{t('common.refresh')}</span>
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
          </button>
        ))}
      </div>

      {loading ? (
        <div className='text-center py-12 text-gray-400'>{t('common.loading')}</div>
      ) : jobs.length > 0 ? (
        <div className='space-y-3'>
          {jobs.map(job => (
            <div key={job.id} className='card hover:border-primary/50 transition-colors'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div className='flex-1 min-w-0'>
                  <div className='space-y-1 mb-2'>
                    <p className='text-white font-mono text-sm truncate' title={job.source_file}>
                      {job.source_file}
                    </p>
                    <div className='flex items-center space-x-2'>
                      <span className='text-xs text-gray-500'>{t('jobs.outputFile')}:</span>
                      <span
                        className='text-primary font-mono text-xs truncate'
                        title={job.output_file}
                      >
                        {job.output_file}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center space-x-3 mb-1'>
                    <span className={clsx('badge', `badge-${job.status}`)}>
                      {getStatusLabel(job.status)}
                    </span>
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
                        <span className='text-white font-mono'>{job.progress.toFixed(1)}%</span>
                      </div>
                      <div className='w-full bg-dark-700 rounded-full h-2 overflow-hidden'>
                        <div
                          className='h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all'
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
                    job.status === 'cancelled') && (
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
        title={t('jobs.confirmClearAllTitle') || '清空任务队列'}
        message={
          t('jobs.confirmClearAll') ||
          '确定要清空任务队列吗？包括正在处理中的任务将被取消。此操作不可撤销。'
        }
        confirmText={t('common.confirm') || '确认清理'}
        cancelText={t('common.cancel') || '取消'}
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
    </div>
  );
}

export default Jobs;
