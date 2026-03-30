// /*
// React Task Manager (single-file app)

// Setup instructions (recommended):
// 1. Create a Vite React project (recommended):
//    npm create vite@latest mern-task-frontend -- --template react
//    cd mern-task-frontend
// 2. Install dependencies:
//    npm install
// 3. Install Tailwind CSS (optional but styles use Tailwind):
//    npm install -D tailwindcss postcss autoprefixer
//    npx tailwindcss init -p
//    // tailwind.config.cjs: content: ['./index.html','./src/**/*.{js,jsx}']
//    // src/index.css: @tailwind base; @tailwind components; @tailwind utilities;
//    import './index.css' in main.jsx
// 4. Replace src/App.jsx with the code below. Replace src/main.jsx and index.html as Vite default.
// 5. Run dev:
//    npm run dev

// Notes:
// - This component expects your backend at http://localhost:5000
// - It stores JWT in localStorage (key: token)
// - Basic features: Register, Login, List tasks, Create, Edit, Toggle complete, Delete, Logout
// - Improvements: better routing (React Router), form validation libs, prettier UI

// */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { Pencil, Check, X, Trash2, Plus, Loader2, ListFilter, ArrowUpDown, Hash, ChevronLeft, ChevronRight, Circle, CheckSquare, LogOut, ArrowRight } from 'lucide-react';



const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return { token, setToken, user, setUser, logout };
}

async function apiFetch(path, token, opts = {}) {
  const headers = opts.headers || {};
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, { ...opts, headers });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, body: text ? JSON.parse(text) : null };
  } catch (e) {
    return { ok: res.ok, status: res.status, body: text };
  }
}

// ── Lightweight toast system ─────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((message, type = 'success') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return { toasts, toast };
}

function Toaster({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="animate-fadeIn"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 18px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(139,92,246,0.15)',
            background: t.type === 'error' ? '#fef2f2' : '#f5f3ff',
            border: `1px solid ${t.type === 'error' ? '#fecaca' : '#ddd6fe'}`,
            color: t.type === 'error' ? '#dc2626' : '#7c3aed',
            fontSize: '14px', fontWeight: '500', minWidth: '220px',
          }}
        >
          <span style={{ fontSize: '16px' }}>{t.type === 'error' ? '✕' : '✓'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}


export default function App() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { token, setToken, user, setUser, logout } = auth;


  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (token) {
      setLoadingUser(true);
      apiFetch('/me', token).then(r => {
        setLoadingUser(false);
        if (r.ok && r.body && r.body.me) setUser(r.body.me);
        else {
          // token invalid
          logout();
        }
      }).catch(() => { setLoadingUser(false); logout(); });
    }
  }, [token]);

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={token ? "/tasks" : "/login"} />}
      />

      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/tasks" />
          ) : (
            <AuthForm
              mode="login"
              onSuccess={({ token: t }) => {
                setToken(t);
                navigate('/tasks');
              }}
              switchToRegister={() => navigate('/register')}
            />
          )
        }
      />

      <Route
        path="/register"
        element={
          token ? (
            <Navigate to="/tasks" />
          ) : (
            <AuthForm
              mode="register"
              onSuccess={({ token: t }) => {
                setToken(t);
                navigate('/tasks');
              }}
              switchToLogin={() => navigate('/login')}
            />
          )
        }
      />

      <Route
        path="/tasks"
        element={
          token ? (
            <Tasks token={token} user={user} logout={logout} navigate={navigate} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

function Header({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between mb-10">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <CheckSquare className="w-6 h-6 text-gray-900" />
        <h1 className="text-xl font-semibold tracking-tight">
          TaskFlow
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-2">
        {user ? (
          <>
            <Link
              to="/tasks"
              className="px-4 py-1.5 rounded-full text-sm bg-gray-900 text-white hover:scale-[1.02] transition"
            >
              Tasks
            </Link>

            <div className="flex items-center gap-3 ml-2">
              <span className="text-sm text-gray-500">
                {user.name}
              </span>

              <button
                onClick={() => {
                  onLogout();
                  navigate('/login');
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-full text-sm hover:bg-gray-100 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 rounded-full text-sm bg-gray-900 text-white hover:scale-[1.02] transition"
            >
              Register
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}


function AuthForm({ mode, onSuccess, switchToRegister, switchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Front-end validation
    if (!isLogin && !name.trim()) {
      setError('Name is required');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('A valid email is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    const path = isLogin ? '/auth/login' : '/auth/register';
    const body = isLogin ? { email, password } : { name, email, password };

    const res = await apiFetch(path, null, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      onSuccess(res.body);
    } else {
      if (res.body && res.body.errors) {
        setError(res.body.errors.map(e => e.msg).join('; '));
      } else if (res.body && res.body.message) {
        setError(res.body.message);
      } else {
        setError('Unexpected error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex w-full">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#8b5cf6] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#8b5cf6] to-[#a78bfa]" />
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/30"
              style={{
                width: `${200 + i * 150}px`,
                height: `${200 + i * 150}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CheckSquare className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            TaskFlow
          </h1>
          <p className="text-white/90 text-lg max-w-md mx-auto">
            Organize your tasks beautifully. Stay productive, stay focused.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#8b5cf6] flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">TaskFlow</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-gray-500 mb-8">
            {isLogin
              ? "Enter your credentials to access your tasks"
              : "Sign up to start managing your tasks"}
          </p>

          {error && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100 animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] transition-all"
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] transition-all"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] transition-all"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-2 mt-4 rounded-xl bg-[#8b5cf6] text-white font-semibold hover:bg-[#7c3aed] transition-colors disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <button
              type="button"
              onClick={isLogin ? switchToRegister : switchToLogin}
              className="text-[#8b5cf6] font-medium hover:underline transition-all"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tasks({ token, user, logout, navigate }) {
  const { toasts, toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [completedFilter, setCompletedFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const welcomeShown = useRef(false);



  const fetchTasks = async () => {
    setLoading(true);

    let query = `?page=${page}&limit=${limit}&sort=createdAt:${sortOrder}`;

    if (completedFilter !== 'all') {
      query += `&completed=${completedFilter}`;
    }

    const r = await apiFetch(`/tasks${query}`, token);

    setLoading(false);
    if (r.ok) {
      setTasks(r.body.tasks || []);
      setTotal(r.body.total || 0);
    } else {
      setError('Failed to load tasks');
    }
  };


  useEffect(() => {
    if (token) {
      fetchTasks();
      if (!welcomeShown.current) {
        welcomeShown.current = true;
        toast('Welcome back! 👋');
      }
    }
  }, [token, completedFilter, sortOrder, page, limit]);


  const totalPages = Math.max(1, Math.ceil(total / limit));

  const createTask = async (e) => {
    e && e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setAdding(true);
    const r = await apiFetch('/tasks', token, { method: 'POST', body: JSON.stringify({ title, description }) });
    setAdding(false);
    if (r.ok) {
      setTitle(''); setDescription('');
      fetchTasks();
      toast('Task added!');
    } else {
      const msg = (r.body && (r.body.message || (r.body.errors && r.body.errors.map(x => x.msg).join(', ')))) || 'Create failed';
      toast(msg, 'error');
    }
  };

  const toggleComplete = async (task) => {
    const r = await apiFetch(`/tasks/${task._id}`, token, { method: 'PUT', body: JSON.stringify({ completed: !task.completed }) });
    if (r.ok) {
      fetchTasks();
      toast(task.completed ? 'Marked as incomplete' : 'Task completed! ✓');
    } else {
      toast('Failed to update task', 'error');
    }
  };

  const removeTask = async (task) => {
    const r = await apiFetch(`/tasks/${task._id}`, token, { method: 'DELETE' });
    if (r.ok) {
      fetchTasks();
      toast('Task deleted');
    } else {
      toast('Failed to delete task', 'error');
    }
  };


  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'true', label: 'Done' },
    { value: 'false', label: 'To Do' },
  ];

  const sortOptions = [
    { value: 'desc', label: 'Newest' },
    { value: 'asc', label: 'Oldest' },
  ];

  const perPageOptions = [5, 10];

  return (
    <div className="min-h-screen" style={{ background: '#f4f4f6' }}>
      <Toaster toasts={toasts} />

      {/* Header */}
      <header style={{ borderBottom: '1px solid #e5e7eb', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="max-w-3xl mx-auto px-4" style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>TaskFlow</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700' }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
                <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                  Hello, <strong style={{ color: '#7c3aed' }}>{user.name ? user.name.split(' ')[0] : 'there'}</strong>
                </span>
              </div>
            )}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#6b7280', cursor: 'pointer', fontSize: '14px' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4" style={{ paddingTop: '32px', paddingBottom: '48px' }}>

        {/* Add Task Form */}
        <form
          onSubmit={createTask}
          style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Add New Task</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              placeholder="Task title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={{ height: '44px', padding: '0 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '14px', outline: 'none', resize: 'none', width: '100%', boxSizing: 'border-box', minHeight: '80px', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
            <div>
              <button
                type="submit"
                disabled={adding || !title.trim()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', background: adding || !title.trim() ? '#c4b5fd' : '#8b5cf6', color: 'white', border: 'none', fontWeight: '600', fontSize: '14px', cursor: adding || !title.trim() ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
              >
                {adding ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: '16px', height: '16px' }} />}
                Add Task
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>

          {/* Status filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '4px' }}>
            <ListFilter style={{ width: '16px', height: '16px', color: '#9ca3af', marginLeft: '8px' }} />
            {filterOptions.map(f => (
              <button
                key={f.value}
                onClick={() => { setPage(1); setCompletedFilter(f.value); }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer', background: completedFilter === f.value ? '#8b5cf6' : 'transparent', color: completedFilter === f.value ? 'white' : '#6b7280', transition: 'all 0.15s' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '4px' }}>
            <ArrowUpDown style={{ width: '16px', height: '16px', color: '#9ca3af', marginLeft: '8px' }} />
            {sortOptions.map(s => (
              <button
                key={s.value}
                onClick={() => setSortOrder(s.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer', background: sortOrder === s.value ? '#8b5cf6' : 'transparent', color: sortOrder === s.value ? 'white' : '#6b7280', transition: 'all 0.15s' }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '4px' }}>
            <Hash style={{ width: '16px', height: '16px', color: '#9ca3af', marginLeft: '8px' }} />
            {perPageOptions.map(n => (
              <button
                key={n}
                onClick={() => { setPage(1); setLimit(n); }}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer', background: limit === n ? '#8b5cf6' : 'transparent', color: limit === n ? 'white' : '#6b7280', transition: 'all 0.15s' }}
              >
                {n}/pg
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
            <Loader2 style={{ width: '32px', height: '32px', color: '#8b5cf6', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckSquare style={{ width: '32px', height: '32px', color: '#8b5cf6' }} />
            </div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>No tasks yet</p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Add your first task above to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.map(t => (
              <div
                key={t._id}
                className="task-card"
                style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', transition: 'box-shadow 0.2s', opacity: t.completed ? 0.7 : 1 }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Toggle button */}
                <button
                  onClick={() => toggleComplete(t)}
                  style={{ marginTop: '2px', width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: t.completed ? 'none' : '2px solid #d1d5db', background: t.completed ? '#8b5cf6' : 'transparent', color: t.completed ? 'white' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { if (!t.completed) { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.color = '#8b5cf6'; } }}
                  onMouseLeave={e => { if (!t.completed) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = 'transparent'; } }}
                >
                  {t.completed ? <Check style={{ width: '14px', height: '14px' }} /> : <Circle style={{ width: '12px', height: '12px' }} />}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '600', color: t.completed ? '#9ca3af' : '#111827', textDecoration: t.completed ? 'line-through' : 'none', marginBottom: '2px' }}>
                    {t.title}
                  </p>
                  {t.description && (
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description}
                    </p>
                  )}
                  <p style={{ fontSize: '12px', color: '#d1d5db', marginTop: '8px' }}>
                    {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Delete button (shows on hover via CSS class) */}
                <button
                  onClick={() => removeTask(t)}
                  className="delete-btn"
                  style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#9ca3af', cursor: 'pointer', transition: 'all 0.2s', opacity: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '32px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: page === 1 ? '#d1d5db' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
              Prev
            </button>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: page === totalPages ? '#d1d5db' : '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              Next
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#d1d5db', marginTop: '32px' }}>
          {total} task{total !== 1 ? 's' : ''} total
        </p>
      </main>
    </div>
  );
}
