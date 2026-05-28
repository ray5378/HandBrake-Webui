import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Video, Loader2, AlertCircle } from 'lucide-react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const { checkInitialization, setupAdmin, login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      try {
        const initialized = await checkInitialization();
        if (initialized === false) {
          setIsSetupMode(true);
        }
        setIsChecking(false);
      } catch (err) {
        setIsChecking(false);
      }
    };
    check();
  }, [checkInitialization]);

  const handleLoginSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请填写所有字段');
      return;
    }

    const result = await login(username, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleSetupSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!username || !password || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要 6 个字符');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    const result = await setupAdmin(username, password, confirmPassword);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isSetupMode) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">HandBrake Web UI</h1>
            <p className="text-gray-400">首次使用，请设置管理员账号</p>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 shadow-xl">
            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 text-error text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div>
                <label className="label">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input"
                  placeholder="设置用户名"
                />
              </div>

              <div>
                <label className="label">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  placeholder="设置密码 (至少 6 位)"
                />
              </div>

              <div>
                <label className="label">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="再次输入密码"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>处理中...</span>
                  </>
                ) : (
                  <span>创建管理员</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">HandBrake Web UI</h1>
          <p className="text-gray-400">基于 Web 的视频转码管理</p>
        </div>

        <div className="bg-dark-800 rounded-xl p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-center space-x-2 text-error text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="label">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input"
                placeholder="输入用户名"
              />
            </div>

            <div>
              <label className="label">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="输入密码"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>处理中...</span>
                </>
              ) : (
                <span>登录</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
