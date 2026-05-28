import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, FolderOpen, Loader2, CheckCircle, Settings, AlertCircle } from 'lucide-react';
import api from '../services/api';
import clsx from 'clsx';

function Transcode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [files, setFiles] = useState([]);
  const [presets, setPresets] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [outputName, setOutputName] = useState('');
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
    const fileParam = searchParams.get('file');
    if (fileParam) {
      setSelectedFile(fileParam);
      const fileName = fileParam.split('/').pop().split('.')[0];
      setOutputName(`${fileName}_encoded`);
    }

    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [filesRes, presetsRes] = await Promise.all([api.get('/files'), api.get('/presets')]);

      setFiles(filesRes.data.data.files);
      setPresets(presetsRes.data.data.presets);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!selectedFile) {
      setError('请选择源文件');
      return;
    }

    if (!outputName) {
      setError('请输入输出文件名');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const sourceFile = selectedFile;
      const extension = selectedFile.split('.').pop();
      const outputFile = `/output/${outputName}.${extension}`;

      const preset = presets.find(p => p.id === selectedPreset);
      const format = preset?.settings?.format || 'mp4';
      const finalOutputFile = outputFile.replace(`.${extension}`, `.${format}`);

      await api.post('/jobs', {
        sourceFile,
        outputFile: finalOutputFile,
        presetId: selectedPreset || undefined,
        customSettings: customSettings ? settings : undefined
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/jobs');
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.error || '提交任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">视频转码</h1>
        <p className="text-gray-400 mt-1">选择文件并配置转码参数</p>
      </div>

      {success ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">任务已提交!</h2>
          <p className="text-gray-400">正在跳转到任务列表...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 text-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <FolderOpen className="w-5 h-5" />
              <span>选择源文件</span>
            </h2>

            {files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto scrollbar-thin">
                {files.map(file => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => {
                      setSelectedFile(file.path);
                      const fileName = file.path.split('/').pop().split('.')[0];
                      setOutputName(`${fileName}_encoded`);
                    }}
                    className={clsx(
                      'p-4 rounded-lg border text-left transition-all',
                      selectedFile === file.path
                        ? 'border-primary bg-primary/10'
                        : 'border-dark-600 bg-dark-700 hover:border-primary/50'
                    )}
                  >
                    <p className="text-white font-medium truncate mb-1">{file.name}</p>
                    <p className="text-xs text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">暂无文件，请先上传</p>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>转码设置</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">输出文件名</label>
                <input
                  type="text"
                  value={outputName}
                  onChange={e => setOutputName(e.target.value)}
                  className="input"
                  placeholder="输出文件名"
                />
              </div>

              <div>
                <label className="label">选择预设</label>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-dark-700 rounded-lg">
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

          <button
            type="submit"
            disabled={submitting || !selectedFile}
            className="btn btn-primary w-full flex items-center justify-center space-x-2 text-lg py-4"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>提交中...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>开始转码</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default Transcode;
