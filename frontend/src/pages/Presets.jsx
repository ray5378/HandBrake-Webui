import React, { useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

function Presets() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: {
      format: 'mp4',
      video: {
        codec: 'libx264',
        crf: 23,
        preset: 'medium'
      },
      audio: {
        codec: 'aac',
        bitrate: 128,
        channels: 2
      }
    }
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
  
  const handleSubmit = async (e) => {
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
  
  const handleEdit = (preset) => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      description: preset.description,
      settings: preset.settings
    });
    setShowModal(true);
  };
  
  const handleDelete = async (presetId) => {
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
      settings: {
        format: 'mp4',
        video: {
          codec: 'libx264',
          crf: 23,
          preset: 'medium'
        },
        audio: {
          codec: 'aac',
          bitrate: 128,
          channels: 2
        }
      }
    });
  };
  
  const getCodecLabel = (codec) => {
    const labels = {
      libx264: 'H.264',
      libx265: 'H.265/HEVC',
      libvpx-vp9: 'VP9',
      aac: 'AAC',
      libopus: 'Opus'
    };
    return labels[codec] || codec;
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
          {presets.map((preset) => (
            <div key={preset.id} className="card hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {preset.isBuiltIn && (
                    <Star className="w-5 h-5 text-warning" />
                  )}
                  <h3 className="text-lg font-semibold text-white">{preset.name}</h3>
                </div>
                <span className="text-xs text-gray-400 uppercase">
                  {preset.settings.format}
                </span>
              </div>
              
              <p className="text-sm text-gray-400 mb-4">{preset.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">视频编码</span>
                  <span className="text-white">
                    {getCodecLabel(preset.settings.video?.codec)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">质量 (CRF)</span>
                  <span className="text-white">{preset.settings.video?.crf || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">音频编码</span>
                  <span className="text-white">
                    {getCodecLabel(preset.settings.audio?.codec)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">音频码率</span>
                  <span className="text-white">
                    {preset.settings.audio?.bitrate
                      ? `${preset.settings.audio.bitrate} kbps`
                      : '-'}
                  </span>
                </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-700">
              <h2 className="text-2xl font-bold text-white">
                {editingPreset ? '编辑预设' : '创建预设'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="label">预设名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="输入预设描述"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">输出格式</label>
                  <select
                    value={formData.settings.format}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: { ...formData.settings, format: e.target.value }
                      })
                    }
                    className="input"
                  >
                    <option value="mp4">MP4</option>
                    <option value="mkv">MKV</option>
                    <option value="webm">WebM</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">视频编码</label>
                  <select
                    value={formData.settings.video.codec}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          video: { ...formData.settings.video, codec: e.target.value }
                        }
                      })
                    }
                    className="input"
                  >
                    <option value="libx264">H.264</option>
                    <option value="libx265">H.265/HEVC</option>
                    <option value="libvpx-vp9">VP9</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">质量 (CRF)</label>
                  <input
                    type="number"
                    min="0"
                    max="51"
                    value={formData.settings.video.crf}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          video: { ...formData.settings.video, crf: parseInt(e.target.value) }
                        }
                      })
                    }
                    className="input"
                  />
                  <p className="text-xs text-gray-400 mt-1">0=最佳, 51=最小</p>
                </div>
                
                <div>
                  <label className="label">编码预设</label>
                  <select
                    value={formData.settings.video.preset}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          video: { ...formData.settings.video, preset: e.target.value }
                        }
                      })
                    }
                    className="input"
                  >
                    <option value="ultrafast"> ultrafast (最快)</option>
                    <option value="superfast">superfast</option>
                    <option value="veryfast">veryfast</option>
                    <option value="faster">faster</option>
                    <option value="fast">fast</option>
                    <option value="medium">medium (平衡)</option>
                    <option value="slow">slow</option>
                    <option value="slower">slower</option>
                    <option value="veryslow">veryslow (最佳)</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">音频编码</label>
                  <select
                    value={formData.settings.audio.codec}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          audio: { ...formData.settings.audio, codec: e.target.value }
                        }
                      })
                    }
                    className="input"
                  >
                    <option value="aac">AAC</option>
                    <option value="libopus">Opus</option>
                    <option value="mp3">MP3</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">音频码率 (kbps)</label>
                  <input
                    type="number"
                    value={formData.settings.audio.bitrate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          audio: { ...formData.settings.audio, bitrate: parseInt(e.target.value) }
                        }
                      })
                    }
                    className="input"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
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
      )}
    </div>
  );
}

export default Presets;
