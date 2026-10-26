import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { LanguageTopBar } from './components/LanguageTopBar';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ActivityCreationStudio } from './components/ActivityCreationStudio';
import { ClassroomSetupComponent } from './components/ClassroomSetupComponent';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherHomeView } from './pages/TeacherHomeView';
import { StudentDashboard } from './pages/StudentDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');

  const handleLoginSuccess = (role: string) => {
    if (role === 'STUDENT') {
      setCurrentTab('student_home');
    } else {
      setCurrentTab('home');
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

    if (user.role === 'STUDENT' || currentTab === 'student_home' || currentTab === 'student') {
      return (
        <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']} onNavigateToLogin={() => setCurrentTab('login')}>
          <StudentDashboard />
        </ProtectedRoute>
      );
    }

    if (currentTab === 'home') {
      return (
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'STUDENT']} onNavigateToLogin={() => setCurrentTab('login')}>
          <TeacherHomeView onNavigateTab={setCurrentTab} />
        </ProtectedRoute>
      );
    }

    if (currentTab === 'classroom_setup') {
      return (
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'STUDENT']} onNavigateToLogin={() => setCurrentTab('login')}>
          <ClassroomSetupComponent />
        </ProtectedRoute>
      );
    }

    if (currentTab === 'teacher_dashboard') {
      return (
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'STUDENT']} onNavigateToLogin={() => setCurrentTab('login')}>
          <TeacherDashboard />
        </ProtectedRoute>
      );
    }

    if (currentTab === 'student_support') {
      return (
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'STUDENT']} onNavigateToLogin={() => setCurrentTab('login')}>
          <StudentDashboard />
        </ProtectedRoute>
      );
    }

    if (currentTab === 'activity_creation') {
      return (
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'STUDENT']} onNavigateToLogin={() => setCurrentTab('login')}>
          <ActivityCreationStudio onNavigateToDashboard={() => setCurrentTab('teacher_dashboard')} />
        </ProtectedRoute>
      );
    }

    // Default view for teacher
    return (
      <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'STUDENT']} onNavigateToLogin={() => setCurrentTab('login')}>
        <TeacherHomeView onNavigateTab={setCurrentTab} />
      </ProtectedRoute>
    );
  };

  return (
    <div style={styles.appContainer}>
      <LanguageTopBar />
      <div style={styles.appWrapper}>
        {user && <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />}

        <div style={styles.mainLayout}>
          {user && <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />}
          <main style={{ ...styles.mainContent, paddingBottom: !user ? 0 : '3rem' }}>
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
  },
  appWrapper: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
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
