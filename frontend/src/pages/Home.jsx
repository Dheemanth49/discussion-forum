import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../api';

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] toast-enter">
      <div className="bg-surface-container-high border border-outline-variant/30 text-on-surface px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium text-sm">
        <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
        {message}
      </div>
    </div>
  );
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const categoryQuery = searchParams.get('category');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data)).catch(() => { });
  }, []);

  useEffect(() => {
    if (categoryQuery) {
      setActiveCategory(Number(categoryQuery));
      setActiveTab('latest');
      return;
    }
    setActiveCategory(null);
  }, [categoryQuery]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let url = '/posts?size=20';
    if (searchQuery) url = `/posts/search?q=${encodeURIComponent(searchQuery)}&size=20`;
    else if (activeCategory) url = `/posts/category/${activeCategory}?size=20`;
    else if (activeTab === 'trending') url = '/posts/trending?size=20';
    else if (activeTab === 'unanswered') url = '/posts/unanswered?size=20';
    else url = `/posts?sort=${activeTab}&size=20`;

    API.get(url)
      .then(r => setPosts(r.data.content || r.data || []))
      .catch((err) => {
        setPosts([]);
        setError(err.response?.data?.message || err.message || 'Failed to connect to the server');
      })
      .finally(() => setLoading(false));
  }, [activeTab, activeCategory, searchQuery]);

  const handleVote = async (postId, upvote, index) => {
    if (!isAuthenticated()) return;
    try {
      const res = await API.post(`/posts/${postId}/vote?upvote=${upvote}`);
      setPosts(prev => prev.map((p, i) => i === index ? res.data : p));
    } catch (err) { }
  };

  const handleShare = async (post) => {
    const url = `${window.location.origin}/post/${post.postId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          setToast('Link copied!');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      setToast('Link copied to clipboard!');
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getCategoryTheme = (name) => {
    if (name.toLowerCase().includes('tech') || name.toLowerCase() === 'technology') return { bg: 'bg-primary/10', text: 'text-primary' };
    if (name.toLowerCase().includes('science')) return { bg: 'bg-secondary/10', text: 'text-secondary' };
    if (name.toLowerCase().includes('education')) return { bg: 'bg-tertiary/10', text: 'text-tertiary' };
    if (name.toLowerCase().includes('general')) return { bg: 'bg-surface-container-high', text: 'text-on-surface' };
    return { bg: 'bg-surface-container-high', text: 'text-primary' };
  };

  return (
    <div className="max-w-[1440px] mx-auto pt-24 pb-24 sm:pb-12 px-3 sm:px-6 lg:px-8 flex gap-6 lg:gap-8">
      {/* SideNavBar (Left Sidebar) */}
      <aside className="hidden lg:flex flex-col w-64 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto font-label shrink-0">
        <div className="mb-8 px-4">
          <h2 className="text-[#65dabc] font-black text-xs uppercase tracking-widest mb-4">Navigation</h2>
          <div className="space-y-1">
            <button onClick={() => { setActiveCategory(null); setActiveTab('latest'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-full font-semibold transition-all ${!activeCategory && activeTab === 'latest' ? 'bg-[#65dabc]/10 text-[#65dabc]' : 'text-[#e2e0fc]/50 hover:text-[#e2e0fc] hover:bg-[#1e1e32]'}`}>
              <span className="material-symbols-outlined">home</span>
              Home
            </button>
            <button onClick={() => { setActiveCategory(null); setActiveTab('trending'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-full font-semibold transition-all ${!activeCategory && activeTab === 'trending' ? 'bg-[#65dabc]/10 text-[#65dabc]' : 'text-[#e2e0fc]/50 hover:text-[#e2e0fc] hover:bg-[#1e1e32]'}`}>
              <span className="material-symbols-outlined">trending_up</span>
              Popular
            </button>
          </div>
        </div>

        <div className="px-4">
          <h2 className="text-on-surface-variant font-black text-xs uppercase tracking-widest mb-4">Categories</h2>
          <div className="space-y-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors group ${!activeCategory ? 'bg-primary/10 text-primary' : 'text-[#e2e0fc]/50 hover:text-[#e2e0fc] hover:bg-[#1e1e32]'}`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-sm">grid_view</span>
                All Topics
              </div>
            </button>
            {categories.map(c => {
              const isActive = activeCategory === c.categoryId;
              return (
                <button
                  key={c.categoryId}
                  onClick={() => setActiveCategory(c.categoryId)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors group ${isActive ? 'bg-primary/10 text-primary' : 'text-[#e2e0fc]/50 hover:text-[#e2e0fc] hover:bg-[#1e1e32]'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm">{c.iconName || 'public'}</span>
                    <span className="truncate max-w-[120px] text-left">{c.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-[800px] w-full">
        {searchQuery && <div className="mb-6"><h2 className="text-lg sm:text-xl font-headline font-bold text-on-surface">Search results for "{searchQuery}"</h2></div>}

        {/* Sorting Tabs */}
        <div className="flex items-center gap-4 sm:gap-8 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {['latest', 'trending', 'unanswered'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`font-bold border-b-2 pb-2 whitespace-nowrap capitalize transition-colors text-sm sm:text-base ${activeTab === t ? 'text-primary border-primary' : 'text-on-surface/40 hover:text-on-surface border-transparent'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-surface-variant border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-error-container/20 border border-error/30 p-6 sm:p-8 rounded-2xl text-center text-error font-bold transition-all duration-300">
              <span className="material-symbols-outlined text-3xl sm:text-4xl mb-4 opacity-80 block mx-auto" style={{ fontVariationSettings: "'FILL' 0" }}>cloud_off</span>
              {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-surface-container p-6 sm:p-8 rounded-2xl text-center text-on-surface/50 font-bold transition-all duration-300">
              No discussions found.
            </div>
          ) : (
            posts.map((post, index) => {
              const cTheme = getCategoryTheme(post.categoryName || '');
              return (
                <article key={post.postId} className="bg-surface-container p-4 sm:p-6 md:p-8 rounded-2xl hover:bg-surface-container-high transition-all duration-300 group">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {/* Votes Block */}
                    <div className="hidden sm:flex flex-col items-center gap-1 bg-surface-container-low p-1.5 sm:p-2 rounded-2xl h-fit">
                      <button
                        onClick={() => handleVote(post.postId, true, index)}
                        className={`material-symbols-outlined text-lg sm:text-xl transition-colors ${post.userVote === 1 ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`}
                        style={post.userVote === 1 ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >expand_less</button>
                      <span className={`font-bold text-xs sm:text-sm tracking-tighter ${post.userVote === 1 ? 'text-primary' : post.userVote === -1 ? 'text-error' : ''}`}>{post.upvotes - post.downvotes}</span>
                      <button
                        onClick={() => handleVote(post.postId, false, index)}
                        className={`material-symbols-outlined text-lg sm:text-xl transition-colors ${post.userVote === -1 ? 'text-error' : 'text-on-surface/40 hover:text-error'}`}
                        style={post.userVote === -1 ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >expand_more</button>
                    </div>

                    {/* Content Block */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-on-primary-container shrink-0">
                          {post.authorUsername?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold truncate max-w-[100px] sm:max-w-[120px]">@{post.authorUsername}</span>
                        <span className="text-[9px] sm:text-[10px] text-on-surface/30 uppercase tracking-widest shrink-0">{timeAgo(post.createdAt)}</span>
                        <div className="ml-auto flex items-center gap-2">
                          {post.relevanceScore != null && (
                            <span title="Semantic Similarity" className="bg-[#65dabc]/10 text-[#65dabc] px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold rounded-full tracking-tighter flex items-center gap-1 border border-[#65dabc]/20">
                              <span className="material-symbols-outlined text-[10px] sm:text-[12px]">radar</span>
                              {(post.relevanceScore * 100).toFixed(0)}% Match
                            </span>
                          )}
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 ${cTheme.bg} ${cTheme.text} text-[9px] sm:text-[10px] font-bold rounded-full uppercase tracking-tighter truncate max-w-[80px] sm:max-w-[100px]`}>
                            {post.categoryName}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg md:text-xl font-headline font-extrabold mb-2 sm:mb-3 leading-tight group-hover:text-primary transition-colors break-words">
                        <Link to={`/post/${post.postId}`}>{post.title}</Link>
                      </h3>

                      <p className="text-on-surface/70 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 line-clamp-3 break-words">
                        {post.content?.replace(/[#*`]/g, '')}
                      </p>

                      {/* Mobile vote row */}
                      <div className="flex sm:hidden items-center gap-3 mb-3">
                        <button onClick={() => handleVote(post.postId, true, index)} className={`flex items-center gap-1 ${post.userVote === 1 ? 'text-primary' : 'text-on-surface/40'}`}>
                          <span className="material-symbols-outlined text-lg" style={post.userVote === 1 ? { fontVariationSettings: "'FILL' 1" } : {}}>expand_less</span>
                        </button>
                        <span className={`font-bold text-xs ${post.userVote === 1 ? 'text-primary' : post.userVote === -1 ? 'text-error' : ''}`}>{post.upvotes - post.downvotes}</span>
                        <button onClick={() => handleVote(post.postId, false, index)} className={`flex items-center gap-1 ${post.userVote === -1 ? 'text-error' : 'text-on-surface/40'}`}>
                          <span className="material-symbols-outlined text-lg" style={post.userVote === -1 ? { fontVariationSettings: "'FILL' 1" } : {}}>expand_more</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                        <Link to={`/post/${post.postId}`} className="flex items-center gap-1.5 sm:gap-2 text-on-surface/40 hover:text-on-surface transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-base sm:text-lg">chat_bubble</span>
                          <span className="text-[11px] sm:text-xs font-medium">{post.commentCount} Comments</span>
                        </Link>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-on-surface/40">
                          <span className="material-symbols-outlined text-base sm:text-lg">visibility</span>
                          <span className="text-[11px] sm:text-xs font-medium">{post.viewCount} Views</span>
                        </div>
                        <button onClick={() => handleShare(post)} className="flex items-center gap-1.5 sm:gap-2 text-on-surface/40 hover:text-on-surface transition-colors cursor-pointer ml-auto">
                          <span className="material-symbols-outlined text-base sm:text-lg">share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="hidden xl:block w-72 sticky top-24 h-fit space-y-8 shrink-0">
        <section className="bg-surface-container rounded-2xl p-6">
          <h2 className="text-sm font-headline font-extrabold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">local_fire_department</span>
            Trending Topics
          </h2>
          <div className="space-y-4">
            {posts.slice(0, 5).map(p => (
              <Link key={p.postId} to={`/post/${p.postId}`} className="block group">
                <p className="text-xs font-bold text-on-surface/80 group-hover:text-primary transition-colors truncate">#{p.title.replace(/\s+/g, '')}</p>
                <p className="text-[10px] text-on-surface/40">{p.viewCount} views</p>
              </Link>
            ))}
          </div>
        </section>
      </aside>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
