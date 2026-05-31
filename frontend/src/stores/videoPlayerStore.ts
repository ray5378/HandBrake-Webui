import { create } from 'zustand';

interface VideoFile {
  path: string;
  name: string;
}

interface VideoPlayerStore {
  isOpen: boolean;
  file: VideoFile | null;
  open: (file: VideoFile) => void;
  close: () => void;
}

export const useVideoPlayerStore = create<VideoPlayerStore>(set => ({
  isOpen: false,
  file: null,

  open: file => {
    set({ file, isOpen: true });
  },

  close: () => {
    set({ isOpen: false });
  }
}));
