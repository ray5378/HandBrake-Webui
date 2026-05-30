import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';
import { formatFileSize } from '../utils/format';

function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobDetail();

    const interval = setInterval(() => {
      if (job && (job.status === 'queued' || job.status === 'processing')) {
        fetchJobDetail();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [id, job?.status]);

  const fetchJobDetail = async () => {
    try {
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data.data);
    } catch (error) {
      console.error('Failed to fetch job detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('确定要取消这个任务吗？')) return;

    try {
      await api.post(`/jobs/${id}/cancel`);
      fetchJobDetail();
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个任务记录吗？')) return;

    try {
      await api.delete(`/jobs/${id}`);
      window.location.href = '/jobs';
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
        <p className="text-gray-400">任务不存在</p>
        <Link to="/jobs" className="btn btn-primary mt-4">
          返回任务列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/jobs" className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">任务详情</h1>
          <p className="text-gray-400 text-sm mt-1">ID: {job.id}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {job.status === 'queued' && <Clock className="w-8 h-8 text-warning" />}
            {job.status === 'processing' && (
              <Play className="w-8 h-8 text-secondary animate-pulse" />
            )}
            {job.status === 'completed' && <CheckCircle className="w-8 h-8 text-success" />}
            {job.status === 'failed' && <XCircle className="w-8 h-8 text-error" />}
            {job.status === 'cancelled' && <XCircle className="w-8 h-8 text-gray-500" />}
            <div>
              <h2 className="text-xl font-semibold text-white">
                {job.source_file.split('/').pop()}
              </h2>
              <span className={clsx('badge', `badge-${job.status}`)}>
                {job.status === 'queued' && '排队中'}
                {job.status === 'processing' && '转码中'}
                {job.status === 'completed' && '已完成'}
                {job.status === 'failed' && '失败'}
                {job.status === 'cancelled' && '已取消'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {job.status === 'processing' && (
              <button onClick={handleCancel} className="btn btn-danger">
                <XCircle className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">取消</span>
              </button>
            )}

            {(job.status === 'completed' ||
              job.status === 'failed' ||
              job.status === 'cancelled') && (
              <button onClick={handleDelete} className="btn btn-secondary">
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">删除</span>
              </button>
            )}
          </div>
        </div>

        {job.status === 'processing' && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-secondary">转码进度</span>
              <span className="text-white font-mono text-lg">{job.progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">源文件</p>
            <p className="text-white font-mono text-sm break-all">{job.source_file}</p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">输出文件</p>
            <p className="text-white font-mono text-sm break-all">{job.output_file}</p>
          </div>

          {job.preset_name && (
            <div>
              <p className="text-sm text-gray-400 mb-1">预设</p>
              <p className="text-white">{job.preset_name}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-400 mb-1">创建时间</p>
            <p className="text-white">{new Date(job.created_at).toLocaleString('zh-CN')}</p>
          </div>

          {job.started_at && (
            <div>
              <p className="text-sm text-gray-400 mb-1">开始时间</p>
              <p className="text-white">{new Date(job.started_at).toLocaleString('zh-CN')}</p>
            </div>
          )}

          {job.completed_at && (
            <div>
              <p className="text-sm text-gray-400 mb-1">完成时间</p>
              <p className="text-white">{new Date(job.completed_at).toLocaleString('zh-CN')}</p>
            </div>
          )}
          
          {job.source_file_size && (
            <div>
              <p className="text-sm text-gray-400 mb-1">源文件大小</p>
              <p className="text-white">{formatFileSize(job.source_file_size)}</p>
            </div>
          )}
          
          {job.output_file_size && (
            <div>
              <p className="text-sm text-gray-400 mb-1">输出文件大小</p>
              <p className="text-green-400">{formatFileSize(job.output_file_size)}</p>
            </div>
          )}
        </div>

        {job.error_log && (
          <div className="mt-6">
            <p className="text-sm text-error mb-2">错误日志:</p>
            <pre className="bg-dark-700 p-4 rounded-lg text-xs text-gray-300 font-mono overflow-x-auto max-h-64">
              {job.error_log}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDetail;
