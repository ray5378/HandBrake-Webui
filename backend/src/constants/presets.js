/**
 * HandBrake 预设常量定义 - 对标标准 HandBrake 预设
 */

// 输出格式
const FORMATS = ['mp4', 'mkv', 'webm'];

// 视频编码器
const VIDEO_CODECS = [
  { value: 'x264', label: 'H.264 (x264)' },
  { value: 'x264_10bit', label: 'H.264 10-bit (x264)' },
  { value: 'x265', label: 'H.265/HEVC (x265)' },
  { value: 'x265_10bit', label: 'H.265/HEVC 10-bit (x265)' },
  { value: 'x265_12bit', label: 'H.265/HEVC 12-bit (x265)' },
  { value: 'svt-av1', label: 'AV1 (SVT-AV1)' },
  { value: 'svt-av1_10bit', label: 'AV1 10-bit (SVT-AV1)' },
  { value: 'vp9', label: 'VP9' },
  { value: 'vp9_10bit', label: 'VP9 10-bit' },
  { value: 'mpeg4', label: 'MPEG-4' },
  { value: 'mpeg2', label: 'MPEG-2' },
  { value: 'ffv1', label: 'FFV1' },
  // Intel QSV
  { value: 'qsv_h264', label: 'H.264 (Intel QSV)' },
  { value: 'qsv_h265', label: 'H.265/HEVC (Intel QSV)' },
  { value: 'qsv_h265_10bit', label: 'H.265/HEVC 10-bit (Intel QSV)' },
  // NVIDIA NVENC
  { value: 'nvenc_h264', label: 'H.264 (NVENC)' },
  { value: 'nvenc_h265', label: 'H.265/HEVC (NVENC)' },
  // AMD VCE
  { value: 'vce_h264', label: 'H.264 (VCE)' },
  { value: 'vce_h265', label: 'H.265/HEVC (VCE)' }
];

// 视频编码器预设
const X264_PRESETS = [
  { value: 'ultrafast', label: 'Ultrafast' },
  { value: 'superfast', label: 'Superfast' },
  { value: 'veryfast', label: 'Veryfast' },
  { value: 'faster', label: 'Faster' },
  { value: 'fast', label: 'Fast' },
  { value: 'medium', label: 'Medium' },
  { value: 'slow', label: 'Slow' },
  { value: 'slower', label: 'Slower' },
  { value: 'veryslow', label: 'Veryslow' },
  { value: 'placebo', label: 'Placebo' }
];

const X265_PRESETS = [
  { value: 'ultrafast', label: 'Ultrafast' },
  { value: 'superfast', label: 'Superfast' },
  { value: 'veryfast', label: 'Veryfast' },
  { value: 'faster', label: 'Faster' },
  { value: 'fast', label: 'Fast' },
  { value: 'medium', label: 'Medium' },
  { value: 'slow', label: 'Slow' },
  { value: 'slower', label: 'Slower' },
  { value: 'veryslow', label: 'Veryslow' },
  { value: 'placebo', label: 'Placebo' }
];

const QSV_PRESETS = [
  { value: 'speed', label: 'Speed' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'quality', label: 'Quality' }
];

const NVENC_PRESETS = [
  { value: 'fast', label: 'Fast' },
  { value: 'medium', label: 'Medium' },
  { value: 'slow', label: 'Slow' }
];

const VCE_PRESETS = [
  { value: 'speed', label: 'Speed' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'quality', label: 'Quality' }
];

// 视频调优
const X264_TUNES = [
  { value: 'film', label: 'Film' },
  { value: 'animation', label: 'Animation' },
  { value: 'grain', label: 'Grain' },
  { value: 'stillimage', label: 'Still Image' },
  { value: 'psnr', label: 'PSNR' },
  { value: 'ssim', label: 'SSIM' },
  { value: 'fastdecode', label: 'Fast Decode' },
  { value: 'zerolatency', label: 'Zero Latency' }
];

const X265_TUNES = [
  { value: 'film', label: 'Film' },
  { value: 'animation', label: 'Animation' },
  { value: 'grain', label: 'Grain' },
  { value: 'stillimage', label: 'Still Image' },
  { value: 'psnr', label: 'PSNR' },
  { value: 'ssim', label: 'SSIM' },
  { value: 'fastdecode', label: 'Fast Decode' },
  { value: 'zerolatency', label: 'Zero Latency' }
];

// 视频编码方式
const RATE_CONTROLS = [
  { value: 'crf', label: '恒定质量 (CRF)' },
  { value: 'cbr', label: '恒定码率 (CBR)' },
  { value: 'vbr', label: '可变码率 (VBR)' },
  { value: 'cqp', label: '恒定量化参数 (CQP)' },
  { value: 'icq', label: 'Intel QSV ICQ' },
  { value: 'cq', label: 'SVT-AV1 CQ' }
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
  { value: 8000, label: '8 kHz' },
  { value: 11025, label: '11.025 kHz' },
  { value: 12000, label: '12 kHz' },
  { value: 16000, label: '16 kHz' },
  { value: 22050, label: '22.05 kHz' },
  { value: 24000, label: '24 kHz' },
  { value: 32000, label: '32 kHz' },
  { value: 44100, label: '44.1 kHz' },
  { value: 48000, label: '48 kHz' },
  { value: 64000, label: '64 kHz' },
  { value: 88200, label: '88.2 kHz' },
  { value: 96000, label: '96 kHz' }
];

// 音频质量等级
const AUDIO_QUALITY = [0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];

// 混合声道
const MIXDOWN_MODES = [
  { value: 'none', label: '自动' },
  { value: 'mono', label: '单声道' },
  { value: 'stereo', label: '立体声' },
  { value: 'dpl2', label: 'Dolby Pro Logic II' },
  { value: '5.1', label: '5.1 声道' },
  { value: '7.1', label: '7.1 声道' }
];

// DRC 模式
const DRC_MODES = [
  { value: 'none', label: '无' },
  { value: 'light', label: '轻度' },
  { value: 'medium', label: '中等' },
  { value: 'heavy', label: '重度' }
];

// 字幕编码
const SUBTITLE_CODECS = [
  { value: 'copy', label: '复制' },
  { value: 'srt', label: 'SRT' },
  { value: 'ssa', label: 'SSA' },
  { value: 'pgs', label: 'PGS' },
  { value: 'vobsub', label: 'VobSub' }
];

// 容器优化
const OPTIMIZE_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'fast-start', label: '快速启动 (Web优化)' },
  { value: 'fragmented', label: '分片' }
];

// 色彩范围
const COLOR_RANGES = [
  { value: 'auto', label: '自动' },
  { value: 'limited', label: '有限 (16-235)' },
  { value: 'full', label: '完整 (0-255)' }
];

// 分辨率限制预设
const RESOLUTION_LIMITS = [
  { value: '', label: '无限制' },
  { value: '4320p', label: '4320p 8K 超高清' },
  { value: '2160p', label: '2160p 4K 超高清' },
  { value: '1440p', label: '1440p 2.5K 四倍高清' },
  { value: '1080p', label: '1080p 全高清' },
  { value: '720p', label: '720p 高清' },
  { value: '576p', label: '576p PAL' },
  { value: '480p', label: '480p NTSC' },
  { value: '360p', label: '360p' },
  { value: '240p', label: '240p' }
];

// 变形模式
const ANAMORPHIC_MODES = [
  { value: 'auto', label: '自动' },
  { value: 'none', label: '无' },
  { value: 'strict', label: '严格' },
  { value: 'loose', label: '宽松' },
  { value: 'custom', label: '自定义' }
];

// 帧率选项
const FRAMERATES = [
  { value: null, label: '与源视频相同' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 12, label: '12' },
  { value: 15, label: '15' },
  { value: 20, label: '20' },
  { value: 23.976, label: '23.976 (NTSC 电影)' },
  { value: 24, label: '24' },
  { value: 25, label: '25 (PAL)' },
  { value: 29.97, label: '29.97 (NTSC)' },
  { value: 30, label: '30' },
  { value: 48, label: '48' },
  { value: 50, label: '50' },
  { value: 59.94, label: '59.94' },
  { value: 60, label: '60' },
  { value: 72, label: '72' },
  { value: 75, label: '75' },
  { value: 90, label: '90' },
  { value: 100, label: '100' },
  { value: 120, label: '120' }
];

// 获取编码器特定的码率控制配置
const getRateControlForCodec = codec => {
  if (!codec) {
    return { type: 'crf', label: '恒定质量 (RF)', default: 22, min: 0, max: 51 };
  }

  const codecLower = codec.toLowerCase();

  if (codecLower.includes('qsv')) {
    return { type: 'icq', label: '恒定质量 (ICQ)', default: 22, min: 0, max: 51 };
  }

  if (codecLower.includes('nvenc')) {
    return { type: 'cqp', label: '恒定质量 (CQP)', default: 22, min: 0, max: 51 };
  }

  if (codecLower.includes('svt-av1')) {
    return { type: 'cq', label: '恒定质量 (CQ)', default: 30, min: 0, max: 63 };
  }

  if (codecLower.includes('vp9')) {
    return { type: 'crf', label: '恒定质量 (CRF)', default: 31, min: 0, max: 63 };
  }

  return { type: 'crf', label: '恒定质量 (RF)', default: 22, min: 0, max: 51 };
};

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
      icq: 22,
      cqp: 22,
      cq: 30,
      bitrate: null,
      quality: null,
      preset: 'medium',
      tune: null,
      profile: null,
      level: null,
      colorRange: 'auto',
      multiPass: false,
      useAdvancedOptions: false,
      advancedOptions: null
    },
    dimensions: {
      width: null,
      height: null,
      displayWidth: null,
      displayHeight: null,
      resolutionLimit: '',
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
        pixelAspectX: 1,
        pixelAspectY: 1,
        keepDisplayAspect: true,
        modulus: 16,
        pixelAspect: null,
        bestSize: false,
        allowUpscaling: false
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
      values: {
        title: '',
        actor: '',
        director: '',
        date: '',
        genre: '',
        description: '',
        plot: ''
      }
    }
  };
}

// 获取标准 HandBrake 预设列表
function getFullDefaultPresets() {
  const uuidv4 = require('uuid').v4;

  return [
    {
      id: uuidv4(),
      name: 'Very Fast 1080p30',
      description: '快速转码，适合分享和流媒体',
      isBuiltIn: true,
      category: 'General',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 22,
          preset: 'veryfast',
          tune: 'fastdecode',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'Fast 1080p30',
      description: '快速转码 1080p 视频',
      isBuiltIn: true,
      category: 'General',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 22,
          preset: 'fast',
          tune: 'film',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'HQ 1080p30 Surround',
      description: '高质量 1080p 转码，带环绕声',
      isBuiltIn: true,
      category: 'General',
      settings: JSON.stringify({
        format: 'mkv',
        optimize: 'none',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 20,
          preset: 'slow',
          tune: 'film',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: '5.1',
            bitrate: 384
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'Fast 720p30',
      description: '快速 720p 转码，适合移动设备',
      isBuiltIn: true,
      category: 'General',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 23,
          preset: 'veryfast',
          tune: 'fastdecode',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1280,
          height: 720,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 128
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'HQ 480p30',
      description: '高质量 SD 转码',
      isBuiltIn: true,
      category: 'General',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 20,
          preset: 'medium',
          tune: 'film',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 720,
          height: 480,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'YouTube 1080p30',
      description: '优化用于 YouTube 的 1080p 视频',
      isBuiltIn: true,
      category: 'Web',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 18,
          preset: 'slow',
          tune: 'film',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 256
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'Vimeo 1080p30',
      description: '优化用于 Vimeo 的 1080p 视频',
      isBuiltIn: true,
      category: 'Web',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 16,
          preset: 'veryslow',
          tune: 'film',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 320
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'H.265 MKV 1080p30',
      description: 'H.265 编码，更高压缩率',
      isBuiltIn: true,
      category: 'Matroska',
      settings: JSON.stringify({
        format: 'mkv',
        optimize: 'none',
        video: {
          codec: 'x265',
          rateControl: 'crf',
          crf: 22,
          preset: 'medium',
          tune: 'film',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'H.265 MKV 2160p60',
      description: '4K H.265 编码，高质量',
      isBuiltIn: true,
      category: 'Matroska',
      settings: JSON.stringify({
        format: 'mkv',
        optimize: 'none',
        video: {
          codec: 'x265_10bit',
          rateControl: 'crf',
          crf: 22,
          preset: 'slow',
          tune: 'film',
          framerate: 60,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 3840,
          height: 2160,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'flac16',
            mixdown: '5.1'
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'VP9 MKV 1080p30',
      description: 'VP9 编码，适合开源媒体',
      isBuiltIn: true,
      category: 'Matroska',
      settings: JSON.stringify({
        format: 'webm',
        optimize: 'none',
        video: {
          codec: 'vp9',
          rateControl: 'crf',
          crf: 30,
          preset: 'medium',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'opus',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'AV1 MKV 1080p30',
      description: 'AV1 编码，最高压缩率',
      isBuiltIn: true,
      category: 'Matroska',
      settings: JSON.stringify({
        format: 'mkv',
        optimize: 'none',
        video: {
          codec: 'svt-av1',
          rateControl: 'cq',
          cq: 30,
          preset: 'medium',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'opus',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'Production Max',
      description: '最高质量，最慢编码，适合存档',
      isBuiltIn: true,
      category: 'Production',
      settings: JSON.stringify({
        format: 'mkv',
        optimize: 'none',
        video: {
          codec: 'x264',
          rateControl: 'crf',
          crf: 18,
          preset: 'veryslow',
          tune: 'film',
          framerateMode: 'cfr'
        },
        audio: {
          default: {
            codec: 'flac16',
            mixdown: 'none'
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'H.265 Intel QSV 1080p30',
      description: 'Intel QSV 硬件加速 H.265 转码',
      isBuiltIn: true,
      category: 'Hardware',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'qsv_h265',
          rateControl: 'icq',
          icq: 22,
          preset: 'balanced',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'H.264 Intel QSV 1080p30',
      description: 'Intel QSV 硬件加速 H.264 转码',
      isBuiltIn: true,
      category: 'Hardware',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'qsv_h264',
          rateControl: 'icq',
          icq: 22,
          preset: 'balanced',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: { enabled: true }
      })
    },
    {
      id: uuidv4(),
      name: 'H.265 NVENC 1080p30',
      description: 'NVIDIA NVENC 硬件加速 H.265 转码',
      isBuiltIn: true,
      category: 'Hardware',
      settings: JSON.stringify({
        format: 'mp4',
        optimize: 'fast-start',
        video: {
          codec: 'nvenc_h265',
          rateControl: 'cqp',
          cqp: 22,
          preset: 'medium',
          framerate: 30,
          framerateMode: 'cfr'
        },
        dimensions: {
          width: 1920,
          height: 1080,
          scaling: {
            keepDisplayAspect: true,
            modulus: 16
          }
        },
        audio: {
          default: {
            codec: 'av_aac',
            mixdown: 'stereo',
            bitrate: 160
          }
        },
        chapters: { enabled: true }
      })
    }
  ];
}

module.exports = {
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
  CHROMA_SUBSAMPLING,
  AUDIO_CODECS,
  AUDIO_SAMPLERATES,
  AUDIO_QUALITY,
  MIXDOWN_MODES,
  DRC_MODES,
  SUBTITLE_CODECS,
  OPTIMIZE_OPTIONS,
  COLOR_RANGES,
  RESOLUTION_LIMITS,
  ANAMORPHIC_MODES,
  FRAMERATES,
  getRateControlForCodec,
  getDefaultPresetSettings,
  getFullDefaultPresets
};
