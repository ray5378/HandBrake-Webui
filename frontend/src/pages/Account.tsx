import { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

function Account() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t('settings.passwordMismatch') || 'Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError(t('settings.passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.put(`/users/${user!.id}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setSuccess(t('settings.passwordChanged') || 'Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || t('errors.unknownError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-4'>
        <button
          onClick={() => navigate(-1)}
          className='p-2 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors'
        >
          <ArrowLeft className='w-5 h-5 text-gray-400' />
        </button>
        <div>
          <h1 className='text-3xl font-bold text-white'>{t('settings.account')}</h1>
          <p className='text-gray-400 mt-1'>{t('settings.accountInfo')}</p>
        </div>
      </div>

      <div className='card'>
        <h2 className='text-xl font-semibold text-white mb-4'>{t('settings.accountInfo')}</h2>
        <div className='space-y-3'>
          <div>
            <p className='text-sm text-gray-400'>{t('auth.username')}</p>
            <p className='text-white text-lg'>{user?.username}</p>
          </div>
          <div>
            <p className='text-sm text-gray-400'>{t('settings.role') || 'Role'}</p>
            <p className='text-white capitalize'>{user?.role}</p>
          </div>
        </div>
      </div>

      <div className='card'>
        <h2 className='text-xl font-semibold text-white mb-4'>{t('settings.changePassword')}</h2>

        {error && (
          <div className='mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 text-error text-sm'>
            <AlertCircle className='w-4 h-4' />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className='mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center space-x-2 text-success text-sm'>
            <CheckCircle className='w-4 h-4' />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className='space-y-4'>
          <div>
            <label className='label'>{t('settings.currentPassword') || 'Current Password'}</label>
            <input
              type='password'
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className='input'
              required
            />
          </div>

          <div>
            <label className='label'>{t('settings.newPassword') || 'New Password'}</label>
            <input
              type='password'
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className='input'
              required
            />
          </div>

          <div>
            <label className='label'>{t('settings.confirmPassword') || 'Confirm Password'}</label>
            <input
              type='password'
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className='input'
              required
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='btn btn-primary inline-flex items-center space-x-2'
          >
            {loading ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>{t('common.saving') || 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save className='w-4 h-4' />
                <span>{t('common.save')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Account;
