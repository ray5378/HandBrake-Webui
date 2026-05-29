/**
 * HandBrake 预设常量定义
 */

// 输出格式
export const FORMATS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mkv', label: 'MKV' },
  { value: 'webm', label: 'WebM' }
];

// 视频编码器
export const VIDEO_CODECS = [
  // 软件编码器
  { value: 'x264', label: 'H.264 (x264)', group: 'software' },
  { value: 'x264_10bit', label: 'H.264 10-bit (x264)', group: 'software' },
  { value: 'x265', label: 'H.265/HEVC (x265)', group: 'software' },
  { value: 'x265_10bit', label: 'H.265/HEVC 10-bit (x265)', group: 'software' },
  { value: 'x265_12bit', label: 'H.265/HEVC 12-bit (x265)', group: 'software' },
  { value: 'svt-av1', label: 'AV1 (SVT-AV1)', group: 'software' },
  { value: 'svt-av1_10bit', label: 'AV1 10-bit (SVT-AV1)', group: 'software' },
  { value: 'vp9', label: 'VP9', group: 'software' },
  { value: 'vp9_10bit', label: 'VP9 10-bit', group: 'software' },
  { value: 'mpeg4', label: 'MPEG-4', group: 'software' },
  { value: 'mpeg2', label: 'MPEG-2', group: 'software' },
  { value: 'ffv1', label: 'FFV1', group: 'software' },
  // Intel QSV 硬件编码
  { value: 'qsv_h264', label: 'H.264 (Intel QSV)', group: 'qsv' },
  { value: 'qsv_h265', label: 'H.265/HEVC (Intel QSV)', group: 'qsv' },
  { value: 'qsv_h265_10bit', label: 'H.265/HEVC 10-bit (Intel QSV)', group: 'qsv' },
  // NVIDIA NVENC 硬件编码
  { value: 'nvenc_h264', label: 'H.264 (NVENC)', group: 'nvenc' },
  { value: 'nvenc_h265', label: 'H.265/HEVC (NVENC)', group: 'nvenc' },
  // AMD VCE 硬件编码
  { value: 'vce_h264', label: 'H.264 (VCE)', group: 'vce' },
  { value: 'vce_h265', label: 'H.265/HEVC (VCE)', group: 'vce' }
];

// 视频编码器预设
export const X264_PRESETS = [
  { value: 'ultrafast', label: 'Ultrafast（极速）' },
  { value: 'superfast', label: 'Superfast（超快）' },
  { value: 'veryfast', label: 'Veryfast（非常快）' },
  { value: 'faster', label: 'Faster（很快）' },
  { value: 'fast', label: 'Fast（快）' },
  { value: 'medium', label: 'Medium（中等）' },
  { value: 'slow', label: 'Slow（慢）' },
  { value: 'slower', label: 'Slower（更慢）' },
  { value: 'veryslow', label: 'Veryslow（非常慢）' },
  { value: 'placebo', label: 'Placebo（极致）' }
];

export const X265_PRESETS = [
  { value: 'ultrafast', label: 'Ultrafast（极速）' },
  { value: 'superfast', label: 'Superfast（超快）' },
  { value: 'veryfast', label: 'Veryfast（非常快）' },
  { value: 'faster', label: 'Faster（很快）' },
  { value: 'fast', label: 'Fast（快）' },
  { value: 'medium', label: 'Medium（中等）' },
  { value: 'slow', label: 'Slow（慢）' },
  { value: 'slower', label: 'Slower（更慢）' },
  { value: 'veryslow', label: 'Veryslow（非常慢）' },
  { value: 'placebo', label: 'Placebo（极致）' }
];

// 硬件编码器预设
export const QSV_PRESETS = [
  { value: 'speed', label: 'Speed（速度优先）' },
  { value: 'balanced', label: 'Balanced（均衡）' },
  { value: 'quality', label: 'Quality（画质优先）' }
];

export const NVENC_PRESETS = [
  { value: 'fast', label: 'Fast（快速）' },
  { value: 'medium', label: 'Medium（中等）' },
  { value: 'slow', label: 'Slow（高质量）' }
];

export const VCE_PRESETS = [
  { value: 'speed', label: 'Speed（速度优先）' },
  { value: 'balanced', label: 'Balanced（均衡）' },
  { value: 'quality', label: 'Quality（画质优先）' }
];

// 视频调优
export const X264_TUNES = [
  { value: 'film', label: 'Film（电影）' },
  { value: 'animation', label: 'Animation（动画）' },
  { value: 'grain', label: 'Grain（颗粒）' },
  { value: 'stillimage', label: 'Still Image（静态影像）' },
  { value: 'psnr', label: 'PSNR（峰值信噪比）' },
  { value: 'ssim', label: 'SSIM（结构相似性）' },
  { value: 'fastdecode', label: 'Fast Decode（快速解码）' },
  { value: 'zerolatency', label: 'Zero Latency（零延迟）' }
];

export const X265_TUNES = [
  { value: 'film', label: 'Film（电影）' },
  { value: 'animation', label: 'Animation（动画）' },
  { value: 'grain', label: 'Grain（颗粒）' },
  { value: 'stillimage', label: 'Still Image（静态影像）' },
  { value: 'psnr', label: 'PSNR（峰值信噪比）' },
  { value: 'ssim', label: 'SSIM（结构相似性）' },
  { value: 'fastdecode', label: 'Fast Decode（快速解码）' },
  { value: 'zerolatency', label: 'Zero Latency（零延迟）' }
];

// 视频编码方式
export const RATE_CONTROLS = [
  { value: 'crf', label: '恒定质量 (CRF)' },
  { value: 'cbr', label: '恒定码率 (CBR)' },
  { value: 'vbr', label: '可变码率 (VBR)' },
  { value: 'cqp', label: '恒定量化参数 (CQP)' }
];

// 音频编码器
export const AUDIO_CODECS = [
  { value: 'copy', label: '直通 (Passthrough)' },
  { value: 'av_aac', label: 'AAC (avcodec)' },
  { value: 'ca_aac', label: 'AAC (CoreAudio)' },
  { value: 'mp3', label: 'MP3 (lame)' },
  { value: 'opus', label: 'Opus' },
  { value: 'vorbis', label: 'Vorbis' },
  { value: 'ac3', label: 'AC3' },
  { value: 'eac3', label: 'EAC3' },
  { value: 'flac16', label: 'FLAC 16-bit' },
  { value: 'flac24', label: 'FLAC 24-bit' }
];

// 音频采样率
export const AUDIO_SAMPLERATES = [
  { value: 8000, label: '8 kHz' },
  { value: 11025, label: '11.025 kHz' },
  { value: 12000, label: '12 kHz' },
  { value: 16000, label: '16 kHz' },
  { value: 22050, label: '22.05 kHz' },
  { value: 24000, label: '24 kHz' },
  { value: 32000, label: '32 kHz' },
  { value: 44100, label: '44.1 kHz（默认）' },
  { value: 48000, label: '48 kHz' },
  { value: 64000, label: '64 kHz' },
  { value: 88200, label: '88.2 kHz' },
  { value: 96000, label: '96 kHz' }
];

// 混合声道
export const MIXDOWN_MODES = [
  { value: 'none', label: '自动' },
  { value: 'mono', label: '单声道' },
  { value: 'stereo', label: '立体声' },
  { value: 'dpl2', label: 'Dolby Pro Logic II' },
  { value: '5.1', label: '5.1 声道' },
  { value: '7.1', label: '7.1 声道' }
];

// DRC 模式
export const DRC_MODES = [
  { value: 'none', label: '无（默认）' },
  { value: 'light', label: '轻度' },
  { value: 'medium', label: '中等' },
  { value: 'heavy', label: '重度' }
];

// 色彩范围
export const COLOR_RANGES = [
  { value: 'auto', label: '自动' },
  { value: 'limited', label: '有限 (16-235)' },
  { value: 'full', label: '完整 (0-255)' }
];

// 分辨率限制预设
export const RESOLUTION_LIMITS = [
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
export const ANAMORPHIC_MODES = [
  { value: 'auto', label: '自动' },
  { value: 'none', label: '无' },
  { value: 'strict', label: '严格' },
  { value: 'loose', label: '宽松' },
  { value: 'custom', label: '自定义' }
];

// 容器优化
export const OPTIMIZE_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'fast-start', label: '快速启动（Web 优化）' },
  { value: 'fragmented', label: '分段 (Fragmented)' }
];

// 帧率选项
export const FRAMERATES = [
  { value: null, label: '与源视频相同' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 12, label: '12' },
  { value: 15, label: '15' },
  { value: 20, label: '20' },
  { value: 23.976, label: '23.976 (NTSC 电影)' },
  { value: 24, label: '24' },
  { value: 25, label: '25 (PAL 电影/视频)' },
  { value: 29.97, label: '29.97 (NTSC 视频)' },
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

// 编码器特定的码率控制类型
export const getRateControlForCodec = codec => {
  if (!codec) return { type: 'crf', label: '恒定质量 (RF)', default: 22, min: 0, max: 51 };
  
  const codecLower = codec.toLowerCase();
  
  // Intel QSV 使用 ICQ
  if (codecLower.includes('qsv')) {
    return { type: 'icq', label: '恒定质量 (ICQ)', default: 22, min: 0, max: 51 };
  }
  
  // NVIDIA NVENC 使用 CQP
  if (codecLower.includes('nvenc')) {
    return { type: 'cqp', label: '恒定质量 (CQP)', default: 22, min: 0, max: 51 };
  }
  
  // SVT-AV1 使用 CQ
  if (codecLower.includes('svt-av1')) {
    return { type: 'cq', label: '恒定质量 (CQ)', default: 30, min: 0, max: 63 };
  }
  
  // VP9 使用 CRF
  if (codecLower.includes('vp9')) {
    return { type: 'crf', label: '恒定质量 (CRF)', default: 31, min: 0, max: 63 };
  }
  
  // 默认 x264/x265 使用 CRF
  return { type: 'crf', label: '恒定质量 (RF)', default: 22, min: 0, max: 51 };
};

// 获取默认预设设置
export function getDefaultPresetSettings() {
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