import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import API from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

/* ─── Toast Component ─── */
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

/* ─── Report Modal ─── */
function ReportModal({ isOpen, onClose, targetType, targetId, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Please provide a reason'); return; }
    setLoading(true);
    setError('');
    try {
      await API.post('/reports', { targetType, targetId, reason });
      onSuccess();
      onClose();
      setReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const reasons = [
    'Spam or misleading',
    'Harassment or hate speech',
    'Inappropriate content',
    'Misinformation',
    'Other'
  ];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative w-full max-w-md bg-surface-container border border-outline-variant/20 rounded-3xl p-6 sm:p-8 shadow-2xl modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-error">flag</span>
            Report Content
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container/30 text-error rounded-xl text-sm font-medium border border-error/30">{error}</div>
        )}

        <div className="space-y-2 mb-4">
          {reasons.map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${reason === r ? 'bg-error/10 text-error border border-error/30' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest border border-transparent'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <textarea
          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-on-surface text-sm min-h-[80px] resize-none outline-none focus:ring-1 focus:ring-error/50 mb-4"
          placeholder="Additional details (optional)..."
          value={reasons.includes(reason) ? '' : reason}
          onChange={e => setReason(e.target.value)}
        />

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors font-medium text-sm">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="px-6 py-2.5 rounded-xl bg-error text-on-error font-bold text-sm hover:bg-error/90 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}



/* ─── Comment Item ─── */
function CommentItem({ comment, postId, onReply, level = 0 }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [localComment, setLocalComment] = useState(comment);
  const [voteAnim, setVoteAnim] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => { setLocalComment(comment); }, [comment]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await API.post(`/posts/${postId}/comments`, { content: replyText, parentCommentId: comment.commentId });
    setReplyText('');
    setShowReply(false);
    onReply();
  };

  const handleVote = async (upvote) => {
    if (!isAuthenticated()) return;
    try {
      setVoteAnim(true);
      setTimeout(() => setVoteAnim(false), 300);
      const res = await API.post(`/posts/${postId}/comments/${localComment.commentId}/vote?upvote=${upvote}`);
      setLocalComment(res.data);
    } catch (err) { }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const isRoot = level === 0;

  return (
    <div className={`relative ${isRoot ? 'group' : 'mt-6 sm:mt-8'}`}>
      {/* Thread Line */}
      <div
        className="absolute w-[1.5px] bg-outline-variant/30"
        style={isRoot ? { left: '1.25rem', top: '2.5rem', bottom: 0 } : { left: '-2.5rem', top: '-1.5rem', bottom: 0 }}
      ></div>

      <div className={`flex gap-3 sm:gap-4 ${!isRoot ? 'pl-3 sm:pl-4 border-l-2 border-transparent' : ''}`}>
        <div className={`shrink-0 rounded-full z-10 bg-surface flex items-center justify-center font-bold text-on-primary-container bg-gradient-to-br from-secondary to-primary ${isRoot ? 'w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm' : 'w-6 h-6 sm:w-8 sm:h-8 text-[9px] sm:text-[10px]'}`}>
          {localComment.authorUsername?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
            <span className="font-bold text-on-surface truncate max-w-[100px] sm:max-w-[120px]">@{localComment.authorUsername}</span>
            <span className="text-on-surface-variant shrink-0">• {timeAgo(localComment.createdAt)}</span>
          </div>

          <div className={`text-on-surface-variant ${!isRoot ? 'text-xs sm:text-sm' : 'text-sm'} leading-relaxed break-words`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      {...props}
                      children={String(children).replace(/\n$/, '')}
                      style={dracula}
                      language={match[1]}
                      PreTag="div"
                    />
                  ) : (
                    <code {...props} className={className}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {localComment.content}
            </ReactMarkdown>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-bold text-on-surface-variant">
            <button
              onClick={() => handleVote(true)}
              className={`flex items-center gap-1 transition-colors ${localComment.userVote === 1 ? 'text-primary' : 'hover:text-primary'} ${voteAnim ? 'vote-pulse' : ''}`}
            >
              <span className="material-symbols-outlined text-base sm:text-lg" style={localComment.userVote === 1 ? { fontVariationSettings: "'FILL' 1" } : {}}>thumb_up</span>
              {localComment.upvotes || 0}
            </button>
            <button
              onClick={() => handleVote(false)}
              className={`flex items-center gap-1 transition-colors ${localComment.userVote === -1 ? 'text-error' : 'hover:text-error'}`}
            >
              <span className="material-symbols-outlined text-base sm:text-lg" style={localComment.userVote === -1 ? { fontVariationSettings: "'FILL' 1" } : {}}>thumb_down</span>
            </button>
            {isAuthenticated() && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="hover:text-primary transition-colors"
              >
                Reply
              </button>
            )}
          </div>

          {showReply && (
            <div className="mt-4 bg-surface-container-low p-3 sm:p-4 rounded-lg">
              <textarea
                className="w-full bg-surface-container-lowest border-none focus:ring-1 focus:ring-primary rounded-lg p-3 text-on-surface text-sm min-h-[70px] sm:min-h-[80px] resize-none mb-3 outline-none"
                placeholder="Write a reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowReply(false)} className="px-3 sm:px-4 py-2 hover:bg-surface-container-high rounded-full text-on-surface-variant text-xs sm:text-sm font-bold transition-colors">Cancel</button>
                <button onClick={handleReply} className="bg-primary/20 text-primary px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold hover:bg-primary/30 transition-colors">Post Reply</button>
              </div>
            </div>
          )}

          {/* Render Replies */}
          {localComment.replies?.length > 0 && (
            <div className={`space-y-3 sm:space-y-4 ${isRoot ? 'mt-6 sm:mt-8' : 'mt-4 sm:mt-6'}`}>
              {localComment.replies.map(r => (
                <CommentItem key={r.commentId} comment={r} postId={postId} onReply={onReply} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Post Detail Page ─── */
export default function PostDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [reportModal, setReportModal] = useState({ open: false, type: '', id: '' });
  const [summaryState, setSummaryState] = useState({ show: false, data: '', loading: false, error: '' });
  const [voteAnim, setVoteAnim] = useState(null);
  const { isAuthenticated, user } = useAuth();

  const showToast = (msg) => { setToast(msg); };

  const handleSummarize = async () => {
    if (!isAuthenticated()) return;
    setSummaryState({ show: true, data: '', loading: true, error: '' });
    try {
      const res = await API.get(`/posts/${postId}/summary`);
      setSummaryState({ show: true, data: res.data.summary, loading: false, error: '' });
    } catch (err) {
      setSummaryState({ 
        show: true, 
        data: '', 
        loading: false, 
        error: err.response?.status === 401 ? 'You must be logged in to use this feature.' : 'Failed to generate summary. Please try again.' 
      });
    }
  };

  const loadData = () => {
    Promise.all([
      API.get(`/posts/${postId}`),
      API.get(`/posts/${postId}/comments`)
    ]).then(([postRes, commentsRes]) => {
      setPost(postRes.data);
      setComments(commentsRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [postId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await API.post(`/posts/${postId}/comments`, { content: newComment });
    setNewComment('');
    loadData();
  };

  const handleVote = async (upvote) => {
    if (!isAuthenticated()) return;
    try {
      setVoteAnim(upvote ? 'up' : 'down');
      setTimeout(() => setVoteAnim(null), 300);
      const res = await API.post(`/posts/${postId}/vote?upvote=${upvote}`);
      setPost(res.data);
    } catch (err) { }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
        showToast('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          showToast('Link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!');
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated()) return;
    try {
      const res = await API.post(`/posts/${postId}/save`);
      setPost(res.data);
      showToast(res.data.isSaved ? 'Post saved!' : 'Post unsaved');
    } catch (err) { }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return (
    <div className="max-w-[1440px] mx-auto pt-24 pb-12 px-4 sm:px-8 flex justify-center mt-20">
      <div className="w-12 h-12 border-4 border-surface-variant border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  if (!post) return (
    <div className="max-w-[1440px] mx-auto pt-24 pb-12 px-4 sm:px-8">
      <div className="bg-surface-container rounded-lg p-10 text-center font-bold text-on-surface-variant">Post not found</div>
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto pt-24 pb-20 sm:pb-16 px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      {/* Center Column */}
      <div className="lg:col-span-8 space-y-6 sm:space-y-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm font-label text-on-surface-variant mb-2 sm:mb-4 overflow-x-auto">
          <Link className="hover:text-primary transition-colors shrink-0" to="/">Home</Link>
          <span className="material-symbols-outlined text-xs shrink-0">chevron_right</span>
          <Link className="hover:text-primary transition-colors shrink-0" to="/">{post.categoryName}</Link>
          <span className="material-symbols-outlined text-xs shrink-0">chevron_right</span>
          <span className="text-on-surface truncate">{post.title}</span>
        </nav>

        {/* Main Post Card */}
        <article className="bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 relative">
          {/* Post Header */}
          <header className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-lg sm:text-xl font-bold text-on-primary-container shrink-0 shadow-inner">
                {post.authorUsername?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-on-surface text-sm sm:text-base">@{post.authorUsername}</span>
                  <span className="bg-secondary/10 text-secondary text-[9px] sm:text-[10px] px-2 sm:px-3 py-1 rounded-full font-bold uppercase tracking-widest">{post.categoryName}</span>
                </div>
                <span className="text-[10px] sm:text-xs text-on-surface-variant font-medium">{timeAgo(post.createdAt)}</span>
              </div>
            </div>
            <button
              onClick={() => setReportModal({ open: true, type: 'POST', id: post.postId })}
              className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error/10"
              title="Report post"
            >
              <span className="material-symbols-outlined text-xl">more_horiz</span>
            </button>
          </header>

          {/* Post Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-headline leading-tight text-on-surface mb-6 sm:mb-8 tracking-tight break-words">
            {post.title}
          </h1>

          {/* Post Content */}
          <div className="markdown-content text-on-surface-variant font-body text-sm sm:text-base lg:text-lg break-words prose prose-invert max-w-none prose-a:text-primary prose-code:bg-surface-container-lowest prose-code:text-secondary prose-code:px-2 prose-code:rounded prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      {...props}
                      children={String(children).replace(/\n$/, '')}
                      style={dracula}
                      language={match[1]}
                      PreTag="div"
                    />
                  ) : (
                    <code {...props} className={className}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {post.content}
            </ReactMarkdown>

            {post.mediaUrl && (
              <div className="my-6 sm:my-8 rounded-xl overflow-hidden shadow-lg border border-outline-variant/20">
                <img src={post.mediaUrl} alt="" className="w-full object-cover rounded-xl" />
              </div>
            )}
          </div>

          {/* Post Actions */}
          <footer className="mt-8 sm:mt-12 flex flex-wrap items-center justify-between pt-6 sm:pt-8 border-t border-outline-variant/15 gap-4">
            {/* Vote Block */}
            <div className="flex items-center gap-1 bg-surface-container-low rounded-full p-1 border border-outline-variant/20">
              <button
                onClick={() => handleVote(true)}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 hover:bg-surface-container-highest rounded-full transition-all active:scale-95 ${post.userVote === 1 ? 'text-primary bg-primary/10' : 'text-on-surface-variant'} ${voteAnim === 'up' ? 'vote-pulse' : ''}`}
              >
                <span className="material-symbols-outlined text-lg sm:text-xl" style={post.userVote === 1 ? { fontVariationSettings: "'FILL' 1" } : {}}>expand_less</span>
                <span className="font-bold text-sm">{post.upvotes - post.downvotes}</span>
              </button>
              <div className="w-px h-4 bg-outline-variant/30"></div>
              <button
                onClick={() => handleVote(false)}
                className={`flex items-center px-3 sm:px-4 py-2 hover:bg-surface-container-highest rounded-full transition-all active:scale-95 ${post.userVote === -1 ? 'text-error bg-error/10' : 'text-on-surface-variant'} ${voteAnim === 'down' ? 'vote-pulse' : ''}`}
              >
                <span className="material-symbols-outlined text-lg sm:text-xl" style={post.userVote === -1 ? { fontVariationSettings: "'FILL' 1" } : {}}>expand_more</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end flex-1 sm:flex-none">
              <div className="text-xs sm:text-sm font-bold text-on-surface-variant/50 mr-1 sm:mr-2 hidden sm:block">👁 {post.viewCount} Views</div>
              {isAuthenticated() && (
                <button 
                  onClick={handleSummarize} 
                  className="mr-1 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-all bg-gradient-to-br from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 text-primary border border-primary/20 shadow-sm"
                  title="Generate AI Summary"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  <span className="hidden sm:inline">Summarize</span>
                </button>
              )}
              <button onClick={handleSave} className={`p-2 sm:p-3 rounded-full transition-all ${post.isSaved ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`} title={post.isSaved ? 'Unsave post' : 'Save post'}>
                <span className="material-symbols-outlined text-lg sm:text-xl" style={post.isSaved ? { fontVariationSettings: "'FILL' 1" } : {}}>bookmark</span>
              </button>
              <button onClick={handleShare} className="p-2 sm:p-3 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-all" title="Share post">
                <span className="material-symbols-outlined text-lg sm:text-xl">share</span>
              </button>
              <button
                onClick={() => isAuthenticated() && setReportModal({ open: true, type: 'POST', id: post.postId })}
                className="p-2 sm:p-3 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-all"
                title="Report post"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">flag</span>
              </button>
            </div>
          </footer>
        </article>

        {/* AI Summary Section - Inline */}
        {summaryState.show && (
          <div className="bg-surface-container rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-primary/10 shadow-sm overflow-hidden relative group">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="text-lg sm:text-xl font-headline font-bold text-on-surface">AI Thread Summary</h3>
              </div>
              <button 
                onClick={() => setSummaryState({ ...summaryState, show: false })}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
              </button>
            </div>

            {summaryState.loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-on-surface-variant space-y-3">
                <div className="w-8 h-8 border-3 border-surface-variant border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm font-medium animate-pulse">Analyzing discussion...</p>
              </div>
            ) : summaryState.error ? (
              <div className="py-6 text-center bg-error-container/10 rounded-xl border border-error/20 px-4">
                <span className="material-symbols-outlined text-error text-2xl mb-1">error</span>
                <p className="text-error text-sm font-medium">{summaryState.error}</p>
              </div>
            ) : (
              <div className="markdown-content text-on-surface-variant font-body text-sm sm:text-base leading-relaxed break-words prose prose-invert max-w-none prose-p:mb-3 bg-surface-container-lowest/50 p-4 sm:p-6 rounded-xl border border-outline-variant/5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryState.data || 'No summary available.'}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Comments Section */}
        <section className="space-y-6 sm:space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold font-headline text-on-surface">{comments.length} Comments</h2>
          </div>

          {/* Comment Input */}
          {isAuthenticated() ? (
            <div className="bg-surface-container rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 bg-gradient-to-br from-secondary to-primary flex items-center justify-center font-bold text-on-primary-container text-xs sm:text-sm">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                  <textarea
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 focus:border-primary/50 focus:ring-1 focus:ring-primary rounded-xl p-3 sm:p-4 text-on-surface text-sm min-h-[80px] sm:min-h-[120px] resize-none outline-none transition-all"
                    placeholder="Write your thoughts... (Markdown Supported)"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                  ></textarea>
                  <div className="flex justify-between items-center">
                    <div className="hidden sm:flex gap-2 text-on-surface-variant">
                      <button className="p-2 hover:text-primary transition-colors"><span className="material-symbols-outlined">format_bold</span></button>
                      <button className="p-2 hover:text-primary transition-colors"><span className="material-symbols-outlined">format_italic</span></button>
                      <button className="p-2 hover:text-primary transition-colors"><span className="material-symbols-outlined">code</span></button>
                    </div>
                    <button
                      onClick={handleAddComment}
                      className="bg-gradient-to-br from-primary to-primary-container text-on-primary-container px-5 sm:px-8 py-2 rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-lg ml-auto"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container rounded-2xl sm:rounded-3xl p-6 text-center">
              <p className="text-on-surface-variant mb-4 font-medium">Join the discussion to share your thoughts.</p>
              <Link to="/login" className="bg-primary/20 text-primary px-8 py-2 rounded-full font-bold hover:bg-primary/30 transition-colors inline-block">Sign In to Comment</Link>
            </div>
          )}

          {/* Comment Tree */}
          <div className="space-y-8 sm:space-y-10 pl-1 sm:pl-2 lg:pl-0">
            {comments.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant">No comments yet.</div>
            ) : (
              comments.map(c => <CommentItem key={c.commentId} comment={c} postId={postId} onReply={loadData} />)
            )}
          </div>
        </section>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:block lg:col-span-4 space-y-8 sticky top-24 h-fit">
        <section className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner">
              <span className="material-symbols-outlined text-4xl">travel_explore</span>
            </div>
            <h3 className="text-xl font-extrabold font-headline text-on-surface">{post.categoryName}</h3>
            <p className="text-on-surface-variant text-sm">Explore more discussions and insights in this category.</p>
            <div className="w-full pt-4">
              <Link to={`/?category=${post.categoryId}`} className="w-full py-3 px-6 rounded-xl bg-surface-container-high text-primary font-bold hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2">
                Browse Category
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/20">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#65dabc] mb-4">Community Guidelines</h4>
          <ul className="space-y-4 text-sm text-on-surface-variant/80 font-medium">
            <li className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">verified_user</span>
              Be respectful of diverse perspectives.
            </li>
            <li className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">library_books</span>
              Cite your sources for technical claims.
            </li>
            <li className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary text-sm mt-0.5">block</span>
              No solicitation or self-promotion.
            </li>
          </ul>
        </section>
      </aside>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.open}
        onClose={() => setReportModal({ open: false, type: '', id: '' })}
        targetType={reportModal.type}
        targetId={reportModal.id}
        onSuccess={() => showToast('Report submitted successfully!')}
      />



      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
