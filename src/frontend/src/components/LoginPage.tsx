import React, { useState } from 'react';
import { useAuthStore, DEMO_USERS, DemoUser } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function LoginPage() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, resetPassword, loginAsDemoUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await signIn(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setErrorMsg(res.error || 'Invalid email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await signUp(email, password, fullName);
      if (res.success) {
        setSuccessMsg('Account created successfully! You are now logged in.');
        setTimeout(() => navigate('/'), 1200);
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await resetPassword(email);
      if (res.success) {
        setSuccessMsg('Password reset link sent to your email.');
      } else {
        setErrorMsg(res.error || 'Failed to send reset link.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemoUser = (user: DemoUser) => {
    loginAsDemoUser(user);
    navigate('/');
  };

  return (
    <div className="login-page-container">
      {/* Background ambient lighting effects */}
      <div className="login-ambient-blob blob-1" />
      <div className="login-ambient-blob blob-2" />

      <div className="login-card-wrapper">
        {/* Brand header */}
        <div className="login-brand-header">
          <div className="login-logo-badge">
            <Sparkles size={24} className="text-primary-color" />
          </div>
          <h1 className="login-brand-title">TaskFlow</h1>
          <p className="login-brand-subtitle">
            Agile Kanban Workspace & Team Collaboration
          </p>
        </div>

        {/* Tab switcher */}
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => { setActiveTab('signin'); setErrorMsg(null); setSuccessMsg(null); }}
          >
            <LogIn size={16} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => { setActiveTab('signup'); setErrorMsg(null); setSuccessMsg(null); }}
          >
            <UserPlus size={16} />
            <span>Sign Up</span>
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'forgot' ? 'active' : ''}`}
            onClick={() => { setActiveTab('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
          >
            <KeyRound size={16} />
            <span>Reset</span>
          </button>
        </div>

        {/* Alert Banners */}
        {errorMsg && (
          <div className="login-alert alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="login-alert alert-success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="login-form">
            <div className="login-input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="name@taskflow.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="login-input-group">
              <div className="flex-between">
                <label>Password</label>
                <button
                  type="button"
                  className="login-link-btn"
                  onClick={() => setActiveTab('forgot')}
                >
                  Forgot?
                </button>
              </div>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="login-spinner" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="login-form">
            <div className="login-input-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  required
                  placeholder="Alex Developer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="alex.developer@taskflow.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Create Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="login-spinner" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {activeTab === 'forgot' && (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="login-input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  required
                  placeholder="name@taskflow.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="login-spinner" />
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Demo Fast Login Section */}
        <div className="demo-accounts-divider">
          <span>Or explore with demo account</span>
        </div>

        <div className="demo-accounts-grid">
          {DEMO_USERS.map((u) => (
            <button
              key={u.id}
              type="button"
              className="demo-account-pill"
              onClick={() => handleSelectDemoUser(u)}
            >
              <img src={u.avatarUrl} alt={u.fullName} className="demo-pill-avatar" />
              <div className="demo-pill-info">
                <span className="demo-pill-name">{u.fullName}</span>
                <span className="demo-pill-role">{u.role}</span>
              </div>
              <ShieldCheck size={14} className="demo-pill-check" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
