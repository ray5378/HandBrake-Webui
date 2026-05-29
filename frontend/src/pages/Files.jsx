import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderOpen,
  Download,
  Trash2,
  Video,
  RefreshCw,
  Grid,
  List,
  Search,
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';
import BatchTranscodeModal from '../components/BatchTranscodeModal';

function Files() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/drive');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const contextMenuRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    fetchFiles();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [currentPath]);

  const fetchFiles = async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const response = await api.get('/files', {
        params: { directory: currentPath },
        signal: abortRef.current.signal
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
    if (!confirm(t('files.confirmDelete'))) return;

    try {
      await api.delete('/files', { params: { path: filePath } });
      fetchFiles();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDownload = async (filePath, fileName) => {
    try {
      const response = await api.get('/files/download', {
        params: { path: filePath },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Download failed:', error);
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

  const handleContextMenu = (e, directory) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      directory
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleBatchTranscode = () => {
    if (contextMenu && contextMenu.directory) {
      setSelectedDirectory(contextMenu.directory);
      setShowBatchModal(true);
    }
    closeContextMenu();
  };

  useEffect(() => {
    const handleClickOutside = e => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredFiles = useMemo(
    () => files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [files, searchTerm]
  );

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-white'>{t('files.title')}</h1>
          <div className='flex items-center space-x-2 mt-2 text-sm text-gray-400'>
            {pathParts.map((part, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className='w-4 h-4' />}
                <button
                  onClick={() => navigateToPath('/' + pathParts.slice(0, index + 1).join('/'))}
                  className='hover:text-white transition-colors'
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className='flex items-center space-x-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              placeholder={t('common.search') + '...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='input pl-10 w-48'
            />
          </div>

          <div className='flex items-center space-x-1 bg-dark-700 rounded-lg p-1'>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded transition-colors',
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400'
              )}
            >
              <Grid className='w-4 h-4' />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded transition-colors',
                viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400'
              )}
            >
              <List className='w-4 h-4' />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className='text-center py-12 text-gray-400'>{t('common.loading')}</div>
      ) : (
        <>
          {directories.length > 0 && (
            <div className='mb-6'>
              <h2 className='text-sm font-medium text-gray-400 mb-3'>
                {t('common.directories') || 'Directories'}
              </h2>
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
                    onContextMenu={e => handleContextMenu(e, dir.path)}
                    className={clsx(
                      'flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors text-left relative',
                      viewMode === 'grid' && 'flex-col text-center justify-center'
                    )}
                  >
                    <FolderOpen className='w-8 h-8 text-warning flex-shrink-0' />
                    <span className='text-white break-all whitespace-normal text-center'>
                      {dir.name}
                    </span>
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
                  className='card hover:border-primary/50 transition-colors group'
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className='aspect-video bg-dark-700 rounded-lg flex items-center justify-center mb-3 overflow-hidden'>
                        <Video className='w-12 h-12 text-gray-600' />
                      </div>
                      <h3 className='font-medium text-white break-all whitespace-normal mb-2'>
                        {file.name}
                      </h3>
                      <p className='text-xs text-gray-400 mb-3'>{formatSize(file.size)}</p>
                      <div className='flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <button
                          onClick={() => handleDownload(file.path, file.name)}
                          className='btn btn-secondary text-xs py-1 px-3'
                        >
                          <Download className='w-3 h-3' />
                        </button>
                        <button
                          onClick={() => handleDelete(file.path)}
                          className='btn btn-danger text-xs py-1 px-3'
                        >
                          <Trash2 className='w-3 h-3' />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3 flex-1 min-w-0'>
                        <Video className='w-8 h-8 text-gray-600 flex-shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <p className='text-white font-medium break-all whitespace-normal'>
                            {file.name}
                          </p>
                          <p className='text-sm text-gray-400'>
                            {formatSize(file.size)} · {file.extension}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() => handleDownload(file.path, file.name)}
                          className='btn btn-secondary text-xs'
                        >
                          <Download className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => handleDelete(file.path)}
                          className='btn btn-danger text-xs'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <Video className='w-16 h-16 text-gray-600 mx-auto mb-4' />
              <p className='text-gray-400'>{t('files.noFiles')}</p>
              <p className='text-sm text-gray-500 mt-1'>{t('files.dragDropHint')}</p>
            </div>
          )}
        </>
      )}

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className='fixed bg-dark-800 border border-dark-700 rounded-lg shadow-2xl z-50 py-1 min-w-[200px]'
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 220),
            top: Math.min(contextMenu.y, window.innerHeight - 200)
          }}
        >
          <button
            onClick={handleBatchTranscode}
            className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3'
          >
            <PlayCircle className='w-4 h-4 text-primary' />
            <span>{t('common.batchTranscode') || 'Batch Transcode'}</span>
          </button>
        </div>
      )}

      {showBatchModal && selectedDirectory && (
        <BatchTranscodeModal
          directory={selectedDirectory}
          onClose={() => {
            setShowBatchModal(false);
            setSelectedDirectory(null);
          }}
          onSuccess={() => navigate('/jobs')}
        />
      )}
    </div>
  );
}

export default Files;
