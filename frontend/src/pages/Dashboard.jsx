import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [bio, setBio] = useState('');
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get('/users/profile'),
      API.get(`/posts/user/${user?.userId}?size=50`),
      API.get('/posts/saved?size=50').catch(() => ({ data: { content: [] } }))
    ]).then(([profileRes, postsRes, savedRes]) => {
      setProfile(profileRes.data);
      setBio(profileRes.data.bio || '');
      setPosts(postsRes.data.content || []);
      setSavedPosts(savedRes.data.content || []);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await API.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await API.put('/users/profile', { profileImageUrl: res.data.url });
      setProfile({ ...profile, profileImageUrl: res.data.url });
      setMsg('Profile picture updated!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Upload failed');
      setTimeout(() => setMsg(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await API.put('/users/profile', { bio });
      setProfile(res.data);
      setMsg('Profile updated!');
    } catch (err) {
      setMsg('Update failed');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) { setMsg('Passwords do not match'); setTimeout(() => setMsg(''), 3000); return; }
    try {
      await API.put('/users/change-password', { oldPassword: passwords.old, newPassword: passwords.new });
      setMsg('Password changed!');
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Delete this post?')) {
      await API.delete(`/posts/${postId}`);
      setPosts(posts.filter(p => p.postId !== postId));
    }
  };

  const handleUnsave = async (postId) => {
    try {
      await API.post(`/posts/${postId}/save`);
      setSavedPosts(savedPosts.filter(p => p.postId !== postId));
    } catch (err) { }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="pt-24 pb-24 sm:pb-12 px-3 sm:px-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 sm:gap-8 min-h-[90vh]">

      {/* Left Side Profile Section */}
      <aside className="w-full lg:w-80 flex-shrink-0">
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
          <div className="relative group mx-auto">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-primary p-1 bg-surface-container">
              {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="User" className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="h-full w-full rounded-full flex items-center justify-center text-3xl sm:text-5xl font-bold text-on-surface bg-inverse-surface/10">
                  {profile?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {uploading ? (
               <div className="absolute bottom-1 right-1 bg-surface-container-high text-on-surface p-2 rounded-full shadow-lg">
                 <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
               </div>
            ) : (
              <label className="absolute bottom-1 right-1 bg-primary text-on-primary-container p-2 rounded-full shadow-lg hover:scale-105 transition-transform cursor-pointer">
                <span className="material-symbols-outlined text-sm">edit</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-headline font-bold text-on-surface tracking-tight">@{profile?.username}</h2>
            <p className="text-on-surface-variant text-xs sm:text-sm">{profile?.email}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-[10px] sm:text-xs text-primary/80 font-medium">
              <span className="material-symbols-outlined text-xs">calendar_today</span>
              Joined {new Date(profile?.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Bio</label>
            <textarea
              className="w-full bg-surface-container-highest border-none rounded-lg text-xs sm:text-sm p-3 text-on-surface focus:ring-1 focus:ring-primary h-20 sm:h-24 resize-none outline-none leading-relaxed"
              placeholder="Tell the archive about yourself..."
              value={bio}
              onChange={e => setBio(e.target.value)}
            ></textarea>
          </div>
          <button
            onClick={handleSaveProfile}
            className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-headline font-bold py-2.5 sm:py-3 rounded-lg hover:opacity-90 transition-opacity active:scale-[0.98] duration-150 text-sm"
          >
            Save Profile
          </button>

          {msg && (
            <div className="p-2 sm:p-3 bg-secondary/20 text-secondary border border-secondary/30 rounded-lg text-xs sm:text-sm font-bold text-center animate-fade-in">
              {msg}
            </div>
          )}
        </div>

        {/* Side Quick Links */}
        <div className="mt-4 sm:mt-6 bg-surface-container-low rounded-xl border border-outline-variant/10 p-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-high border-l-4 border-primary text-primary font-bold text-xs sm:text-sm">
            <span className="material-symbols-outlined text-sm">dashboard</span>
            Dashboard
          </div>
          <button onClick={() => setActiveTab('settings')} className="w-full flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-all text-xs sm:text-sm cursor-pointer mt-1 font-medium">
            <span className="material-symbols-outlined text-sm">shield</span>
            Security
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <div className="flex-grow space-y-6 sm:space-y-8 min-w-0">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-surface-container rounded-xl p-3 sm:p-5 flex flex-col gap-1 border-l-2 border-primary/40 border-y border-r border-outline-variant/10">
            <span className="text-on-surface-variant text-[9px] sm:text-xs font-medium uppercase tracking-wider">Total Posts</span>
            <span className="text-2xl sm:text-3xl font-headline font-black text-on-surface">{profile?.postCount || 0}</span>
          </div>
          <div className="bg-surface-container rounded-xl p-3 sm:p-5 flex flex-col gap-1 border-l-2 border-secondary/40 border-y border-r border-outline-variant/10">
            <span className="text-on-surface-variant text-[9px] sm:text-xs font-medium uppercase tracking-wider">Comments</span>
            <span className="text-2xl sm:text-3xl font-headline font-black text-on-surface">{profile?.commentCount || 0}</span>
          </div>
          <div className="bg-surface-container rounded-xl p-3 sm:p-5 flex flex-col gap-1 border-l-2 border-tertiary/40 border-y border-r border-outline-variant/10">
            <span className="text-on-surface-variant text-[9px] sm:text-xs font-medium uppercase tracking-wider">Role</span>
            <span className="text-base sm:text-xl font-headline font-black text-primary capitalize mt-1">{profile?.role?.toLowerCase() || 'User'}</span>
          </div>
          <div className="bg-surface-container rounded-xl p-3 sm:p-5 flex flex-col gap-1 border-l-2 border-primary-container border-y border-r border-outline-variant/10">
            <span className="text-on-surface-variant text-[9px] sm:text-xs font-medium uppercase tracking-wider">Saved</span>
            <span className="text-2xl sm:text-3xl font-headline font-black text-secondary">{savedPosts.length}</span>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="space-y-4 sm:space-y-6">
          <nav className="flex gap-4 sm:gap-8 border-b border-outline-variant/10 overflow-x-auto scrollbar-hide">
            {['posts', 'saved', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 sm:pb-4 text-xs sm:text-sm transition-all font-headline font-bold capitalize whitespace-nowrap ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent'}`}
              >
                {tab === 'posts' ? 'My Posts' : tab === 'saved' ? 'Saved Posts' : 'Settings'}
              </button>
            ))}
          </nav>

          {/* My Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-3 sm:space-y-4">
              {posts.length === 0 ? (
                <div className="bg-surface-container-high rounded-xl p-8 sm:p-12 text-center text-on-surface-variant border border-outline-variant/10">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl mb-4 opacity-50">article</span>
                  <p className="font-body text-base sm:text-lg">No posts yet.</p>
                  <Link to="/create" className="text-primary hover:text-primary-fixed mt-2 inline-block font-bold text-sm">Create your first discussion!</Link>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.postId} className="bg-surface-container-high rounded-xl p-4 sm:p-5 hover:bg-surface-container-highest transition-all group border border-outline-variant/10">
                    <div className="flex justify-between items-start gap-3 sm:gap-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded">{post.categoryName}</span>
                        </div>
                        <h3 className="text-sm sm:text-lg font-headline font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer truncate">
                          <Link to={`/post/${post.postId}`}>{post.title}</Link>
                        </h3>
                        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-on-surface-variant font-label">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">chat_bubble</span> {post.commentCount}</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">visibility</span> {post.viewCount}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(post.postId)} className="p-2 bg-surface-container rounded hover:bg-error/20 hover:text-error text-on-surface-variant transition-all border border-transparent hover:border-error/30 shrink-0">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Saved Posts Tab */}
          {activeTab === 'saved' && (
            <div className="space-y-3 sm:space-y-4 animate-fade-in">
              {savedPosts.length === 0 ? (
                <div className="bg-surface-container-high rounded-xl p-8 sm:p-12 text-center text-on-surface-variant border border-outline-variant/10">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl mb-4 opacity-50">bookmark</span>
                  <p className="font-body text-base sm:text-lg">No saved posts yet.</p>
                  <Link to="/" className="text-primary hover:text-primary-fixed mt-2 inline-block font-bold text-sm">Explore discussions to save!</Link>
                </div>
              ) : (
                savedPosts.map(post => (
                  <div key={post.postId} className="bg-surface-container-high rounded-xl p-4 sm:p-5 hover:bg-surface-container-highest transition-all group border border-outline-variant/10">
                    <div className="flex justify-between items-start gap-3 sm:gap-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded">{post.categoryName}</span>
                          <span className="text-[10px] sm:text-xs text-on-surface-variant">by @{post.authorUsername}</span>
                        </div>
                        <h3 className="text-sm sm:text-lg font-headline font-bold text-on-surface group-hover:text-primary transition-colors cursor-pointer truncate">
                          <Link to={`/post/${post.postId}`}>{post.title}</Link>
                        </h3>
                        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-on-surface-variant font-label">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">chat_bubble</span> {post.commentCount}</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">visibility</span> {post.viewCount}</span>
                        </div>
                      </div>
                      <button onClick={() => handleUnsave(post.postId)} className="p-2 bg-surface-container rounded hover:bg-primary/20 text-primary transition-all border border-transparent hover:border-primary/30 shrink-0" title="Unsave">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Settings Section */}
          {activeTab === 'settings' && (
            <div className="bg-surface-container rounded-xl border border-outline-variant/10 p-4 sm:p-8 space-y-6 sm:space-y-8 animate-fade-in">
              <div className="border-b border-outline-variant/10 pb-4">
                <h2 className="text-lg sm:text-xl font-headline font-extrabold text-on-surface tracking-tight">Account Settings</h2>
                <p className="text-xs sm:text-sm text-on-surface-variant font-body">Manage your security</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs sm:text-sm font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Security & Password
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] sm:text-xs text-on-surface-variant ml-1 font-label">Current Password</label>
                      <input
                        className="w-full bg-surface-container-highest border-none rounded-lg text-xs sm:text-sm px-4 py-2.5 sm:py-3 focus:ring-1 focus:ring-primary text-on-surface outline-none"
                        type="password" placeholder="••••••••••••"
                        value={passwords.old} onChange={e => setPasswords({ ...passwords, old: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] sm:text-xs text-on-surface-variant ml-1 font-label">New Password</label>
                      <input
                        className="w-full bg-surface-container-highest border-none rounded-lg text-xs sm:text-sm px-4 py-2.5 sm:py-3 focus:ring-1 focus:ring-primary text-on-surface outline-none"
                        placeholder="Enter new password" type="password"
                        value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] sm:text-xs text-on-surface-variant ml-1 font-label">Confirm Password</label>
                      <input
                        className="w-full bg-surface-container-highest border-none rounded-lg text-xs sm:text-sm px-4 py-2.5 sm:py-3 focus:ring-1 focus:ring-primary text-on-surface outline-none"
                        placeholder="Confirm new password" type="password"
                        value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      className="text-xs font-bold text-primary hover:underline hover:text-primary-fixed"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
