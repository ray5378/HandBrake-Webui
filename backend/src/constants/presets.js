/**
 * HandBrake 预设常量定义
 */

// 输出格式
const FORMATS = ['mp4', 'mkv', 'webm'];

// 视频编码器
const VIDEO_CODECS = [
  { value: 'x264', label: 'H.264 (x264)' },
  { value: 'x265', label: 'H.265/HEVC (x265)' },
  { value: 'svt-av1', label: 'AV1 (SVT-AV1)' },
  { value: 'vp9', label: 'VP9' }
];

// 视频编码器预设
const X264_PRESETS = [
  'ultrafast',
  'superfast',
  'veryfast',
  'faster',
  'fast',
  'medium',
  'slow',
  'slower',
  'veryslow',
  'placebo'
];

const X265_PRESETS = [
  'ultrafast',
  'superfast',
  'veryfast',
  'faster',
  'fast',
  'medium',
  'slow',
  'slower',
  'veryslow',
  'placebo'
];

// 视频调优
const X264_TUNES = [
  'film',
  'animation',
  'grain',
  'stillimage',
  'psnr',
  'ssim',
  'fastdecode',
  'zerolatency'
];

const X265_TUNES = [
  'film',
  'animation',
  'grain',
  'stillimage',
  'psnr',
  'ssim',
  'fastdecode',
  'zerolatency'
];

// 视频编码方式
const RATE_CONTROLS = [
  { value: 'crf', label: '恒定质量 (CRF)' },
  { value: 'cbr', label: '恒定码率 (CBR)' },
  { value: 'vbr', label: '可变码率 (VBR)' },
  { value: 'cqp', label: '恒定量化参数 (CQP)' }
];

// 色度子采样
const CHROMA_SUBSAMPLING = ['4:2:0', '4:2:2', '4:4:4'];

// 音频编码器
const AUDIO_CODECS = [
  { value: 'ca_aac', label: 'AAC (CoreAudio)' },
  { value: 'av_aac', label: 'AAC (libavcodec)' },
  { value: 'mp3', label: 'MP3 (lame)' },
  { value: 'opus', label: 'Opus' },
  { value: 'vorbis', label: 'Vorbis' },
  { value: 'ac3', label: 'AC3' },
  { value: 'eac3', label: 'EAC3' },
  { value: 'flac16', label: 'FLAC 16-bit' },
  { value: 'flac24', label: 'FLAC 24-bit' },
  { value: 'copy', label: '直通' }
];

// 音频采样率
const AUDIO_SAMPLERATES = [
  8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000, 64000, 88200, 96000
];

// 音频质量等级
const AUDIO_QUALITY = [0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];

// 混合声道
const MIXDOWN_MODES = ['none', 'mono', 'stereo', 'dpl2', '5.1', '7.1'];

// DRC 模式
const DRC_MODES = ['none', 'light', 'medium', 'heavy'];

// 字幕编码
const SUBTITLE_CODECS = ['copy', 'srt', 'ssa', 'pgs', 'vobsub', 'pgs'];

// 容器优化
const OPTIMIZE_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'fast-start', label: '快速启动 (Web优化)' },
  { value: 'fragmented', label: '分片' }
];

// 获取默认预设设置
function getDefaultPresetSettings() {
  return {
    format: 'mp4',
    optimize: 'none',
    summary: {
      source: null,
      destination: null,
      title: null
    },
    video: {
      codec: 'x264',
      framerate: null,
      framerateMode: 'cfr',
      peakFrameRate: null,
      rateControl: 'crf',
      crf: 22,
      qp: null,
      bitrate: null,
      quality: null,
      preset: 'medium',
      tune: null,
      profile: null,
      level: null,
      useAdvancedOptions: false,
      advancedOptions: null
    },
    dimensions: {
      width: null,
      height: null,
      displayWidth: null,
      displayHeight: null,
      cropping: {
        enabled: false,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        autocrop: true
      },
      scaling: {
        mode: 'auto',
        algorithm: 'lanczos',
        anamorphic: 'auto',
        keepDisplayAspect: true,
        modulus: 16,
        pixelAspect: null
      },
      interlaceDetect: false,
      combDetect: 'default',
      deinterlace: false,
      decomb: false,
      decomboff: false,
      detelecine: false,
      colorspace: null
    },
    filters: {
      deinterlace: {
        enabled: false,
        mode: 'slower',
        parity: 'auto'
      },
      decomb: {
        enabled: false,
        mode: 'default'
      },
      detelecine: {
        enabled: false,
        mode: 'default',
        pattern: '23.976',
        framerate: null,
        startFrame: null
      },
      deblock: {
        enabled: false,
        strength: 4,
        threshold: 4
      },
      denoise: {
        enabled: false,
        method: 'nlmeans',
        tune: 'none',
        strength: 'medium',
        preset: 'medium',
        hqdn3d: {
          lightSpatial: 4,
          lightTemporal: 6,
          heavySpatial: 6,
          heavyTemporal: 16
        },
        nlmeans: {
          strength: null,
          chromaStrength: null,
          yOriginTune: null,
          cOriginTune: null,
          ySpatialTune: null,
          cSpatialTune: null
        }
      },
      sharpen: {
        enabled: false,
        method: 'unsharp',
        lapsharp: {
          sigma: 0.5
        },
        unsharp: {
          lumaMatrix: '5:5:1.0',
          chromaMatrix: '5:5:0.0'
        }
      },
      chromaSmooth: {
        enabled: false,
        tuSize: 2,
        strength: 2
      },
      colorspace: {
        enabled: false,
        matrix: null,
        primaries: null,
        transfer: null,
        range: 'auto'
      },
      rotate: {
        enabled: false,
        angle: 0,
        hFlip: false,
        vFlip: false
      },
      pad: {
        enabled: false,
        mode: 'none',
        color: 'black',
        width: null,
        height: null,
        x: null,
        y: null
      }
    },
    audio: {
      tracks: [],
      default: {
        codec: 'av_aac',
        bitrate: 160,
        samplerate: null,
        mixdown: 'stereo',
        drc: 'none',
        gain: 0,
        normalizeMixLevel: false
      }
    },
    subtitles: {
      tracks: [],
      default: {
        codec: 'copy',
        burn: false,
        default: false,
        forced: false
      },
      scanForced: false,
      importSrt: null
    },
    chapters: {
      enabled: true,
      useChapterMarkers: true,
      chapterNames: null
    },
    tags: {
      enabled: false,
      values: {}
    }
  };
}

// 获取默认预设列表
function getFullDefaultPresets() {
  const uuidv4 = require('uuid').v4;

  return [
    {
      id: uuidv4(),
      name: 'Fast 1080p30',
      description: '快速转码 1080p 视频，适合分享',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 22,
          preset: 'veryfast',
          tune: 'film'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          keepDisplayAspect: true
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: {
          enabled: true
        }
      })
    },
    {
      id: uuidv4(),
      name: 'HQ 1080p30 Surround',
      description: '高质量 1080p 转码，带环绕声',
      settings: JSON.stringify({
        format: 'mkv',
        optimize: 'none',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 20,
          preset: 'slow',
          tune: 'film'
        },
        dimensions: {
          width: 1920,
          height: 1080
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: '5.1',
            bitrate: 384
          }
        },
        chapters: {
          enabled: true
        }
      })
    },
    {
      id: uuidv4(),
      name: 'Fast 720p30',
      description: '快速 720p 转码，适合移动设备',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 23,
          preset: 'veryfast',
          tune: 'fastdecode'
        },
        dimensions: {
          width: 1280,
          height: 720
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 128
          }
        },
        chapters: {
          enabled: true
        }
      })
    },
    {
      id: uuidv4(),
      name: 'HQ 480p30',
      description: '高质量 SD 转码',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 20,
          preset: 'medium',
          tune: 'film'
        },
        dimensions: {
          width: 720,
          height: 480
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: {
          enabled: true
        }
      })
    },
    {
      id: uuidv4(),
      name: 'H.265 MKV 1080p30',
      description: 'H.265 编码，更高压缩率',
      settings: JSON.stringify({
        format: 'mkv',
        optimize: 'none',
        video: {
          codec: 'x265',
          rateControl: 'crf',
          crf: 22,
          preset: 'medium',
          tune: 'film'
        },
        dimensions: {
          width: 1920,
          height: 1080
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: {
          enabled: true
        }
      })
    },
    {
      id: uuidv4(),
      name: 'VP9 MKV 1080p30',
      description: 'VP9 编码，适合开源媒体',
      settings: JSON.stringify({
        format: 'webm',
        optimize: 'none',
        video: {
          codec: 'vp9',
          rateControl: 'crf',
          crf: 30,
          preset: 'medium'
        },
        dimensions: {
          width: 1920,
          height: 1080
        },
        audio: {
          default: {
            codec: 'opus',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: {
          enabled: true
        }
      })
    },
    {
      id: uuidv4(),
      name: 'Production Max',
      description: '最高质量，最慢编码，适合存档',
      settings: JSON.stringify({
        format: 'mkv',
        optimize: 'none',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 18,
          preset: 'veryslow',
          tune: 'film'
        },
        audio: {
          default: {
            codec: 'flac16',
            mixdown: 'none'
          }
        },
        chapters: {
          enabled: true
        }
      })
    },
    {
      id: uuidv4(),
      name: 'Super HQ 1080p30 Surround',
      description: '超级高质量 1080p 转码',
      settings: JSON.stringify({
        format: 'mkv',
        optimize: 'none',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 18,
          preset: 'slow',
          tune: 'film'
        },
        dimensions: {
          width: 1920,
          height: 1080
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: '5.1',
            bitrate: 448
          }
        },
        chapters: {
          enabled: true
        }
      })
    }
  ];
}

module.exports = {
  FORMATS,
  VIDEO_CODECS,
  X264_PRESETS,
  X265_PRESETS,
  X264_TUNES,
  X265_TUNES,
  RATE_CONTROLS,
  CHROMA_SUBSAMPLING,
  AUDIO_CODECS,
  AUDIO_SAMPLERATES,
  AUDIO_QUALITY,
  MIXDOWN_MODES,
  DRC_MODES,
  SUBTITLE_CODECS,
  OPTIMIZE_OPTIONS,
  getDefaultPresetSettings,
  getFullDefaultPresets
};
