import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import { warmupBackend } from './services/api';

// Pages
import Dashboard from './pages/Dashboard';
import PublicDepartments from './pages/PublicDepartments';
import DepartmentDetail from './pages/DepartmentDetail';
import DepartmentList from './pages/DepartmentList';

import PublicProjects from './pages/PublicProjects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectList from './pages/ProjectList';

import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';

import TagList from './pages/TagList';
import SearchPage from './pages/SearchPage';

export default function App() {
  useEffect(() => {
    warmupBackend();
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/departments" element={<PublicDepartments />} />
              <Route path="/departments/:id" element={<DepartmentDetail />} />
              <Route path="/projects" element={<PublicProjects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/search" element={<SearchPage />} />

              {/* Management Pages (Public CRUD) */}
              <Route path="/departments/manage" element={<DepartmentList />} />
              <Route path="/projects/manage" element={<ProjectList />} />
              <Route path="/tasks/manage" element={<TaskList />} />
              <Route path="/tags" element={<TagList />} />
              <Route path="/tags/manage" element={<TagList />} />

              {/* Fallback */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
