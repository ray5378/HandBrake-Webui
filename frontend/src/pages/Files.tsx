import { Fragment, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderOpen,
  Video,
  Grid,
  List,
  Search,
  ChevronRight,
  PlayCircle,
  X,
  MousePointer2,
  Settings
} from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import api from '../services/api';
import clsx from 'clsx';
import BatchTranscodeModal from '../components/BatchTranscodeModal';
import { formatFileSize } from '../utils/format';
import { FileItem, SearchResult } from '../types';

const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mkv',
  '.webm',
  '.avi',
  '.mov',
  '.wmv',
  '.flv',
  '.ts',
  '.mts',
  '.m2ts',
  '.m4v'
];

interface FileDirectory {
  name: string;
  path: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  directory: string;
  isFile: boolean;
}

function Files() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [directories, setDirectories] = useState<FileDirectory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/drive');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const [selectedVideoFile, setSelectedVideoFile] = useState<FileItem | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{
    files: SearchResult[];
    directories: SearchResult[];
  }>({ files: [], directories: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const parentPath =
    currentPath === '/drive' ? null : currentPath.substring(0, currentPath.lastIndexOf('/'));

  const fetchFiles = useCallback(async () => {
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
  }, [currentPath]);

  useEffect(() => {
    fetchFiles();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchFiles]);

  const fetchThumbnails = useCallback(async () => {
    const videoFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return VIDEO_EXTENSIONS.includes(ext);
    });
    if (videoFiles.length === 0) return;
    try {
      const res = await api.post('/files/thumbnails', {
        paths: videoFiles.map(f => f.path)
      });
      if (res.data.success && res.data.thumbnails) {
        const newThumbnails: Record<string, string> = {};
        res.data.thumbnails.forEach((item: { path: string; thumbnail?: string }) => {
          if (item.thumbnail) {
            newThumbnails[item.path] = item.thumbnail;
          }
        });
        setThumbnails(prev => ({ ...prev, ...newThumbnails }));
      }
    } catch (error) {
      console.error('Failed to fetch thumbnails:', error);
    }
  }, [files]);

  useEffect(() => {
    if (files.length > 0) {
      fetchThumbnails();
    }
  }, [files, fetchThumbnails]);

  const formatSize = formatFileSize;

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSearchTerm('');
  };

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    const isFile = filteredFiles.some(f => f.path === path);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      directory: path,
      isFile
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!parentPath) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      navigateToPath(parentPath);
    }
  };

  const handleFileClick = (file: FileItem) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (VIDEO_EXTENSIONS.includes(ext)) {
      setSelectedVideoFile(file);
      setShowVideoPlayer(true);
    }
  };

  const handlePlayVideo = () => {
    if (contextMenu && contextMenu.directory) {
      const parts = contextMenu.directory.split('/');
      const name = parts[parts.length - 1];
      setSelectedVideoFile({
        path: contextMenu.directory,
        name,
        size: 0,
        extension: '',
        modified: ''
      });
      setShowVideoPlayer(true);
    }
    closeContextMenu();
  };

  const handleBatchTranscode = () => {
    if (contextMenu && contextMenu.directory) {
      setSelectedDirectory(contextMenu.directory);
      setShowBatchModal(true);
    }
    closeContextMenu();
  };

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ files: [], directories: [] });
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.get('/files/search', { params: { q: query } });
      setSearchResults(res.data.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchResultClick = (result: SearchResult) => {
    setShowSearchResults(false);
    setSearchTerm('');
    if (result.type === 'directory') {
      navigateToPath(result.path);
    } else {
      navigateToPath(result.path.substring(0, result.path.lastIndexOf('/')) || '/drive');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredFiles = useMemo(() => files, [files]);

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-white'>{t('files.title')}</h1>
          <div className='flex flex-wrap items-center gap-1 mt-2 text-sm text-gray-400'>
            {pathParts.map((part, index) => (
              <Fragment key={index}>
                {index > 0 && <ChevronRight className='w-4 h-4 shrink-0' />}
                <button
                  onClick={() => navigateToPath('/' + pathParts.slice(0, index + 1).join('/'))}
                  className='hover:text-white transition-colors truncate max-w-[120px]'
                >
                  {part}
                </button>
              </Fragment>
            ))}
          </div>
        </div>

        <div className='flex items-center gap-2 flex-wrap'>
          <div className='relative flex-1 min-w-[140px]'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              placeholder={t('common.search') + '...'}
              value={searchTerm}
              onChange={e => {
                const value = e.target.value;
                setSearchTerm(value);
                if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                if (!value.trim()) {
                  setSearchResults({ files: [], directories: [] });
                  setShowSearchResults(false);
                  return;
                }
                searchTimerRef.current = setTimeout(() => doSearch(value), 300);
              }}
              onFocus={() => {
                if (
                  searchTerm.trim() &&
                  (searchResults.files.length > 0 || searchResults.directories.length > 0)
                ) {
                  setShowSearchResults(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className='input pl-10 w-full pr-8'
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchResults({ files: [], directories: [] });
                  setShowSearchResults(false);
                  if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                }}
                className='absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors'
              >
                <X className='w-3.5 h-3.5' />
              </button>
            )}
            {showSearchResults && (
              <div className='absolute top-full left-0 sm:right-0 sm:left-auto mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 max-h-[400px] sm:max-h-[800px] overflow-y-auto min-w-[260px] sm:min-w-[600px] max-w-[90vw]'>
                {searchLoading ? (
                  <div className='p-4 text-center text-gray-400 text-sm'>{t('common.loading')}</div>
                ) : searchResults.directories.length === 0 && searchResults.files.length === 0 ? (
                  <div className='p-4 text-center text-gray-500 text-sm'>
                    {t('files.noSearchResults', '未找到匹配的结果')}
                  </div>
                ) : (
                  <>
                    {searchResults.directories.length > 0 && (
                      <div className='p-2'>
                        <p className='text-xs text-gray-500 px-2 py-1'>
                          {t('common.directories') || '文件夹'}
                        </p>
                        {searchResults.directories.map(dir => (
                          <button
                            key={dir.path}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => handleSearchResultClick(dir)}
                            className='w-full flex items-center space-x-3 px-2 py-2 hover:bg-dark-700 rounded transition-colors text-left'
                          >
                            <FolderOpen className='w-5 h-5 text-warning shrink-0' />
                            <div className='flex-1 min-w-0'>
                              <p className='text-white text-sm break-all whitespace-normal'>
                                {dir.name}
                              </p>
                              <p className='text-gray-500 text-xs break-all whitespace-normal'>
                                {dir.path}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.files.length > 0 && (
                      <div className='p-2 pt-0'>
                        <p className='text-xs text-gray-500 px-2 py-1'>
                          {t('files.title') || '文件'}
                        </p>
                        {searchResults.files.map(file => (
                          <button
                            key={file.path}
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => handleSearchResultClick(file)}
                            className='w-full flex items-center space-x-3 px-2 py-2 hover:bg-dark-700 rounded transition-colors text-left'
                          >
                            <Video className='w-5 h-5 text-primary shrink-0' />
                            <div className='flex-1 min-w-0'>
                              <p className='text-white text-sm break-all whitespace-normal'>
                                {file.name}
                              </p>
                              <p className='text-gray-500 text-xs break-all whitespace-normal'>
                                {file.path}
                                {file.size != null && (
                                  <span className='ml-2'>{formatFileSize(file.size)}</span>
                                )}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className='flex items-center space-x-1 bg-dark-700 rounded-lg p-1 shrink-0'>
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
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {(directories.length > 0 || files.length > 0) && (
            <div className='flex items-center space-x-2 text-sm text-gray-500 mb-5 bg-dark-700/50 rounded-lg px-4 py-2.5'>
              <MousePointer2 className='w-4 h-4 text-primary shrink-0' />
              <span>{t('files.rightClickHint')}</span>
            </div>
          )}

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
              {filteredFiles.map(file => {
                const ext = '.' + file.name.split('.').pop()?.toLowerCase();
                const isVideo = VIDEO_EXTENSIONS.includes(ext);
                const thumbnail = isVideo ? thumbnails[file.path] : null;

                return (
                  <div
                    key={file.path}
                    className='card hover:bg-dark-600 hover:border-primary/50 transition-colors cursor-context-menu'
                    onContextMenu={e => handleContextMenu(e, file.path)}
                    onClick={e => {
                      e.stopPropagation();
                      handleFileClick(file);
                    }}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className='aspect-video bg-dark-700 rounded-lg flex items-center justify-center mb-3 overflow-hidden'>
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={file.name}
                              className='w-full h-full object-cover'
                            />
                          ) : isVideo ? (
                            <Video className='w-12 h-12 text-gray-600' />
                          ) : (
                            <Video className='w-12 h-12 text-gray-600' />
                          )}
                        </div>
                        <h3 className='font-medium text-white break-all whitespace-normal mb-2'>
                          {file.name}
                        </h3>
                        <p className='text-xs text-gray-400 mb-3'>{formatSize(file.size)}</p>
                      </>
                    ) : (
                      <div className='flex items-center space-x-3'>
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={file.name}
                            className='w-12 h-8 object-cover rounded flex-shrink-0'
                          />
                        ) : (
                          <Video className='w-8 h-8 text-gray-600 flex-shrink-0' />
                        )}
                        <div className='flex-1 min-w-0'>
                          <p className='text-white font-medium break-all whitespace-normal'>
                            {file.name}
                          </p>
                          <p className='text-sm text-gray-400'>
                            {formatSize(file.size)} · {file.extension}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className='fixed bg-dark-800 border border-dark-700 rounded-lg shadow-2xl z-50 min-w-[200px] overflow-hidden'
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 220),
            top: Math.min(contextMenu.y, window.innerHeight - 200)
          }}
        >
          <div>
            {contextMenu.isFile && (
              <button
                onClick={handlePlayVideo}
                className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg'
              >
                <PlayCircle className='w-4 h-4 text-primary' />
                <span>{t('nav.play')}</span>
              </button>
            )}
            <button
              onClick={handleBatchTranscode}
              className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg'
            >
              <Settings className='w-4 h-4 text-primary' />
              <span>{t('nav.transcode')}</span>
            </button>
          </div>
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

      {showVideoPlayer && selectedVideoFile && (
        <VideoPlayer
          file={selectedVideoFile}
          onClose={() => {
            setShowVideoPlayer(false);
            setSelectedVideoFile(null);
          }}
        />
      )}
    </div>
  );
}

export default Files;
