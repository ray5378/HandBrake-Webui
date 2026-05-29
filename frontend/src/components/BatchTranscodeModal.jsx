import React, { useState, useEffect } from 'react';
import { X, Video, Settings, Loader2, CheckCircle, FolderOpen } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

function BatchTranscodeModal({ directory, onClose, onSuccess }) {
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [outputDirectory, setOutputDirectory] = useState('/output');
  const [customSettings, setCustomSettings] = useState(false);
  const [settings, setSettings] = useState({
    crf: 23,
    audioBitrate: 128,
    audioChannels: 2
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [directories, setDirectories] = useState([]);
  const [loadingDirs, setLoadingDirs] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [presetsRes, filesRes] = await Promise.all([
        api.get('/presets'),
        api.get('/files', { params: { directory: '/output' } })
      ]);

      setPresets(presetsRes.data.data.presets);
      setDirectories(filesRes.data.data.directories);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoadingDirs(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!outputDirectory) {
      setError('请选择输出目录');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/jobs/batch', {
        sourceDirectory: directory,
        outputDirectory,
        presetId: selectedPreset || undefined,
        customSettings: customSettings ? settings : undefined
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <Video className="w-6 h-6" />
              <span>批量转码</span>
            </h2>
            <p className="text-gray-400 mt-1">源目录: {directory}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">任务已提交!</h3>
            <p className="text-gray-400">正在跳转到任务列表...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 text-error">
                <X className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-dark-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
                <FolderOpen className="w-5 h-5" />
                <span>输出设置</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="label">输出目录</label>
                  <input
                    type="text"
                    value={outputDirectory}
                    onChange={e => setOutputDirectory(e.target.value)}
                    className="input"
                    placeholder="例如: /output/converted"
                  />
                </div>

                <div>
                  <label className="label mb-2">选择预设</label>
                  {presets.length > 0 ? (
                    <select
                      value={selectedPreset}
                      onChange={e => setSelectedPreset(e.target.value)}
                      className="input"
                    >
                      <option value="">不使用预设</option>
                      {presets.map(preset => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} - {preset.description}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-400">暂无预设可用</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="customSettings"
                    checked={customSettings}
                    onChange={e => setCustomSettings(e.target.checked)}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-primary focus:ring-primary"
                  />
                  <label htmlFor="customSettings" className="text-sm text-gray-300">
                    使用自定义设置
                  </label>
                </div>

                {customSettings && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-dark-600 rounded-lg">
                    <div>
                      <label className="label">CRF (质量)</label>
                      <input
                        type="number"
                        min="0"
                        max="51"
                        value={settings.crf}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            crf: parseInt(e.target.value)
                          })
                        }
                        className="input"
                      />
                      <p className="text-xs text-gray-400 mt-1">0=最佳质量, 51=最小体积</p>
                    </div>

                    <div>
                      <label className="label">音频码率 (kbps)</label>
                      <input
                        type="number"
                        value={settings.audioBitrate}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            audioBitrate: parseInt(e.target.value)
                          })
                        }
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">音频声道</label>
                      <select
                        value={settings.audioChannels}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            audioChannels: parseInt(e.target.value)
                          })
                        }
                        className="input"
                      >
                        <option value="2">立体声</option>
                        <option value="6">5.1 环绕</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-dark-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">说明</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• 递归扫描源目录中的所有视频文件</li>
                <li>• 保持原始目录结构</li>
                <li>• 转码后的文件保持原文件名，仅扩展名改为容器格式</li>
                <li>• 所有任务会自动加入队列处理</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>提交中...</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
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
