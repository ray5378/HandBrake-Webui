import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Settings,
  Loader2,
  CheckCircle,
  FolderOpen,
  ChevronRight,
  GitBranch,
  Plus
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

function BatchTranscodeModal({ directory, onClose, onSuccess }) {
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [outputDirectory, setOutputDirectory] = useState('/drive/转码/转码后');
  const [browsePath, setBrowsePath] = useState('/drive/转码/转码后');
  const [browseDirs, setBrowseDirs] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [sourceTree, setSourceTree] = useState([]);
  const [showNewDirInput, setShowNewDirInput] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [copyNonVideoFiles, setCopyNonVideoFiles] = useState(false);
  const [moveNonVideoFiles, setMoveNonVideoFiles] = useState(false);
  const [customSettings, setCustomSettings] = useState(false);
  const [settings, setSettings] = useState({
    crf: 23,
    audioBitrate: 128,
    audioChannels: 2
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchBrowseDirs = async path => {
    setBrowseLoading(true);
    try {
      const res = await api.get('/files', { params: { directory: path } });
      setBrowseDirs(res.data.data.directories);
    } catch (err) {
      console.error('Failed to fetch directories:', err);
    } finally {
      setBrowseLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [presetsRes, treeRes] = await Promise.all([
        api.get('/presets'),
        api.get('/files/tree', { params: { path: directory } })
      ]);

      setPresets(presetsRes.data.data.presets);
      setSourceTree(treeRes.data.data.directories || []);

      setBrowsePath(ROOT_OUTPUT_PATH);
      if (lastDir) {
        setOutputDirectory(`${ROOT_OUTPUT_PATH}/${lastDir}`);
      }
      await fetchBrowseDirs(ROOT_OUTPUT_PATH);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleBrowse = path => {
    setBrowsePath(path);
    fetchBrowseDirs(path);
  };

  const handleBreadcrumbClick = path => {
    setBrowsePath(path);
    setOutputDirectory(lastDir ? `${path}/${lastDir}` : path);
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
      setError(err.response?.data?.error || '创建目录失败');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!outputDirectory) {
      setError('请选择输出目录');
      return;
    }

    try {
      const cacheRes = await api.get('/system/cache-dir');
      if (!cacheRes.data.data.cacheDir) {
        setError('请先在设置中配置缓存目录');
        return;
      }
    } catch (err) {
      setError('检查缓存目录失败，请先在设置中配置');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/jobs/batch', {
        sourceDirectory: directory,
        outputDirectory,
        presetId: selectedPreset || undefined,
        customSettings: customSettings ? settings : undefined,
        copyNonVideoFiles,
        moveNonVideoFiles
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || '提交任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  const ROOT_OUTPUT_PATH = '/drive/转码/转码后';
  const pathParts = (browsePath || ROOT_OUTPUT_PATH).split('/').filter(Boolean);
  const lastDir = directory.split('/').filter(Boolean).pop();

  const buildTree = paths => {
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
  };

  const renderTree = (node, prefix = '', depth = 0) => {
    const entries = Object.entries(node).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([name, children], idx) => {
      const isLast = idx === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      const hasChildren = Object.keys(children).length > 0;
      return (
        <React.Fragment key={name}>
          <div className='text-xs text-gray-400 font-mono mb-1' style={{ paddingLeft: depth * 16 }}>
            <div className='flex items-baseline space-x-1'>
              <span className='text-gray-600 shrink-0'>{connector}</span>
              <FolderOpen className='w-3 h-3 text-warning shrink-0 relative top-0.5' />
              <span className='text-gray-400'>{name}</span>
              <ChevronRight className='w-3 h-3 text-gray-600 shrink-0 relative top-0.5' />
              <span className='text-primary whitespace-nowrap'>
                {outputDirectory}/{prefix}
                {name}
              </span>
            </div>
          </div>
          {hasChildren && renderTree(children, prefix + name + '/', depth + 1)}
        </React.Fragment>
      );
    });
  };

  const treeData = buildTree(sourceTree);

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
      <div className='bg-dark-800 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b border-dark-700'>
          <div>
            <h2 className='text-2xl font-bold text-white flex items-center space-x-3'>
              <Video className='w-6 h-6' />
              <span>批量转码</span>
            </h2>
            <p className='text-gray-400 mt-1'>源目录: {directory}</p>
          </div>
          <button onClick={onClose} className='p-2 hover:bg-dark-700 rounded-lg transition-colors'>
            <X className='w-5 h-5 text-gray-400' />
          </button>
        </div>

        {success ? (
          <div className='p-8 text-center'>
            <CheckCircle className='w-16 h-16 text-success mx-auto mb-4' />
            <h3 className='text-xl font-bold text-white mb-2'>任务已提交!</h3>
            <p className='text-gray-400'>正在跳转到任务列表...</p>
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
                <span>输出设置</span>
              </h3>

              <div className='space-y-4'>
                <div>
                  <label className='label'>输出目录</label>

                  {browseLoading ? (
                    <div className='flex items-center space-x-2 text-gray-400 py-2'>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span className='text-sm'>加载中...</span>
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
                                onClick={() => handleBreadcrumbClick(fullPath)}
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

                      <div className='grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 mb-3 max-h-48 overflow-y-auto'>
                        {browseDirs.map(dir => (
                          <button
                            type='button'
                            key={dir.path}
                            onClick={() => handleBrowse(dir.path)}
                            onDoubleClick={e => {
                              e.preventDefault();
                              setOutputDirectory(dir.path);
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
                          <p className='col-span-full text-gray-500 text-xs py-2'>空目录</p>
                        )}
                      </div>
                    </>
                  )}

                  <div className='flex items-center justify-between'>
                    <p className='text-xs text-gray-400'>
                      已选: <span className='text-primary'>{outputDirectory}</span>
                    </p>
                    <div className='flex space-x-2'>
                      {showNewDirInput ? (
                        <div className='flex space-x-1'>
                          <input
                            type='text'
                            value={newDirName}
                            onChange={e => setNewDirName(e.target.value)}
                            className='input text-xs py-1 w-28'
                            placeholder='目录名'
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
                            创建
                          </button>
                          <button
                            type='button'
                            onClick={() => {
                              setShowNewDirInput(false);
                              setNewDirName('');
                            }}
                            className='btn btn-secondary text-xs py-1'
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          type='button'
                          onClick={() => setShowNewDirInput(true)}
                          className='text-xs text-primary hover:underline flex items-center space-x-1'
                        >
                          <Plus className='w-3 h-3' />
                          <span>新建目录</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {sourceTree.length > 0 && (
                  <div className='p-3 bg-dark-600 rounded-lg'>
                    <h4 className='text-sm font-semibold text-white mb-2 flex items-center space-x-1'>
                      <GitBranch className='w-4 h-4 text-primary' />
                      <span>目录结构预览</span>
                    </h4>
                    <div className='max-h-48 overflow-y-auto space-y-0.5'>
                      <div className='text-xs font-mono space-y-1'>
                        <div className='flex items-center space-x-1'>
                          <FolderOpen className='w-3 h-3 text-warning shrink-0' />
                          <span className='text-gray-400'>源:</span>
                          <span className='text-gray-400 break-all'>{directory}</span>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <ChevronRight className='w-3 h-3 text-gray-600 shrink-0' />
                          <span className='text-primary'>输出:</span>
                          <span className='text-primary break-all'>{outputDirectory}</span>
                        </div>
                      </div>
                      {renderTree(treeData, '', 1)}
                    </div>
                  </div>
                )}

                <div>
                  <label className='label mb-2'>选择预设</label>
                  {presets.length > 0 ? (
                    <select
                      value={selectedPreset}
                      onChange={e => setSelectedPreset(e.target.value)}
                      className='input'
                    >
                      <option value=''>不使用预设</option>
                      {presets.map(preset => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} - {preset.description}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className='text-gray-400'>暂无预设可用</p>
                  )}
                </div>

                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='copyNonVideoFiles'
                    checked={copyNonVideoFiles}
                    onChange={e => setCopyNonVideoFiles(e.target.checked)}
                    className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                  />
                  <label htmlFor='copyNonVideoFiles' className='text-sm text-gray-300'>
                    把源目录不能转码的文件复制到目标目录
                  </label>
                </div>

                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='moveNonVideoFiles'
                    checked={moveNonVideoFiles}
                    onChange={e => setMoveNonVideoFiles(e.target.checked)}
                    className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                  />
                  <label htmlFor='moveNonVideoFiles' className='text-sm text-gray-300'>
                    把源目录不能转码的文件移动到目标目录
                  </label>
                </div>

                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='customSettings'
                    checked={customSettings}
                    onChange={e => setCustomSettings(e.target.checked)}
                    className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                  />
                  <label htmlFor='customSettings' className='text-sm text-gray-300'>
                    使用自定义设置
                  </label>
                </div>

                {customSettings && (
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-dark-600 rounded-lg'>
                    <div>
                      <label className='label'>CRF (质量)</label>
                      <input
                        type='number'
                        min='0'
                        max='51'
                        value={settings.crf}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            crf: parseInt(e.target.value)
                          })
                        }
                        className='input'
                      />
                      <p className='text-xs text-gray-400 mt-1'>0=最佳质量, 51=最小体积</p>
                    </div>

                    <div>
                      <label className='label'>音频码率 (kbps)</label>
                      <input
                        type='number'
                        value={settings.audioBitrate}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            audioBitrate: parseInt(e.target.value)
                          })
                        }
                        className='input'
                      />
                    </div>

                    <div>
                      <label className='label'>音频声道</label>
                      <select
                        value={settings.audioChannels}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            audioChannels: parseInt(e.target.value)
                          })
                        }
                        className='input'
                      >
                        <option value='2'>立体声</option>
                        <option value='6'>5.1 环绕</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className='bg-dark-700 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-white mb-3'>说明</h3>
              <ul className='text-gray-400 text-sm space-y-2'>
                <li>• 递归扫描源目录中的所有视频文件</li>
                <li>• 保持原始目录结构</li>
                <li>• 转码后的文件保持原文件名，仅扩展名改为容器格式</li>
                <li>• 所有任务会自动加入队列处理</li>
              </ul>
            </div>

            <div className='flex space-x-3 pt-4'>
              <button type='button' onClick={onClose} className='btn btn-secondary flex-1'>
                取消
              </button>
              <button
                type='submit'
                disabled={submitting}
                className='btn btn-primary flex-1 flex items-center justify-center space-x-2'
              >
                {submitting ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span>提交中...</span>
                  </>
                ) : (
                  <>
                    <Settings className='w-4 h-4' />
                    <span>开始批量转码</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default BatchTranscodeModal;
