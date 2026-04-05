import { useState, useEffect } from 'react';
import API from '../api';

export default function AdminPanel() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportFilter, setReportFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      API.get('/admin/stats').catch(() => ({ data: {} })),
      API.get('/admin/users?size=100').catch(() => ({ data: { content: [] } })),
      API.get('/admin/reports?size=100').catch(() => ({ data: { content: [] } }))
    ]).then(([statsRes, usersRes, reportsRes]) => {
      setStats(statsRes.data);
      setUsers(usersRes.data.content || []);
      setReports(reportsRes.data.content || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleBan = async (userId, isBanned) => {
    try {
      await API.put(`/admin/users/${userId}/${isBanned ? 'unban' : 'ban'}`);
      setUsers(users.map(u => u.userId === userId ? { ...u, isBanned: !isBanned } : u));
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Delete this user permanently? This will also delete all their posts and comments.')) {
      try {
        await API.delete(`/admin/users/${userId}`);
        setUsers(users.filter(u => u.userId !== userId));
        alert('User deleted successfully');
      } catch (err) { 
        console.error(err); 
        alert('Failed to delete user: ' + (err.response?.data?.message || 'Check logs for details'));
      }
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      if (action === 'dismiss') {
        await API.put(`/admin/reports/${reportId}`, { status: 'DISMISSED' });
        setReports(reports.map(r => r.reportId === reportId ? { ...r, status: 'DISMISSED' } : r));
      } else if (action === 'reviewed') {
        await API.put(`/admin/reports/${reportId}`, { status: 'REVIEWED' });
        setReports(reports.map(r => r.reportId === reportId ? { ...r, status: 'REVIEWED' } : r));
      } else if (action === 'ban') {
        const report = reports.find(r => r.reportId === reportId);
        if (report?.targetAuthorId) {
          await API.put(`/admin/users/${report.targetAuthorId}/ban`);
          await API.put(`/admin/reports/${reportId}`, { status: 'REVIEWED' });
          setReports(reports.map(r => r.reportId === reportId ? { ...r, status: 'REVIEWED' } : r));
          setUsers(users.map(u => u.userId === report.targetAuthorId ? { ...u, isBanned: true } : u));
          alert('User has been banned.');
        }
      } else if (action === 'delete') {
        await API.delete(`/admin/reports/${reportId}`);
        setReports(reports.filter(r => r.reportId !== reportId));
        alert('Report record deleted.');
      }
    } catch (err) { 
      console.error(err); 
      alert('Action failed: ' + (err.response?.data?.message || 'Check connection'));
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

  const filteredReports = reportFilter
    ? reports.filter(r => r.status === reportFilter)
    : reports;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="pt-24 pb-24 sm:pb-12 px-3 sm:px-6 max-w-[1440px] mx-auto flex flex-col gap-6 sm:gap-8 min-h-[90vh]">

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary p-2 bg-primary/10 rounded-xl">admin_panel_settings</span>
            <h1 className="text-2xl sm:text-3xl font-headline font-extrabold tracking-tight text-on-surface">Forum<span className="text-primary">Hub</span> Admin</h1>
          </div>
          <p className="text-on-surface-variant font-body text-sm sm:text-base">Manage global parameters, user access, and system equilibrium.</p>
        </div>
        <div className="flex gap-2 sm:gap-4 border-b border-outline-variant/10 overflow-x-auto scrollbar-hide">
          {['overview', 'users', 'reports'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 sm:pb-4 text-xs sm:text-sm transition-all font-headline font-bold capitalize whitespace-nowrap relative ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface border-b-2 border-transparent'}`}
            >
              {tab}
              {tab === 'reports' && stats.pendingReports > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-error text-on-error text-[9px] font-bold rounded-full">{stats.pendingReports}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-fade-in">
          <div className="bg-surface-container rounded-xl sm:rounded-2xl p-4 sm:p-6 border-t-4 border-primary shadow-lg border-x border-b border-outline-variant/10 relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[80px] sm:text-[120px]">groups</span>
            </div>
            <div className="relative z-10 w-full">
              <span className="text-on-surface-variant text-[10px] sm:text-sm font-bold uppercase tracking-widest block mb-2">Total Users</span>
              <span className="text-3xl sm:text-5xl font-headline font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary-container">{stats.totalUsers || 0}</span>
            </div>
          </div>
          <div className="bg-surface-container rounded-xl sm:rounded-2xl p-4 sm:p-6 border-t-4 border-secondary shadow-lg border-x border-b border-outline-variant/10 relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[80px] sm:text-[120px]">article</span>
            </div>
            <div className="relative z-10 w-full">
              <span className="text-on-surface-variant text-[10px] sm:text-sm font-bold uppercase tracking-widest block mb-2">Total Posts</span>
              <span className="text-3xl sm:text-5xl font-headline font-black bg-clip-text text-transparent bg-gradient-to-br from-secondary to-secondary-container">{stats.totalPosts || 0}</span>
            </div>
          </div>
          <div className="bg-surface-container rounded-xl sm:rounded-2xl p-4 sm:p-6 border-t-4 border-tertiary shadow-lg border-x border-b border-outline-variant/10 relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[80px] sm:text-[120px]">forum</span>
            </div>
            <div className="relative z-10 w-full">
              <span className="text-on-surface-variant text-[10px] sm:text-sm font-bold uppercase tracking-widest block mb-2">Comments</span>
              <span className="text-3xl sm:text-5xl font-headline font-black bg-clip-text text-transparent bg-gradient-to-br from-tertiary to-tertiary-container">{stats.totalComments || 0}</span>
            </div>
          </div>
          <div className="bg-surface-container rounded-xl sm:rounded-2xl p-4 sm:p-6 border-t-4 border-error shadow-lg border-x border-b border-outline-variant/10 relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[80px] sm:text-[120px]">flag</span>
            </div>
            <div className="relative z-10 w-full">
              <span className="text-on-surface-variant text-[10px] sm:text-sm font-bold uppercase tracking-widest block mb-2">Pending Reports</span>
              <span className="text-3xl sm:text-5xl font-headline font-black bg-clip-text text-transparent bg-gradient-to-br from-error to-error-container">{stats.pendingReports || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-surface-container rounded-xl sm:rounded-2xl border border-outline-variant/20 overflow-hidden shadow-[0_8px_32px_rgba(17,17,37,0.4)] animate-fade-in">
          {/* Mobile card view */}
          <div className="block sm:hidden divide-y divide-outline-variant/10">
            {users.map(u => (
              <div key={u.userId} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex justify-center items-center text-xs font-black uppercase">{u.username[0]}</div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">{u.username}</p>
                      <p className="text-on-surface-variant text-[11px]">{u.email}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-secondary/20 text-secondary' : 'bg-surface-bright text-on-surface'}`}>{u.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant">{u.postCount} posts</span>
                    {u.isBanned ? (
                      <span className="flex items-center gap-1 text-[10px] bg-error/10 text-error px-2 py-0.5 rounded font-bold">Banned</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">Active</span>
                    )}
                  </div>
                  {u.role !== 'ADMIN' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleBan(u.userId, u.isBanned)} className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${u.isBanned ? 'bg-surface-bright text-on-surface' : 'bg-error-container text-on-error-container'}`}>
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button onClick={() => handleDeleteUser(u.userId)} className="px-2.5 py-1 bg-surface-lowest border border-outline-variant/20 text-on-surface-variant rounded text-[10px] font-bold">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-highest/50 border-b border-outline-variant/20">
                  <th className="font-headline font-bold text-on-surface-variant text-xs uppercase tracking-widest py-4 sm:py-5 px-4 sm:px-6">Username</th>
                  <th className="font-headline font-bold text-on-surface-variant text-xs uppercase tracking-widest py-4 sm:py-5 px-4 sm:px-6 hidden md:table-cell">Email</th>
                  <th className="font-headline font-bold text-on-surface-variant text-xs uppercase tracking-widest py-4 sm:py-5 px-4 sm:px-6">Role</th>
                  <th className="font-headline font-bold text-on-surface-variant text-xs uppercase tracking-widest py-4 sm:py-5 px-4 sm:px-6 text-center hidden lg:table-cell">Posts</th>
                  <th className="font-headline font-bold text-on-surface-variant text-xs uppercase tracking-widest py-4 sm:py-5 px-4 sm:px-6">Status</th>
                  <th className="font-headline font-bold text-on-surface-variant text-xs uppercase tracking-widest py-4 sm:py-5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {users.map(u => (
                  <tr key={u.userId} className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-bold text-on-surface flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex justify-center items-center text-xs font-black uppercase">{u.username[0]}</div>
                      {u.username}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-on-surface-variant text-sm hidden md:table-cell">{u.email}</td>
                    <td className="py-4 px-4 sm:px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-secondary/20 text-secondary' : 'bg-surface-bright text-on-surface'}`}>{u.role}</span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center text-on-surface font-mono hidden lg:table-cell">{u.postCount}</td>
                    <td className="py-4 px-4 sm:px-6">
                      {u.isBanned ? (
                        <span className="flex items-center gap-1 text-[10px] bg-error/10 text-error px-2.5 py-1 rounded font-bold uppercase tracking-widest w-fit">
                          <span className="material-symbols-outlined text-[10px]">block</span> Banned
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded font-bold uppercase tracking-widest w-fit">
                          <span className="material-symbols-outlined text-[10px]">check_circle</span> Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right space-x-2">
                      {u.role !== 'ADMIN' ? (
                        <>
                          <button onClick={() => handleBan(u.userId, u.isBanned)} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${u.isBanned ? 'bg-surface-bright text-on-surface hover:bg-outline-variant' : 'bg-error-container text-on-error-container hover:bg-error/30'}`}>
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                          <button onClick={() => handleDeleteUser(u.userId)} className="px-3 py-1.5 bg-surface-lowest border border-outline-variant/20 hover:border-error/40 hover:text-error text-on-surface-variant rounded text-xs font-bold transition-all">Delete</button>
                        </>
                      ) : (
                        <span className="text-xs text-on-surface-variant italic py-1.5 inline-block">System Root</span>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="6" className="py-12 text-center text-on-surface-variant">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          {/* Filter Chips */}
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            {['', 'PENDING', 'REVIEWED', 'DISMISSED'].map(status => (
              <button
                key={status}
                onClick={() => setReportFilter(status)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all ${reportFilter === status ? 'bg-primary text-on-primary-container shadow-lg' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
              >
                {status || 'All'}
                {status === 'PENDING' && stats.pendingReports > 0 && (
                  <span className="ml-1 text-[9px]">({stats.pendingReports})</span>
                )}
              </button>
            ))}
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-surface-container rounded-2xl p-8 sm:p-12 text-center text-on-surface-variant border border-outline-variant/10">
              <span className="material-symbols-outlined text-4xl mb-4 block opacity-50">flag</span>
              <p className="font-body text-lg">No reports found.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredReports.map(report => (
                <div
                  key={report.reportId}
                  className={`bg-surface-container rounded-xl sm:rounded-2xl p-4 sm:p-6 border-l-4 transition-all hover:shadow-lg ${report.status === 'PENDING' ? 'border-error' : report.status === 'REVIEWED' ? 'border-primary' : 'border-outline-variant/30'} border-y border-r border-outline-variant/10`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Report Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${report.status === 'PENDING' ? 'bg-error/10 text-error' : report.status === 'REVIEWED' ? 'bg-primary/10 text-primary' : 'bg-surface-bright text-on-surface-variant'}`}>
                          {report.status}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 bg-surface-container-high rounded uppercase tracking-widest text-on-surface-variant">
                          {report.targetType}
                        </span>
                        <span className="text-[10px] sm:text-xs text-on-surface-variant/60">{timeAgo(report.createdAt)}</span>
                      </div>

                      {/* Target Info */}
                      {report.targetTitle && (
                        <p className="text-sm sm:text-base font-headline font-bold text-on-surface truncate">{report.targetTitle}</p>
                      )}

                      {/* Reporter & Author */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-on-surface-variant">
                        <span>Reported by: <strong className="text-on-surface">@{report.reporterUsername}</strong></span>
                        {report.targetAuthor && (
                          <span>Author: <strong className="text-on-surface">@{report.targetAuthor}</strong></span>
                        )}
                      </div>

                      {/* Reason */}
                      <div className="bg-surface-container-high/50 p-3 rounded-lg">
                        <p className="text-xs sm:text-sm text-on-surface-variant italic">"{report.reason}"</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {report.status === 'PENDING' && (
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleReportAction(report.reportId, 'ban')}
                          className="px-3 py-1.5 bg-error text-on-error rounded-lg text-[10px] sm:text-xs font-bold hover:bg-error/90 transition-all active:scale-95 whitespace-nowrap"
                        >
                          Ban Author
                        </button>
                        <button
                          onClick={() => handleReportAction(report.reportId, 'reviewed')}
                          className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-[10px] sm:text-xs font-bold hover:bg-primary/30 transition-all whitespace-nowrap"
                        >
                          Mark Reviewed
                        </button>
                        <button
                          onClick={() => handleReportAction(report.reportId, 'dismiss')}
                          className="px-3 py-1.5 bg-surface-container-high text-on-surface-variant rounded-lg text-[10px] sm:text-xs font-bold hover:bg-surface-container-highest transition-all whitespace-nowrap"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                    {report.status !== 'PENDING' && (
                      <button
                        onClick={() => handleReportAction(report.reportId, 'delete')}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all self-start"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
