import { Fragment, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderOpen,
  Video,
  Grid,
  List,
  Search,
  PlayCircle,
  X,
  MousePointer2,
  Settings,
  ArrowUpDown,
  Check,
  Copy,
  Scissors,
  Clipboard,
  Pencil,
  Trash2
} from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import api from '../services/api';
import clsx from 'clsx';
import BatchTranscodeModal from '../components/BatchTranscodeModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
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
  name: string;
}

interface EmptyContextMenuState {
  x: number;
  y: number;
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
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [lastClickedPath, setLastClickedPath] = useState<string | null>(null);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragRect, setDragRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [emptyContextMenu, setEmptyContextMenu] = useState<EmptyContextMenuState | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [clipboard, setClipboard] = useState<{ type: 'copy' | 'cut'; paths: string[] } | null>(
    null
  );
  const [renameTarget, setRenameTarget] = useState<{ path: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    paths: string[];
    displayName: string;
    isDirectory: boolean;
  } | null>(null);
  const [createFolder, setCreateFolder] = useState(false);

  const [selectedVideoFile, setSelectedVideoFile] = useState<FileItem | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [batchSourcePaths, setBatchSourcePaths] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<{
    files: SearchResult[];
    directories: SearchResult[];
  }>({ files: [], directories: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const emptyContextMenuRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sortPopupRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  const [sortField, setSortFieldState] = useState<'name' | 'modified' | 'size'>('modified');
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>('desc');

  const setSortField = useCallback((field: 'name' | 'modified' | 'size') => {
    setSortFieldState(field);
    localStorage.setItem('fileSortField', field);
    api.put('/users/preferences', { preferences: { fileSortField: field } }).catch(() => {});
  }, []);

  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    setSortOrderState(order);
    localStorage.setItem('fileSortOrder', order);
    api.put('/users/preferences', { preferences: { fileSortOrder: order } }).catch(() => {});
  }, []);
  const [showSortPopup, setShowSortPopup] = useState(false);
  const [showSortSubmenu, setShowSortSubmenu] = useState(false);
  const [sortSubmenuAnchor, setSortSubmenuAnchor] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0
  });

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

  const THUMBNAIL_BATCH_SIZE = 1;

  const fetchThumbnails = useCallback(async () => {
    const videoFiles = filteredFiles.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return VIDEO_EXTENSIONS.includes(ext);
    });
    if (videoFiles.length === 0) return;

    const allPaths = videoFiles.map(f => f.path);

    for (let i = 0; i < allPaths.length; i += THUMBNAIL_BATCH_SIZE) {
      const batch = allPaths.slice(i, i + THUMBNAIL_BATCH_SIZE);
      try {
        const res = await api.post('/files/thumbnails', { paths: batch });
        if (res.data.success && res.data.thumbnails) {
          const batchThumbnails: Record<string, string> = {};
          res.data.thumbnails.forEach((item: { path: string; thumbnail?: string }) => {
            if (item.thumbnail) {
              batchThumbnails[item.path] = item.thumbnail;
            }
          });
          setThumbnails(prev => ({ ...prev, ...batchThumbnails }));
        }
      } catch (error) {
        console.error('Failed to fetch thumbnails batch:', error);
      }
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
    e.stopPropagation();
    setEmptyContextMenu(null);
    const isFile = filteredFiles.some(f => f.path === path);
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      directory: path,
      isFile,
      name
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setEmptyContextMenu(null);
  };

  const handleEmptyContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setEmptyContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-item-type]')) return;

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setSelectedPaths([]);

    const handleMouseMove = (moveE: MouseEvent) => {
      if (!dragStartRef.current) return;
      setIsDragSelecting(true);

      const x1 = Math.min(dragStartRef.current.x, moveE.clientX);
      const y1 = Math.min(dragStartRef.current.y, moveE.clientY);
      const x2 = Math.max(dragStartRef.current.x, moveE.clientX);
      const y2 = Math.max(dragStartRef.current.y, moveE.clientY);

      setDragRect({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 });

      const newSelected: string[] = [];
      document.querySelectorAll('[data-path]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.left < x2 && rect.right > x1 && rect.top < y2 && rect.bottom > y1) {
          newSelected.push(el.getAttribute('data-path')!);
        }
      });
      setSelectedPaths(newSelected);
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      setIsDragSelecting(false);
      setDragRect(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCopy = () => {
    if (!contextMenu) return;
    const paths = selectedPaths.length > 0 ? [...selectedPaths] : [contextMenu.directory];
    setClipboard({ type: 'copy', paths });
    closeContextMenu();
  };

  const handleCut = () => {
    if (!contextMenu) return;
    const paths = selectedPaths.length > 0 ? [...selectedPaths] : [contextMenu.directory];
    setClipboard({ type: 'cut', paths });
    closeContextMenu();
  };

  const handlePaste = async () => {
    if (!clipboard || !currentPath) return;
    try {
      const destinationDir = currentPath;
      if (clipboard.type === 'copy') {
        await api.post('/files/copy', {
          sourcePaths: clipboard.paths,
          destinationDir
        });
      } else {
        await api.post('/files/move', {
          sourcePaths: clipboard.paths,
          destinationDir
        });
      }
      setClipboard(null);
      closeContextMenu();
      fetchFiles();
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const handleRenameClick = () => {
    if (!contextMenu) return;
    setRenameTarget({
      path: contextMenu.directory,
      name: contextMenu.name
    });
    closeContextMenu();
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!renameTarget) return;
    try {
      await api.put('/files/rename', {
        path: renameTarget.path,
        newName
      });
      setRenameTarget(null);
      fetchFiles();
    } catch (error) {
      console.error('Failed to rename:', error);
    }
  };

  const handleDeleteClick = () => {
    if (!contextMenu) return;
    if (selectedPaths.length > 1) {
      setDeleteTarget({
        paths: [...selectedPaths],
        displayName: String(selectedPaths.length) + ' 项',
        isDirectory: false
      });
    } else {
      const parts = contextMenu.directory.split('/');
      const name = parts[parts.length - 1];
      setDeleteTarget({
        paths: [contextMenu.directory],
        displayName: name,
        isDirectory: !contextMenu.isFile
      });
    }
    closeContextMenu();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      for (const p of deleteTarget.paths) {
        await api.delete('/files', { params: { path: p } });
      }
      setDeleteTarget(null);
      setSelectedPaths([]);
      fetchFiles();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      const newPath = currentPath.endsWith('/')
        ? currentPath + folderName
        : currentPath + '/' + folderName;
      await api.post('/files/mkdir', { path: newPath });
      setCreateFolder(false);
      fetchFiles();
    } catch (error) {
      console.error('Failed to create folder:', error);
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
        modifiedAt: ''
      });
      setShowVideoPlayer(true);
    }
    closeContextMenu();
  };

  const handleBatchTranscode = () => {
    if (selectedPaths.length > 0) {
      setSelectedDirectory(selectedPaths[0]);
      setBatchSourcePaths([...selectedPaths]);
    } else if (contextMenu && contextMenu.directory) {
      setSelectedDirectory(contextMenu.directory);
      setBatchSourcePaths([]);
    }
    setShowBatchModal(true);
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
      if (emptyContextMenuRef.current && !emptyContextMenuRef.current.contains(e.target as Node)) {
        setEmptyContextMenu(null);
      }
      if (
        sortPopupRef.current &&
        !sortPopupRef.current.contains(e.target as Node) &&
        sortButtonRef.current &&
        !sortButtonRef.current.contains(e.target as Node)
      ) {
        setShowSortPopup(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const savedField = localStorage.getItem('fileSortField');
    const savedOrder = localStorage.getItem('fileSortOrder');
    if (savedField && ['name', 'modified', 'size'].includes(savedField)) {
      setSortFieldState(savedField as 'name' | 'modified' | 'size');
    }
    if (savedOrder && ['asc', 'desc'].includes(savedOrder)) {
      setSortOrderState(savedOrder as 'asc' | 'desc');
    }

    api
      .get<{ data: { preferences: Record<string, string> } }>('/users/preferences')
      .then(res => {
        const prefs = res.data.data.preferences;
        if (prefs.fileSortField && ['name', 'modified', 'size'].includes(prefs.fileSortField)) {
          setSortFieldState(prefs.fileSortField as 'name' | 'modified' | 'size');
        }
        if (prefs.fileSortOrder && ['asc', 'desc'].includes(prefs.fileSortOrder)) {
          setSortOrderState(prefs.fileSortOrder as 'asc' | 'desc');
        }
      })
      .catch(() => {});
  }, []);

  const filteredFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'modified') {
        cmp = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
      } else if (sortField === 'size') {
        cmp = a.size - b.size;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [files, sortField, sortOrder]);

  const allItems = useMemo(() => {
    return [...directories.map(d => d.path), ...filteredFiles.map(f => f.path)];
  }, [directories, filteredFiles]);

  const selectRange = useCallback(
    (path: string) => {
      if (!lastClickedPath) {
        setSelectedPaths([path]);
        setLastClickedPath(path);
        return;
      }
      const lastIdx = allItems.indexOf(lastClickedPath);
      const currentIdx = allItems.indexOf(path);
      if (lastIdx === -1 || currentIdx === -1) return;
      const start = Math.min(lastIdx, currentIdx);
      const end = Math.max(lastIdx, currentIdx);
      const range = allItems.slice(start, end + 1);
      setSelectedPaths(range);
      setLastClickedPath(path);
    },
    [lastClickedPath, allItems]
  );

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-white'>{t('files.title')}</h1>
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

          <div className='relative shrink-0'>
            <button
              ref={sortButtonRef}
              onClick={() => setShowSortPopup(prev => !prev)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                showSortPopup || sortField !== 'modified' || sortOrder !== 'desc'
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              )}
            >
              <ArrowUpDown className='w-4 h-4' />
            </button>
            {showSortPopup && (
              <div
                ref={sortPopupRef}
                className='absolute top-full right-0 mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden'
              >
                <div className='px-3 py-2 text-xs text-gray-500 border-b border-dark-700'>
                  排序方式
                </div>
                <div className='p-1'>
                  {(
                    [
                      { value: 'name', label: '名称' },
                      { value: 'modified', label: '修改日期' },
                      { value: 'size', label: '大小' }
                    ] as const
                  ).map(field => (
                    <button
                      key={field.value}
                      onClick={() => setSortField(field.value)}
                      className='w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-dark-700 rounded transition-colors'
                    >
                      {field.label}
                      {sortField === field.value && <Check className='w-3.5 h-3.5 text-primary' />}
                    </button>
                  ))}
                </div>
                <div className='px-3 py-2 text-xs text-gray-500 border-t border-dark-700'>
                  排列顺序
                </div>
                <div className='p-1'>
                  <button
                    onClick={() => setSortOrder('asc')}
                    className='w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-dark-700 rounded transition-colors'
                  >
                    递增
                    {sortOrder === 'asc' && <Check className='w-3.5 h-3.5 text-primary' />}
                  </button>
                  <button
                    onClick={() => setSortOrder('desc')}
                    className='w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-dark-700 rounded transition-colors'
                  >
                    递减
                    {sortOrder === 'desc' && <Check className='w-3.5 h-3.5 text-primary' />}
                  </button>
                </div>
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
        <div
          onContextMenu={handleEmptyContextMenu}
          onMouseDown={handleDragStart}
          className='relative min-h-[calc(100vh-240px)] select-none'
        >
          <div className='flex items-center space-x-2 text-sm text-gray-500 mb-5 bg-dark-700/50 rounded-lg px-4 py-2.5'>
            <MousePointer2 className='w-4 h-4 text-primary shrink-0' />
            <span>{t('files.rightClickHint')}</span>
          </div>

          <div className='mb-6'>
            <div className='flex flex-wrap items-center gap-1 mb-4'>
              {pathParts.map((part, index) => (
                <Fragment key={index}>
                  {index > 0 && (
                    <span className='text-purple-500 text-lg font-light select-none'>/</span>
                  )}
                  <button
                    onClick={() => navigateToPath('/' + pathParts.slice(0, index + 1).join('/'))}
                    className='text-purple-400 hover:text-purple-300 transition-colors truncate max-w-[200px] text-lg font-medium'
                  >
                    {part}
                  </button>
                </Fragment>
              ))}
            </div>
            {directories.length > 0 && (
              <div
                className={clsx(
                  'grid gap-4',
                  viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1'
                )}
              >
                {directories.map(dir => (
                  <button
                    key={dir.path}
                    data-item-type='directory'
                    data-path={dir.path}
                    onClick={e => {
                      if (e.ctrlKey) {
                        e.stopPropagation();
                        setSelectedPaths(prev =>
                          prev.includes(dir.path)
                            ? prev.filter(p => p !== dir.path)
                            : [...prev, dir.path]
                        );
                        setLastClickedPath(dir.path);
                        return;
                      }
                      if (e.shiftKey && lastClickedPath) {
                        e.stopPropagation();
                        selectRange(dir.path);
                        return;
                      }
                      setSelectedPaths([]);
                      navigateToPath(dir.path);
                    }}
                    onContextMenu={e => {
                      if (!selectedPaths.includes(dir.path)) {
                        setSelectedPaths([dir.path]);
                      }
                      handleContextMenu(e, dir.path);
                    }}
                    className={clsx(
                      'flex items-center space-x-3 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors text-left relative',
                      viewMode === 'grid' && 'flex-col text-center justify-center',
                      selectedPaths.includes(dir.path) && 'ring-2 ring-primary'
                    )}
                  >
                    <FolderOpen className='w-8 h-8 text-warning flex-shrink-0' />
                    <span className='text-white break-all whitespace-normal text-center'>
                      {dir.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
                  data-item-type='file'
                  data-path={file.path}
                  className={clsx(
                    'card hover:bg-dark-600 hover:border-primary/50 transition-colors cursor-context-menu',
                    selectedPaths.includes(file.path) && 'ring-2 ring-primary'
                  )}
                  onContextMenu={e => {
                    if (!selectedPaths.includes(file.path)) {
                      setSelectedPaths([file.path]);
                    }
                    handleContextMenu(e, file.path);
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    if (e.ctrlKey) {
                      setSelectedPaths(prev =>
                        prev.includes(file.path)
                          ? prev.filter(p => p !== file.path)
                          : [...prev, file.path]
                      );
                      setLastClickedPath(file.path);
                      return;
                    }
                    if (e.shiftKey && lastClickedPath) {
                      selectRange(file.path);
                      return;
                    }
                    setSelectedPaths([]);
                    setLastClickedPath(file.path);
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
        </div>
      )}

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className='fixed bg-dark-800 border border-dark-700 rounded-lg shadow-2xl z-50 min-w-[180px] overflow-hidden'
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 220),
            top: Math.min(contextMenu.y, window.innerHeight - 320)
          }}
        >
          <div>
            {contextMenu.isFile && selectedPaths.length <= 1 && (
              <button
                onClick={handlePlayVideo}
                className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3'
              >
                <PlayCircle className='w-4 h-4 text-primary' />
                <span>{t('nav.play')}</span>
              </button>
            )}
            {selectedPaths.length <= 1 && (
              <button
                onClick={handleBatchTranscode}
                className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3'
              >
                <Settings className='w-4 h-4 text-primary' />
                <span>{t('nav.transcode')}</span>
              </button>
            )}
            <div className='border-t border-dark-700' />
            <button
              onClick={handleCopy}
              className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3'
            >
              <Copy className='w-4 h-4 text-gray-400' />
              <span>
                {t('files.copy')}
                {selectedPaths.length > 1 ? ` (${selectedPaths.length})` : ''}
              </span>
            </button>
            <button
              onClick={handleCut}
              className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3'
            >
              <Scissors className='w-4 h-4 text-gray-400' />
              <span>
                {t('files.cut')}
                {selectedPaths.length > 1 ? ` (${selectedPaths.length})` : ''}
              </span>
            </button>
            <button
              onClick={handleDeleteClick}
              className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3'
            >
              <Trash2 className='w-4 h-4 text-error' />
              <span>
                {t('files.delete')}
                {selectedPaths.length > 1 ? ` (${selectedPaths.length})` : ''}
              </span>
            </button>
            {selectedPaths.length <= 1 && (
              <button
                onClick={handleRenameClick}
                className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3'
              >
                <Pencil className='w-4 h-4 text-gray-400' />
                <span>{t('files.rename')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {emptyContextMenu && (
        <div
          ref={emptyContextMenuRef}
          className='fixed bg-dark-800 border border-dark-700 rounded-lg shadow-2xl z-50 min-w-[180px] overflow-hidden'
          style={{
            left: Math.min(emptyContextMenu.x, window.innerWidth - 220),
            top: Math.min(emptyContextMenu.y, window.innerHeight - 180)
          }}
        >
          <button
            onClick={() => {
              setCreateFolder(true);
              setEmptyContextMenu(null);
            }}
            className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3'
          >
            <FolderOpen className='w-4 h-4 text-warning' />
            <span>{t('files.newFolder')}</span>
          </button>
          <button
            onClick={() => {
              setShowSortSubmenu(true);
              setSortSubmenuAnchor({ x: emptyContextMenu.x, y: emptyContextMenu.y });
            }}
            className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3'
          >
            <ArrowUpDown className='w-4 h-4 text-gray-400' />
            <span>排序方式</span>
          </button>
          {clipboard && (
            <>
              <div className='border-t border-dark-700' />
              <button
                onClick={handlePaste}
                className='w-full px-4 py-3 text-left text-white hover:bg-dark-700 transition-colors flex items-center space-x-3'
              >
                <Clipboard className='w-4 h-4 text-primary' />
                <span>
                  {t('files.paste')}
                  {clipboard.type === 'cut' ? ` (${t('files.cut')})` : ''}
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {showSortSubmenu && (
        <div
          className='fixed bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden'
          style={{
            left:
              sortSubmenuAnchor.x > window.innerWidth / 2
                ? Math.min(sortSubmenuAnchor.x - 190, window.innerWidth - 200)
                : Math.min(sortSubmenuAnchor.x + 190, window.innerWidth - 200),
            top: Math.min(sortSubmenuAnchor.y, window.innerHeight - 280)
          }}
          onMouseLeave={() => setShowSortSubmenu(false)}
        >
          <div className='px-3 py-2 text-xs text-gray-500 border-b border-dark-700'>排序方式</div>
          <div className='p-1'>
            {(
              [
                { value: 'name', label: '名称' },
                { value: 'modified', label: '修改日期' },
                { value: 'size', label: '大小' }
              ] as const
            ).map(field => (
              <button
                key={field.value}
                onClick={() => {
                  setSortField(field.value);
                  setShowSortSubmenu(false);
                  setEmptyContextMenu(null);
                }}
                className='w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-dark-700 rounded transition-colors'
              >
                {field.label}
                {sortField === field.value && <Check className='w-3.5 h-3.5 text-primary' />}
              </button>
            ))}
          </div>
          <div className='px-3 py-2 text-xs text-gray-500 border-t border-dark-700'>排列顺序</div>
          <div className='p-1'>
            <button
              onClick={() => {
                setSortOrder('asc');
                setShowSortSubmenu(false);
                setEmptyContextMenu(null);
              }}
              className='w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-dark-700 rounded transition-colors'
            >
              递增
              {sortOrder === 'asc' && <Check className='w-3.5 h-3.5 text-primary' />}
            </button>
            <button
              onClick={() => {
                setSortOrder('desc');
                setShowSortSubmenu(false);
                setEmptyContextMenu(null);
              }}
              className='w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-dark-700 rounded transition-colors'
            >
              递减
              {sortOrder === 'desc' && <Check className='w-3.5 h-3.5 text-primary' />}
            </button>
          </div>
        </div>
      )}

      {isDragSelecting && dragRect && (
        <div
          className='fixed z-50 border-2 border-primary bg-primary/10 pointer-events-none'
          style={{
            left: dragRect.x,
            top: dragRect.y,
            width: dragRect.width,
            height: dragRect.height
          }}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t('files.confirmDeleteTitle')}
        message={
          deleteTarget
            ? deleteTarget.paths.length > 1
              ? t('files.confirmDeleteMultiple', { count: deleteTarget.paths.length })
              : t('files.confirmDeleteMessage', { name: deleteTarget.displayName }) +
                (deleteTarget.isDirectory ? '\n' + t('files.confirmDeleteDirectory') : '')
            : ''
        }
        confirmText={t('common.confirm') || '确认'}
        cancelText={t('common.cancel') || '取消'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      {renameTarget && (
        <RenameModal
          currentName={renameTarget.name}
          onConfirm={handleRenameConfirm}
          onCancel={() => setRenameTarget(null)}
        />
      )}

      {createFolder && (
        <CreateFolderModal onConfirm={handleCreateFolder} onCancel={() => setCreateFolder(false)} />
      )}

      {showBatchModal && selectedDirectory && (
        <BatchTranscodeModal
          directory={selectedDirectory}
          sourcePaths={batchSourcePaths.length > 0 ? batchSourcePaths : undefined}
          onClose={() => {
            setShowBatchModal(false);
            setSelectedDirectory(null);
            setBatchSourcePaths([]);
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

interface RenameModalProps {
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

function RenameModal({ currentName, onConfirm, onCancel }: RenameModalProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const dotIndex = currentName.lastIndexOf('.');
      if (dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [currentName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm(value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4'>
      <div className='bg-dark-800 rounded-xl max-w-md w-full p-6'>
        <h3 className='text-lg font-bold text-white mb-4'>{t('files.renameTitle')}</h3>
        <input
          ref={inputRef}
          className='input w-full mb-4'
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('files.renamePlaceholder')}
        />
        <div className='flex space-x-3'>
          <button onClick={onCancel} className='btn btn-secondary flex-1'>
            {t('common.cancel', '取消')}
          </button>
          <button onClick={() => onConfirm(value)} className='btn btn-primary flex-1'>
            {t('common.confirm', '确认')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CreateFolderModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

function CreateFolderModal({ onConfirm, onCancel }: CreateFolderModalProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onConfirm(value.trim());
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4'>
      <div className='bg-dark-800 rounded-xl max-w-md w-full p-6'>
        <h3 className='text-lg font-bold text-white mb-4'>{t('files.newFolder')}</h3>
        <input
          ref={inputRef}
          className='input w-full mb-4'
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('files.newFolderPlaceholder')}
        />
        <div className='flex space-x-3'>
          <button onClick={onCancel} className='btn btn-secondary flex-1'>
            {t('common.cancel', '取消')}
          </button>
          <button
            onClick={() => value.trim() && onConfirm(value.trim())}
            className='btn btn-primary flex-1'
            disabled={!value.trim()}
          >
            {t('common.confirm', '确认')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Files;
