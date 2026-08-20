import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');

  const handleLoginSuccess = (role: string) => {
    switch (role) {
      case 'ADMIN':
        setCurrentTab('admin');
        break;
      case 'TEACHER':
        setCurrentTab('teacher');
        break;
      case 'STUDENT':
      default:
        setCurrentTab('student');
        break;
    }
  };

  const renderContent = () => {
    if (!user && (currentTab === 'home' || currentTab === 'login')) {
      return (
        <Login
          onSuccess={handleLoginSuccess}
          onNavigateToRegister={() => setCurrentTab('register')}
        />
      );
    }

    if (!user && currentTab === 'register') {
      return (
        <Register
          onSuccess={handleLoginSuccess}
          onNavigateToLogin={() => setCurrentTab('login')}
        />
      );
    }

    if (currentTab === 'admin') {
      return (
        <ProtectedRoute
          allowedRoles={['ADMIN']}
          onNavigateToLogin={() => setCurrentTab('login')}
        >
          <AdminDashboard />
        </ProtectedRoute>
      );
    }

    if (currentTab === 'teacher') {
      return (
        <ProtectedRoute
          allowedRoles={['TEACHER', 'ADMIN']}
          onNavigateToLogin={() => setCurrentTab('login')}
        >
          <TeacherDashboard />
        </ProtectedRoute>
      );
    }

    if (currentTab === 'student' || currentTab === 'home') {
      return (
        <ProtectedRoute
          allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}
          onNavigateToLogin={() => setCurrentTab('login')}
        >
          <StudentDashboard />
        </ProtectedRoute>
      );
    }

    return (
      <Login
        onSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setCurrentTab('register')}
      />
    );
  };

  return (
    <div style={styles.appWrapper}>
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />
      <main style={styles.mainContent}>{renderContent()}</main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;

const styles: Record<string, React.CSSProperties> = {
  appWrapper: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  mainContent: {
    paddingBottom: '3rem',
  },
};
