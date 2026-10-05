import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Layers,
  ArrowRight,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { departmentApi } from '../services/api';
import type { Department } from '../types';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import './DetailPages.css';

export default function PublicDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    departmentApi
      .getAll()
      .then(data => setDepartments(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredDepts = departments.filter(d =>
    d.departmentName.toLowerCase().includes(searchName.toLowerCase())
  );

  return (
    <div className="detail-page-container animate-fade-in" style={{ maxWidth: '1200px' }}>
      {/* Top Banner */}
      <div className="glass-card detail-hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="detail-title">Organizational Departments</h1>
            <p className="detail-desc" style={{ marginTop: '4px' }}>
              Explore operational units, team divisions, and their respective initiatives.
            </p>
          </div>

          {/* Segmented View Switcher */}
          <div className="view-toggle-container">
            <Link to="/departments" className="view-toggle-btn active">
              <Building2 size={15} />
              <span>Overview Cards</span>
            </Link>
            <Link to="/departments/manage" className="view-toggle-btn">
              <Settings size={15} />
              <span>Manage Table</span>
            </Link>
          </div>
        </div>

        {/* Search Input */}
        <div className="search-main-bar" style={{ marginTop: '12px' }}>
          <Search size={18} className="search-bar-icon" />
          <input
            type="text"
            className="search-bar-input"
            placeholder="Search departments by name..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
          {searchName && (
            <button className="search-clear-btn" onClick={() => setSearchName('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Department Cards */}
      <div className="detail-section">
        <div className="section-header-row">
          <h2 className="detail-section-title">Active Departments</h2>
          <span className="badge-pill">{filteredDepts.length} Units</span>
        </div>

        {loading ? (
          <div className="detail-cards-grid">
            <Skeleton height="180px" borderRadius="var(--radius-xl)" />
            <Skeleton height="180px" borderRadius="var(--radius-xl)" />
            <Skeleton height="180px" borderRadius="var(--radius-xl)" />
          </div>
        ) : filteredDepts.length === 0 ? (
          <EmptyState
            title="No departments match search"
            description="Try changing your search keywords or visit Department Management to add new ones."
            actionText="Clear Search"
            onAction={() => setSearchName('')}
          />
        ) : (
          <div className="detail-cards-grid">
            {filteredDepts.map(dept => {
              const projCount = dept.projects ? dept.projects.length : 0;
              return (
                <Link
                  key={dept.departmentId}
                  to={`/departments/${dept.departmentId}`}
                  className="glass-card detail-sub-card"
                >
                  <div className="sub-card-top">
                    <div className="sub-card-title-group">
                      <div className="dept-icon-box" style={{ width: '36px', height: '36px' }}>
                        <Building2 size={18} />
                      </div>
                      <h3 className="sub-card-title">{dept.departmentName}</h3>
                    </div>
                    <Badge
                      label={dept.isActive ? 'Active' : 'Inactive'}
                      variant={dept.isActive ? 'success' : 'neutral'}
                      size="sm"
                    />
                  </div>

                  <p className="sub-card-desc">
                    {dept.departmentDescription || 'No description available for this department.'}
                  </p>

                  <div className="sub-card-bottom">
                    <div className="dept-projects-count">
                      <Layers size={13} />
                      <span>{projCount} Projects</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <span>View Projects</span>
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
