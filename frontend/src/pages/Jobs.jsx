import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ListTodo,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();

    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [filter, pagination.page]);

  const fetchJobs = async () => {
    try {
      const params = {
        ...(filter !== 'all' && { status: filter }),
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await api.get('/jobs', { params });
      setJobs(response.data.data.jobs);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const handleCancel = async jobId => {
    if (!confirm('确定要取消这个任务吗？')) return;

    try {
      await api.post(`/jobs/${jobId}/cancel`);
      fetchJobs();
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handleDelete = async jobId => {
    if (!confirm('确定要删除这个任务记录吗？')) return;

    try {
      await api.delete(`/jobs/${jobId}`);
      fetchJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page }));
  };

  const renderPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pageNumbers = [];
    
    // 显示第一页
    pageNumbers.push(1);
    
    // 显示当前页前后各1页
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (!pageNumbers.includes(i)) {
        pageNumbers.push(i);
      }
    }
    
    // 显示最后一页
    if (totalPages > 1 && !pageNumbers.includes(totalPages)) {
      pageNumbers.push(totalPages);
    }
    
    // 生成显示的页面，加入省略号
    const displayPages = [];
    let lastPage = 0;
    
    for (const pageNum of pageNumbers) {
      if (pageNum - lastPage > 1) {
        displayPages.push(-1); // 表示省略号
      }
      displayPages.push(pageNum);
      lastPage = pageNum;
    }
    
    return displayPages;
  };

  const filters = [
    { value: 'all', label: '全部', icon: ListTodo },
    { value: 'queued', label: '排队中', icon: Clock },
    { value: 'processing', label: '转码中', icon: Play },
    { value: 'completed', label: '已完成', icon: CheckCircle },
    { value: 'failed', label: '失败', icon: XCircle }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">任务队列</h1>
          <p className="text-gray-400 mt-1">管理和监控所有转码任务</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn btn-secondary inline-flex items-center space-x-2"
        >
          <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
          <span>刷新</span>
        </button>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPagination(prev => ({ ...prev, page: 1 })); // 切换筛选时重置到第一页
            }}
            className={clsx(
              'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap',
              filter === f.value
                ? 'bg-primary text-white'
                : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
            )}
          >
            <f.icon className="w-4 h-4" />
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : jobs.length > 0 ? (
        <>
          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.id} className="card hover:border-primary/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-white font-medium truncate">
                        {job.source_file.split('/').pop()}
                      </h3>
                      <span className={clsx('badge', `badge-${job.status}`)}>
                        {job.status === 'queued' && '排队中'}
                        {job.status === 'processing' && '转码中'}
                        {job.status === 'completed' && '已完成'}
                        {job.status === 'failed' && '失败'}
                        {job.status === 'cancelled' && '已取消'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span>输出: {job.output_file.split('/').pop()}</span>
                      {job.preset_name && <span>预设: {job.preset_name}</span>}
                      <span>创建: {new Date(job.created_at).toLocaleString('zh-CN')}</span>
                    </div>

                    {job.status === 'processing' && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-secondary">转码进度</span>
                          <span className="text-white font-mono">{job.progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {job.status === 'processing' && (
                      <button onClick={() => handleCancel(job.id)} className="btn btn-danger text-sm">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}

                    {(job.status === 'completed' ||
                      job.status === 'failed' ||
                      job.status === 'cancelled') && (
                      <>
                        <Link to={`/jobs/${job.id}`} className="btn btn-secondary text-sm">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="btn btn-danger text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {job.status === 'queued' && (
                      <button onClick={() => handleDelete(job.id)} className="btn btn-danger text-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {job.error_log && job.status === 'failed' && (
                  <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                    <p className="text-sm text-error font-medium mb-1">错误信息:</p>
                    <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                      {job.error_log}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 分页组件 */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col items-center space-y-3">
              <div className="text-sm text-gray-400">
                共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {renderPageNumbers().map((pageNum, index) => (
                  pageNum === -1 ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                      <MoreHorizontal className="w-4 h-4" />
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={clsx(
                        'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                        pageNum === pagination.page
                          ? 'bg-primary text-white'
                          : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                      )}
                    >
                      {pageNum}
                    </button>
                  )
                ))}

                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="btn btn-secondary text-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12">
          <ListTodo className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">暂无任务</p>
          <Link to="/transcode" className="btn btn-primary inline-flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>开始转码</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default Jobs;
