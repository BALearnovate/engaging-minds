import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ActivityCreationStudio } from './components/ActivityCreationStudio';
import { ClassroomSetupComponent } from './components/ClassroomSetupComponent';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('classroom_setup');

  const handleLoginSuccess = (role: string) => {
    if (role === 'STUDENT') {
      setCurrentTab('student_home');
    } else {
      setCurrentTab('classroom_setup');
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

    if (currentTab === 'activity_creation' || currentTab === 'home') {
      return (
        <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'STUDENT']} onNavigateToLogin={() => setCurrentTab('login')}>
          <ActivityCreationStudio />
        </ProtectedRoute>
      );
    }

    // Default view for teacher
    return (
      <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'STUDENT']} onNavigateToLogin={() => setCurrentTab('login')}>
        <ClassroomSetupComponent />
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
