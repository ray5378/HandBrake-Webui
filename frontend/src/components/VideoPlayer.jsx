import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import DPlayer from 'dplayer';
import { useAuthStore } from '../stores/authStore';

export default function VideoPlayer({ file, onClose }) {
  const containerRef = useRef(null);
  const dpRef = useRef(null);
  const token = useAuthStore(s => s.token);
  const [playerStyle, setPlayerStyle] = useState({
    maxWidth: 'calc(100vw - 2rem)',
    maxHeight: 'calc(100vh - 5rem)',
    width: '100%'
  });

  useEffect(() => {
    const videoUrl = `/api/files/stream?path=${encodeURIComponent(file.path)}&token=${encodeURIComponent(token)}`;

    const lang = navigator.language.startsWith('zh') ? 'zh-cn' : 'en';

    dpRef.current = new DPlayer({
      container: containerRef.current,
      video: {
        url: videoUrl,
        type: 'auto'
      },
      autoplay: true,
      screenshot: true,
      hotkey: true,
      lang,
      contextmenu: [
        {
          text: lang === 'zh-cn' ? '画中画' : 'Picture in Picture',
          click: () => {
            const video = dpRef.current?.video;
            if (!video) return;
            if (document.pictureInPictureElement) {
              document.exitPictureInPicture();
            } else {
              video.requestPictureInPicture();
            }
          }
        }
      ]
    });

    const videoEl = dpRef.current.video;

    const onMetadata = () => {
      const vw = videoEl.videoWidth;
      const vh = videoEl.videoHeight;
      const gap = 16;
      const headerH = 40;
      const isDesktop = window.innerWidth >= 768;
      const scale = isDesktop ? 2 / 3 : 1;
      const maxW = (window.innerWidth - gap * 2) * scale;
      const maxH = (window.innerHeight - headerH - gap * 2) * scale;

      let w, h;
      if (vw >= vh) {
        w = maxW;
        h = w * (vh / vw);
        if (h > maxH) {
          h = maxH;
          w = h * (vw / vh);
        }
      } else {
        h = maxH;
        w = h * (vw / vh);
        if (w > maxW) {
          w = maxW;
          h = w * (vh / vw);
        }
      }

      setPlayerStyle({
        width: `${Math.round(w)}px`,
        height: `${Math.round(h)}px`
      });

      const container = containerRef.current;
      if (!container) return;
      const dpEl = container.querySelector('.dplayer') || container.firstChild;
      const videoWrap = dpEl?.querySelector('.dplayer-video-wrap');
      if (dpEl) {
        dpEl.style.setProperty('width', '100%', 'important');
        dpEl.style.setProperty('height', '100%', 'important');
        dpEl.style.setProperty('max-width', '100%', 'important');
        dpEl.style.setProperty('max-height', '100%', 'important');
      }
      if (videoWrap) {
        videoWrap.style.setProperty('position', 'absolute', 'important');
        videoWrap.style.setProperty('inset', '0', 'important');
        videoWrap.style.setProperty('display', 'flex', 'important');
        videoWrap.style.setProperty('align-items', 'center', 'important');
        videoWrap.style.setProperty('justify-content', 'center', 'important');
        videoWrap.style.setProperty('overflow', 'hidden', 'important');
      }
      if (videoEl) {
        videoEl.removeAttribute('width');
        videoEl.removeAttribute('height');
        videoEl.style.setProperty('max-width', '100%', 'important');
        videoEl.style.setProperty('max-height', '100%', 'important');
        videoEl.style.setProperty('width', 'auto', 'important');
        videoEl.style.setProperty('height', 'auto', 'important');
        videoEl.style.setProperty('object-fit', 'contain', 'important');
      }
    };

    if (videoEl.readyState >= 2) {
      onMetadata();
    } else {
      videoEl.addEventListener('loadedmetadata', onMetadata, { once: true });
    }

    const onResize = () => {
      const v = dpRef.current?.video;
      if (v && v.videoWidth && v.videoHeight) {
        const vw = v.videoWidth;
        const vh = v.videoHeight;
        const gap = 16;
        const headerH = 40;
        const isDesktop = window.innerWidth >= 768;
        const scale = isDesktop ? 2 / 3 : 1;
        const maxW = (window.innerWidth - gap * 2) * scale;
        const maxH = (window.innerHeight - headerH - gap * 2) * scale;

        let w, h;
        if (vw >= vh) {
          w = maxW;
          h = w * (vh / vw);
          if (h > maxH) {
            h = maxH;
            w = h * (vw / vh);
          }
        } else {
          h = maxH;
          w = h * (vw / vh);
          if (w > maxW) {
            w = maxW;
            h = w * (vh / vw);
          }
        }

        setPlayerStyle({
          width: `${Math.round(w)}px`,
          height: `${Math.round(h)}px`
        });
      }
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (dpRef.current) {
        dpRef.current.destroy();
      }
    };
  }, [file, token]);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80'
      onClick={onClose}
    >
      <div
        className='flex flex-col items-center'
        style={playerStyle}
        onClick={e => e.stopPropagation()}
      >
        <div className='flex justify-between items-center w-full px-4'>
          <span className='text-white text-sm truncate'>{file.name}</span>
          <button
            onClick={onClose}
            className='text-white/60 hover:text-white transition-colors text-xl leading-none ml-4'
          >
            ✕
          </button>
        </div>
        <div ref={containerRef} className='flex-1 w-full overflow-hidden' />
      </div>
      <style>{`
        .dplayer {
          max-width: 100% !important;
          max-height: 100% !important;
          width: 100% !important;
          height: 100% !important;
        }
        .dplayer-video-wrap {
          position: absolute !important;
          inset: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
        }
        .dplayer video {
          max-width: 100% !important;
          max-height: 100% !important;
          width: auto !important;
          height: auto !important;
          object-fit: contain !important;
        }
        .dplayer-controller {
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
        }
      `}</style>
    </div>
  );
}

VideoPlayer.propTypes = {
  file: PropTypes.shape({
    path: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};
