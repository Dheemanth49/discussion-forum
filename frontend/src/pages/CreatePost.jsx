import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CreatePost() {
  const [form, setForm] = useState({ title: '', content: '', categoryId: '' });
  const [categories, setCategories] = useState([]);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await API.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm({ ...form, mediaUrl: res.data.url });
    } catch (err) {
      setError('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.categoryId) { setError('Please select a category'); return; }
    if (!form.title.trim() || !form.content.trim()) { setError('Title and Content are required'); return; }
    setLoading(true);
    try {
      const res = await API.post('/posts', { ...form, categoryId: Number(form.categoryId) });
      navigate(`/post/${res.data.postId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.content;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end, text.length);
    const insertedText = selected ? `${prefix}${selected}${suffix}` : `${prefix}text${suffix}`;
    setForm({ ...form, content: before + insertedText + after });
  };

  return (
    <>
      <main className="pt-24 pb-12 px-4 flex justify-center w-full max-w-[1440px] mx-auto min-h-screen relative z-10">
        <div className="w-full max-w-[800px]">
          {/* Page Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface mb-2">Create New Discussion</h1>
            <p className="text-on-surface-variant font-body">Share your thoughts with the community</p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl font-bold border border-error/50">
              {error}
            </div>
          )}

          {/* Main Composition Container */}
          <div className="space-y-6">
            
            {/* Metadata Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-6 py-4 text-xl font-headline font-semibold text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all outline-none" 
                  placeholder="Catchy discussion title..." 
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <div className="relative group">
                  <select 
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-6 py-5 text-on-surface font-label appearance-none cursor-pointer focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none"
                    value={form.categoryId}
                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => (
                      <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                </div>
              </div>
            </div>

            {/* Editor Shell */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden flex flex-col min-h-[500px] border border-outline-variant/20">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-surface-container border-b border-outline-variant/10 flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => insertMarkdown('**', '**')} className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">format_bold</span></button>
                  <button onClick={() => insertMarkdown('*', '*')} className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">format_italic</span></button>
                  <button onClick={() => insertMarkdown('`', '`')} className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">code</span></button>
                  <div className="w-px h-6 bg-outline-variant/20 mx-1"></div>
                  <button onClick={() => insertMarkdown('[text](', ')')} className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">link</span></button>
                  <button onClick={() => insertMarkdown('> ')} className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">format_quote</span></button>
                  <div className="w-px h-6 bg-outline-variant/20 mx-1"></div>
                  <button onClick={() => insertMarkdown('- ')} className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-lg">format_list_bulleted</span></button>
                </div>
                
                <button 
                  onClick={() => setPreview(!preview)}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-label transition-colors ${preview ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright'}`}
                >
                  <span className="material-symbols-outlined text-sm">{preview ? 'edit' : 'visibility'}</span>
                  {preview ? 'Edit mode' : 'Preview toggle'}
                </button>
              </div>

              {/* Split View Area (or single view depending on screen size, currently forced split on md screens if preview is active) */}
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-full">
                
                {/* Markdown Editor */}
                <div className={`bg-surface-container p-6 relative flex-1 min-h-[300px] ${preview ? 'hidden md:block w-full md:w-1/2' : 'w-full'}`}>
                  <textarea 
                    id="markdown-editor"
                    className="w-full h-full bg-transparent border-none focus:ring-0 resize-none font-mono text-on-surface placeholder:text-outline-variant leading-relaxed text-sm outline-none" 
                    placeholder="Write your content here in Markdown..."
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                  ></textarea>
                  <div className="absolute bottom-4 right-6 text-[10px] uppercase tracking-widest text-outline-variant font-label">Editor</div>
                </div>

                {/* Live Preview */}
                <div className={`bg-surface-container-lowest p-6 border-t md:border-t-0 md:border-l border-outline-variant/10 relative overflow-y-auto flex-1 min-h-[300px] ${preview ? 'block w-full md:w-1/2' : 'hidden'}`}>
                  <div className="prose prose-invert max-w-none text-on-surface-variant font-body">
                    {form.content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content}</ReactMarkdown>
                    ) : (
                      <>
                        <h3 className="text-on-surface font-headline font-bold mb-4">Post Preview</h3>
                        <p className="mb-4">Your formatted content will appear here in real-time as you write...</p>
                        <div className="p-4 bg-surface-container-highest/30 rounded-lg italic border-l-2 border-primary/30">
                          "This is how a quote might look."
                        </div>
                      </>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-6 text-[10px] uppercase tracking-widest text-outline-variant font-label">Preview</div>
                </div>
              </div>
            </div>

            {/* Media Upload Zone */}
            <div className="group relative overflow-hidden border-2 border-dashed border-outline-variant/30 rounded-xl p-8 transition-all hover:bg-surface-container-low/50 hover:border-primary/40">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center bg-surface-container-high rounded-full group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary text-3xl">{uploading ? 'hourglass_empty' : form.mediaUrl ? 'check_circle' : 'cloud_upload'}</span>
                </div>
                <div className="text-center">
                  <p className="text-on-surface font-medium mb-1">
                    {uploading ? 'Uploading...' : form.mediaUrl ? 'File uploaded successfully' : 'Upload an image'}
                  </p>
                  <p className="text-xs text-outline font-label">Max file size: 5MB (JPG, PNG)</p>
                </div>
              </div>
              <input 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload} 
                disabled={uploading}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
              <button onClick={() => navigate('/')} className="text-on-surface-variant hover:text-on-surface font-label transition-colors">Cancel</button>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="bg-gradient-to-br from-secondary to-primary px-10 py-2.5 rounded-xl text-on-primary-container font-headline font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {loading ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Background Atmospheric Glow */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed top-1/2 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none z-0"></div>
    </>
  );
}
