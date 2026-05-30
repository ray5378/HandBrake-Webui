import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Trash2,
  Video,
  RefreshCw,
  Grid,
  List,
  Search,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

function Files() {
  const [files, setFiles] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/source');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/files', {
        params: { directory: currentPath }
      });
      setFiles(response.data.data.files);
      setDirectories(response.data.data.directories);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async filePath => {
    if (!confirm('确定要删除这个文件吗？')) return;

    try {
      await api.delete('/files', { params: { path: filePath } });
      fetchFiles();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatSize = bytes => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const navigateToPath = path => {
    setCurrentPath(path);
    setSearchTerm('');
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">文件管理</h1>
          <div className="flex items-center space-x-2 mt-2 text-sm text-gray-400">
            {pathParts.map((part, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-4 h-4" />}
                <button
                  onClick={() => navigateToPath('/' + pathParts.slice(0, index + 1).join('/'))}
                  className="hover:text-white transition-colors"
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索文件..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input pl-10 w-48"
            />
          </div>

          <div className="flex items-center space-x-1 bg-dark-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded transition-colors',
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded transition-colors',
                viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button onClick={fetchFiles} className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <>
          {directories.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-400 mb-3">文件夹</h2>
              <div
                className={clsx(
                  'grid gap-4',
                  viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1'
                )}
              >
                {directories.map(dir => (
                  <button
                    key={dir.path}
                    onClick={() => navigateToPath(dir.path)}
                    className={clsx(
                      'flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors text-left',
                      viewMode === 'grid' && 'flex-col text-center justify-center'
                    )}
                  >
                    <FolderOpen className="w-8 h-8 text-warning flex-shrink-0" />
                    <span className="text-white truncate">{dir.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredFiles.length > 0 ? (
            <div
              className={clsx(
                'grid gap-4',
                viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'grid-cols-1'
              )}
            >
              {filteredFiles.map(file => (
                <div
                  key={file.path}
                  className="card hover:border-primary/50 transition-colors group"
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-video bg-dark-700 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                        <Video className="w-12 h-12 text-gray-600" />
                      </div>
                      <h3 className="font-medium text-white truncate mb-2" title={file.name}>
                        {file.name}
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">{formatSize(file.size)}</p>
                      <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() =>
                            navigate(`/transcode?file=${encodeURIComponent(file.path)}`)
                          }
                          className="btn btn-primary text-xs py-1 px-3"
                        >
                          转码
                        </button>
                        <button
                          onClick={() => handleDelete(file.path)}
                          className="btn btn-danger text-xs py-1 px-3"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Video className="w-8 h-8 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{file.name}</p>
                          <p className="text-sm text-gray-400">
                            {formatSize(file.size)} · {file.extension}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/transcode?file=${encodeURIComponent(file.path)}`)
                          }
                          className="btn btn-primary text-xs"
                        >
                          转码
                        </button>
                        <button
                          onClick={() => handleDelete(file.path)}
                          className="btn btn-danger text-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">暂无文件</p>
              <p className="text-sm text-gray-500 mt-1">请将视频文件放入源目录</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Files;
