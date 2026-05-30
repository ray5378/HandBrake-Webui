import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Star,
  Settings,
  Video,
  Headphones,
  Subtitles,
  BookOpen,
  Tag,
  Search,
  Eye,
  Copy,
  X
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToastStore } from '../stores/toastStore';
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
  RATE_CONTROLS,
  AUDIO_CODECS,
  AUDIO_SAMPLERATES,
  MIXDOWN_MODES,
  DRC_MODES,
  COLOR_RANGES,
  RESOLUTION_LIMITS,
  ANAMORPHIC_MODES,
  FRAMERATES,
  getRateControlForCodec,
  getAllowedRateControls,
  OPTIMIZE_OPTIONS,
  getDefaultPresetSettings
} from '../constants/presets';

function Presets() {
  const { t } = useTranslation();
  const addToast = useToastStore(state => state.addToast);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: getDefaultPresetSettings()
  });
  const [presetFilter, setPresetFilter] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [confirmDeletePresetId, setConfirmDeletePresetId] = useState(null);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await api.get('/presets');
      setPresets(response.data.data.presets);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      if (editingPreset) {
        await api.put(`/presets/${editingPreset.id}`, formData);
      } else {
        await api.post('/presets', formData);
      }

      setShowModal(false);
      resetForm();
      fetchPresets();
    } catch (error) {
      console.error('Failed to save preset:', error);
      addToast({
        message: error.response?.data?.error || t('errors.saveFailed'),
        type: 'error'
      });
    }
  };

  const handleEdit = preset => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      description: preset.description,
      settings: {
        ...getDefaultPresetSettings(),
        ...preset.settings
      }
    });
    setActiveTab('summary');
    setShowModal(true);
  };

  const handleDelete = async presetId => {
    setConfirmDeletePresetId(presetId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeletePresetId) return;
    try {
      await api.delete(`/presets/${confirmDeletePresetId}`);
      fetchPresets();
    } catch (error) {
      console.error('Failed to delete preset:', error);
      addToast({
        message: error.response?.data?.error || t('errors.deleteFailed'),
        type: 'error'
      });
    }
    setConfirmDeletePresetId(null);
  };

  const handleView = preset => {
    setEditingPreset(preset);
    setReadOnly(true);
    setFormData({
      name: preset.name,
      description: preset.description,
      settings: {
        ...getDefaultPresetSettings(),
        ...preset.settings
      }
    });
    setActiveTab('summary');
    setShowModal(true);
  };

  const handleCopy = async preset => {
    try {
      const res = await api.post('/presets', {
        name: preset.name + ' - 副本',
        description: preset.description,
        settings: preset.settings
      });
      fetchPresets();
      const newId = res.data.data?.preset?.id;
      if (newId) {
        setEditingPreset({ ...preset, id: newId });
        setReadOnly(false);
        setFormData({
          name: preset.name + ' - 副本',
          description: preset.description,
          settings: {
            ...getDefaultPresetSettings(),
            ...preset.settings
          }
        });
        setActiveTab('summary');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to copy preset:', error);
      addToast({
        message: error.response?.data?.error || '复制预设失败',
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setEditingPreset(null);
    setReadOnly(false);
    setFormData({
      name: '',
      description: '',
      settings: getDefaultPresetSettings()
    });
    setActiveTab('summary');
  };

  const updateSettings = (path, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newSettings = { ...prev.settings };
      let current = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      return {
        ...prev,
        settings: newSettings
      };
    });
  };

  const getCodecLabel = codec => {
    const allCodecs = [...VIDEO_CODECS, ...AUDIO_CODECS];
    const found = allCodecs.find(c => c.value === codec);
    return found ? found.label : codec;
  };

  const tabs = [
    { id: 'summary', label: t('presetTabs.summary'), icon: Layers },
    { id: 'dimensions', label: t('presetTabs.dimensions'), icon: Settings },
    { id: 'filters', label: t('presetTabs.filters'), icon: Settings },
    { id: 'video', label: t('presetTabs.video'), icon: Video },
    { id: 'audio', label: t('presetTabs.audio'), icon: Headphones },
    { id: 'subtitles', label: t('presetTabs.subtitles'), icon: Subtitles },
    { id: 'chapters', label: t('presetTabs.chapters'), icon: BookOpen },
    { id: 'tags', label: t('presetTabs.tags'), icon: Tag }
  ];

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className='space-y-6'>
            <div>
              <label className='label'>{t('container.format')}</label>
              <select
                value={formData.settings.format}
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
                value={formData.settings.optimize}
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
                  value={formData.settings.video?.codec || 'x264'}
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
                  value={formData.settings.video?.rateControl || 'crf'}
                  onChange={e => updateSettings('video.rateControl', e.target.value)}
                  className='input'
                >
                  {getAllowedRateControls(formData.settings.video?.codec).map(rc => (
                    <option key={rc.value} value={rc.value}>
                      {rc.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const codec = formData.settings.video?.codec;
              const rateControl = formData.settings.video?.rateControl;
              const rcInfo = getRateControlForCodec(codec);

              if (
                rateControl === 'crf' ||
                rateControl === 'icq' ||
                rateControl === 'cqp' ||
                rateControl === 'cq'
              ) {
                const fieldName = rcInfo.type;
                const currentValue = formData.settings.video?.[fieldName] ?? rcInfo.default;

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

            {(formData.settings.video?.rateControl === 'cbr' ||
              formData.settings.video?.rateControl === 'vbr') && (
              <div>
                <label className='label'>{t('video.bitrate')} (kbps)</label>
                <input
                  type='number'
                  min='8'
                  max='80000'
                  step='50'
                  value={formData.settings.video?.bitrate || ''}
                  onChange={e => updateSettings('video.bitrate', parseInt(e.target.value) || 0)}
                  className='input'
                  placeholder={t('common.placeholder.bitrateRange')}
                />
              </div>
            )}

            {formData.settings.video?.rateControl === 'cqp' && (
              <div>
                <label className='label'>{t('video.qp')}</label>
                <div className='flex items-center space-x-3'>
                  <input
                    type='number'
                    min='0'
                    max='51'
                    value={formData.settings.video?.qp ?? 22}
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
                    value={formData.settings.video?.qp ?? 22}
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
                  value={formData.settings.video?.preset || 'medium'}
                  onChange={e => updateSettings('video.preset', e.target.value)}
                  className='input'
                >
                  {(() => {
                    const codec = formData.settings.video?.codec || 'x264';
                    let presets;
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
                  value={formData.settings.video?.tune || ''}
                  onChange={e => updateSettings('video.tune', e.target.value || null)}
                  className='input'
                >
                  <option value=''>{t('common.none')}</option>
                  {(() => {
                    const codec = formData.settings.video?.codec || 'x264';
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
                <label className='label'>{t('video.profile')}</label>
                <select
                  value={formData.settings.video?.profile || ''}
                  onChange={e => updateSettings('video.profile', e.target.value || null)}
                  className='input'
                >
                  <option value=''>{t('common.auto')}</option>
                  {formData.settings.video?.codec === 'x264' ? (
                    <>
                      <option value='baseline'>{t('video.baseline')}</option>
                      <option value='main'>{t('video.main')}</option>
                      <option value='high'>{t('video.high')}</option>
                      <option value='high10'>{t('profiles.high10')}</option>
                      <option value='high422'>{t('profiles.high422')}</option>
                      <option value='high444'>{t('profiles.high444')}</option>
                    </>
                  ) : formData.settings.video?.codec === 'x265' ? (
                    <>
                      <option value='main'>{t('video.main')}</option>
                      <option value='main10'>{t('profiles.main10')}</option>
                      <option value='mainstillpicture'>{t('profiles.mainstillpicture')}</option>
                    </>
                  ) : null}
                </select>
              </div>

              <div>
                <label className='label'>{t('video.level')}</label>
                <select
                  value={formData.settings.video?.level || ''}
                  onChange={e => updateSettings('video.level', e.target.value || null)}
                  className='input'
                >
                  <option value=''>{t('common.auto')}</option>
                  <option value='1.0'>1.0</option>
                  <option value='1.1'>1.1</option>
                  <option value='1.2'>1.2</option>
                  <option value='1.3'>1.3</option>
                  <option value='2.0'>2.0</option>
                  <option value='2.1'>2.1</option>
                  <option value='2.2'>2.2</option>
                  <option value='3.0'>3.0</option>
                  <option value='3.1'>3.1</option>
                  <option value='3.2'>3.2</option>
                  <option value='4.0'>4.0</option>
                  <option value='4.1'>4.1</option>
                  <option value='4.2'>4.2</option>
                  <option value='5.0'>5.0</option>
                  <option value='5.1'>5.1</option>
                  <option value='5.2'>5.2</option>
                  <option value='6.0'>6.0</option>
                  <option value='6.1'>6.1</option>
                  <option value='6.2'>6.2</option>
                </select>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='label'>{t('video.framerate')}</label>
                <select
                  value={
                    formData.settings.video?.framerate === null ||
                    formData.settings.video?.framerate === undefined
                      ? ''
                      : String(formData.settings.video?.framerate)
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
                {formData.settings.video?.framerate !== null &&
                  formData.settings.video?.framerate !== undefined && (
                    <div className='mt-2'>
                      <input
                        type='number'
                        step='0.001'
                        min='1'
                        max='240'
                        value={formData.settings.video?.framerate || 30}
                        onChange={e =>
                          updateSettings('video.framerate', parseFloat(e.target.value) || null)
                        }
                        className='input'
                        placeholder={t('common.placeholder.enterFramerate')}
                      />
                    </div>
                  )}
              </div>

              <div>
                <label className='label'>{t('video.framerateMode')}</label>
                <select
                  value={formData.settings.video?.framerateMode || 'cfr'}
                  onChange={e => updateSettings('video.framerateMode', e.target.value)}
                  className='input'
                >
                  <option value='cfr'>{t('video.fixedFramerate')}</option>
                  <option value='vfr'>{t('video.variableFramerate')}</option>
                  <option value='pfr'>{t('video.peakFramerate')}</option>
                </select>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='label'>{t('video.colorRange')}</label>
                <select
                  value={formData.settings.video?.colorRange || 'auto'}
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

              <div className='flex items-center space-x-2 pt-6'>
                <input
                  type='checkbox'
                  id='multiPass'
                  checked={formData.settings.video?.multiPass || false}
                  onChange={e => updateSettings('video.multiPass', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='multiPass' className='text-gray-200'>
                  {t('video.multiPass')}
                </label>
              </div>
            </div>
          </div>
        );

      case 'dimensions':
        return (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='label'>{t('dimensions.width')} (px)</label>
                <input
                  type='number'
                  value={formData.settings.dimensions?.width || ''}
                  onChange={e =>
                    updateSettings(
                      'dimensions.width',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className='input'
                  placeholder={t('common.auto')}
                />
              </div>
              <div>
                <label className='label'>{t('dimensions.height')} (px)</label>
                <input
                  type='number'
                  value={formData.settings.dimensions?.height || ''}
                  onChange={e =>
                    updateSettings(
                      'dimensions.height',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className='input'
                  placeholder={t('common.auto')}
                />
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='cropEnable'
                  checked={formData.settings.dimensions?.cropping?.enabled}
                  onChange={e => updateSettings('dimensions.cropping.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='cropEnable' className='text-gray-200'>
                  {t('dimensions.enableCropping')}
                </label>
              </div>
              {formData.settings.dimensions?.cropping?.enabled && (
                <div className='pl-6 space-y-4'>
                  <div className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      id='autocrop'
                      checked={formData.settings.dimensions?.cropping?.autocrop}
                      onChange={e =>
                        updateSettings('dimensions.cropping.autocrop', e.target.checked)
                      }
                      className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                    />
                    <label htmlFor='autocrop' className='text-gray-200'>
                      {t('dimensions.autoCrop')}
                    </label>
                  </div>
                  {!formData.settings.dimensions?.cropping?.autocrop && (
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                      <div>
                        <label className='label'>{t('dimensions.top')}</label>
                        <input
                          type='number'
                          value={formData.settings.dimensions?.cropping?.top || 0}
                          onChange={e =>
                            updateSettings('dimensions.cropping.top', parseInt(e.target.value))
                          }
                          className='input'
                        />
                      </div>
                      <div>
                        <label className='label'>{t('dimensions.bottom')}</label>
                        <input
                          type='number'
                          value={formData.settings.dimensions?.cropping?.bottom || 0}
                          onChange={e =>
                            updateSettings('dimensions.cropping.bottom', parseInt(e.target.value))
                          }
                          className='input'
                        />
                      </div>
                      <div>
                        <label className='label'>{t('dimensions.left')}</label>
                        <input
                          type='number'
                          value={formData.settings.dimensions?.cropping?.left || 0}
                          onChange={e =>
                            updateSettings('dimensions.cropping.left', parseInt(e.target.value))
                          }
                          className='input'
                        />
                      </div>
                      <div>
                        <label className='label'>{t('dimensions.right')}</label>
                        <input
                          type='number'
                          value={formData.settings.dimensions?.cropping?.right || 0}
                          onChange={e =>
                            updateSettings('dimensions.cropping.right', parseInt(e.target.value))
                          }
                          className='input'
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='keepAspect'
                  checked={formData.settings.dimensions?.scaling?.keepDisplayAspect !== false}
                  onChange={e =>
                    updateSettings('dimensions.scaling.keepDisplayAspect', e.target.checked)
                  }
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='keepAspect' className='text-gray-200'>
                  {t('dimensions.keepAspectRatio')}
                </label>
              </div>
              <div>
                <label className='label'>{t('dimensions.modulus')}</label>
                <select
                  value={formData.settings.dimensions?.scaling?.modulus || 16}
                  onChange={e =>
                    updateSettings('dimensions.scaling.modulus', parseInt(e.target.value))
                  }
                  className='input'
                >
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                </select>
              </div>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='label'>{t('dimensions.resolutionLimit')}</label>
                <select
                  value={formData.settings.dimensions?.resolutionLimit || ''}
                  onChange={e => updateSettings('dimensions.resolutionLimit', e.target.value)}
                  className='input'
                >
                  {RESOLUTION_LIMITS.map(limit => (
                    <option key={limit.value} value={limit.value}>
                      {limit.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='label'>{t('dimensions.anamorphic')}</label>
                <select
                  value={formData.settings.dimensions?.scaling?.anamorphic || 'auto'}
                  onChange={e => updateSettings('dimensions.scaling.anamorphic', e.target.value)}
                  className='input'
                >
                  {ANAMORPHIC_MODES.map(mode => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.settings.dimensions?.scaling?.anamorphic === 'custom' && (
                <div>
                  <label className='label'>{t('dimensions.pixelAspectRatio')}</label>
                  <div className='flex items-center space-x-2'>
                    <input
                      type='number'
                      min='1'
                      max='100'
                      value={formData.settings.dimensions?.scaling?.pixelAspectX || 1}
                      onChange={e =>
                        updateSettings('dimensions.scaling.pixelAspectX', parseInt(e.target.value))
                      }
                      className='input w-16'
                    />
                    <span className='text-gray-400'>:</span>
                    <input
                      type='number'
                      min='1'
                      max='100'
                      value={formData.settings.dimensions?.scaling?.pixelAspectY || 1}
                      onChange={e =>
                        updateSettings('dimensions.scaling.pixelAspectY', parseInt(e.target.value))
                      }
                      className='input w-16'
                    />
                  </div>
                </div>
              )}

              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='bestSize'
                    checked={formData.settings.dimensions?.scaling?.bestSize || false}
                    onChange={e => updateSettings('dimensions.scaling.bestSize', e.target.checked)}
                    className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                  />
                  <label htmlFor='bestSize' className='text-gray-200'>
                    {t('dimensions.bestSize')}
                  </label>
                </div>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='allowUpscaling'
                    checked={formData.settings.dimensions?.scaling?.allowUpscaling || false}
                    onChange={e =>
                      updateSettings('dimensions.scaling.allowUpscaling', e.target.checked)
                    }
                    className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                  />
                  <label htmlFor='allowUpscaling' className='text-gray-200'>
                    {t('dimensions.allowUpscaling')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='label'>{t('audio.codec')}</label>
                <select
                  value={formData.settings.audio?.default?.codec || 'av_aac'}
                  onChange={e => updateSettings('audio.default.codec', e.target.value)}
                  className='input'
                >
                  {AUDIO_CODECS.map(codec => (
                    <option key={codec.value} value={codec.value}>
                      {codec.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='label'>{t('audio.bitrate')}</label>
                <input
                  type='number'
                  value={formData.settings.audio?.default?.bitrate || 160}
                  onChange={e => updateSettings('audio.default.bitrate', parseInt(e.target.value))}
                  className='input'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='label'>{t('audio.mixdown')}</label>
                <select
                  value={formData.settings.audio?.default?.mixdown || 'stereo'}
                  onChange={e => updateSettings('audio.default.mixdown', e.target.value)}
                  className='input'
                >
                  {MIXDOWN_MODES.map(mode => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='label'>{t('audio.samplerate')}</label>
                <select
                  value={formData.settings.audio?.default?.samplerate || ''}
                  onChange={e =>
                    updateSettings(
                      'audio.default.samplerate',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className='input'
                >
                  <option value=''>{t('common.auto')}</option>
                  {AUDIO_SAMPLERATES.map(sr => (
                    <option key={sr.value} value={sr.value}>
                      {sr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className='label'>{t('audio.drc')}</label>
              <select
                value={formData.settings.audio?.default?.drc || 'none'}
                onChange={e => updateSettings('audio.default.drc', e.target.value)}
                className='input'
              >
                {DRC_MODES.map(mode => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='label'>{t('audio.gain')}</label>
              <input
                type='number'
                step='0.5'
                min='-20'
                max='20'
                value={formData.settings.audio?.default?.gain || 0}
                onChange={e => updateSettings('audio.default.gain', parseFloat(e.target.value))}
                className='input'
              />
            </div>
          </div>
        );

      case 'filters':
        return (
          <div className='space-y-6'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='deinterlace'
                  checked={formData.settings.filters?.deinterlace?.enabled}
                  onChange={e => updateSettings('filters.deinterlace.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='deinterlace' className='text-gray-200'>
                  {t('filters.deinterlace')}
                </label>
              </div>
              {formData.settings.filters?.deinterlace?.enabled && (
                <div className='pl-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <select
                    value={formData.settings.filters?.deinterlace?.mode || 'slower'}
                    onChange={e => updateSettings('filters.deinterlace.mode', e.target.value)}
                    className='input'
                  >
                    <option value='fast'>{t('filters.fast')}</option>
                    <option value='slow'>{t('filters.slow')}</option>
                    <option value='slower'>{t('filters.slower')}</option>
                    <option value='bob'>{t('filters.bob')}</option>
                  </select>
                  <select
                    value={formData.settings.filters?.deinterlace?.parity || 'auto'}
                    onChange={e => updateSettings('filters.deinterlace.parity', e.target.value)}
                    className='input'
                  >
                    <option value='auto'>{t('deinterlaceParity.auto')}</option>
                    <option value='tff'>{t('deinterlaceParity.tff')}</option>
                    <option value='bff'>{t('deinterlaceParity.bff')}</option>
                  </select>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='decomb'
                  checked={formData.settings.filters?.decomb?.enabled}
                  onChange={e => updateSettings('filters.decomb.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='decomb' className='text-gray-200'>
                  {t('filters.decomb')}
                </label>
              </div>
              {formData.settings.filters?.decomb?.enabled && (
                <div className='pl-6'>
                  <select
                    value={formData.settings.filters?.decomb?.mode || 'default'}
                    onChange={e => updateSettings('filters.decomb.mode', e.target.value)}
                    className='input'
                  >
                    <option value='default'>{t('decombModes.default')}</option>
                    <option value='bob'>{t('decombModes.bob')}</option>
                    <option value='custom'>{t('decombModes.custom')}</option>
                  </select>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='detelecine'
                  checked={formData.settings.filters?.detelecine?.enabled}
                  onChange={e => updateSettings('filters.detelecine.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='detelecine' className='text-gray-200'>
                  {t('filters.detelecine')}
                </label>
              </div>
              {formData.settings.filters?.detelecine?.enabled && (
                <div className='pl-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <select
                    value={formData.settings.filters?.detelecine?.pattern || '23.976'}
                    onChange={e => updateSettings('filters.detelecine.pattern', e.target.value)}
                    className='input'
                  >
                    <option value='23.976'>23.976</option>
                    <option value='24'>24</option>
                    <option value='25'>25</option>
                    <option value='29.97'>29.97</option>
                    <option value='30'>30</option>
                    <option value='custom'>{t('detelecinePatterns.custom')}</option>
                  </select>
                  <input
                    type='number'
                    value={formData.settings.filters?.detelecine?.startFrame || ''}
                    onChange={e =>
                      updateSettings(
                        'filters.detelecine.startFrame',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className='input'
                    placeholder={t('common.placeholder.startFrame')}
                  />
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='denoise'
                  checked={formData.settings.filters?.denoise?.enabled}
                  onChange={e => updateSettings('filters.denoise.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='denoise' className='text-gray-200'>
                  {t('filters.denoise')}
                </label>
              </div>
              {formData.settings.filters?.denoise?.enabled && (
                <div className='pl-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <select
                    value={formData.settings.filters?.denoise?.method || 'nlmeans'}
                    onChange={e => updateSettings('filters.denoise.method', e.target.value)}
                    className='input'
                  >
                    <option value='hqdn3d'>{t('filters.hqdn3d')}</option>
                    <option value='nlmeans'>{t('filters.nlmeans')}</option>
                  </select>
                  <select
                    value={formData.settings.filters?.denoise?.preset || 'medium'}
                    onChange={e => updateSettings('filters.denoise.preset', e.target.value)}
                    className='input'
                  >
                    <option value='ultralight'>{t('filters.ultralight')}</option>
                    <option value='light'>{t('filters.light')}</option>
                    <option value='medium'>{t('filters.medium')}</option>
                    <option value='strong'>{t('filters.strong')}</option>
                  </select>
                  <select
                    value={formData.settings.filters?.denoise?.tune || 'none'}
                    onChange={e => updateSettings('filters.denoise.tune', e.target.value)}
                    className='input'
                  >
                    <option value='none'>{t('common.none')}</option>
                    <option value='film'>{t('filters.film')}</option>
                    <option value='grain'>{t('filters.grain')}</option>
                    <option value='psnr'>PSNR</option>
                    <option value='ssim'>SSIM</option>
                  </select>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='deblock'
                  checked={formData.settings.filters?.deblock?.enabled}
                  onChange={e => updateSettings('filters.deblock.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='deblock' className='text-gray-200'>
                  {t('filters.deblock')}
                </label>
              </div>
              {formData.settings.filters?.deblock?.enabled && (
                <div className='pl-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='label'>{t('filters.strength')}</label>
                    <input
                      type='number'
                      min='0'
                      max='10'
                      value={formData.settings.filters?.deblock?.strength || 4}
                      onChange={e =>
                        updateSettings('filters.deblock.strength', parseInt(e.target.value))
                      }
                      className='input'
                    />
                  </div>
                  <div>
                    <label className='label'>{t('filters.threshold')}</label>
                    <input
                      type='number'
                      min='0'
                      max='10'
                      value={formData.settings.filters?.deblock?.threshold || 4}
                      onChange={e =>
                        updateSettings('filters.deblock.threshold', parseInt(e.target.value))
                      }
                      className='input'
                    />
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='sharpen'
                  checked={formData.settings.filters?.sharpen?.enabled}
                  onChange={e => updateSettings('filters.sharpen.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='sharpen' className='text-gray-200'>
                  {t('filters.sharpen')}
                </label>
              </div>
              {formData.settings.filters?.sharpen?.enabled && (
                <div className='pl-6'>
                  <select
                    value={formData.settings.filters?.sharpen?.method || 'unsharp'}
                    onChange={e => updateSettings('filters.sharpen.method', e.target.value)}
                    className='input'
                  >
                    <option value='unsharp'>{t('filters.unsharp')}</option>
                    <option value='lapsharp'>{t('filters.lapsharp')}</option>
                  </select>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='chromaSmooth'
                  checked={formData.settings.filters?.chromaSmooth?.enabled}
                  onChange={e => updateSettings('filters.chromaSmooth.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='chromaSmooth' className='text-gray-200'>
                  {t('filters.chromaSmooth')}
                </label>
              </div>
              {formData.settings.filters?.chromaSmooth?.enabled && (
                <div className='pl-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='label'>{t('filters.tuSize')}</label>
                    <input
                      type='number'
                      min='2'
                      max='6'
                      value={formData.settings.filters?.chromaSmooth?.tuSize || 2}
                      onChange={e =>
                        updateSettings('filters.chromaSmooth.tuSize', parseInt(e.target.value))
                      }
                      className='input'
                    />
                  </div>
                  <div>
                    <label className='label'>{t('filters.strength')}</label>
                    <input
                      type='number'
                      min='1'
                      max='10'
                      value={formData.settings.filters?.chromaSmooth?.strength || 2}
                      onChange={e =>
                        updateSettings('filters.chromaSmooth.strength', parseInt(e.target.value))
                      }
                      className='input'
                    />
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='colorspace'
                  checked={formData.settings.filters?.colorspace?.enabled}
                  onChange={e => updateSettings('filters.colorspace.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='colorspace' className='text-gray-200'>
                  {t('filters.colorspace')}
                </label>
              </div>
              {formData.settings.filters?.colorspace?.enabled && (
                <div className='pl-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <select
                    value={formData.settings.filters?.colorspace?.matrix || ''}
                    onChange={e =>
                      updateSettings('filters.colorspace.matrix', e.target.value || null)
                    }
                    className='input'
                  >
                    <option value=''>{t('common.auto')}</option>
                    <option value='bt709'>{t('colorspaceMatrices.bt709')}</option>
                    <option value='bt470bg'>{t('colorspaceMatrices.bt470bg')}</option>
                    <option value='smpte170m'>{t('colorspaceMatrices.smpte170m')}</option>
                    <option value='bt2020nc'>{t('colorspaceMatrices.bt2020nc')}</option>
                  </select>
                  <select
                    value={formData.settings.filters?.colorspace?.range || 'auto'}
                    onChange={e => updateSettings('filters.colorspace.range', e.target.value)}
                    className='input'
                  >
                    <option value='auto'>{t('colorspaceRanges.auto')}</option>
                    <option value='limited'>{t('colorspaceRanges.limited')}</option>
                    <option value='full'>{t('colorspaceRanges.full')}</option>
                  </select>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='rotate'
                  checked={formData.settings.filters?.rotate?.enabled}
                  onChange={e => updateSettings('filters.rotate.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='rotate' className='text-gray-200'>
                  {t('filters.rotate')}
                </label>
              </div>
              {formData.settings.filters?.rotate?.enabled && (
                <div className='pl-6 space-y-4'>
                  <select
                    value={formData.settings.filters?.rotate?.angle || 0}
                    onChange={e => updateSettings('filters.rotate.angle', parseInt(e.target.value))}
                    className='input'
                  >
                    <option value={0}>0°</option>
                    <option value={90}>90°</option>
                    <option value={180}>180°</option>
                    <option value={270}>270°</option>
                  </select>
                  <div className='flex items-center space-x-4'>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        id='hflip'
                        checked={formData.settings.filters?.rotate?.hFlip}
                        onChange={e => updateSettings('filters.rotate.hFlip', e.target.checked)}
                        className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                      />
                      <label htmlFor='hflip' className='text-gray-200'>
                        {t('filters.hFlip')}
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        id='vflip'
                        checked={formData.settings.filters?.rotate?.vFlip}
                        onChange={e => updateSettings('filters.rotate.vFlip', e.target.checked)}
                        className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                      />
                      <label htmlFor='vflip' className='text-gray-200'>
                        {t('filters.vFlip')}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'subtitles':
        return (
          <div className='space-y-6'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='scanForced'
                  checked={formData.settings.subtitles?.scanForced}
                  onChange={e => updateSettings('subtitles.scanForced', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='scanForced' className='text-gray-200'>
                  {t('subtitles.scanForced')}
                </label>
              </div>
            </div>
            <p className='text-gray-500 text-sm'>{t('subtitles.comingSoon')}</p>
          </div>
        );

      case 'chapters':
        return (
          <div className='space-y-6'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='chapters'
                  checked={formData.settings.chapters?.enabled !== false}
                  onChange={e => updateSettings('chapters.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='chapters' className='text-gray-200'>
                  {t('chapters.includeChapters')}
                </label>
              </div>
            </div>
          </div>
        );

      case 'tags':
        return (
          <div className='space-y-6'>
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='tags'
                  checked={formData.settings.tags?.enabled}
                  onChange={e => updateSettings('tags.enabled', e.target.checked)}
                  className='w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary'
                />
                <label htmlFor='tags' className='text-gray-200'>
                  {t('tags.includeTags')}
                </label>
              </div>
            </div>

            {formData.settings.tags?.enabled && (
              <div className='space-y-4'>
                <div>
                  <label className='label'>{t('tags.title')}</label>
                  <input
                    type='text'
                    value={formData.settings.tags?.values?.title || ''}
                    onChange={e => updateSettings('tags.values.title', e.target.value)}
                    className='input'
                    placeholder={t('common.placeholder.enterTitle')}
                  />
                </div>
                <div>
                  <label className='label'>{t('tags.actor')}</label>
                  <input
                    type='text'
                    value={formData.settings.tags?.values?.actor || ''}
                    onChange={e => updateSettings('tags.values.actor', e.target.value)}
                    className='input'
                    placeholder={t('common.placeholder.enterActor')}
                  />
                </div>
                <div>
                  <label className='label'>{t('tags.director')}</label>
                  <input
                    type='text'
                    value={formData.settings.tags?.values?.director || ''}
                    onChange={e => updateSettings('tags.values.director', e.target.value)}
                    className='input'
                    placeholder={t('common.placeholder.enterDirector')}
                  />
                </div>
                <div>
                  <label className='label'>{t('tags.releaseDate')}</label>
                  <input
                    type='date'
                    value={formData.settings.tags?.values?.date || ''}
                    onChange={e => updateSettings('tags.values.date', e.target.value)}
                    className='input'
                  />
                </div>
                <div>
                  <label className='label'>{t('tags.genre')}</label>
                  <input
                    type='text'
                    value={formData.settings.tags?.values?.genre || ''}
                    onChange={e => updateSettings('tags.values.genre', e.target.value)}
                    className='input'
                    placeholder={t('common.placeholder.enterGenre')}
                  />
                </div>
                <div>
                  <label className='label'>{t('tags.description')}</label>
                  <input
                    type='text'
                    value={formData.settings.tags?.values?.description || ''}
                    onChange={e => updateSettings('tags.values.description', e.target.value)}
                    className='input'
                    placeholder={t('common.placeholder.enterDescription')}
                  />
                </div>
                <div>
                  <label className='label'>{t('tags.plot')}</label>
                  <textarea
                    value={formData.settings.tags?.values?.plot || ''}
                    onChange={e => updateSettings('tags.values.plot', e.target.value)}
                    className='input h-32'
                    placeholder={t('common.placeholder.enterPlot')}
                  />
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }, [activeTab, formData, t]);

  const presetTags = [
    {
      group: '类别',
      tags: [{ id: 'custom', label: '自定义' }]
    },
    {
      group: '编码',
      tags: [
        { id: 'x264', label: 'H.264' },
        { id: 'x265', label: 'H.265' },
        { id: 'hevc', label: 'HEVC' },
        { id: 'av1', label: 'AV1' },
        { id: 'vp9', label: 'VP9' },
        { id: 'mpeg4', label: 'MPEG-4' }
      ]
    },
    {
      group: '分辨率',
      tags: [
        { id: '4k', label: '4K' },
        { id: '2160p', label: '2160p' },
        { id: '1080p', label: '1080p' },
        { id: '720p', label: '720p' }
      ]
    }
  ];

  const matchesTag = (preset, tagId) => {
    const codec = preset.settings?.video?.codec;
    const { width, height } = preset.settings?.dimensions || {};
    const maxDim = Math.max(width || 0, height || 0);

    switch (tagId) {
      case 'custom':
        return !preset.isBuiltIn;
      case 'x264':
        return codec === 'x264' || codec === 'x264_10bit';
      case 'x265':
      case 'hevc':
        return codec === 'x265' || codec === 'x265_10bit' || codec === 'x265_12bit';
      case 'av1':
        return codec === 'svt-av1' || codec === 'svt-av1_10bit';
      case 'vp9':
        return codec === 'vp9' || codec === 'vp9_10bit';
      case 'mpeg4':
        return codec === 'mpeg4';
      case '4k':
      case '2160p':
        if (width == null && height == null) return false;
        return maxDim >= 1800 && maxDim <= 4320;
      case '1080p':
        if (width == null && height == null) return false;
        return maxDim >= 900 && maxDim < 1800;
      case '720p':
        if (width == null && height == null) return false;
        return maxDim >= 600 && maxDim < 900;
      default:
        return false;
    }
  };

  const filteredPresets = useMemo(() => {
    let list = presets;

    if (activeTag) {
      list = list.filter(p => matchesTag(p, activeTag));
    }

    if (presetFilter.trim()) {
      const q = presetFilter.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [presets, presetFilter, activeTag]);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-white'>{t('presets.title')}</h1>
          <p className='text-gray-400 mt-1'>{t('presets.subtitle')}</p>
        </div>

        <div className='flex items-center gap-3'>
          <div
            className='relative'
            onFocus={() => setShowTagDropdown(true)}
            onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
          >
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
            <input
              type='text'
              value={presetFilter}
              onChange={e => setPresetFilter(e.target.value)}
              className='input pl-9 py-2 text-sm w-48 sm:w-56'
              placeholder={
                activeTag
                  ? `按标签「${presetTags.flatMap(g => g.tags).find(t => t.id === activeTag)?.label || ''}」筛选...`
                  : '搜索预设...'
              }
            />
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className='absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors'
              >
                <X className='w-3.5 h-3.5' />
              </button>
            )}
            {showTagDropdown && (
              <div className='absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 p-3 min-w-[280px]'>
                {presetTags.map(group => (
                  <div key={group.group} className='mb-2.5 last:mb-0'>
                    <p className='text-xs text-gray-500 mb-1.5'>{group.group}</p>
                    <div className='flex flex-wrap gap-1.5'>
                      {group.tags.map(tag => (
                        <button
                          key={tag.id}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
                          className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                            activeTag === tag.id
                              ? 'bg-primary text-white'
                              : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className='btn btn-primary inline-flex items-center space-x-2 shrink-0'
          >
            <Plus className='w-4 h-4' />
            <span>{t('presets.createPreset')}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className='text-center py-12 text-gray-400'>{t('common.loading')}</div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredPresets.map(preset => (
            <div key={preset.id} className='card hover:border-primary/50 transition-colors'>
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center space-x-2'>
                  {preset.isBuiltIn && <Star className='w-5 h-5 text-warning' />}
                  <h3 className='text-lg font-semibold text-white'>{preset.name}</h3>
                </div>
                <span className='text-xs text-gray-400 uppercase'>{preset.settings.format}</span>
              </div>

              <p className='text-sm text-gray-400 mb-4'>{preset.description}</p>

              <div className='space-y-2 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-400'>{t('common.video')}</span>
                  <span className='text-white'>{getCodecLabel(preset.settings.video?.codec)}</span>
                </div>
                {preset.settings.video?.crf !== undefined && (
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400'>
                      {t('video.crf')} ({t('video.quality')})
                    </span>
                    <span className='text-white'>{preset.settings.video.crf}</span>
                  </div>
                )}
                <div className='flex items-center justify-between'>
                  <span className='text-gray-400'>{t('common.audio')}</span>
                  <span className='text-white'>
                    {getCodecLabel(preset.settings.audio?.default?.codec)}
                  </span>
                </div>
                {preset.settings.audio?.default?.bitrate && (
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400'>{t('common.audioBitrate')}</span>
                    <span className='text-white'>{preset.settings.audio.default.bitrate} kbps</span>
                  </div>
                )}
              </div>

              <div className='flex items-center space-x-2 mt-4 pt-4 border-t border-dark-700'>
                <button
                  onClick={() => handleView(preset)}
                  className='btn btn-secondary flex-1 text-sm flex items-center justify-center'
                >
                  <Eye className='w-4 h-4' />
                  <span className='ml-2'>查看</span>
                </button>
                <button
                  onClick={() => handleCopy(preset)}
                  className='btn btn-secondary text-sm flex items-center justify-center'
                >
                  <Copy className='w-4 h-4' />
                </button>
                {!preset.isBuiltIn && (
                  <>
                    <button
                      onClick={() => handleEdit(preset)}
                      className='btn btn-secondary text-sm flex items-center justify-center'
                    >
                      <Edit className='w-4 h-4' />
                    </button>
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className='btn btn-danger text-sm'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {filteredPresets.length === 0 && (
            <div className='col-span-full text-center py-12 text-gray-500'>无匹配预设</div>
          )}
        </div>
      )}

      {showModal && (
        <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4'>
          <div className='bg-dark-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
            <div className='p-6 border-b border-dark-700'>
              <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-bold text-white'>
                  {readOnly
                    ? '查看预设'
                    : editingPreset
                      ? t('presets.editPreset')
                      : t('presets.createPreset')}
                </h2>
              </div>
            </div>

            <div className='flex-1 overflow-hidden flex flex-col md:flex-row'>
              <div className='bg-dark-900 border-b md:border-b-0 md:border-r border-dark-700 p-4 md:w-48 shrink-0'>
                <nav className='space-y-1'>
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                          'w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors',
                          activeTab === tab.id
                            ? 'bg-primary/20 text-primary'
                            : 'text-gray-400 hover:text-white hover:bg-dark-800'
                        )}
                      >
                        <Icon className='w-4 h-4' />
                        <span className='text-sm'>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto overflow-x-auto'>
                <fieldset disabled={readOnly} className='contents'>
                  <div className='p-6 space-y-6'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div>
                        <label className='label'>{t('presets.presetName')}</label>
                        <input
                          type='text'
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className='input'
                          placeholder={t('common.placeholder.enterPresetName')}
                          required
                        />
                      </div>
                      <div>
                        <label className='label'>{t('presets.presetDescription')}</label>
                        <input
                          type='text'
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                          className='input'
                          placeholder={t('common.placeholder.enterPresetDescription')}
                        />
                      </div>
                    </div>

                    <div className='border-t border-dark-700 pt-6'>{tabContent}</div>
                  </div>
                </fieldset>

                <div className='p-6 border-t border-dark-700 flex flex-wrap items-center justify-end gap-3'>
                  {readOnly ? (
                    <button
                      type='button'
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className='btn btn-primary'
                    >
                      关闭
                    </button>
                  ) : (
                    <>
                      <button
                        type='button'
                        onClick={() => {
                          setShowModal(false);
                          resetForm();
                        }}
                        className='btn btn-secondary'
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setFormData({
                            name: editingPreset?.name || '',
                            description: editingPreset?.description || '',
                            settings: getDefaultPresetSettings()
                          });
                        }}
                        className='btn btn-warning'
                      >
                        {t('common.reset')}
                      </button>
                      <button type='submit' className='btn btn-primary'>
                        {editingPreset ? t('common.save') : t('common.create')}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDeletePresetId !== null}
        title={t('presets.confirmDeleteTitle', '删除预设')}
        message={t('presets.confirmDelete', '确定要删除这个预设吗？此操作不可撤销。')}
        confirmText={t('common.confirm', '确认')}
        cancelText={t('common.cancel', '取消')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeletePresetId(null)}
        danger
      />
    </div>
  );
}

export default Presets;
