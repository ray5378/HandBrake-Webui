import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
      label: '总任务数',
      value: stats?.total || 0,
      icon: Video,
      color: 'text-primary'
    },
    {
      label: '排队中',
      value: stats?.queued || 0,
      icon: Clock,
      color: 'text-warning'
    },
    {
      label: '转码中',
      value: stats?.processing || 0,
      icon: Play,
      color: 'text-secondary'
    },
    {
      label: '已完成',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'text-success'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">仪表盘</h1>
          <p className="text-gray-400 mt-1">系统概览和快速操作</p>
        </div>
        <Link to="/transcode" className="btn btn-primary inline-flex items-center space-x-2">
          <Play className="w-4 h-4" />
          <span>开始转码</span>
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
            <h2 className="text-xl font-semibold text-white">最近任务</h2>
            <Link
              to="/jobs"
              className="text-primary hover:text-primary/80 text-sm flex items-center space-x-1"
            >
              <span>查看全部</span>
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
                      {new Date(job.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge badge-${job.status}`}>
                      {job.status === 'queued' && '排队'}
                      {job.status === 'processing' && '转码中'}
                      {job.status === 'completed' && '完成'}
                      {job.status === 'failed' && '失败'}
                      {job.status === 'cancelled' && '取消'}
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
              <p>暂无任务</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">系统信息</h2>

          {systemInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">HandBrake 版本</p>
                  <p className="text-white font-mono">{systemInfo.handbrakeVersion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Node.js 版本</p>
                  <p className="text-white font-mono">{systemInfo.nodeVersion}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">存储空间</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">已使用</span>
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
                    共 {formatBytes(systemInfo.diskUsage?.total || 0)}， 可用{' '}
                    {formatBytes(systemInfo.diskUsage?.free || 0)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">运行时间</p>
                <p className="text-white font-mono">
                  {Math.floor(systemInfo.uptime / 3600)} 小时{' '}
                  {Math.floor((systemInfo.uptime % 3600) / 60)} 分钟
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/files"
            className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
          >
            <FolderOpen className="w-8 h-8 text-primary" />
            <div>
              <p className="text-white font-medium">文件管理</p>
              <p className="text-sm text-gray-400">浏览和上传视频文件</p>
            </div>
          </Link>

          <Link
            to="/presets"
            className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
          >
            <TrendingUp className="w-8 h-8 text-secondary" />
            <div>
              <p className="text-white font-medium">预设管理</p>
              <p className="text-sm text-gray-400">创建和管理转码预设</p>
            </div>
          </Link>

          <Link
            to="/settings"
            className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
          >
            <XCircle className="w-8 h-8 text-warning" />
            <div>
              <p className="text-white font-medium">系统设置</p>
              <p className="text-sm text-gray-400">配置和用户管理</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
