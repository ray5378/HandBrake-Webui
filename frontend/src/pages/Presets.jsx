import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Star,
  Settings,
  Video,
  Headphones,
  Subtitles,
  BookOpen,
  Tag,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';
import {
  FORMATS,
  VIDEO_CODECS,
  X264_PRESETS,
  X265_PRESETS,
  X264_TUNES,
  X265_TUNES,
  RATE_CONTROLS,
  AUDIO_CODECS,
  AUDIO_SAMPLERATES,
  MIXDOWN_MODES,
  DRC_MODES,
  OPTIMIZE_OPTIONS,
  getDefaultPresetSettings
} from '../constants/presets';

function Presets() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: getDefaultPresetSettings()
  });

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
      alert(error.response?.data?.error || '保存失败');
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
    if (!confirm('确定要删除这个预设吗？')) return;

    try {
      await api.delete(`/presets/${presetId}`);
      fetchPresets();
    } catch (error) {
      console.error('Failed to delete preset:', error);
      alert(error.response?.data?.error || '删除失败');
    }
  };

  const resetForm = () => {
    setEditingPreset(null);
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
    { id: 'summary', label: 'Summary', icon: Layers },
    { id: 'dimensions', label: 'Dimensions', icon: Settings },
    { id: 'filters', label: 'Filters', icon: Settings },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'audio', label: 'Audio', icon: Headphones },
    { id: 'subtitles', label: 'Subtitles', icon: Subtitles },
    { id: 'chapters', label: 'Chapters', icon: BookOpen },
    { id: 'tags', label: 'Tags', icon: Tag }
  ];

  const TabContent = ({ tab }) => {
    switch (tab) {
      case 'summary':
        return (
          <div className="space-y-6">
            <div>
              <label className="label">Container</label>
              <select
                value={formData.settings.format}
                onChange={e => updateSettings('format', e.target.value)}
                className="input"
              >
                {FORMATS.map(fmt => (
                  <option key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Optimization</label>
              <select
                value={formData.settings.optimize}
                onChange={e => updateSettings('optimize', e.target.value)}
                className="input"
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Video Codec</label>
                <select
                  value={formData.settings.video?.codec || 'x264'}
                  onChange={e => updateSettings('video.codec', e.target.value)}
                  className="input"
                >
                  {VIDEO_CODECS.map(codec => (
                    <option key={codec.value} value={codec.value}>
                      {codec.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Rate Control</label>
                <select
                  value={formData.settings.video?.rateControl || 'crf'}
                  onChange={e => updateSettings('video.rateControl', e.target.value)}
                  className="input"
                >
                  {RATE_CONTROLS.map(rc => (
                    <option key={rc.value} value={rc.value}>
                      {rc.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.settings.video?.rateControl === 'crf' && (
              <div>
                <label className="label">
                  Constant Quality (RF): {formData.settings.video?.crf || 22}
                </label>
                <input
                  type="range"
                  min="0"
                  max="51"
                  step="0.5"
                  value={formData.settings.video?.crf || 22}
                  onChange={e => updateSettings('video.crf', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Smaller size</span>
                  <span>Higher quality</span>
                </div>
              </div>
            )}

            {(formData.settings.video?.rateControl === 'cbr' ||
              formData.settings.video?.rateControl === 'vbr') && (
              <div>
                <label className="label">Target Bitrate (kbps)</label>
                <input
                  type="number"
                  value={formData.settings.video?.bitrate || 1500}
                  onChange={e => updateSettings('video.bitrate', parseInt(e.target.value))}
                  className="input"
                />
              </div>
            )}

            {formData.settings.video?.rateControl === 'cqp' && (
              <div>
                <label className="label">Constant QP: {formData.settings.video?.qp || 22}</label>
                <input
                  type="range"
                  min="0"
                  max="51"
                  value={formData.settings.video?.qp || 22}
                  onChange={e => updateSettings('video.qp', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Encoder Preset</label>
                <select
                  value={formData.settings.video?.preset || 'medium'}
                  onChange={e => updateSettings('video.preset', e.target.value)}
                  className="input"
                >
                  {(formData.settings.video?.codec === 'x265' ? X265_PRESETS : X264_PRESETS).map(
                    preset => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="label">Tune</label>
                <select
                  value={formData.settings.video?.tune || ''}
                  onChange={e => updateSettings('video.tune', e.target.value || null)}
                  className="input"
                >
                  <option value="">None</option>
                  {(formData.settings.video?.codec === 'x265' ? X265_TUNES : X264_TUNES).map(
                    tune => (
                      <option key={tune.value} value={tune.value}>
                        {tune.label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Profile</label>
                <select
                  value={formData.settings.video?.profile || ''}
                  onChange={e => updateSettings('video.profile', e.target.value || null)}
                  className="input"
                >
                  <option value="">Auto</option>
                  {formData.settings.video?.codec === 'x264' ? (
                    <>
                      <option value="baseline">Baseline</option>
                      <option value="main">Main</option>
                      <option value="high">High</option>
                      <option value="high10">High 10</option>
                      <option value="high422">High 4:2:2</option>
                      <option value="high444">High 4:4:4</option>
                    </>
                  ) : formData.settings.video?.codec === 'x265' ? (
                    <>
                      <option value="main">Main</option>
                      <option value="main10">Main 10</option>
                      <option value="mainstillpicture">Main Still Picture</option>
                    </>
                  ) : null}
                </select>
              </div>

              <div>
                <label className="label">Level</label>
                <select
                  value={formData.settings.video?.level || ''}
                  onChange={e => updateSettings('video.level', e.target.value || null)}
                  className="input"
                >
                  <option value="">Auto</option>
                  <option value="1.0">1.0</option>
                  <option value="1.1">1.1</option>
                  <option value="1.2">1.2</option>
                  <option value="1.3">1.3</option>
                  <option value="2.0">2.0</option>
                  <option value="2.1">2.1</option>
                  <option value="2.2">2.2</option>
                  <option value="3.0">3.0</option>
                  <option value="3.1">3.1</option>
                  <option value="3.2">3.2</option>
                  <option value="4.0">4.0</option>
                  <option value="4.1">4.1</option>
                  <option value="4.2">4.2</option>
                  <option value="5.0">5.0</option>
                  <option value="5.1">5.1</option>
                  <option value="5.2">5.2</option>
                  <option value="6.0">6.0</option>
                  <option value="6.1">6.1</option>
                  <option value="6.2">6.2</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Framerate (FPS)</label>
                <select
                  value={formData.settings.video?.framerate || ''}
                  onChange={e => updateSettings('video.framerate', e.target.value || null)}
                  className="input"
                >
                  <option value="">Same as source</option>
                  <option value="23.976">23.976</option>
                  <option value="24">24</option>
                  <option value="25">25</option>
                  <option value="29.97">29.97</option>
                  <option value="30">30</option>
                  <option value="50">50</option>
                  <option value="59.94">59.94</option>
                  <option value="60">60</option>
                </select>
              </div>

              <div>
                <label className="label">Framerate Mode</label>
                <select
                  value={formData.settings.video?.framerateMode || 'cfr'}
                  onChange={e => updateSettings('video.framerateMode', e.target.value)}
                  className="input"
                >
                  <option value="cfr">Constant Framerate</option>
                  <option value="vfr">Variable Framerate</option>
                  <option value="pfr">Peak Framerate</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'dimensions':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Width (px)</label>
                <input
                  type="number"
                  value={formData.settings.dimensions?.width || ''}
                  onChange={e =>
                    updateSettings(
                      'dimensions.width',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="input"
                  placeholder="Auto"
                />
              </div>
              <div>
                <label className="label">Height (px)</label>
                <input
                  type="number"
                  value={formData.settings.dimensions?.height || ''}
                  onChange={e =>
                    updateSettings(
                      'dimensions.height',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="input"
                  placeholder="Auto"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cropEnable"
                  checked={formData.settings.dimensions?.cropping?.enabled}
                  onChange={e => updateSettings('dimensions.cropping.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="cropEnable" className="text-gray-200">
                  Enable Cropping
                </label>
              </div>
              {formData.settings.dimensions?.cropping?.enabled && (
                <div className="pl-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autocrop"
                      checked={formData.settings.dimensions?.cropping?.autocrop}
                      onChange={e =>
                        updateSettings('dimensions.cropping.autocrop', e.target.checked)
                      }
                      className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                    />
                    <label htmlFor="autocrop" className="text-gray-200">
                      Auto Crop
                    </label>
                  </div>
                  {!formData.settings.dimensions?.cropping?.autocrop && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="label">Top</label>
                        <input
                          type="number"
                          value={formData.settings.dimensions?.cropping?.top || 0}
                          onChange={e =>
                            updateSettings('dimensions.cropping.top', parseInt(e.target.value))
                          }
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Bottom</label>
                        <input
                          type="number"
                          value={formData.settings.dimensions?.cropping?.bottom || 0}
                          onChange={e =>
                            updateSettings('dimensions.cropping.bottom', parseInt(e.target.value))
                          }
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Left</label>
                        <input
                          type="number"
                          value={formData.settings.dimensions?.cropping?.left || 0}
                          onChange={e =>
                            updateSettings('dimensions.cropping.left', parseInt(e.target.value))
                          }
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Right</label>
                        <input
                          type="number"
                          value={formData.settings.dimensions?.cropping?.right || 0}
                          onChange={e =>
                            updateSettings('dimensions.cropping.right', parseInt(e.target.value))
                          }
                          className="input"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="keepAspect"
                  checked={formData.settings.dimensions?.scaling?.keepDisplayAspect !== false}
                  onChange={e =>
                    updateSettings('dimensions.scaling.keepDisplayAspect', e.target.checked)
                  }
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="keepAspect" className="text-gray-200">
                  Keep Aspect Ratio
                </label>
              </div>
              <div>
                <label className="label">Modulus</label>
                <select
                  value={formData.settings.dimensions?.scaling?.modulus || 16}
                  onChange={e =>
                    updateSettings('dimensions.scaling.modulus', parseInt(e.target.value))
                  }
                  className="input"
                >
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Audio Codec</label>
                <select
                  value={formData.settings.audio?.default?.codec || 'av_aac'}
                  onChange={e => updateSettings('audio.default.codec', e.target.value)}
                  className="input"
                >
                  {AUDIO_CODECS.map(codec => (
                    <option key={codec.value} value={codec.value}>
                      {codec.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Bitrate (kbps)</label>
                <input
                  type="number"
                  value={formData.settings.audio?.default?.bitrate || 160}
                  onChange={e => updateSettings('audio.default.bitrate', parseInt(e.target.value))}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Mixdown</label>
                <select
                  value={formData.settings.audio?.default?.mixdown || 'stereo'}
                  onChange={e => updateSettings('audio.default.mixdown', e.target.value)}
                  className="input"
                >
                  {MIXDOWN_MODES.map(mode => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Sample Rate</label>
                <select
                  value={formData.settings.audio?.default?.samplerate || ''}
                  onChange={e =>
                    updateSettings(
                      'audio.default.samplerate',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="input"
                >
                  <option value="">Auto</option>
                  {AUDIO_SAMPLERATES.map(sr => (
                    <option key={sr.value} value={sr.value}>
                      {sr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Dynamic Range Compression</label>
              <select
                value={formData.settings.audio?.default?.drc || 'none'}
                onChange={e => updateSettings('audio.default.drc', e.target.value)}
                className="input"
              >
                {DRC_MODES.map(mode => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Gain (dB)</label>
              <input
                type="number"
                step="0.5"
                min="-20"
                max="20"
                value={formData.settings.audio?.default?.gain || 0}
                onChange={e => updateSettings('audio.default.gain', parseFloat(e.target.value))}
                className="input"
              />
            </div>
          </div>
        );

      case 'filters':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="deinterlace"
                  checked={formData.settings.filters?.deinterlace?.enabled}
                  onChange={e => updateSettings('filters.deinterlace.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="deinterlace" className="text-gray-200">
                  Deinterlace
                </label>
              </div>
              {formData.settings.filters?.deinterlace?.enabled && (
                <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.settings.filters?.deinterlace?.mode || 'slower'}
                    onChange={e => updateSettings('filters.deinterlace.mode', e.target.value)}
                    className="input"
                  >
                    <option value="fast">Fast</option>
                    <option value="slow">Slow</option>
                    <option value="slower">Slower</option>
                    <option value="bob">Bob</option>
                  </select>
                  <select
                    value={formData.settings.filters?.deinterlace?.parity || 'auto'}
                    onChange={e => updateSettings('filters.deinterlace.parity', e.target.value)}
                    className="input"
                  >
                    <option value="auto">Auto</option>
                    <option value="tff">Top Field First</option>
                    <option value="bff">Bottom Field First</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="decomb"
                  checked={formData.settings.filters?.decomb?.enabled}
                  onChange={e => updateSettings('filters.decomb.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="decomb" className="text-gray-200">
                  Decomb
                </label>
              </div>
              {formData.settings.filters?.decomb?.enabled && (
                <div className="pl-6">
                  <select
                    value={formData.settings.filters?.decomb?.mode || 'default'}
                    onChange={e => updateSettings('filters.decomb.mode', e.target.value)}
                    className="input"
                  >
                    <option value="default">Default</option>
                    <option value="bob">Bob</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="detelecine"
                  checked={formData.settings.filters?.detelecine?.enabled}
                  onChange={e => updateSettings('filters.detelecine.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="detelecine" className="text-gray-200">
                  Detelecine
                </label>
              </div>
              {formData.settings.filters?.detelecine?.enabled && (
                <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.settings.filters?.detelecine?.pattern || '23.976'}
                    onChange={e => updateSettings('filters.detelecine.pattern', e.target.value)}
                    className="input"
                  >
                    <option value="23.976">23.976</option>
                    <option value="24">24</option>
                    <option value="25">25</option>
                    <option value="29.97">29.97</option>
                    <option value="30">30</option>
                    <option value="custom">Custom</option>
                  </select>
                  <input
                    type="number"
                    value={formData.settings.filters?.detelecine?.startFrame || ''}
                    onChange={e =>
                      updateSettings(
                        'filters.detelecine.startFrame',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="input"
                    placeholder="Start Frame"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="denoise"
                  checked={formData.settings.filters?.denoise?.enabled}
                  onChange={e => updateSettings('filters.denoise.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="denoise" className="text-gray-200">
                  Denoise
                </label>
              </div>
              {formData.settings.filters?.denoise?.enabled && (
                <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.settings.filters?.denoise?.method || 'nlmeans'}
                    onChange={e => updateSettings('filters.denoise.method', e.target.value)}
                    className="input"
                  >
                    <option value="hqdn3d">HQDN3D</option>
                    <option value="nlmeans">NLMeans</option>
                  </select>
                  <select
                    value={formData.settings.filters?.denoise?.preset || 'medium'}
                    onChange={e => updateSettings('filters.denoise.preset', e.target.value)}
                    className="input"
                  >
                    <option value="ultralight">Ultralight</option>
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="strong">Strong</option>
                  </select>
                  <select
                    value={formData.settings.filters?.denoise?.tune || 'none'}
                    onChange={e => updateSettings('filters.denoise.tune', e.target.value)}
                    className="input"
                  >
                    <option value="none">None</option>
                    <option value="film">Film</option>
                    <option value="grain">Grain</option>
                    <option value="psnr">PSNR</option>
                    <option value="ssim">SSIM</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="deblock"
                  checked={formData.settings.filters?.deblock?.enabled}
                  onChange={e => updateSettings('filters.deblock.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="deblock" className="text-gray-200">
                  Deblock
                </label>
              </div>
              {formData.settings.filters?.deblock?.enabled && (
                <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Strength</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.settings.filters?.deblock?.strength || 4}
                      onChange={e =>
                        updateSettings('filters.deblock.strength', parseInt(e.target.value))
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Threshold</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.settings.filters?.deblock?.threshold || 4}
                      onChange={e =>
                        updateSettings('filters.deblock.threshold', parseInt(e.target.value))
                      }
                      className="input"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sharpen"
                  checked={formData.settings.filters?.sharpen?.enabled}
                  onChange={e => updateSettings('filters.sharpen.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="sharpen" className="text-gray-200">
                  Sharpen
                </label>
              </div>
              {formData.settings.filters?.sharpen?.enabled && (
                <div className="pl-6">
                  <select
                    value={formData.settings.filters?.sharpen?.method || 'unsharp'}
                    onChange={e => updateSettings('filters.sharpen.method', e.target.value)}
                    className="input"
                  >
                    <option value="unsharp">Unsharp Mask</option>
                    <option value="lapsharp">Laplace</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="chromaSmooth"
                  checked={formData.settings.filters?.chromaSmooth?.enabled}
                  onChange={e => updateSettings('filters.chromaSmooth.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="chromaSmooth" className="text-gray-200">
                  Chroma Smooth
                </label>
              </div>
              {formData.settings.filters?.chromaSmooth?.enabled && (
                <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">TU Size</label>
                    <input
                      type="number"
                      min="2"
                      max="6"
                      value={formData.settings.filters?.chromaSmooth?.tuSize || 2}
                      onChange={e =>
                        updateSettings('filters.chromaSmooth.tuSize', parseInt(e.target.value))
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Strength</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.settings.filters?.chromaSmooth?.strength || 2}
                      onChange={e =>
                        updateSettings('filters.chromaSmooth.strength', parseInt(e.target.value))
                      }
                      className="input"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="colorspace"
                  checked={formData.settings.filters?.colorspace?.enabled}
                  onChange={e => updateSettings('filters.colorspace.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="colorspace" className="text-gray-200">
                  Color Space
                </label>
              </div>
              {formData.settings.filters?.colorspace?.enabled && (
                <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={formData.settings.filters?.colorspace?.matrix || ''}
                    onChange={e =>
                      updateSettings('filters.colorspace.matrix', e.target.value || null)
                    }
                    className="input"
                  >
                    <option value="">Auto</option>
                    <option value="bt709">BT.709</option>
                    <option value="bt470bg">BT.470 BG</option>
                    <option value="smpte170m">SMPTE 170M</option>
                    <option value="bt2020nc">BT.2020</option>
                  </select>
                  <select
                    value={formData.settings.filters?.colorspace?.range || 'auto'}
                    onChange={e => updateSettings('filters.colorspace.range', e.target.value)}
                    className="input"
                  >
                    <option value="auto">Auto</option>
                    <option value="limited">Limited</option>
                    <option value="full">Full</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rotate"
                  checked={formData.settings.filters?.rotate?.enabled}
                  onChange={e => updateSettings('filters.rotate.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="rotate" className="text-gray-200">
                  Rotate / Flip
                </label>
              </div>
              {formData.settings.filters?.rotate?.enabled && (
                <div className="pl-6 space-y-4">
                  <select
                    value={formData.settings.filters?.rotate?.angle || 0}
                    onChange={e => updateSettings('filters.rotate.angle', parseInt(e.target.value))}
                    className="input"
                  >
                    <option value={0}>0°</option>
                    <option value={90}>90°</option>
                    <option value={180}>180°</option>
                    <option value={270}>270°</option>
                  </select>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hflip"
                        checked={formData.settings.filters?.rotate?.hFlip}
                        onChange={e => updateSettings('filters.rotate.hFlip', e.target.checked)}
                        className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                      />
                      <label htmlFor="hflip" className="text-gray-200">
                        Horizontal Flip
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="vflip"
                        checked={formData.settings.filters?.rotate?.vFlip}
                        onChange={e => updateSettings('filters.rotate.vFlip', e.target.checked)}
                        className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                      />
                      <label htmlFor="vflip" className="text-gray-200">
                        Vertical Flip
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
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="scanForced"
                  checked={formData.settings.subtitles?.scanForced}
                  onChange={e => updateSettings('subtitles.scanForced', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="scanForced" className="text-gray-200">
                  Scan for forced subtitles
                </label>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Subtitle track management coming soon.</p>
          </div>
        );

      case 'chapters':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="chapters"
                  checked={formData.settings.chapters?.enabled !== false}
                  onChange={e => updateSettings('chapters.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="chapters" className="text-gray-200">
                  Include chapter markers
                </label>
              </div>
            </div>
          </div>
        );

      case 'tags':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="tags"
                  checked={formData.settings.tags?.enabled}
                  onChange={e => updateSettings('tags.enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                />
                <label htmlFor="tags" className="text-gray-200">
                  Include metadata tags
                </label>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Tag management coming soon.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">转码预设</h1>
          <p className="text-gray-400 mt-1">管理和创建转码预设方案</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary inline-flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>创建预设</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presets.map(preset => (
            <div key={preset.id} className="card hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {preset.isBuiltIn && <Star className="w-5 h-5 text-warning" />}
                  <h3 className="text-lg font-semibold text-white">{preset.name}</h3>
                </div>
                <span className="text-xs text-gray-400 uppercase">{preset.settings.format}</span>
              </div>

              <p className="text-sm text-gray-400 mb-4">{preset.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Video</span>
                  <span className="text-white">{getCodecLabel(preset.settings.video?.codec)}</span>
                </div>
                {preset.settings.video?.crf !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Quality (CRF)</span>
                    <span className="text-white">{preset.settings.video.crf}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Audio</span>
                  <span className="text-white">
                    {getCodecLabel(preset.settings.audio?.default?.codec)}
                  </span>
                </div>
                {preset.settings.audio?.default?.bitrate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Audio Bitrate</span>
                    <span className="text-white">{preset.settings.audio.default.bitrate} kbps</span>
                  </div>
                )}
              </div>

              {!preset.isBuiltIn && (
                <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-dark-700">
                  <button
                    onClick={() => handleEdit(preset)}
                    className="btn btn-secondary flex-1 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="ml-2">编辑</span>
                  </button>
                  <button
                    onClick={() => handleDelete(preset.id)}
                    className="btn btn-danger text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingPreset ? '编辑预设' : '创建预设'}
                </h2>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <div className="bg-dark-900 border-b md:border-b-0 md:border-r border-dark-700 p-4 md:w-48 shrink-0">
                <nav className="space-y-1">
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
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">预设名称</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                        placeholder="输入预设名称"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">描述</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="input"
                        placeholder="输入预设描述"
                      />
                    </div>
                  </div>

                  <div className="border-t border-dark-700 pt-6">
                    <TabContent tab={activeTab} />
                  </div>
                </div>

                <div className="p-6 border-t border-dark-700 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingPreset ? '保存' : '创建'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Presets;
