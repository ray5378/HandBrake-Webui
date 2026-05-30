import { create } from 'zustand';

let toastId = 0;

export const useToastStore = create((set, get) => ({
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