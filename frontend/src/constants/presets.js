/**
 * HandBrake 预设常量定义
 */

// 输出格式
export const FORMATS = [
  { value: 'mp4', label: 'MP4', i18nKey: 'container.format' },
  { value: 'mkv', label: 'MKV', i18nKey: 'container.format' },
  { value: 'webm', label: 'WebM', i18nKey: 'container.format' }
];

// 视频编码器
export const VIDEO_CODECS = [
  // 软件编码器
  { value: 'x264', label: 'H.264', i18nKey: 'codecs.x264', group: 'software' },
  { value: 'x264_10bit', label: 'H.264 10位', i18nKey: 'codecs.x264_10bit', group: 'software' },
  { value: 'x265', label: 'H.265/HEVC', i18nKey: 'codecs.x265', group: 'software' },
  { value: 'x265_10bit', label: 'H.265/HEVC 10位', i18nKey: 'codecs.x265_10bit', group: 'software' },
  { value: 'x265_12bit', label: 'H.265/HEVC 12位', i18nKey: 'codecs.x265_12bit', group: 'software' },
  { value: 'svt-av1', label: 'AV1', i18nKey: 'codecs.svt_av1', group: 'software' },
  { value: 'svt-av1_10bit', label: 'AV1 10位', i18nKey: 'codecs.svt_av1_10bit', group: 'software' },
  { value: 'vp9', label: 'VP9', i18nKey: 'codecs.vp9', group: 'software' },
  { value: 'vp9_10bit', label: 'VP9 10位', i18nKey: 'codecs.vp9_10bit', group: 'software' },
  { value: 'mpeg4', label: 'MPEG-4', i18nKey: 'codecs.mpeg4', group: 'software' },
  { value: 'mpeg2', label: 'MPEG-2', i18nKey: 'codecs.mpeg2', group: 'software' },
  { value: 'ffv1', label: 'FFV1 无损', i18nKey: 'codecs.ffv1', group: 'software' },
  // Intel QSV 硬件编码
  { value: 'qsv_h264', label: 'H.264 QSV', i18nKey: 'codecs.qsv_h264', group: 'qsv' },
  { value: 'qsv_h265', label: 'H.265/HEVC QSV', i18nKey: 'codecs.qsv_h265', group: 'qsv' },
  { value: 'qsv_h265_10bit', label: 'H.265/HEVC 10位 QSV', i18nKey: 'codecs.qsv_h265_10bit', group: 'qsv' },
  // NVIDIA NVENC 硬件编码
  { value: 'nvenc_h264', label: 'H.264 NVENC', i18nKey: 'codecs.nvenc_h264', group: 'nvenc' },
  { value: 'nvenc_h265', label: 'H.265/HEVC NVENC', i18nKey: 'codecs.nvenc_h265', group: 'nvenc' },
  // AMD VCE 硬件编码
  { value: 'vce_h264', label: 'H.264 VCE', i18nKey: 'codecs.vce_h264', group: 'vce' },
  { value: 'vce_h265', label: 'H.265/HEVC VCE', i18nKey: 'codecs.vce_h265', group: 'vce' }
];

// 视频编码器预设
export const X264_PRESETS = [
  { value: 'ultrafast', label: '极速', i18nKey: 'presets.ultrafast' },
  { value: 'superfast', label: '超快', i18nKey: 'presets.superfast' },
  { value: 'veryfast', label: '非常快', i18nKey: 'presets.veryfast' },
  { value: 'faster', label: '很快', i18nKey: 'presets.faster' },
  { value: 'fast', label: '快', i18nKey: 'presets.fast' },
  { value: 'medium', label: '中等', i18nKey: 'presets.medium' },
  { value: 'slow', label: '慢', i18nKey: 'presets.slow' },
  { value: 'slower', label: '更慢', i18nKey: 'presets.slower' },
  { value: 'veryslow', label: '非常慢', i18nKey: 'presets.veryslow' },
  { value: 'placebo', label: '极致（最慢）', i18nKey: 'presets.placebo' }
];

export const X265_PRESETS = [
  { value: 'ultrafast', label: '极速', i18nKey: 'presets.ultrafast' },
  { value: 'superfast', label: '超快', i18nKey: 'presets.superfast' },
  { value: 'veryfast', label: '非常快', i18nKey: 'presets.veryfast' },
  { value: 'faster', label: '很快', i18nKey: 'presets.faster' },
  { value: 'fast', label: '快', i18nKey: 'presets.fast' },
  { value: 'medium', label: '中等', i18nKey: 'presets.medium' },
  { value: 'slow', label: '慢', i18nKey: 'presets.slow' },
  { value: 'slower', label: '更慢', i18nKey: 'presets.slower' },
  { value: 'veryslow', label: '非常慢', i18nKey: 'presets.veryslow' },
  { value: 'placebo', label: '极致（最慢）', i18nKey: 'presets.placebo' }
];

// 硬件编码器预设
export const QSV_PRESETS = [
  { value: 'speed', label: '速度优先', i18nKey: 'presets.speed' },
  { value: 'balanced', label: '均衡', i18nKey: 'presets.balanced' },
  { value: 'quality', label: '画质优先', i18nKey: 'presets.quality' }
];

export const NVENC_PRESETS = [
  { value: 'fast', label: '快速', i18nKey: 'presets.fast' },
  { value: 'medium', label: '中等', i18nKey: 'presets.medium' },
  { value: 'slow', label: '高质量', i18nKey: 'presets.slow' }
];

export const VCE_PRESETS = [
  { value: 'speed', label: '速度优先', i18nKey: 'presets.speed' },
  { value: 'balanced', label: '均衡', i18nKey: 'presets.balanced' },
  { value: 'quality', label: '画质优先', i18nKey: 'presets.quality' }
];

// 视频调优
export const X264_TUNES = [
  { value: 'film', label: '电影', i18nKey: 'tunes.film' },
  { value: 'animation', label: '动画', i18nKey: 'tunes.animation' },
  { value: 'grain', label: '颗粒/噪点', i18nKey: 'tunes.grain' },
  { value: 'stillimage', label: '静态图像', i18nKey: 'tunes.stillimage' },
  { value: 'psnr', label: 'PSNR 优化', i18nKey: 'tunes.psnr' },
  { value: 'ssim', label: 'SSIM 优化', i18nKey: 'tunes.ssim' },
  { value: 'fastdecode', label: '快速解码', i18nKey: 'tunes.fastdecode' },
  { value: 'zerolatency', label: '零延迟', i18nKey: 'tunes.zerolatency' }
];

export const X265_TUNES = [
  { value: 'film', label: '电影', i18nKey: 'tunes.film' },
  { value: 'animation', label: '动画', i18nKey: 'tunes.animation' },
  { value: 'grain', label: '颗粒/噪点', i18nKey: 'tunes.grain' },
  { value: 'stillimage', label: '静态图像', i18nKey: 'tunes.stillimage' },
  { value: 'psnr', label: 'PSNR 优化', i18nKey: 'tunes.psnr' },
  { value: 'ssim', label: 'SSIM 优化', i18nKey: 'tunes.ssim' },
  { value: 'fastdecode', label: '快速解码', i18nKey: 'tunes.fastdecode' },
  { value: 'zerolatency', label: '零延迟', i18nKey: 'tunes.zerolatency' }
];

// 视频编码方式
export const RATE_CONTROLS = [
  { value: 'crf', label: '恒定质量 (RF)', i18nKey: 'video.constantQuality' },
  { value: 'cbr', label: '恒定码率 (CBR)', i18nKey: 'video.constantBitrate' },
  { value: 'vbr', label: '可变码率 (VBR)', i18nKey: 'video.variableBitrate' },
  { value: 'cqp', label: '恒定量化参数 (CQP)', i18nKey: 'video.cqp' },
  { value: 'icq', label: '智能恒定质量 (ICQ)', i18nKey: 'video.icq' },
  { value: 'cq', label: '恒定质量 (CQ)', i18nKey: 'video.cq' }
];

// 音频编码器
export const AUDIO_CODECS = [
  { value: 'copy', label: '音频直通', i18nKey: 'audio.passthrough' },
  { value: 'av_aac', label: 'AAC (avcodec)', i18nKey: 'audio.aac_av' },
  { value: 'ca_aac', label: 'AAC (CoreAudio)', i18nKey: 'audio.aac_ca' },
  { value: 'mp3', label: 'MP3 (lame)', i18nKey: 'audio.mp3' },
  { value: 'opus', label: 'Opus', i18nKey: 'audio.opus' },
  { value: 'vorbis', label: 'Vorbis', i18nKey: 'audio.vorbis' },
  { value: 'ac3', label: 'AC3 (杜比数字)', i18nKey: 'audio.ac3' },
  { value: 'eac3', label: 'EAC3 (杜比数字增强)', i18nKey: 'audio.eac3' },
  { value: 'flac16', label: 'FLAC 16位 无损', i18nKey: 'audio.flac16' },
  { value: 'flac24', label: 'FLAC 24位 无损', i18nKey: 'audio.flac24' }
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
  { value: 44100, label: '44.1 kHz (CD音质)' },
  { value: 48000, label: '48 kHz (默认)' },
  { value: 64000, label: '64 kHz' },
  { value: 88200, label: '88.2 kHz' },
  { value: 96000, label: '96 kHz (高清音频)' }
];

// 混合声道
export const MIXDOWN_MODES = [
  { value: 'none', label: '自动', i18nKey: 'audio.auto' },
  { value: 'mono', label: '单声道', i18nKey: 'audio.mono' },
  { value: 'stereo', label: '立体声', i18nKey: 'audio.stereo' },
  { value: 'dpl2', label: '杜比定向逻辑II', i18nKey: 'audio.dpl2' },
  { value: '5.1', label: '5.1 环绕声', i18nKey: 'audio.surround51' },
  { value: '7.1', label: '7.1 环绕声', i18nKey: 'audio.surround71' }
];

// DRC 模式
export const DRC_MODES = [
  { value: 'none', label: '无', i18nKey: 'common.none' },
  { value: 'light', label: '轻度', i18nKey: 'drc.light' },
  { value: 'medium', label: '中等', i18nKey: 'drc.medium' },
  { value: 'heavy', label: '重度', i18nKey: 'drc.heavy' }
];

// 色彩范围
export const COLOR_RANGES = [
  { value: 'auto', label: '自动', i18nKey: 'common.auto' },
  { value: 'limited', label: '有限范围 (16-235)', i18nKey: 'colorRange.limited' },
  { value: 'full', label: '完整范围 (0-255)', i18nKey: 'colorRange.full' }
];

// 分辨率限制预设
export const RESOLUTION_LIMITS = [
  { value: '', label: '无限制', i18nKey: 'resolution.none' },
  { value: '4320p', label: '4320p 8K 超高清', i18nKey: 'resolution.4320p' },
  { value: '2160p', label: '2160p 4K 超高清', i18nKey: 'resolution.2160p' },
  { value: '1440p', label: '1440p 2.5K 四倍高清', i18nKey: 'resolution.1440p' },
  { value: '1080p', label: '1080p 全高清', i18nKey: 'resolution.1080p' },
  { value: '720p', label: '720p 高清', i18nKey: 'resolution.720p' },
  { value: '576p', label: '576p PAL标清', i18nKey: 'resolution.576p' },
  { value: '480p', label: '480p NTSC标清', i18nKey: 'resolution.480p' },
  { value: '360p', label: '360p 低清', i18nKey: 'resolution.360p' },
  { value: '240p', label: '240p 流畅', i18nKey: 'resolution.240p' }
];

// 变形模式
export const ANAMORPHIC_MODES = [
  { value: 'auto', label: '自动', i18nKey: 'common.auto' },
  { value: 'none', label: '无', i18nKey: 'common.none' },
  { value: 'strict', label: '严格', i18nKey: 'anamorphic.strict' },
  { value: 'loose', label: '宽松', i18nKey: 'anamorphic.loose' },
  { value: 'custom', label: '自定义', i18nKey: 'anamorphic.custom' }
];

// 容器优化
export const OPTIMIZE_OPTIONS = [
  { value: 'none', label: '无', i18nKey: 'common.none' },
  { value: 'fast-start', label: '快速启动（网页播放优化）', i18nKey: 'container.fastStart' },
  { value: 'fragmented', label: '分片（流媒体优化）', i18nKey: 'container.fragmented' }
];

// 帧率选项
export const FRAMERATES = [
  { value: null, label: '与源视频相同', i18nKey: 'framerate.source' },
  { value: 5, label: '5 FPS' },
  { value: 10, label: '10 FPS' },
  { value: 12, label: '12 FPS' },
  { value: 15, label: '15 FPS' },
  { value: 20, label: '20 FPS' },
  { value: 23.976, label: '23.976 FPS (电影标准)' },
  { value: 24, label: '24 FPS (电影)' },
  { value: 25, label: '25 FPS (PAL制式)' },
  { value: 29.97, label: '29.97 FPS (NTSC制式)' },
  { value: 30, label: '30 FPS' },
  { value: 48, label: '48 FPS' },
  { value: 50, label: '50 FPS' },
  { value: 59.94, label: '59.94 FPS' },
  { value: 60, label: '60 FPS' },
  { value: 72, label: '72 FPS' },
  { value: 75, label: '75 FPS' },
  { value: 90, label: '90 FPS' },
  { value: 100, label: '100 FPS' },
  { value: 120, label: '120 FPS' }
];

// 获取编码器允许的码率控制选项
export const getAllowedRateControls = codec => {
  const codecLower = (codec || '').toLowerCase();
  if (codecLower.includes('qsv')) {
    return RATE_CONTROLS.filter(rc => rc.value === 'icq' || rc.value === 'cbr');
  }
  if (codecLower.includes('nvenc')) {
    return RATE_CONTROLS.filter(rc => rc.value === 'cqp' || rc.value === 'cbr');
  }
  if (codecLower.includes('svt-av1')) {
    return RATE_CONTROLS.filter(rc => rc.value === 'cq' || rc.value === 'cbr');
  }
  if (codecLower.includes('vp9')) {
    return RATE_CONTROLS.filter(rc => rc.value === 'crf' || rc.value === 'cbr');
  }
  // x264/x265 默认
  return RATE_CONTROLS.filter(rc => rc.value === 'crf' || rc.value === 'cbr' || rc.value === 'vbr');
};

// 编码器特定的码率控制类型
export const getRateControlForCodec = codec => {
  if (!codec) return { type: 'crf', label: '恒定质量 (RF)', default: 22, min: 0, max: 51 };
  
  const codecLower = codec.toLowerCase();
  
  // Intel QSV 使用 ICQ
  if (codecLower.includes('qsv')) {
    return { type: 'icq', label: '智能恒定质量 (ICQ)', default: 22, min: 0, max: 51 };
  }
  
  // NVIDIA NVENC 使用 CQP
  if (codecLower.includes('nvenc')) {
    return { type: 'cqp', label: '恒定量化参数 (CQP)', default: 22, min: 0, max: 51 };
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
      icq: 22,
      cqp: 22,
      cq: 30,
      qp: null,
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
