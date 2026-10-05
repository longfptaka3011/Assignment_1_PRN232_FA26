import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  CheckSquare,
  FolderKanban,
  Building2,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { taskApi, projectApi, departmentApi } from '../../services/api';
import type { Task, Project, Department } from '../../types';
import './CommandPalette.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setLoading(true);
      Promise.all([taskApi.getAll(), projectApi.getAll(), departmentApi.getAll()])
        .then(([t, p, d]) => {
          setTasks(t);
          setProjects(p);
          setDepartments(d);
        })
        .catch(err => console.error(err))
        .finally(() => {
          setLoading(false);
          setTimeout(() => inputRef.current?.focus(), 50);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredTasks = q ? tasks.filter(t => t.title.toLowerCase().includes(q)) : tasks.slice(0, 4);
  const filteredProjects = q ? projects.filter(p => p.projectName.toLowerCase().includes(q)) : projects.slice(0, 3);
  const filteredDepts = q ? departments.filter(d => d.departmentName.toLowerCase().includes(q)) : departments.slice(0, 3);

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  const totalResults = filteredTasks.length + filteredProjects.length + filteredDepts.length;

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette-modal animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="cmd-palette-input-row">
          <Search size={20} className="cmd-palette-icon" />
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette-input"
            placeholder="Type a command or search tasks, projects, departments..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className="cmd-palette-clear-btn" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
          <span className="cmd-palette-esc">ESC</span>
        </div>

        {/* Results List */}
        <div className="cmd-palette-body">
          {loading ? (
            <div className="cmd-palette-empty">Loading workspace data...</div>
          ) : totalResults === 0 ? (
            <div className="cmd-palette-empty">
              <span>No results matching "{query}"</span>
            </div>
          ) : (
            <>
              {/* Tasks */}
              {filteredTasks.length > 0 && (
                <div className="cmd-palette-group">
                  <div className="cmd-palette-group-title">
                    <CheckSquare size={13} />
                    <span>Tasks</span>
                  </div>
                  {filteredTasks.map(t => (
                    <div
                      key={t.taskId}
                      className="cmd-palette-item"
                      onClick={() => handleSelect(`/tasks/${t.taskId}`)}
                    >
                      <div className="cmd-item-left">
                        <span className="cmd-item-title">{t.title}</span>
                        <span className="cmd-item-sub">{t.projectName || 'General'}</span>
                      </div>
                      <div className="cmd-item-right">
                        <span className="cmd-item-badge">{t.statusName || 'Active'}</span>
                        <ArrowRight size={13} className="cmd-item-arrow" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {filteredProjects.length > 0 && (
                <div className="cmd-palette-group">
                  <div className="cmd-palette-group-title">
                    <FolderKanban size={13} />
                    <span>Projects</span>
                  </div>
                  {filteredProjects.map(p => (
                    <div
                      key={p.projectId}
                      className="cmd-palette-item"
                      onClick={() => handleSelect(`/projects/${p.projectId}`)}
                    >
                      <div className="cmd-item-left">
                        <span className="cmd-item-title">{p.projectName}</span>
                        <span className="cmd-item-sub">{p.departmentName}</span>
                      </div>
                      <div className="cmd-item-right">
                        <ArrowRight size={13} className="cmd-item-arrow" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Departments */}
              {filteredDepts.length > 0 && (
                <div className="cmd-palette-group">
                  <div className="cmd-palette-group-title">
                    <Building2 size={13} />
                    <span>Departments</span>
                  </div>
                  {filteredDepts.map(d => (
                    <div
                      key={d.departmentId}
                      className="cmd-palette-item"
                      onClick={() => handleSelect(`/departments/${d.departmentId}`)}
                    >
                      <div className="cmd-item-left">
                        <span className="cmd-item-title">{d.departmentName}</span>
                        <span className="cmd-item-sub">{d.departmentDescription || 'Department'}</span>
                      </div>
                      <div className="cmd-item-right">
                        <ArrowRight size={13} className="cmd-item-arrow" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="cmd-palette-footer">
          <div className="cmd-footer-shortcuts">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> to navigate
            </span>
            <span>
              <kbd>↵</kbd> to select
            </span>
            <span>
              <kbd>esc</kbd> to close
            </span>
          </div>
          <div className="cmd-footer-brand">
            <Sparkles size={12} />
            <span>TaskTrack Quick Access</span>
          </div>
        </div>
      </div>
    </div>
  );
};
