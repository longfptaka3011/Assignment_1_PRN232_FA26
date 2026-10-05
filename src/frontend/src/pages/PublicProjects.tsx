import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Building2,
  Calendar,
  ArrowRight,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { projectApi, departmentApi } from '../services/api';
import type { Project, Department } from '../types';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import './DetailPages.css';

export default function PublicProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState('');
  const [deptFilter, setDeptFilter] = useState<number | ''>('');

  useEffect(() => {
    Promise.all([projectApi.getAll(), departmentApi.getAll()])
      .then(([projs, depts]) => {
        setProjects(projs);
        setDepartments(depts);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = projects.filter(p => {
    const matchesName = p.projectName.toLowerCase().includes(searchName.toLowerCase());
    const matchesDept = deptFilter === '' || p.departmentId === Number(deptFilter);
    return matchesName && matchesDept;
  });

  return (
    <div className="detail-page-container animate-fade-in" style={{ maxWidth: '1200px' }}>
      {/* Top Banner */}
      <div className="glass-card detail-hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="detail-title">Enterprise Projects</h1>
            <p className="detail-desc" style={{ marginTop: '4px' }}>
              Strategic roadmap, team initiatives, and milestone progress tracking.
            </p>
          </div>

          {/* Segmented Switcher */}
          <div className="view-toggle-container">
            <Link to="/projects" className="view-toggle-btn active">
              <FolderKanban size={15} />
              <span>Project Cards</span>
            </Link>
            <Link to="/projects/manage" className="view-toggle-btn">
              <Settings size={15} />
              <span>Manage Table</span>
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          <div className="search-main-bar" style={{ flex: 1, minWidth: '240px' }}>
            <Search size={18} className="search-bar-icon" />
            <input
              type="text"
              className="search-bar-input"
              placeholder="Search projects..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
            {searchName && (
              <button className="search-clear-btn" onClick={() => setSearchName('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <select
            className="criteria-select"
            style={{ width: '200px' }}
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="detail-section">
        <div className="section-header-row">
          <h2 className="detail-section-title">All Active Projects</h2>
          <span className="badge-pill">{filteredProjects.length} Projects</span>
        </div>

        {loading ? (
          <div className="detail-cards-grid">
            <Skeleton height="200px" borderRadius="var(--radius-xl)" />
            <Skeleton height="200px" borderRadius="var(--radius-xl)" />
            <Skeleton height="200px" borderRadius="var(--radius-xl)" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No projects match filters"
            description="Try clearing your search query or selecting another department."
            actionText="Clear Filters"
            onAction={() => {
              setSearchName('');
              setDeptFilter('');
            }}
          />
        ) : (
          <div className="detail-cards-grid">
            {filteredProjects.map(proj => {
              const taskCount = proj.tasks ? proj.tasks.length : 0;
              const completedCount = proj.tasks ? proj.tasks.filter(t => t.status === 2).length : 0;
              const pct = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

              return (
                <Link
                  key={proj.projectId}
                  to={`/projects/${proj.projectId}`}
                  className="glass-card detail-sub-card"
                >
                  <div className="sub-card-top">
                    <div className="sub-card-title-group">
                      <div
                        className="dept-icon-box"
                        style={{
                          width: '36px',
                          height: '36px',
                          background: 'rgba(139, 92, 246, 0.12)',
                          color: '#8b5cf6',
                        }}
                      >
                        <FolderKanban size={18} />
                      </div>
                      <h3 className="sub-card-title">{proj.projectName}</h3>
                    </div>
                    <Badge
                      label={proj.statusName || (proj.status === 2 ? 'Done' : 'Active')}
                      variant={proj.status === 2 ? 'success' : 'info'}
                      size="sm"
                    />
                  </div>

                  <p className="sub-card-desc">
                    {proj.description || 'No project description provided.'}
                  </p>

                  <div className="dept-projects-count" style={{ marginTop: '4px' }}>
                    <Building2 size={13} />
                    <span>{proj.departmentName}</span>
                  </div>

                  {taskCount > 0 && (
                    <div className="hero-progress-box" style={{ padding: '8px 12px', marginTop: '6px' }}>
                      <div className="hero-progress-labels" style={{ fontSize: '0.75rem' }}>
                        <span>Progress</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="progress-track" style={{ height: '6px' }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                      </div>
                    </div>
                  )}

                  <div className="sub-card-bottom" style={{ marginTop: '8px' }}>
                    <div className="sub-card-date">
                      <Calendar size={12} />
                      <span>{new Date(proj.startDate).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <span>View Details</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
