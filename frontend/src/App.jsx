import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import Loading from './components/common/Loading';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Files = lazy(() => import('./pages/Files'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Presets = lazy(() => import('./pages/Presets'));
const Settings = lazy(() => import('./pages/Settings'));
const Account = lazy(() => import('./pages/Account'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, checkAuth } = useAuthStore();

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path='files' element={<Files />} />
            <Route path='jobs' element={<Jobs />} />
            <Route path='presets' element={<Presets />} />
            <Route path='settings' element={<Settings />} />
            <Route path='account' element={<Account />} />
          </Route>
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
