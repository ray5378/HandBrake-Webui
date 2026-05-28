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
  { value: 'x264', label: 'H.264 (x264)' },
  { value: 'x265', label: 'H.265/HEVC (x265)' },
  { value: 'svt-av1', label: 'AV1 (SVT-AV1)' },
  { value: 'vp9', label: 'VP9' }
];

// 视频编码器预设
export const X264_PRESETS = [
  { value: 'ultrafast', label: 'Ultrafast' },
  { value: 'superfast', label: 'Superfast' },
  { value: 'veryfast', label: 'Veryfast' },
  { value: 'faster', label: 'Faster' },
  { value: 'fast', label: 'Fast' },
  { value: 'medium', label: 'Medium (Default)' },
  { value: 'slow', label: 'Slow' },
  { value: 'slower', label: 'Slower' },
  { value: 'veryslow', label: 'Veryslow' },
  { value: 'placebo', label: 'Placebo' }
];

export const X265_PRESETS = [
  { value: 'ultrafast', label: 'Ultrafast' },
  { value: 'superfast', label: 'Superfast' },
  { value: 'veryfast', label: 'Veryfast' },
  { value: 'faster', label: 'Faster' },
  { value: 'fast', label: 'Fast' },
  { value: 'medium', label: 'Medium (Default)' },
  { value: 'slow', label: 'Slow' },
  { value: 'slower', label: 'Slower' },
  { value: 'veryslow', label: 'Veryslow' },
  { value: 'placebo', label: 'Placebo' }
];

// 视频调优
export const X264_TUNES = [
  { value: 'film', label: 'Film' },
  { value: 'animation', label: 'Animation' },
  { value: 'grain', label: 'Grain' },
  { value: 'stillimage', label: 'Still Image' },
  { value: 'psnr', label: 'PSNR' },
  { value: 'ssim', label: 'SSIM' },
  { value: 'fastdecode', label: 'Fast Decode' },
  { value: 'zerolatency', label: 'Zero Latency' }
];

export const X265_TUNES = [
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
export const RATE_CONTROLS = [
  { value: 'crf', label: 'Constant Quality (CRF)' },
  { value: 'cbr', label: 'Constant Bitrate (CBR)' },
  { value: 'vbr', label: 'Variable Bitrate (VBR)' },
  { value: 'cqp', label: 'Constant QP (CQP)' }
];

// 音频编码器
export const AUDIO_CODECS = [
  { value: 'copy', label: 'Passthrough' },
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
  { value: 44100, label: '44.1 kHz (Default)' },
  { value: 48000, label: '48 kHz' },
  { value: 64000, label: '64 kHz' },
  { value: 88200, label: '88.2 kHz' },
  { value: 96000, label: '96 kHz' }
];

// 混合声道
export const MIXDOWN_MODES = [
  { value: 'none', label: 'Auto' },
  { value: 'mono', label: 'Mono' },
  { value: 'stereo', label: 'Stereo' },
  { value: 'dpl2', label: 'Dolby Pro Logic II' },
  { value: '5.1', label: '5.1 Channels' },
  { value: '7.1', label: '7.1 Channels' }
];

// DRC 模式
export const DRC_MODES = [
  { value: 'none', label: 'None (Default)' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' }
];

// 容器优化
export const OPTIMIZE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'fast-start', label: 'Fast Start (Web Optimized)' },
  { value: 'fragmented', label: 'Fragmented' }
];

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
