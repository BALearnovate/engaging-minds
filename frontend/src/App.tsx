import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ActivityCreationStudio } from './components/ActivityCreationStudio';
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
        setCurrentTab('dashboard');
        break;
      case 'TEACHER':
        setCurrentTab('dashboard');
        break;
      case 'STUDENT':
      default:
        setCurrentTab('dashboard');
        break;
    }
  };

  const renderContent = () => {
    if (!user && currentTab === 'login') {
      return (
        <Login
          onSuccess={handleLoginSuccess}
          onNavigateToRegister={() => setCurrentTab('register')}
        />
      );
    }

    if (!user) {
      return (
        <Register
          onSuccess={handleLoginSuccess}
          onNavigateToLogin={() => setCurrentTab('login')}
        />
      );
    }

    if (currentTab === 'activity_creation') {
      return (
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'STUDENT']} onNavigateToLogin={() => setCurrentTab('login')}>
          <ActivityCreationStudio />
        </ProtectedRoute>
      );
    }

    if (currentTab === 'dashboard') {
      if (user.role === 'ADMIN') {
        return (
          <ProtectedRoute allowedRoles={['ADMIN']} onNavigateToLogin={() => setCurrentTab('login')}>
            <AdminDashboard />
          </ProtectedRoute>
        );
      }
      if (user.role === 'TEACHER') {
        return (
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']} onNavigateToLogin={() => setCurrentTab('login')}>
            <TeacherDashboard />
          </ProtectedRoute>
        );
      }
      return (
        <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']} onNavigateToLogin={() => setCurrentTab('login')}>
          <StudentDashboard />
        </ProtectedRoute>
      );
    }

    // Default 'home' view
    return (
      <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']} onNavigateToLogin={() => setCurrentTab('login')}>
        <StudentDashboard />
      </ProtectedRoute>
    );
  };

  return (
    <div style={styles.appWrapper}>
      {user && <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />}

      <div style={styles.mainLayout}>
        {user && <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />}
        <main style={{ ...styles.mainContent, paddingBottom: !user ? 0 : '3rem' }}>
          {renderContent()}
        </main>
      </div>
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
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  mainLayout: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  mainContent: {
    width: '100%',
    flex: 1,
  },
};
