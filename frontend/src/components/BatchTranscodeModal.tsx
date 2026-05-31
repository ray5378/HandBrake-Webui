import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Settings, X, ChevronRight, FileText } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';
import { useToastStore } from '../stores/toastStore';
import { Preset, ApiResponse, FileItem } from '../types';

import {
  FORMATS,
  VIDEO_CODECS,
  X264_PRESETS,
  X265_PRESETS,
  QSV_PRESETS,
  NVENC_PRESETS,
  VCE_PRESETS,
  X264_TUNES,
  X265_TUNES,
  COLOR_RANGES,
  FRAMERATES,
  getRateControlForCodec,
  getAllowedRateControls,
  OPTIMIZE_OPTIONS,
  getDefaultPresetSettings
} from '../constants/presets';
import type { LucideIcon } from 'lucide-react';

interface BatchTranscodeModalProps {
  directory: string;
  onClose: () => void;
  onSuccess: () => void;
}

function BatchTranscodeModal({ directory, onClose, onSuccess }: BatchTranscodeModalProps) {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [, setShowPresetModal] = useState(false);
  const [quickSettings, setQuickSettings] = useState(getDefaultPresetSettings());
  const [activeTab, setActiveTab] = useState('summary');
  const [editingPreset, setEditingPreset] = useState(false);
  const [savePresetName, setSavePresetName] = useState('');

  const [sourceFiles, setSourceFiles] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [outputDirList, setOutputDirList] = useState<Array<{ name: string; path: string }>>([]);
  const [outputPath, setOutputPath] = useState('/drive');
  const [browseLoading, setBrowseLoading] = useState(false);
  const [customOutputDir, setCustomOutputDir] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  const fetchPresets = async () => {
    try {
      const response = await api.get('/presets');
      setPresets(response.data.data.presets || []);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    }
  };

  const fetchSourceFiles = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const response = await api.get('/files', {
        params: { directory },
        signal: abortRef.current.signal
      });
      const files: FileItem[] = (response.data.data?.files || []).filter((f: FileItem) => {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase() || '';
        return [
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
        ].includes(ext);
      });

      setSourceFiles(files);
      setHasMore(files.length > limit * page);
    } catch (error) {
      console.error('Failed to fetch source files:', error);
    } finally {
      setLoading(false);
    }
  }, [directory, limit, page]);

  useEffect(() => {
    const stored = localStorage.getItem('lastUsedPresetId');
    if (stored) setSelectedPresetId(stored);
    fetchPresets();
    fetchSourceFiles();
    browseOutputDirs('/drive');
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [directory, fetchSourceFiles]);

  useEffect(() => {
    if (selectedPresetId && presets.length > 0) {
      const preset = presets.find(p => p.id === selectedPresetId);
      if (preset) {
        setQuickSettings({
          ...getDefaultPresetSettings(),
          ...preset.settings
        } as typeof quickSettings);
      }
    }
  }, [selectedPresetId, presets]);

  const browseOutputDirs = async (path: string) => {
    setBrowseLoading(true);
    try {
      const res = await api.get('/files', { params: { directory: path } });
      setOutputDirList(res.data.data.directories || []);
    } catch (err) {
      console.error('Failed to browse:', err);
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleBrowse = (path: string) => {
    setOutputPath(path);
    setCustomOutputDir('');
    browseOutputDirs(path);
  };

  const displayedFiles = useMemo(() => {
    return sourceFiles.slice(0, page * limit);
  }, [sourceFiles, page, limit]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setHasMore(sourceFiles.length > nextPage * limit);
  }, [page, hasMore, loading, sourceFiles.length, limit]);

  useEffect(() => {
    if (page > 1) {
      setHasMore(sourceFiles.length > page * limit);
    }
  }, [page, sourceFiles.length, limit]);

  const toggleFile = (path: string) => {
    const next = new Set(selectedFiles);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setSelectedFiles(next);
  };

  const toggleAll = () => {
    if (selectedFiles.size === sourceFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(sourceFiles.map(f => f.path)));
    }
  };

  const updateSettings = (path: string, value: unknown) => {
    const keys = path.split('.');
    setQuickSettings(prev => {
      const newSettings = { ...prev };
      let current: Record<string, unknown> = newSettings as unknown as Record<string, unknown>;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;

      return newSettings;
    });
  };

  const handleSubmit = async () => {
    if (selectedFiles.size === 0) return;
    setSubmitting(true);
    try {
      const finalOutputDir = customOutputDir || outputPath;
      const response = (await api.post('/jobs/batch', {
        directory,
        files: Array.from(selectedFiles),
        presetId: selectedPresetId || null,
        outputDir: finalOutputDir,
        settings: quickSettings
      })) as {
        data: ApiResponse<{
          accepted: number;
          total: number;
          skipped: number;
          skipReport: Array<{ file: string; existing: string }>;
        }>;
      };

      const data = response.data.data;
      const addToast = useToastStore.getState().addToast;
      if (data) {
        if (data.skipped > 0) {
          const message =
            `${t('transcode.tasksAccepted', '已接受')} ${data.accepted} ${t('transcode.tasksTotal', '个转码任务')}\n` +
            `${t('transcode.tasksSkipped', data.skipped + ' 个被跳过（输出已存在）')}` +
            (data.skipReport ? '\n\n' + data.skipReport.map(r => r.file).join('\n') : '');
          addToast({ message, type: 'warning', duration: 8000 });
        }
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to submit batch job:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePreset = async () => {
    if (!savePresetName.trim()) return;
    try {
      await api.post('/presets', {
        name: savePresetName,
        description: '',
        settings: quickSettings
      });

      await fetchPresets();
      setEditingPreset(false);
      setSavePresetName('');
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  };

  const tabs: Array<{ id: string; label: string; icon: LucideIcon }> = [
    { id: 'summary', label: t('presetTabs.summary'), icon: FileText },
    { id: 'video', label: t('presetTabs.video'), icon: Settings }
  ];

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className='space-y-6'>
            <div>
              <label className='label'>{t('container.format')}</label>
              <select
                value={quickSettings.format}
                onChange={e => updateSettings('format', e.target.value)}
                className='input'
              >
                {FORMATS.map(fmt => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className='label'>{t('container.optimization')}</label>
              <select
                value={quickSettings.optimize}
                onChange={e => updateSettings('optimize', e.target.value)}
                className='input'
              >
                {OPTIMIZE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='label'>{t('video.codec')}</label>
                <select
                  value={(quickSettings.video?.codec as string) || 'x264'}
                  onChange={e => updateSettings('video.codec', e.target.value)}
                  className='input'
                >
                  <optgroup label={t('codecs.software')}>
                    {VIDEO_CODECS.filter(c => c.group === 'software').map(codec => (
                      <option key={codec.value} value={codec.value}>
                        {codec.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={t('codecs.qsv')}>
                    {VIDEO_CODECS.filter(c => c.group === 'qsv').map(codec => (
                      <option key={codec.value} value={codec.value}>
                        {codec.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={t('codecs.nvenc')}>
                    {VIDEO_CODECS.filter(c => c.group === 'nvenc').map(codec => (
                      <option key={codec.value} value={codec.value}>
                        {codec.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={t('codecs.vce')}>
                    {VIDEO_CODECS.filter(c => c.group === 'vce').map(codec => (
                      <option key={codec.value} value={codec.value}>
                        {codec.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className='label'>{t('video.rateControl')}</label>
                <select
                  value={(quickSettings.video?.rateControl as string) || 'crf'}
                  onChange={e => updateSettings('video.rateControl', e.target.value)}
                  className='input'
                >
                  {getAllowedRateControls((quickSettings.video?.codec as string) || '').map(rc => (
                    <option key={rc.value} value={rc.value}>
                      {rc.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const codec = (quickSettings.video?.codec as string) || '';
              const rateControl = quickSettings.video?.rateControl as string | undefined;
              const rcInfo = getRateControlForCodec(codec);

              if (
                rateControl === 'crf' ||
                rateControl === 'icq' ||
                rateControl === 'cqp' ||
                rateControl === 'cq'
              ) {
                const fieldName = rcInfo.type;
                const currentValue =
                  ((quickSettings.video as Record<string, unknown>)[fieldName] as number) ??
                  rcInfo.default;

                return (
                  <div>
                    <label className='label'>{rcInfo.label}</label>
                    <div className='flex items-center space-x-3'>
                      <input
                        type='number'
                        min={rcInfo.min}
                        max={rcInfo.max}
                        step={rcInfo.type === 'crf' || rcInfo.type === 'icq' ? '0.5' : '1'}
                        value={currentValue}
                        onChange={e => {
                          const val =
                            rcInfo.type === 'crf' || rcInfo.type === 'icq'
                              ? parseFloat(e.target.value)
                              : parseInt(e.target.value);
                          if (!isNaN(val) && val >= rcInfo.min && val <= rcInfo.max) {
                            updateSettings(`video.${fieldName}`, val);
                          }
                        }}
                        className='input w-24'
                      />
                      <input
                        type='range'
                        min={rcInfo.min}
                        max={rcInfo.max}
                        step={rcInfo.type === 'crf' || rcInfo.type === 'icq' ? '0.5' : '1'}
                        value={currentValue}
                        onChange={e => {
                          const val =
                            rcInfo.type === 'crf' || rcInfo.type === 'icq'
                              ? parseFloat(e.target.value)
                              : parseInt(e.target.value);
                          updateSettings(`video.${fieldName}`, val);
                        }}
                        className='flex-1'
                      />
                    </div>
                    <div className='flex justify-between text-xs text-gray-500 mt-1'>
                      <span>{t('video.smaller')}</span>
                      <span>{t('video.higher')}</span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {(quickSettings.video?.rateControl === 'cbr' ||
              quickSettings.video?.rateControl === 'vbr') && (
              <div>
                <label className='label'>
                  {t('video.bitrate')} {t('unit.kbps', '(kbps)')}
                </label>
                <input
                  type='number'
                  min='8'
                  max='80000'
                  step='50'
                  value={quickSettings.video?.bitrate || ''}
                  onChange={e => updateSettings('video.bitrate', parseInt(e.target.value) || 0)}
                  className='input'
                  placeholder={t('common.placeholder.bitrateRange')}
                />
              </div>
            )}

            {quickSettings.video?.rateControl === 'cqp' && (
              <div>
                <label className='label'>{t('video.qp')}</label>
                <div className='flex items-center space-x-3'>
                  <input
                    type='number'
                    min='0'
                    max='51'
                    value={(quickSettings.video?.qp as unknown as number) ?? 22}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 0 && val <= 51) {
                        updateSettings('video.qp', val);
                      }
                    }}
                    className='input w-24'
                  />
                  <input
                    type='range'
                    min='0'
                    max='51'
                    value={(quickSettings.video?.qp as unknown as number) ?? 22}
                    onChange={e => updateSettings('video.qp', parseInt(e.target.value))}
                    className='flex-1'
                  />
                </div>
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='label'>{t('video.preset')}</label>
                <select
                  value={(quickSettings.video?.preset as string) || 'medium'}
                  onChange={e => updateSettings('video.preset', e.target.value)}
                  className='input'
                >
                  {(() => {
                    const codec = (quickSettings.video?.codec as string) || 'x264';
                    let presets: ReadonlyArray<{ value: string; label: string }>;
                    if (codec.startsWith('qsv_')) {
                      presets = QSV_PRESETS;
                    } else if (codec.startsWith('nvenc_')) {
                      presets = NVENC_PRESETS;
                    } else if (codec.startsWith('vce_')) {
                      presets = VCE_PRESETS;
                    } else if (codec === 'x265') {
                      presets = X265_PRESETS;
                    } else {
                      presets = X264_PRESETS;
                    }
                    return presets.map(preset => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              <div>
                <label className='label'>{t('video.tune')}</label>
                <select
                  value={(quickSettings.video?.tune as unknown as string) || ''}
                  onChange={e => updateSettings('video.tune', e.target.value || null)}
                  className='input'
                >
                  <option value=''>{t('common.none')}</option>
                  {(() => {
                    const codec = (quickSettings.video?.codec as string) || 'x264';
                    if (
                      codec.startsWith('qsv_') ||
                      codec.startsWith('nvenc_') ||
                      codec.startsWith('vce_')
                    ) {
                      return null;
                    }
                    return (codec === 'x265' ? X265_TUNES : X264_TUNES).map(tune => (
                      <option key={tune.value} value={tune.value}>
                        {tune.label}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='label'>{t('video.framerate')}</label>
                <select
                  value={
                    quickSettings.video?.framerate === null ||
                    quickSettings.video?.framerate === undefined
                      ? ''
                      : String(quickSettings.video?.framerate)
                  }
                  onChange={e => {
                    if (e.target.value === '') {
                      updateSettings('video.framerate', null);
                    } else {
                      updateSettings('video.framerate', parseFloat(e.target.value));
                    }
                  }}
                  className='input'
                >
                  {FRAMERATES.map(fr => (
                    <option
                      key={fr.value === null ? 'null' : fr.value}
                      value={fr.value === null ? '' : String(fr.value)}
                    >
                      {fr.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='label'>{t('video.colorRange')}</label>
                <select
                  value={(quickSettings.video?.colorRange as string) || 'auto'}
                  onChange={e => updateSettings('video.colorRange', e.target.value)}
                  className='input'
                >
                  {COLOR_RANGES.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [activeTab, quickSettings, t]);

  const pathParts = (outputPath || '/drive').split('/').filter(Boolean);

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto'>
      <div className='bg-dark-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col my-4'>
        <div className='p-6 border-b border-dark-700'>
          <div className='flex items-center justify-between'>
            <h2 className='text-2xl font-bold text-white'>
              {t('transcode.batchTranscode', '批量转码')}
            </h2>
            <button
              onClick={onClose}
              className='p-1 hover:bg-dark-700 rounded-lg transition-colors'
            >
              <X className='w-5 h-5 text-gray-400' />
            </button>
          </div>

          <div className='text-sm text-gray-400 mt-1'>
            {t('transcode.sourceDirectory', '源目录')}:{' '}
            <span className='text-white'>{directory}</span>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto'>
          <div className='p-6'>
            <div className='space-y-6'>
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <label className='label'>{t('presets.usePreset', '使用预设')}</label>
                  <button
                    onClick={() => {
                      setShowPresetModal(true);
                    }}
                    className='text-xs text-primary hover:underline'
                  >
                    {t('presets.refreshPresets', '刷新')}
                  </button>
                </div>
                <select
                  value={selectedPresetId}
                  onChange={e => {
                    setSelectedPresetId(e.target.value);
                    localStorage.setItem('lastUsedPresetId', e.target.value);
                  }}
                  className='input'
                >
                  <option value=''>{t('transcode.customSettings', '自定义设置')}</option>
                  {presets.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {preset.isBuiltIn ? `(${t('presets.builtIn', '内置')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className='bg-dark-900 rounded-xl p-4 border border-dark-700'>
                <div className='flex items-center space-x-2 mb-4'>
                  <Settings className='w-4 h-4 text-primary' />
                  <h3 className='text-white font-medium'>
                    {t('transcode.quickSettings', '快速设置')}
                  </h3>
                </div>

                <div className='flex space-x-2 mb-4'>
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                          'flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                          activeTab === tab.id
                            ? 'bg-primary text-white'
                            : 'bg-dark-800 text-gray-400 hover:text-white'
                        )}
                      >
                        <Icon className='w-3.5 h-3.5' />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className='space-y-4'>{tabContent}</div>

                <div className='mt-4 pt-4 border-t border-dark-700'>
                  {!editingPreset ? (
                    <button
                      onClick={() => setEditingPreset(true)}
                      className='text-xs text-primary hover:underline'
                    >
                      {t('presets.saveAsNew', '保存为新预设')}
                    </button>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <input
                        type='text'
                        value={savePresetName}
                        onChange={e => setSavePresetName(e.target.value)}
                        placeholder={t('presets.presetName', '预设名称')}
                        className='input flex-1 text-sm'
                        onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                      />
                      <button onClick={handleSavePreset} className='btn btn-primary text-sm'>
                        {t('common.save', '保存')}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPreset(false);
                          setSavePresetName('');
                        }}
                        className='btn btn-secondary text-sm'
                      >
                        {t('common.cancel', '取消')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className='label'>
                  {t('transcode.sourceFiles', '源文件')} ({sourceFiles.length})
                </label>
                {loading && (
                  <div className='flex items-center space-x-2 my-4'>
                    <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
                    <span className='text-sm text-gray-400'>{t('common.loading')}</span>
                  </div>
                )}
                {sourceFiles.length > 0 && (
                  <>
                    <div className='flex items-center space-x-2 mb-2'>
                      <button onClick={toggleAll} className='text-xs text-primary hover:underline'>
                        {selectedFiles.size === sourceFiles.length
                          ? t('common.deselectAll', '取消全选')
                          : t('common.selectAll', '全选')}
                      </button>
                    </div>
                    <div className='space-y-1 max-h-48 overflow-y-auto bg-dark-700 rounded-lg p-2'>
                      {displayedFiles.map(file => {
                        const checked = selectedFiles.has(file.path);
                        return (
                          <label
                            key={file.path}
                            className='flex items-center space-x-2 px-2 py-1 hover:bg-dark-600 rounded cursor-pointer'
                          >
                            <input
                              type='checkbox'
                              checked={checked}
                              onChange={() => toggleFile(file.path)}
                              className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                            />
                            <span className='text-white text-sm break-all'>{file.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    {hasMore && (
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className='mt-2 btn btn-secondary text-sm'
                      >
                        {loading ? t('common.loading') : t('jobs.loadingMore', '加载更多...')}
                      </button>
                    )}
                  </>
                )}
                {!loading && sourceFiles.length === 0 && (
                  <div className='text-center py-8 bg-dark-700 rounded-lg mt-2'>
                    <p className='text-gray-400 text-sm'>
                      {t('files.noSupportedFiles', '目录中无可转码的视频文件')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className='label'>{t('transcode.outputDirectory', '输出目录')}</label>

                <div className='mb-2'>
                  <label className='text-sm text-gray-500'>
                    {t('transcode.manualInput', '自定义目录')}
                  </label>
                  <input
                    type='text'
                    value={customOutputDir}
                    onChange={e => {
                      setCustomOutputDir(e.target.value);
                      if (!e.target.value) browseOutputDirs('/drive');
                    }}
                    placeholder={t('transcode.enterOutputDir', '/custom/output/dir')}
                    className='input mt-1 font-mono text-sm'
                  />
                </div>

                <div className='mb-2'>
                  <label className='text-sm text-gray-500'>
                    {t('transcode.browseTitle', '或浏览目录')}
                  </label>
                  {browseLoading ? (
                    <div className='flex items-center space-x-2 text-gray-400 py-2'>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span className='text-sm'>{t('common.loading')}</span>
                    </div>
                  ) : (
                    <>
                      <div className='flex flex-wrap items-center gap-1 text-sm mb-3'>
                        {pathParts.map((part, i) => {
                          const fullPath = '/' + pathParts.slice(0, i + 1).join('/');
                          return (
                            <span key={i} className='flex items-center gap-1'>
                              {i > 0 && <ChevronRight className='w-3 h-3 text-gray-500' />}
                              <button
                                type='button'
                                onClick={() => handleBrowse(fullPath)}
                                className={`hover:underline truncate max-w-[100px] ${
                                  outputPath === fullPath
                                    ? 'text-white font-medium'
                                    : 'text-primary'
                                }`}
                              >
                                {part}
                              </button>
                            </span>
                          );
                        })}
                      </div>

                      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto'>
                        {outputDirList.map(dir => (
                          <button
                            type='button'
                            key={dir.path}
                            onClick={() => handleBrowse(dir.path)}
                            className='flex items-center space-x-2 p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors text-left'
                          >
                            <span className='w-4 h-4 text-warning'>📁</span>
                            <span className='text-white text-xs truncate'>{dir.name}</span>
                          </button>
                        ))}
                        {outputDirList.length === 0 && (
                          <p className='col-span-full text-gray-500 text-xs py-2'>
                            {t('common.empty', '空目录')}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <p className='text-xs text-gray-400'>
                  {t('transcode.currentPath', '当前路径')}:{' '}
                  <span className='text-primary font-mono'>{customOutputDir || outputPath}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='p-6 border-t border-dark-700 flex items-center justify-end space-x-3'>
          <button onClick={onClose} className='btn btn-secondary'>
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedFiles.size === 0 || submitting}
            className='btn btn-primary'
          >
            {submitting ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin mr-2 inline' />
                {t('common.processing')}
              </>
            ) : (
              t('transcode.startTranscoding', '开始转码')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BatchTranscodeModal;
