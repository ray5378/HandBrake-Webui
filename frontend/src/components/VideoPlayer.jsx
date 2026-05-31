import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DPlayer from 'dplayer';
import { useAuthStore } from '../stores/authStore';

export default function VideoPlayer({ file, onClose }) {
  const containerRef = useRef(null);
  const dpRef = useRef(null);
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

    // 确保 DPlayer 容器正确适应高度
    if (containerRef.current) {
      const dplayerWrapper = containerRef.current.firstChild;
      if (dplayerWrapper) {
        dplayerWrapper.style.maxHeight = '100%';
        dplayerWrapper.style.height = 'auto';
      }
    }

    return () => {
      if (dpRef.current) {
        dpRef.current.destroy();
      }
    };
  }, [file, token]);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'
      onClick={onClose}
    >
      <div className='w-full max-h-full flex flex-col max-w-5xl' onClick={e => e.stopPropagation()}>
        <div className='flex justify-between items-center mb-2 flex-shrink-0'>
          <span className='text-white text-sm truncate'>{file.name}</span>
          <button
            onClick={onClose}
            className='text-white/60 hover:text-white transition-colors text-xl leading-none ml-4'
          >
            ✕
          </button>
        </div>
        <div
          ref={containerRef}
          className='flex-shrink-1 min-h-0 overflow-hidden'
          style={{
            maxHeight: 'calc(100vh - 3rem)',
            width: '100%'
          }}
        />
      </div>
      <style>{`
        .dplayer {
          max-height: 100%;
          height: auto;
        }
        .dplayer video {
          max-height: 100%;
          object-fit: contain;
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
