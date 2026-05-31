import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Video,
  Settings,
  Loader2,
  CheckCircle,
  FolderOpen,
  ChevronRight,
  GitBranch,
  Plus,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';
import { useLocalStorage } from '../hooks';

const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.wmv',
  '.flv',
  '.webm',
  '.m4v',
  '.mpg',
  '.mpeg'
];

function BatchTranscodeModal({ directory, onClose, onSuccess }) {
  const { t } = useTranslation();
  const isSingleFile = VIDEO_EXTENSIONS.includes(
    '.' + (directory || '').split('.').pop()?.toLowerCase()
  );

  // 提取源目录最后部分（如果不是单文件）
  const sourceDirBasename = useMemo(() => {
    if (isSingleFile) return '';
    const parts = (directory || '').split('/').filter(Boolean);
    return parts.length > 0 ? parts.pop() : '';
  }, [directory, isSingleFile]);

  const [presets, setPresets] = useState([]);
  const [lastUsedPresetId, setLastUsedPresetId] = useLocalStorage('handbrake_last_used_preset', '');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [lastOutputDir, setLastOutputDir] = useLocalStorage(
    'handbrake_last_output_dir',
    '/drive/转码/转码后'
  );

  // 输出目录默认加上源目录最后部分
  const [outputDirectory, setOutputDirectory] = useState(
    sourceDirBasename ? `${lastOutputDir}/${sourceDirBasename}` : lastOutputDir
  );
  const [browsePath, setBrowsePath] = useState(lastOutputDir);
  const [browseDirs, setBrowseDirs] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [sourceTree, setSourceTree] = useState([]);
  const [showNewDirInput, setShowNewDirInput] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [copyNonVideoFiles, setCopyNonVideoFiles] = useState(false);
  const [moveNonVideoFiles, setMoveNonVideoFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [presetSearch, setPresetSearch] = useState('');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [presetHighlightIdx, setPresetHighlightIdx] = useState(-1);
  const presetInputRef = useRef(null);
  const presetDropdownRef = useRef(null);
  const abortRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // 缓存目录设置弹窗状态
  const [showCacheSettingsModal, setShowCacheSettingsModal] = useState(false);
  const [cacheDir, setCacheDir] = useState('');
  const [maxConcurrentJobs, setMaxConcurrentJobs] = useState(2);
  const [cacheBrowsePath, setCacheBrowsePath] = useState('/drive');
  const [cacheBrowseDirs, setCacheBrowseDirs] = useState([]);
  const [cacheBrowseLoading, setCacheBrowseLoading] = useState(false);
  const [savingCacheDir, setSavingCacheDir] = useState(false);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (showCacheSettingsModal) {
      fetchCacheDirData();
    }
  }, [showCacheSettingsModal]);

  const fetchBrowseDirs = async path => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setBrowseLoading(true);
    try {
      const res = await api.get('/files', {
        params: { directory: path },
        signal: abortRef.current.signal
      });
      setBrowseDirs(res.data.data.directories);
    } catch (err) {
      console.error('Failed to fetch directories:', err);
    } finally {
      setBrowseLoading(false);
    }
  };

  const fetchCacheDirs = async path => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setCacheBrowseLoading(true);
    try {
      const res = await api.get('/files', {
        params: { directory: path },
        signal: abortRef.current.signal
      });
      setCacheBrowseDirs(res.data.data.directories);
    } catch (err) {
      console.error('Failed to fetch cache directories:', err);
    } finally {
      setCacheBrowseLoading(false);
    }
  };

  const fetchCacheDirData = async () => {
    try {
      const res = await api.get('/system/cache-dir');
      const dir = res.data.data.cacheDir;
      const jobs = res.data.data.maxConcurrentJobs;
      if (dir) {
        setCacheDir(dir);
        setCacheBrowsePath(dir);
        fetchCacheDirs(dir);
      } else {
        fetchCacheDirs('/drive');
      }
      if (jobs) {
        setMaxConcurrentJobs(jobs);
      }
    } catch (err) {
      console.error('Failed to fetch cache dir:', err);
    }
  };

  const handleCacheBrowse = path => {
    setCacheBrowsePath(path);
    setCacheDir(path);
    fetchCacheDirs(path);
  };

  const handleSaveCacheDir = async () => {
    if (!cacheDir) {
      return;
    }

    setSavingCacheDir(true);
    try {
      await api.post('/system/cache-dir', { path: cacheDir, maxConcurrentJobs });
      // 关闭设置弹窗，继续批量转码流程
      setShowCacheSettingsModal(false);
    } catch (err) {
      console.error('Failed to save cache dir:', err);
    } finally {
      setSavingCacheDir(false);
    }
  };

  const fetchData = async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    try {
      const presetsRes = await api.get('/presets', { signal });
      const allPresets = presetsRes.data.data.presets;

      // 将自定义预设排在最上面，内置预设按名称排序
      const customPresets = allPresets
        .filter(p => !p.isBuiltIn)
        .sort((a, b) => a.name.localeCompare(b.name));
      const builtInPresets = allPresets
        .filter(p => p.isBuiltIn)
        .sort((a, b) => a.name.localeCompare(b.name));

      const sortedPresets = [...customPresets, ...builtInPresets];
      setPresets(sortedPresets);

      // 自动选择上一次使用的预设，否则默认选择第一个预设
      if (lastUsedPresetId && sortedPresets.some(p => p.id === lastUsedPresetId)) {
        setSelectedPreset(lastUsedPresetId);
      } else if (sortedPresets.length > 0) {
        setSelectedPreset(sortedPresets[0].id);
      }

      if (!isSingleFile) {
        const treeRes = await api.get('/files/tree', { params: { path: directory }, signal });
        setSourceTree(treeRes.data.data.directories || []);
      }

      await fetchBrowseDirs(browsePath);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleBrowse = path => {
    setBrowsePath(path);
    // 用户选择目录时，如果是批量转码，自动追加源目录最后部分
    const newOutputDir = sourceDirBasename ? `${path}/${sourceDirBasename}` : path;
    setOutputDirectory(newOutputDir);
    setLastOutputDir(path);
    fetchBrowseDirs(path);
  };

  const handleCreateDir = async () => {
    if (!newDirName.trim()) return;
    try {
      const newPath = `${browsePath}/${newDirName.trim()}`;
      await api.post('/files/mkdir', { path: newPath });
      setShowNewDirInput(false);
      setNewDirName('');
      fetchBrowseDirs(browsePath);
    } catch (err) {
      setError(err.response?.data?.error || t('batchTranscode.createDirFailed', '创建目录失败'));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!outputDirectory) {
      setError(t('batchTranscode.selectOutputDir', '请选择输出目录'));
      return;
    }

    if (!selectedPreset) {
      setError(t('batchTranscode.selectPresetError', '请选择转码预设'));
      return;
    }

    try {
      const cacheRes = await api.get('/system/cache-dir', { signal: abortRef.current?.signal });
      if (!cacheRes.data.data.cacheDir) {
        // 显示设置缓存目录弹窗
        setShowCacheSettingsModal(true);
        return;
      }
    } catch (err) {
      // 显示设置缓存目录弹窗
      setShowCacheSettingsModal(true);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isSingleFile) {
        const fileName =
          directory
            .split('/')
            .pop()
            .replace(/\.[^.]+$/, '') + '.mp4';
        const outputFile = outputDirectory + '/' + fileName;
        await api.post('/jobs', {
          sourceFile: directory,
          outputFile,
          presetId: selectedPreset
        });
      } else {
        await api.post('/jobs/batch', {
          sourceDirectory: directory,
          outputDirectory,
          presetId: selectedPreset,
          copyNonVideoFiles,
          moveNonVideoFiles
        });
      }

      // 保存使用的预设到 localStorage
      setLastUsedPresetId(selectedPreset);

      setSuccess(true);
      successTimeoutRef.current = setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || t('batchTranscode.submitFailed', '提交任务失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const ROOT_OUTPUT_PATH = '/drive/转码/转码后';
  const pathParts = useMemo(
    () => (browsePath || ROOT_OUTPUT_PATH).split('/').filter(Boolean),
    [browsePath]
  );

  const buildTree = useMemo(
    () => paths => {
      const tree = {};
      for (const p of paths) {
        if (!p) continue;
        const parts = p.split('/');
        let current = tree;
        for (const part of parts) {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }
      return tree;
    },
    []
  );

  const treeData = useMemo(() => buildTree(sourceTree), [buildTree, sourceTree]);

  const filteredPresets = useMemo(() => {
    if (!presetSearch.trim()) return presets;
    const q = presetSearch.toLowerCase();
    return presets.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [presets, presetSearch]);

  const selectedPresetName = useMemo(() => {
    const p = presets.find(pre => pre.id === selectedPreset);
    return p ? p.name : '';
  }, [presets, selectedPreset]);

  const handleSelectPreset = id => {
    setSelectedPreset(id);
    setPresetSearch('');
    setShowPresetDropdown(false);
  };

  useEffect(() => {
    if (!showPresetDropdown) return;
    const handleClick = e => {
      if (
        presetInputRef.current &&
        !presetInputRef.current.contains(e.target) &&
        presetDropdownRef.current &&
        !presetDropdownRef.current.contains(e.target)
      ) {
        setShowPresetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPresetDropdown]);

  const getTreeLines = useMemo(() => {
    const lines = [];
    const collect = (node, prefix = '', depth = 0) => {
      const entries = Object.entries(node).sort(([a], [b]) => a.localeCompare(b));
      entries.forEach(([name, children], idx) => {
        const isLast = idx === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const hasChildren = Object.keys(children).length > 0;
        lines.push({
          name,
          prefix,
          depth,
          connector,
          hasChildren
        });
        if (hasChildren) {
          collect(children, prefix + name + '/', depth + 1);
        }
      });
    };
    collect(treeData);
    return lines;
  }, [treeData]);

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-dark-800 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b border-dark-700'>
          <div>
            <h2 className='text-2xl font-bold text-white flex items-center space-x-3'>
              <Video className='w-6 h-6' />
              <span>
                {isSingleFile
                  ? t('batchTranscode.title', '转码')
                  : t('batchTranscode.batchTitle', '批量转码')}
              </span>
            </h2>
            <p className='text-gray-400 mt-1'>
              {isSingleFile
                ? t('batchTranscode.sourceFile', '源文件')
                : t('batchTranscode.sourceDir', '源目录')}
              : {directory}
            </p>
          </div>
          <button onClick={onClose} className='p-2 hover:bg-dark-700 rounded-lg transition-colors'>
            <X className='w-5 h-5 text-gray-400' />
          </button>
        </div>

        {success ? (
          <div className='p-8 text-center'>
            <CheckCircle className='w-16 h-16 text-success mx-auto mb-4' />
            <h3 className='text-xl font-bold text-white mb-2'>
              {t('batchTranscode.taskSubmitted', '任务已提交!')}
            </h3>
            <p className='text-gray-400'>
              {t('batchTranscode.redirecting', '正在跳转到任务列表...')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='p-6 space-y-6'>
            {error && (
              <div className='p-4 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 text-error'>
                <X className='w-5 h-5' />
                <span>{error}</span>
              </div>
            )}

            <div className='bg-dark-700 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-white mb-3 flex items-center space-x-2'>
                <FolderOpen className='w-5 h-5' />
                <span>{t('batchTranscode.outputSettings', '输出设置')}</span>
              </h3>

              <div className='space-y-4'>
                <div>
                  <label className='label'>{t('batchTranscode.outputDir', '输出目录')}</label>

                  {browseLoading ? (
                    <div className='flex items-center space-x-2 text-gray-400 py-2'>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span className='text-sm'>{t('batchTranscode.loading', '加载中...')}</span>
                    </div>
                  ) : (
                    <>
                      <div className='flex items-center space-x-1 text-sm mb-3 flex-wrap'>
                        {pathParts.map((part, i) => {
                          const fullPath = '/' + pathParts.slice(0, i + 1).join('/');
                          return (
                            <React.Fragment key={i}>
                              {i > 0 && <ChevronRight className='w-3 h-3 text-gray-500 shrink-0' />}
                              <button
                                type='button'
                                onClick={() => handleBrowse(fullPath)}
                                className={clsx(
                                  'hover:underline',
                                  browsePath === fullPath
                                    ? 'text-white font-medium'
                                    : 'text-primary'
                                )}
                              >
                                {part}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 mb-3 max-h-48 overflow-y-auto overflow-x-auto'>
                        {browseDirs.map(dir => (
                          <button
                            type='button'
                            key={dir.path}
                            onClick={() => handleBrowse(dir.path)}
                            onDoubleClick={e => {
                              e.preventDefault();
                              setOutputDirectory(dir.path);
                              setLastOutputDir(dir.path);
                            }}
                            className={clsx(
                              'flex items-center space-x-2 p-2 rounded-lg transition-colors text-left',
                              outputDirectory === dir.path
                                ? 'bg-primary/20 border border-primary'
                                : 'bg-dark-600 hover:bg-dark-500 border border-transparent'
                            )}
                          >
                            <FolderOpen className='w-4 h-4 text-warning shrink-0' />
                            <span className='text-white text-xs truncate'>{dir.name}</span>
                          </button>
                        ))}
                        {browseDirs.length === 0 && (
                          <p className='col-span-full text-gray-500 text-xs py-2'>
                            {t('batchTranscode.emptyDir', '空目录')}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <div className='flex items-center justify-between'>
                    <p className='text-xs text-gray-400 truncate max-w-[250px] sm:max-w-none'>
                      {t('batchTranscode.selected', '已选')}:{' '}
                      <span className='text-primary'>{outputDirectory}</span>
                    </p>
                    <div className='flex space-x-2'>
                      {showNewDirInput ? (
                        <div className='flex space-x-1'>
                          <input
                            type='text'
                            value={newDirName}
                            onChange={e => setNewDirName(e.target.value)}
                            className='input text-xs py-1 w-20 sm:w-28'
                            placeholder={t('batchTranscode.dirName', '目录名')}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCreateDir();
                              if (e.key === 'Escape') {
                                setShowNewDirInput(false);
                                setNewDirName('');
                              }
                            }}
                          />
                          <button
                            type='button'
                            onClick={handleCreateDir}
                            className='btn btn-primary text-xs py-1'
                          >
                            {t('batchTranscode.create', '创建')}
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              setShowNewDirInput(false);
                              setNewDirName('');
                            }}
                            className='btn btn-secondary text-xs py-1'
                          >
                            {t('batchTranscode.cancel', '取消')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type='button'
                          onClick={() => setShowNewDirInput(true)}
                          className='text-xs text-primary hover:underline flex items-center space-x-1'
                        >
                          <Plus className='w-3 h-3' />
                          <span>{t('batchTranscode.newDir', '新建目录')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!isSingleFile && sourceTree.length > 0 && (
                  <div className='p-3 bg-dark-600 rounded-lg'>
                    <h4 className='text-sm font-semibold text-white mb-2 flex items-center space-x-1'>
                      <GitBranch className='w-4 h-4 text-primary' />
                      <span>{t('batchTranscode.dirTreePreview', '目录结构预览')}</span>
                    </h4>
                    <div className='max-h-48 overflow-y-auto overflow-x-auto'>
                      {/* 左右两列表格 */}
                      <div className='grid grid-cols-2 gap-3 min-w-[400px]'>
                        {/* 左侧 - 源目录 */}
                        <div>
                          <div className='text-xs text-gray-400 mb-1 font-semibold'>
                            {t('batchTranscode.source', '源')}
                          </div>
                          <div className='bg-dark-700 rounded px-2 py-1'>
                            <div className='text-xs font-mono mb-2 border-b border-dark-600 pb-1'>
                              <span className='text-gray-400 break-all'>{directory}</span>
                            </div>
                            <div className='space-y-0.5'>
                              {getTreeLines.map((line, i) => (
                                <div
                                  key={i}
                                  className='text-xs text-gray-400 font-mono'
                                  style={{ paddingLeft: line.depth * 16 }}
                                >
                                  <div className='flex items-baseline space-x-1'>
                                    <span className='text-gray-600 shrink-0'>{line.connector}</span>
                                    <FolderOpen className='w-3 h-3 text-warning shrink-0 relative top-0.5' />
                                    <span className='text-gray-400'>{line.name}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        {/* 右侧 - 输出目录 */}
                        <div>
                          <div className='text-xs text-primary mb-1 font-semibold'>
                            {t('batchTranscode.output', '输出')}
                          </div>
                          <div className='bg-dark-700 rounded px-2 py-1'>
                            <div className='text-xs font-mono mb-2 border-b border-dark-600 pb-1'>
                              <span className='text-primary break-all'>{outputDirectory}</span>
                            </div>
                            <div className='space-y-0.5'>
                              {getTreeLines.map((line, i) => (
                                <div
                                  key={i}
                                  className='text-xs text-gray-400 font-mono'
                                  style={{ paddingLeft: line.depth * 16 }}
                                >
                                  <div className='flex items-baseline space-x-1'>
                                    <span className='text-gray-600 shrink-0'>{line.connector}</span>
                                    <FolderOpen className='w-3 h-3 text-primary shrink-0 relative top-0.5' />
                                    <span className='text-primary'>{line.name}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className='label mb-2'>
                    {t('batchTranscode.selectPreset', '选择预设')}
                  </label>
                  {presets.length > 0 ? (
                    <div className='relative'>
                      <div
                        ref={presetInputRef}
                        className='input flex items-center cursor-text'
                        onClick={() => {
                          setShowPresetDropdown(true);
                          presetInputRef.current?.querySelector('input')?.focus();
                        }}
                      >
                        <input
                          type='text'
                          value={showPresetDropdown ? presetSearch : selectedPresetName}
                          onChange={e => {
                            setPresetSearch(e.target.value);
                            setShowPresetDropdown(true);
                            setPresetHighlightIdx(-1);
                          }}
                          onFocus={() => {
                            setPresetSearch('');
                            setShowPresetDropdown(true);
                          }}
                          onKeyDown={e => {
                            const filtered = filteredPresets;
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setPresetHighlightIdx(prev =>
                                prev < filtered.length - 1 ? prev + 1 : 0
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setPresetHighlightIdx(prev =>
                                prev > 0 ? prev - 1 : filtered.length - 1
                              );
                            } else if (e.key === 'Enter' && presetHighlightIdx >= 0) {
                              e.preventDefault();
                              handleSelectPreset(filtered[presetHighlightIdx].id);
                            } else if (e.key === 'Escape') {
                              setShowPresetDropdown(false);
                            }
                          }}
                          className='bg-transparent border-none outline-none text-white flex-1 min-w-0'
                          placeholder={t('batchTranscode.searchPreset', '输入搜索预设...')}
                        />
                        <ChevronDown className='w-4 h-4 text-gray-400 shrink-0' />
                      </div>
                      {showPresetDropdown && (
                        <div
                          ref={presetDropdownRef}
                          className='absolute z-50 left-0 right-0 mt-1 bg-dark-700 border border-dark-600 rounded-lg max-h-60 overflow-y-auto shadow-xl'
                        >
                          {filteredPresets.length > 0 ? (
                            filteredPresets.map((preset, idx) => (
                              <button
                                key={preset.id}
                                type='button'
                                onMouseDown={() => handleSelectPreset(preset.id)}
                                onMouseEnter={() => setPresetHighlightIdx(idx)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                                  idx === presetHighlightIdx
                                    ? 'bg-primary/20 text-primary'
                                    : 'text-gray-300 hover:bg-dark-600'
                                }`}
                              >
                                <span className='truncate'>
                                  {preset.name}
                                  {!preset.isBuiltIn && (
                                    <span className='text-xs text-gray-500 ml-1'>
                                      {t('batchTranscode.custom', '(自定义)')}
                                    </span>
                                  )}
                                </span>
                                <span className='text-xs text-gray-500 shrink-0 ml-2'>
                                  {preset.description}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className='px-3 py-2 text-sm text-gray-500'>
                              {t('batchTranscode.noMatchPreset', '无匹配预设')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className='text-gray-400'>{t('batchTranscode.noPresets', '暂无预设可用')}</p>
                  )}
                </div>

                {!isSingleFile && (
                  <div className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      id='copyNonVideoFiles'
                      checked={copyNonVideoFiles}
                      onChange={e => setCopyNonVideoFiles(e.target.checked)}
                      className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                    />
                    <label htmlFor='copyNonVideoFiles' className='text-sm text-gray-300'>
                      {t('batchTranscode.copyNonVideo', '把源目录不能转码的文件复制到目标目录')}
                    </label>
                  </div>
                )}

                {!isSingleFile && (
                  <div className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      id='moveNonVideoFiles'
                      checked={moveNonVideoFiles}
                      onChange={e => setMoveNonVideoFiles(e.target.checked)}
                      className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                    />
                    <label htmlFor='moveNonVideoFiles' className='text-sm text-gray-300'>
                      {t('batchTranscode.moveNonVideo', '把源目录不能转码的文件移动到目标目录')}
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className='bg-dark-700 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-white mb-3'>
                {t('batchTranscode.instructions', '说明')}
              </h3>
              <ul className='text-gray-400 text-sm space-y-2'>
                {isSingleFile ? (
                  <>
                    <li>• {t('batchTranscode.singleFileDesc1', '转码单个视频文件')}</li>
                    <li>
                      •{' '}
                      {t(
                        'batchTranscode.singleFileDesc2',
                        '转码后的文件保持原文件名，扩展名改为 .mp4'
                      )}
                    </li>
                    <li>• {t('batchTranscode.singleFileDesc3', '任务会自动加入队列处理')}</li>
                  </>
                ) : (
                  <>
                    <li>• {t('batchTranscode.batchDesc1', '递归扫描源目录中的所有视频文件')}</li>
                    <li>• {t('batchTranscode.batchDesc2', '保持原始目录结构')}</li>
                    <li>
                      •{' '}
                      {t(
                        'batchTranscode.batchDesc3',
                        '转码后的文件保持原文件名，仅扩展名改为容器格式'
                      )}
                    </li>
                    <li>• {t('batchTranscode.batchDesc4', '所有任务会自动加入队列处理')}</li>
                  </>
                )}
              </ul>
            </div>

            <div className='flex space-x-3 pt-4'>
              <button type='button' onClick={onClose} className='btn btn-secondary flex-1'>
                {t('batchTranscode.cancel', '取消')}
              </button>
              <button
                type='submit'
                disabled={submitting}
                className='btn btn-primary flex-1 flex items-center justify-center space-x-2'
              >
                {submitting ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span>{t('batchTranscode.submit', '提交中...')}</span>
                  </>
                ) : (
                  <>
                    <Settings className='w-4 h-4' />
                    <span>
                      {isSingleFile
                        ? t('batchTranscode.startSingle', '开始转码')
                        : t('batchTranscode.startBatch', '开始批量转码')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 设置缓存目录弹窗 - 始终在最顶层 */}
      {showCacheSettingsModal && (
        <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4'>
          <div className='bg-dark-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border-2 border-primary'>
            <div className='flex items-center justify-between p-6 border-b border-dark-700'>
              <div>
                <h2 className='text-2xl font-bold text-white flex items-center space-x-3'>
                  <AlertCircle className='w-6 h-6 text-warning' />
                  <span>{t('batchTranscode.cacheDirRequired', '请先设置缓存目录')}</span>
                </h2>
                <p className='text-gray-400 mt-1'>
                  {t('batchTranscode.cacheDirRequiredDesc', '转码任务需要设置缓存目录才能开始')}
                </p>
              </div>
              <button
                onClick={() => setShowCacheSettingsModal(false)}
                className='p-2 hover:bg-dark-700 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-gray-400' />
              </button>
            </div>

            <div className='p-6 space-y-6'>
              {/* 缓存目录选择 */}
              <div>
                <h3 className='text-sm font-medium text-gray-400 mb-2'>
                  {t('batchTranscode.selectCacheDir', '选择缓存目录')}
                </h3>
                <p className='text-gray-500 text-xs mb-3'>
                  {t('batchTranscode.cacheDirDesc', '转码时中间文件会先写入此目录，完成后移动到输出目录')}
                </p>

                <div className='mb-4'>
                  <p className='text-white font-mono text-sm bg-dark-700 rounded-lg p-3 truncate'>
                    {cacheDir || t('batchTranscode.notSelected', '（未选择）')}
                  </p>
                </div>

                <div className='mb-4'>
                  {cacheBrowseLoading ? (
                    <div className='flex items-center space-x-2 text-gray-400 py-2'>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span className='text-sm'>{t('common.loading')}</span>
                    </div>
                  ) : (
                    <>
                      <div className='flex flex-wrap items-center gap-1 text-sm mb-3'>
                        <button
                          type='button'
                          onClick={() => handleCacheBrowse('/drive')}
                          className={`hover:underline truncate max-w-[100px] ${
                            cacheBrowsePath === '/drive' ? 'text-white font-medium' : 'text-primary'
                          }`}
                        >
                          drive
                        </button>
                        {cacheBrowsePath
                          .split('/')
                          .filter(Boolean)
                          .slice(1)
                          .map((part, i) => {
                            const fullPath =
                              '/drive/' +
                              cacheBrowsePath
                                .split('/')
                                .filter(Boolean)
                                .slice(1, i + 2)
                                .join('/');
                            return (
                              <React.Fragment key={i}>
                                <ChevronRight className='w-3 h-3 text-gray-500 shrink-0' />
                                <button
                                  type='button'
                                  onClick={() => handleCacheBrowse(fullPath)}
                                  className={`hover:underline truncate max-w-[100px] ${
                                    cacheBrowsePath === fullPath ? 'text-white font-medium' : 'text-primary'
                                  }`}
                                >
                                  {part}
                                </button>
                              </React.Fragment>
                            );
                          })}
                      </div>

                      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3 max-h-48 overflow-y-auto overflow-x-auto'>
                        {cacheBrowseDirs.map(dir => (
                          <button
                            type='button'
                            key={dir.path}
                            onClick={() => handleCacheBrowse(dir.path)}
                            className={`flex items-center space-x-2 p-2 rounded-lg transition-colors text-left ${
                              cacheDir === dir.path
                                ? 'bg-primary/20 border border-primary'
                                : 'bg-dark-600 hover:bg-dark-500 border border-transparent'
                            }`}
                          >
                            <FolderOpen className='w-4 h-4 text-warning shrink-0' />
                            <span className='text-white text-xs truncate'>{dir.name}</span>
                          </button>
                        ))}
                        {cacheBrowseDirs.length === 0 && (
                          <p className='col-span-full text-gray-500 text-xs py-2'>
                            {t('common.empty') || '空目录'}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 并发数设置 */}
              <div className='border-t border-dark-700 pt-6'>
                <h3 className='text-sm font-medium text-gray-400 mb-2'>
                  {t('batchTranscode.concurrentJobs', '同时转码任务数')}
                </h3>
                <p className='text-gray-500 text-xs mb-3'>
                  {t('batchTranscode.concurrentJobsDesc', '设置同时运行的转码任务数量')}
                </p>
                <div className='flex items-center space-x-3'>
                  <input
                    type='number'
                    min={1}
                    max={10}
                    value={maxConcurrentJobs}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setMaxConcurrentJobs(Math.min(10, Math.max(1, val)));
                    }}
                    className='input w-24 text-center font-mono text-lg'
                  />
                  <span className='text-gray-400 text-sm'>{t('settings.tasks', '个任务')}</span>
                </div>
              </div>

              {/* 保存按钮 */}
              <div className='flex space-x-3 pt-4'>
                <button
                  type='button'
                  onClick={() => setShowCacheSettingsModal(false)}
                  className='btn btn-secondary flex-1'
                >
                  {t('batchTranscode.cancel', '取消')}
                </button>
                <button
                  type='button'
                  onClick={handleSaveCacheDir}
                  disabled={savingCacheDir || !cacheDir}
                  className='btn btn-primary flex-1 flex items-center justify-center space-x-2'
                >
                  {savingCacheDir ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span>{t('common.saving')}</span>
                    </>
                  ) : (
                    <>
                      <Settings className='w-4 h-4' />
                      <span>{t('batchTranscode.saveAndContinue', '保存并继续')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchTranscodeModal;
