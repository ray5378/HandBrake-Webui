import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ListTodo,
  Play,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  Trash,
  SkipForward,
  X
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
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmJobAction, setConfirmJobAction] = useState(null);
  const abortRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchJobs = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const response = await api.get('/jobs', {
        params: { limit: 9999 },
        signal: abortRef.current.signal
      });
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

  const limit = 10;
  const totalPages = Math.ceil(filteredJobs.length / limit);
  const paginatedJobs = filteredJobs.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(1);
  }, [page, totalPages]);

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

  const handleClearAllForce = async () => {
    try {
      await api.delete('/jobs/all-force');
      fetchJobs();
    } catch (error) {
      console.error('Failed to force clear all jobs:', error);
    }
    setConfirmAction(null);
  };

  const handleClearCache = async type => {
    try {
      const res = await api.post('/system/cache-clear', { type });
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
      <div>
        <h1 className='text-3xl font-bold text-white'>{t('jobs.title')}</h1>
        <p className='text-gray-400 mt-1'>{t('jobs.subtitle')}</p>
      </div>

      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex flex-wrap gap-2 order-2 sm:order-1'>
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
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
        <div className='flex flex-wrap items-center gap-2 order-1 sm:order-2'>
          <button
            onClick={() => setConfirmAction('clearAll')}
            className='btn btn-danger inline-flex items-center space-x-2'
          >
            <AlertTriangle className='w-4 h-4' />
            <span>{t('jobs.clearAll') || '清理任务'}</span>
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
            <span>{t('jobs.clearCache') || '清除缓存'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className='text-center py-12 text-gray-400'>{t('common.loading')}</div>
      ) : filteredJobs.length > 0 ? (
        <>
          <div className='card space-y-3'>
            {paginatedJobs.map(job => (
              <div
                key={job.id}
                className={`p-4 rounded-lg transition-colors font-mono ${job.status === 'processing' ? 'bg-[#fbbf24]/20' : 'bg-dark-700 hover:bg-dark-600'}`}
              >
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                  <div className='flex-1 min-w-0'>
                    <div className='space-y-1 mb-2'>
                      <div className='text-gray-400 font-mono text-sm' title={job.source_file}>
                        <span className='text-gray-400'>{t('jobs.sourceFile', '源文件')}: </span>
                        <span className='text-white break-all'>{job.source_file}</span>
                        {job.source_file_size != null && (
                          <span className='text-gray-400 ml-3'>
                            {t('jobs.originalSize', '原体积')}：
                            {formatFileSize(job.source_file_size)}
                          </span>
                        )}
                      </div>
                      <div className='text-gray-400 font-mono text-sm' title={job.output_file}>
                        <span className='text-gray-400'>{t('jobs.outputFile', '输出文件')}: </span>
                        <span className='text-white break-all'>{job.output_file}</span>
                        {(job.status === 'completed' || job.status === 'skipped') &&
                          job.output_file_size != null && (
                            <span className='text-gray-400 ml-3'>
                              <span className='text-gray-400'>
                                {t('jobs.outputSize', '转码后')}：
                              </span>
                              {formatFileSize(job.output_file_size)}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className='flex items-center space-x-3 mb-1 font-mono'>
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
                        <div className='flex items-center justify-between text-sm mb-1 font-mono'>
                          <span className='text-gray-400'>{t('jobs.progress')}</span>
                          <span className='text-white'>
                            {job.progress.toFixed(1)}%
                            {formatETA(job.eta_seconds) && (
                              <span className='text-white font-normal ml-2 text-xs'>
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
                      <button
                        onClick={() => handleCancel(job.id)}
                        className='btn btn-danger text-sm'
                      >
                        <XCircle className='w-4 h-4' />
                      </button>
                    )}

                    {(job.status === 'completed' ||
                      job.status === 'failed' ||
                      job.status === 'cancelled' ||
                      job.status === 'skipped') && (
                      <>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className='btn btn-danger text-sm'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </>
                    )}

                    {job.status === 'queued' && (
                      <button
                        onClick={() => handleDelete(job.id)}
                        className='btn btn-danger text-sm'
                      >
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
          {totalPages > 1 && (
            <div className='flex items-center justify-center space-x-4 mt-6'>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className='btn btn-secondary text-sm'
              >
                ← {t('common.previous', '上一页')}
              </button>
              <span className='text-gray-400 text-sm'>
                {t('jobs.page', '第')} {page} / {totalPages} {t('jobs.pageSuffix', '页')}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className='btn btn-secondary text-sm'
              >
                {t('common.next', '下一页')} →
              </button>
            </div>
          )}
        </>
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

      {confirmAction === 'clearAll' && (
        <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4'>
          <div className='bg-dark-800 rounded-xl max-w-md w-full p-6'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center space-x-3'>
                <AlertTriangle className='w-6 h-6 text-error' />
                <h3 className='text-lg font-bold text-white'>
                  {t('jobs.confirmClearAllTitle', '清空队列')}
                </h3>
              </div>
              <button
                onClick={() => setConfirmAction(null)}
                className='p-1 hover:bg-dark-700 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-400' />
              </button>
            </div>
            <p className='text-gray-400 mb-5'>{t('jobs.confirmClearAll', '请选择清空方式：')}</p>
            <div className='space-y-3'>
              <button onClick={handleClearAllForce} className='w-full btn btn-danger'>
                {t('jobs.clearAllWithProcessing', '清空所有任务（含正在转码）')}
              </button>
              <button onClick={handleClearAll} className='w-full btn btn-danger'>
                {t('jobs.clearAllQueuedOnly', '只清空队列任务')}
              </button>
              <button onClick={() => setConfirmAction(null)} className='w-full btn btn-secondary'>
                {t('common.cancel', '取消')}
              </button>
            </div>
          </div>
        </div>
      )}
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
      {confirmAction === 'clearCache' && (
        <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4'>
          <div className='bg-dark-800 rounded-xl max-w-md w-full p-6'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex items-center space-x-3'>
                <Trash className='w-6 h-6 text-error' />
                <h3 className='text-lg font-bold text-white'>
                  {t('jobs.confirmClearCacheTitle', '清除缓存')}
                </h3>
              </div>
              <button
                onClick={() => setConfirmAction(null)}
                className='p-1 hover:bg-dark-700 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-400' />
              </button>
            </div>
            <p className='text-gray-400 mb-5'>
              {t('jobs.confirmClearCache', '请选择要清除的缓存类型：')}
            </p>
            <div className='space-y-3'>
              <button
                onClick={() => handleClearCache('transcode')}
                className='w-full btn btn-danger'
              >
                {t('jobs.clearTranscodeCache', '清除转码缓存')}
              </button>
              <button
                onClick={() => handleClearCache('preview')}
                className='w-full btn btn-primary'
              >
                {t('jobs.clearPreviewCache', '清除预览图片缓存')}
              </button>
              <button onClick={() => handleClearCache('all')} className='w-full btn btn-danger'>
                {t('jobs.clearAllCache', '清除转码和预览图片缓存')}
              </button>
              <button onClick={() => setConfirmAction(null)} className='w-full btn btn-secondary'>
                {t('common.cancel', '取消')}
              </button>
            </div>
          </div>
        </div>
      )}
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
