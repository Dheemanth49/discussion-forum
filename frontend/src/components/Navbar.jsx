import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search)}`);
      setSearch('');
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full flex justify-between items-center px-4 md:px-8 h-20 bg-[#111125]/70 backdrop-blur-xl z-[100] shadow-[0_10px_40px_rgba(0,0,0,0.12)] border-b border-outline-variant/20">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-[#65dabc] font-headline bg-gradient-to-br from-secondary to-primary bg-clip-text text-transparent">ForumHub</Link>
          <div className="hidden md:flex gap-8">
            <Link to="/" className="text-primary font-bold border-b-2 border-primary pb-1 font-headline tracking-[-0.04em] antialiased">Explore</Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <form className="relative hidden sm:block" onSubmit={handleSearch}>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant flex items-center justify-center">search</span>
            <input 
              className="bg-surface-container-lowest border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all text-on-surface outline-none" 
              placeholder="Search discussions..." 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-4">
            {isAuthenticated() ? (
              <>
                <button className="material-symbols-outlined text-[#e2e0fc]/60 hover:text-[#e2e0fc] transition-colors hidden sm:block">notifications</button>
                <Link to="/create" className="hidden sm:block bg-gradient-to-br from-primary to-primary-container text-on-primary-container px-6 py-2 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-[0_4px_12px_rgba(101,218,188,0.2)] hover:shadow-[0_8px_20px_rgba(101,218,188,0.3)]">
                  New Post
                </Link>
                
                <div className="relative">
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-primary/20 cursor-pointer bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-on-primary-container font-extrabold text-sm"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  
                  {showMenu && (
                    <div className="absolute right-0 top-14 w-48 bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-3xl">
                      <div className="px-4 py-3 border-b border-outline-variant/20">
                        <p className="text-sm text-on-surface font-bold truncate">{user?.username}</p>
                        <p className="text-[10px] text-on-surface-variant truncate">{user?.email}</p>
                        {isAdmin() && <span className="inline-block mt-1 px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-[10px] rounded-full font-bold uppercase tracking-widest shadow-inner">Admin</span>}
                      </div>
                      <Link to="/dashboard" onClick={() => setShowMenu(false)} className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container-highest transition-colors font-medium">Dashboard</Link>
                      {isAdmin() && <Link to="/admin" onClick={() => setShowMenu(false)} className="block px-4 py-2 text-sm text-on-surface hover:bg-surface-container-highest transition-colors font-medium">Admin Panel</Link>}
                      <button onClick={() => { logout(); setShowMenu(false); navigate('/login'); }} className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors font-bold">Sign out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors font-bold text-sm rounded-xl">Sign In</Link>
                <Link to="/register" className="bg-surface-container-highest border border-outline-variant/20 text-on-surface px-6 py-2 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-black/20 hover:bg-surface-variant">Register</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 w-full z-[100] flex justify-around items-center h-20 px-6 pb-4 pt-2 bg-[#1e1e32]/90 backdrop-blur-xl shadow-[0_-10px_40px_rgba(101,218,188,0.05)] rounded-t-[2rem] border-t border-outline-variant/20">
        <Link to="/" className="flex flex-col items-center justify-center text-[#65dabc] scale-110">
          <span className="material-symbols-outlined">rss_feed</span>
          <span className="font-label text-[10px] uppercase tracking-[0.1em] font-bold">Feed</span>
        </Link>
        <Link to="/" className="flex flex-col items-center justify-center text-[#e2e0fc]/40 hover:text-[#e2e0fc] transition-colors">
          <span className="material-symbols-outlined">search</span>
          <span className="font-label text-[10px] uppercase tracking-[0.1em] mt-1">Search</span>
        </Link>
        {isAuthenticated() ? (
          <>
            <Link to="/create" className="flex flex-col items-center justify-center text-[#e2e0fc]/40 hover:text-[#e2e0fc] transition-colors">
              <span className="material-symbols-outlined">add_circle</span>
              <span className="font-label text-[10px] uppercase tracking-[0.1em] mt-1">Post</span>
            </Link>
            <Link to="/dashboard" className="flex flex-col items-center justify-center text-[#e2e0fc]/40 hover:text-[#e2e0fc] transition-colors">
              <span className="material-symbols-outlined">person</span>
              <span className="font-label text-[10px] uppercase tracking-[0.1em] mt-1">Profile</span>
            </Link>
          </>
        ) : (
          <Link to="/login" className="flex flex-col items-center justify-center text-[#e2e0fc]/40 hover:text-[#e2e0fc] transition-colors">
            <span className="material-symbols-outlined">login</span>
            <span className="font-label text-[10px] uppercase tracking-[0.1em] mt-1">Login</span>
          </Link>
        )}
      </nav>

      {/* Contextual FAB (Mobile + New Post) */}
      {isAuthenticated() && (
        <Link to="/create" className="fixed bottom-24 right-6 bg-gradient-to-br from-primary to-primary-container text-on-primary-container w-14 h-14 rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(101,218,188,0.25)] hover:scale-110 active:scale-90 transition-transform z-[90] sm:hidden">
          <span className="material-symbols-outlined text-3xl font-bold">add</span>
        </Link>
      )}
    </>
  );
}
