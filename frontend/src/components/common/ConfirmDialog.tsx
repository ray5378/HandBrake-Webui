import { AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  danger
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className='fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4'>
      <div className='bg-dark-800 rounded-xl max-w-md w-full p-6'>
        <div className='flex items-start justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            {danger && <AlertTriangle className='w-6 h-6 text-error' />}
            <h3 className='text-lg font-bold text-white'>{title}</h3>
          </div>
          <button onClick={onCancel} className='p-1 hover:bg-dark-700 rounded-lg transition-colors'>
            <X className='w-5 h-5 text-gray-400' />
          </button>
        </div>
        <p className='text-gray-400 mb-6 whitespace-pre-line'>{message}</p>
        <div className='flex space-x-3'>
          <button onClick={onCancel} className='btn btn-secondary flex-1'>
            {cancelText || '取消'}
          </button>
          <button
            onClick={onConfirm}
            className={clsx('btn flex-1', danger ? 'btn btn-danger' : 'btn btn-primary')}
          >
            {confirmText || '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
