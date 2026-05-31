import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DPlayer from 'dplayer';
import 'dplayer/dist/DPlayer.min.css';
import { useAuthStore } from '../stores/authStore';

export default function VideoPlayer({ file, onClose }) {
  const containerRef = useRef(null);
  const dpRef = useRef(null);
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    const videoUrl = `/api/files/stream?path=${encodeURIComponent(file.path)}&token=${encodeURIComponent(token)}`;

    dpRef.current = new DPlayer({
      container: containerRef.current,
      video: {
        url: videoUrl,
        type: 'auto'
      },
      autoplay: true,
      screenshot: false,
      lang: navigator.language.startsWith('zh') ? 'zh-cn' : 'en'
    });

    return () => {
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
      <div className='w-full max-w-5xl mx-4' onClick={e => e.stopPropagation()}>
        <div className='flex justify-between items-center mb-2'>
          <span className='text-white text-sm truncate'>{file.name}</span>
          <button
            onClick={onClose}
            className='text-white/60 hover:text-white transition-colors text-xl leading-none ml-4'
          >
            ✕
          </button>
        </div>
        <div ref={containerRef} />
      </div>
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
