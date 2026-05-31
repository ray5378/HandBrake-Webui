import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DPlayer from 'dplayer';
import { useAuthStore } from '../stores/authStore';

export default function VideoPlayer({ file, onClose }) {
  const containerRef = useRef(null);
  const dpRef = useRef(null);
  const roRef = useRef(null);
  const token = useAuthStore(s => s.token);

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

    const container = containerRef.current;
    if (!container) return;

    const forceFitInBounds = () => {
      const dpEl = container.querySelector('.dplayer') || container.firstChild;
      const videoEl = dpRef.current?.video;
      const videoWrap = dpEl?.querySelector('.dplayer-video-wrap');

      if (dpEl) {
        dpEl.style.setProperty('max-width', '100%', 'important');
        dpEl.style.setProperty('max-height', '100%', 'important');
        dpEl.style.setProperty('width', '100%', 'important');
        dpEl.style.setProperty('height', '100%', 'important');
        dpEl.style.setProperty('position', 'relative', 'important');
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

    requestAnimationFrame(() => {
      requestAnimationFrame(forceFitInBounds);
    });

    roRef.current = new ResizeObserver(forceFitInBounds);
    roRef.current.observe(container);

    return () => {
      if (roRef.current) {
        roRef.current.disconnect();
      }
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
        className='w-full h-full flex items-center justify-center'
        style={{ maxHeight: '100vh', maxWidth: '100vw' }}
        onClick={e => e.stopPropagation()}
      >
        <div className='absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none'>
          <span className='text-white text-sm truncate'>{file.name}</span>
          <button
            onClick={onClose}
            className='text-white/60 hover:text-white transition-colors text-xl leading-none ml-4 pointer-events-auto'
          >
            ✕
          </button>
        </div>
        <div
          ref={containerRef}
          className='flex-shrink-1 min-h-0 overflow-hidden'
          style={{
            maxHeight: 'calc(100vh - 5rem)',
            maxWidth: 'calc(100vw - 2rem)',
            width: '100%'
          }}
        />
      </div>
      <style>{`
        .dplayer {
          max-width: 100% !important;
          max-height: 100% !important;
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
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
