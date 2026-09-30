import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeAndLang } from '../stores/themeAndLangStore';
import { Project, Notification } from '../types';
import { 
  CheckSquare, 
  Bell, 
  Plus, 
  Search, 
  ChevronDown, 
  Check, 
  Sparkles,
  LogOut,
  Sun,
  Moon,
  UserCheck,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

interface NavbarProps {
  currentProject: Project;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onOpenCreateIssue: () => void;
  notifications: Notification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onSelectIssueByKey?: (key: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onOpenCreateIssue,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSelectIssueByKey,
  searchQuery,
  onSearchChange
}) => {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  const { profile, isDemoUser, signOut } = useAuthStore();
  const { theme, toggleTheme, lang, setLanguage, t } = useThemeAndLang();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'unread') return !n.isRead;
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'IssueAssigned':
        return <UserCheck size={14} className="text-primary" />;
      case 'CommentAdded':
        return <MessageSquare size={14} className="text-secondary" />;
      case 'IssueStatusChanged':
        return <ArrowRight size={14} className="text-success" />;
      default:
        return <Sparkles size={14} className="text-warning" />;
    }
  };

  const formatTimeAgo = (dateStr: string): string => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead && onMarkNotificationRead) {
      onMarkNotificationRead(n.id);
    }
    setShowNotifMenu(false);
    if (n.linkUrl && onSelectIssueByKey) {
      onSelectIssueByKey(n.linkUrl);
    }
  };

  return (
    <header className="navbar glass-panel" id="main-navbar">
      <div className="navbar-left">
        <div className="brand-logo" id="brand-logo">
          <div className="brand-icon-wrapper">
            <CheckSquare className="brand-icon" size={20} />
          </div>
          <span className="brand-title">{t('appName')}</span>
          <span className="badge badge-brand">Pro</span>
        </div>

        {/* Project Selector */}
        <div className="project-dropdown-container">
          <button 
            className="project-selector-btn"
            id="project-selector-btn"
            onClick={() => setShowProjectMenu(!showProjectMenu)}
          >
            <div className="project-avatar-badge">{currentProject.key}</div>
            <div className="project-name-wrap">
              <span className="project-name">{currentProject.name}</span>
            </div>
            <ChevronDown size={14} className="dropdown-arrow" />
          </button>

          {showProjectMenu && (
            <div className="dropdown-menu glass-panel" id="project-dropdown-menu">
              <div className="dropdown-header">{t('switchProject')}</div>
              {projects.map(p => (
                <button
                  key={p.id}
                  className={`dropdown-item ${p.id === currentProject.id ? 'active' : ''}`}
                  onClick={() => {
                    onSelectProject(p);
                    setShowProjectMenu(false);
                  }}
                >
                  <div className="project-avatar-badge small">{p.key}</div>
                  <div className="dropdown-item-text">
                    <span className="item-title">{p.name}</span>
                    <span className="item-sub">{p.issueCount} issues</span>
                  </div>
                  {p.id === currentProject.id && <Check size={14} className="check-icon" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="navbar-center">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            id="global-search-input"
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <kbd className="search-shortcut">⌘K</kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="navbar-right">
        {/* Language Switcher Button */}
        <button
          className="icon-btn lang-toggle-btn"
          id="lang-toggle-btn"
          onClick={() => setLanguage(lang === 'vi' ? 'en' : 'vi')}
          title={lang === 'vi' ? 'Chuyển sang English' : 'Switch to Tiếng Việt'}
        >
          <span className="lang-flag">{lang === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}</span>
        </button>

        {/* Theme Mode Toggle Button */}
        <button
          className="icon-btn theme-toggle-btn"
          id="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={17} className="text-warning" /> : <Moon size={17} />}
        </button>

        {/* Create Issue Action */}
        <button 
          className="btn btn-primary create-issue-btn"
          id="btn-open-create-issue"
          onClick={onOpenCreateIssue}
        >
          <Plus size={16} />
          <span>{t('createIssue')}</span>
        </button>

        {/* Notifications Popover */}
        <div className="notification-container">
          <button 
            className="icon-btn" 
            id="notifications-btn"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge pulse-badge" id="notif-count-badge">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="dropdown-menu notif-menu glass-panel" id="notifications-menu">
              <div className="notif-menu-header">
                <div className="notif-title-row">
                  <span className="notif-header-title">{t('notifications')}</span>
                  {unreadCount > 0 && (
                    <button className="mark-read-btn" onClick={onMarkAllNotificationsRead}>
                      {t('markAllRead')}
                    </button>
                  )}
                </div>
                {/* Filter Tabs */}
                <div className="notif-tabs-filter">
                  <button
                    className={`notif-filter-tab ${notifFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setNotifFilter('all')}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    className={`notif-filter-tab ${notifFilter === 'unread' ? 'active' : ''}`}
                    onClick={() => setNotifFilter('unread')}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>
              </div>

              <div className="notif-list">
                {filteredNotifications.length === 0 ? (
                  <div className="empty-notif">{t('noNotifications')}</div>
                ) : (
                  filteredNotifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`notif-item ${n.isRead ? 'read' : 'unread'}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="notif-avatar-col">
                        <img 
                          src={n.senderAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.senderName}`}
                          alt="" 
                          className="notif-user-avatar"
                        />
                        <div className="notif-type-icon-badge">
                          {getNotifIcon(n.type)}
                        </div>
                      </div>

                      <div className="notif-content">
                        <div className="notif-top">
                          <span className="notif-title">{n.title}</span>
                          <span className="notif-time">{formatTimeAgo(n.createdAt)}</span>
                        </div>
                        <div className="notif-message">{n.message}</div>
                      </div>

                      {!n.isRead && onMarkNotificationRead && (
                        <button
                          type="button"
                          className="notif-mark-single-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkNotificationRead(n.id);
                          }}
                          title="Mark as read"
                        >
                          <span className="unread-dot" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile with Dropdown */}
        <div className="user-profile-container">
          <button 
            className="user-profile-widget" 
            id="user-profile-widget"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <img 
              src={profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.fullName || 'User')}`} 
              alt={profile?.fullName || 'User'} 
              className="user-avatar"
            />
            <div className="user-info">
              <span className="user-name">{profile?.fullName || 'Alex Developer'}</span>
              <span className="user-role">{isDemoUser ? t('demoAccount') : (profile?.email || 'Active')}</span>
            </div>
            <ChevronDown size={14} className="dropdown-arrow" />
          </button>

          {showUserMenu && (
            <div className="dropdown-menu user-dropdown-menu glass-panel" id="user-dropdown-menu">
              <div className="dropdown-header">
                <div className="font-semibold text-primary-color">{profile?.fullName}</div>
                <div className="text-xs text-muted-color">{profile?.email}</div>
              </div>
              <div className="dropdown-divider" />
              <button 
                className="dropdown-item text-danger"
                onClick={() => {
                  signOut();
                  navigate('/login');
                }}
              >
                <LogOut size={16} />
                <span>{t('logOut')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
