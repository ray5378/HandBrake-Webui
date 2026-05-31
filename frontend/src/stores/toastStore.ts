import { create } from 'zustand';

let toastId = 0;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (params: { message: string; type?: Toast['type']; duration?: number }) => number;
  removeToast: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: ({ message, type = 'info', duration = 4000 }) => {
    const id = ++toastId;
    set(state => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: id => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  }
}));
