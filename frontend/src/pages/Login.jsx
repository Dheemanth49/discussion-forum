import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      login(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-body text-on-surface min-h-screen flex items-center justify-center p-0 md:p-6 lg:p-12 overflow-x-hidden fixed inset-0 z-[200] bg-surface" style={{ backgroundImage: 'radial-gradient(at 0% 0%, rgba(101, 218, 188, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 178, 255, 0.15) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(30, 30, 50, 0.5) 0px, transparent 50%)' }}>
      <main className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 min-h-[100dvh] md:min-h-[85vh] md:rounded-3xl overflow-hidden shadow-[0_24px_48px_rgba(17,17,37,0.5)] bg-surface">

        {/* Left Column: Decorative Panel */}
        <section className="hidden md:flex flex-col justify-between p-12 relative bg-surface-container-low overflow-hidden">
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-3xl text-primary" data-icon="forum">forum</span>
              <h1 className="font-headline text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-secondary to-primary">ForumHub</h1>
            </Link>
            <h2 className="font-headline text-5xl font-extrabold leading-tight mb-6">
              Connect with the <br />
              <span className="text-primary">Global Archive.</span>
            </h2>
            <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">
              Join the members discussing the future of technology, philosophy, and digital art in our curated sanctuaries.
            </p>
          </div>



          {/* Background Illustration Layer */}
          <div className="absolute bottom-[-10%] right-[-10%] opacity-20 pointer-events-none transform rotate-12">
            <span className="material-symbols-outlined text-[400px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
          </div>
          <div className="absolute top-[20%] right-[10%] opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[200px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          </div>
        </section>

        {/* Right Column: Login Card */}
        <section className="flex items-center justify-center p-8 md:p-16 lg:p-24 bg-surface relative">

          {/* Mobile Logo Only */}
          <Link to="/" className="absolute top-8 left-8 md:hidden flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-primary" data-icon="forum">forum</span>
            <span className="font-headline font-bold bg-clip-text text-transparent bg-gradient-to-br from-secondary to-primary">ForumHub</span>
          </Link>

          <div className="w-full max-w-md p-8 md:p-10 rounded-[2rem] border border-outline-variant/20 shadow-2xl backdrop-blur-2xl bg-surface-variant/40">
            <header className="mb-10 text-center md:text-left">
              <h3 className="font-headline text-3xl font-bold text-on-surface mb-2">Welcome Back</h3>
              <p className="text-on-surface-variant font-body">Please enter your details to sign in.</p>
            </header>

            {error && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl font-bold border border-error/50">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">mail</span>
                  </div>
                  <input
                    className="w-full bg-surface-container-lowest border-none rounded-2xl py-4 pl-12 pr-4 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                    id="email" name="email" placeholder="name@example.com" type="email" required
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-medium text-on-surface-variant" htmlFor="password">Password</label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                  </div>
                  <input
                    className="w-full bg-surface-container-lowest border-none rounded-2xl py-4 pl-12 pr-12 text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                    id="password" name="password" placeholder="••••••••" type={showPassword ? 'text' : 'password'} required
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline-variant hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-3 px-1">
                <input className="w-5 h-5 rounded border-none bg-surface-container-highest text-primary focus:ring-offset-background focus:ring-primary cursor-pointer accent-primary" id="remember" name="remember" type="checkbox" />
                <label className="text-sm text-on-surface-variant cursor-pointer select-none" htmlFor="remember">Remember me for 30 days</label>
              </div>

              {/* Sign In Button */}
              <button
                className="w-full bg-gradient-to-br from-secondary-container to-primary text-on-surface font-headline font-bold py-4 rounded-2xl shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
                type="submit" disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
              </button>

            </form>

            <footer className="mt-12 text-center">
              <p className="text-on-surface-variant">
                Don't have an account?
                <Link className="text-secondary font-bold hover:underline transition-all ml-1" to="/register">Register</Link>
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
