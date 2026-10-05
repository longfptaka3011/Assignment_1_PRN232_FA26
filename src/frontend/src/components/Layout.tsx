import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  Tag,
  Search,
  Plus,
  Bell,
  HelpCircle,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CommandPalette } from './ui/CommandPalette';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clean, purposeful navigation representing all real project modules
  const mainNavItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/departments', label: 'Teams', icon: Users },
    { path: '/tags', label: 'Tags', icon: Tag },
    { path: '/search', label: 'Search Hub', icon: Search },
  ];

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div className="mobile-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* Modern Clean Sidebar Navigation */}
      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header with Brand */}
        <div className="sidebar-header">
          <Link to="/" className="brand-logo" onClick={() => setMobileOpen(false)}>
            <div className="brand-mark">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
                <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" opacity="0.6" />
                <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" opacity="0.6" />
                <rect x="14" y="14" width="7" height="7" rx="2" fill="#4f46e5" />
              </svg>
            </div>
            {!collapsed && (
              <div className="brand-text">
                <span className="brand-title">TASKTRACK</span>
                <span className="brand-subtitle">QE190010</span>
              </div>
            )}
          </Link>

          <button
            className="sidebar-toggle-btn desktop-only"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          <button
            className="sidebar-close-btn mobile-only"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Nav Links with Exact Single-Item Active State */}
        <nav className="sidebar-nav">
          {mainNavItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `nav-item-link ${isActive ? 'nav-item-active' : ''}`
                }
                title={collapsed ? item.label : undefined}
                end={item.path === '/'}
              >
                <div className="nav-item-icon">
                  <Icon size={18} strokeWidth={2} />
                </div>
                {!collapsed && <span className="nav-item-label">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer with Theme Toggle & User Profile */}
        <div className="sidebar-footer">
          {/* Quick theme & system bar */}
          <div className="sidebar-utility-row">
            <button
              className="utility-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
              {!collapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
            </button>
            <button
              className="utility-btn"
              onClick={() => setCmdOpen(true)}
              title="Command Palette (Ctrl+K)"
            >
              <Sparkles size={16} />
              {!collapsed && <span>Shortcuts</span>}
            </button>
          </div>

          {/* User Profile Card */}
          <div className="sidebar-user-profile">
            <div className="user-avatar-wrapper">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                alt="Trần Nguyễn Bảo Long"
                className="user-avatar-img"
                onError={(e) => {
                  // Fallback avatar initial
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="user-avatar-fallback">L</div>
              <span className="user-status-dot online" />
            </div>

            {!collapsed && (
              <div className="user-info">
                <span className="user-name">Trần Nguyễn Bảo Long</span>
                <span className="user-email">longfptaka3011@gmail.com</span>
              </div>
            )}

            {!collapsed && (
              <button
                className="user-more-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title="Account options"
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main App Canvas */}
      <div className="app-main-wrapper">
        {/* Top Header Bar matching Screenshot */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="menu-hamburger-btn mobile-only"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Center / Right Header Tools */}
          <div className="topbar-right">
            {/* Global Search Input */}
            <div className="header-search-bar" onClick={() => setCmdOpen(true)}>
              <Search size={15} className="search-bar-icon" />
              <input
                type="text"
                placeholder="Search tasks, projects..."
                readOnly
                className="search-bar-input"
              />
              <span className="search-kbd-badge">⌘K</span>
            </div>

            {/* Quick Action: New Project */}
            <Link to="/projects/manage" className="btn-new-project">
              <Plus size={15} strokeWidth={2.5} />
              <span>New Project</span>
            </Link>

            {/* Notification Bell */}
            <button className="topbar-icon-btn notification-btn" title="Notifications">
              <Bell size={17} />
              <span className="notification-indicator" />
            </button>

            {/* Help Icon */}
            <button className="topbar-icon-btn" title="Help & Guides">
              <HelpCircle size={17} />
            </button>

            {/* User Dropdown Thumbnail */}
            <div className="topbar-user-dropdown" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"
                alt="Trần Nguyễn Bảo Long"
                className="topbar-avatar-img"
              />
              <ChevronDown size={14} className="dropdown-arrow" />
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="app-main-content animate-fade-in">
          <div className="main-content-inner">{children}</div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
