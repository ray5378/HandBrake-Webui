import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import clsx from 'clsx';
import { useToastStore } from '../../stores/toastStore';

const TYPE_STYLES = {
  success: {
    bg: 'bg-success/10 border-success/30',
    text: 'text-success',
    icon: CheckCircle
  },
  error: {
    bg: 'bg-error/10 border-error/30',
    text: 'text-error',
    icon: XCircle
  },
  warning: {
    bg: 'bg-warning/10 border-warning/30',
    text: 'text-warning',
    icon: AlertTriangle
  },
  info: {
    bg: 'bg-primary/10 border-primary/30',
    text: 'text-primary',
    icon: Info
  }
};

function ToastItem({ toast }) {
  const removeToast = useToastStore(state => state.removeToast);
  const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
  const Icon = style.icon;

  return (
    <div
      className={clsx(
        'flex items-start space-x-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm min-w-[300px] max-w-md animate-slide-in',
        style.bg
      )}
    >
      <Icon className={clsx('w-5 h-5 mt-0.5 shrink-0', style.text)} />
      <p className={clsx('flex-1 text-sm', style.text)}>{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className={clsx('p-0.5 rounded hover:bg-black/20 transition-colors shrink-0', style.text)}
      >
        <X className='w-4 h-4' />
      </button>
    </div>
  );
}

function Toast() {
  const toasts = useToastStore(state => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className='fixed top-4 right-4 z-[200] flex flex-col space-y-2'>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

export default Toast;