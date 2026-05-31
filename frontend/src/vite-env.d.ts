/// <reference types="vite/client" />

declare module 'dplayer' {
  interface DPlayerOptions {
    container: HTMLElement;
    video: {
      url: string;
      type?: string;
      pic?: string;
      thumbnails?: string;
    };
    autoplay?: boolean;
    screenshot?: boolean;
    hotkey?: boolean;
    lang?: string;
    contextmenu?: Array<{
      text: string;
      click: () => void;
    }>;
  }

  class DPlayer {
    constructor(options: DPlayerOptions);
    video: HTMLVideoElement;
    destroy(): void;
  }

  export default DPlayer;
}
