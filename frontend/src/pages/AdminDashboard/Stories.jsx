import { useState, useEffect } from 'react';
import authService from '../../services/authService';
import ConfirmDeleteModal from '../../shared/components/admin/ConfirmDeleteModal';
import EmptyState from '../../shared/components/admin/EmptyState';
import LoadingSpinner from '../../shared/components/admin/LoadingSpinner';
import ServerPagination from '../../components/common/ServerPagination';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Layers,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ total: 0, published: 0, draft: 0, archived: 0 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Digital Transformation',
    author: 'VR4Web Editorial',
    summary: '',
    content: '',
    imageUrl: '/banner/3.jpg',
    status: 'published',
  });

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await authService.getStories({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit: pageSize,
      });
      if (res && res.success) {
        setStories(res.data || []);
        const total = res.pagination?.totalRecords ?? res.total ?? (res.data || []).length;
        setTotalRecords(total);
        setTotalPages(res.pagination?.totalPages ?? res.pagination?.pages ?? Math.ceil(total / pageSize) ?? 1);
        if (res.counts) {
          setCounts(res.counts);
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error loading stories' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStories();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page, pageSize]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title || '',
        category: item.category || 'Digital Transformation',
        author: item.author || 'VR4Web Editorial',
        summary: item.summary || '',
        content: item.content || '',
        imageUrl: item.imageUrl || '/banner/3.jpg',
        status: item.status || 'published',
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        category: 'Digital Transformation',
        author: 'VR4Web Editorial',
        summary: '',
        content: '',
        imageUrl: '/banner/3.jpg',
        status: 'published',
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      if (editingItem) {
        await authService.updateStory(editingItem._id, formData);
        setFeedback({ type: 'success', message: 'Story updated successfully' });
      } else {
        await authService.createStory(formData);
        setFeedback({ type: 'success', message: 'Story created successfully' });
      }
      setModalOpen(false);
      fetchStories();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await authService.deleteStory(deleteTarget._id);
      setFeedback({ type: 'success', message: 'Story permanently deleted' });
      setDeleteTarget(null);
      fetchStories();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // Stats from backend
  const totalCount = counts.total || totalRecords;
  const publishedCount = counts.published || 0;
  const draftCount = counts.draft || 0;
  const archivedCount = counts.archived || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-black pb-12 min-w-0">
      {/* ─── Breadcrumbs & Header ─── */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-bold text-black uppercase tracking-wider mb-1 flex-wrap">
            <span>VR4Web</span>
            <span className="text-black/50 font-bold">/</span>
            <span>Admin</span>
            <span className="text-black/50 font-bold">/</span>
            <span className="text-blue-600 font-bold">Stories Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 tracking-tight flex items-center gap-2.5 flex-wrap">
            <span>Stories Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold shrink-0">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-black font-semibold mt-1 max-w-2xl">
            Publish client case studies, digital narratives, and transformation stories.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={() => fetchStories()}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-black hover:bg-slate-50 font-bold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            title="Refresh stories"
          >
            <RotateCcw className="w-4 h-4 text-black shrink-0" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 sm:px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">Add New Story</span>
          </button>
        </div>
      </div>

      {/* ─── Feedback Alert Toast ─── */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between border shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="cursor-pointer text-black/50 hover:text-black p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Metric Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Stories */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={`bg-white rounded-3xl border p-5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
            statusFilter === 'all'
              ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
              All
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-wider text-black">Total Stories</p>
            <p className="text-3xl font-black text-black mt-1">{totalCount}</p>
          </div>
        </div>

        {/* Published */}
        <div
          onClick={() => {
            setStatusFilter('published');
            setPage(1);
          }}
          className={`bg-white rounded-3xl border p-5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
            statusFilter === 'published'
              ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-wider text-black">Published</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{publishedCount}</p>
          </div>
        </div>

        {/* Drafts */}
        <div
          onClick={() => {
            setStatusFilter('draft');
            setPage(1);
          }}
          className={`bg-white rounded-3xl border p-5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
            statusFilter === 'draft'
              ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
              Draft
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-wider text-black">Drafts</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{draftCount}</p>
          </div>
        </div>

        {/* Archived */}
        <div
          onClick={() => {
            setStatusFilter('archived');
            setPage(1);
          }}
          className={`bg-white rounded-3xl border p-5 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
            statusFilter === 'archived'
              ? 'border-slate-500 ring-2 ring-slate-100 bg-slate-50/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-black flex items-center justify-center shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-black bg-slate-100 px-2.5 py-0.5 rounded-full font-bold">
              Archived
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-black uppercase tracking-wider text-black">Archived</p>
            <p className="text-3xl font-black text-black mt-1">{archivedCount}</p>
          </div>
        </div>
      </div>

      {/* ─── Search & Filter Controls ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black/50" />
          <input
            type="text"
            placeholder="Search stories by title, summary, or author..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-black font-semibold placeholder:text-black/40 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-black text-xs sm:text-sm rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 font-bold cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {(search || statusFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-black" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Stories Content Area (Mobile Cards + Desktop Table) ─── */}
      {loading ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex justify-center">
          <LoadingSpinner text="Loading stories from database..." />
        </div>
      ) : stories.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <EmptyState
            title="No Stories Found"
            description="No stories match your criteria. Click below to publish your first case story!"
            actionText="Add New Story"
            onAction={() => handleOpenModal()}
            icon={BookOpen}
          />
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< 768px): Responsive card view, NO horizontal scroll */}
          <div className="md:hidden space-y-4">
            {stories.map((story, idx) => {
              const sNo = (page - 1) * pageSize + idx + 1;

              return (
                <div
                  key={story._id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
                >
                  {/* Top Bar: S.No + Status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-black font-bold">#{sNo}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        story.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : story.status === 'draft'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-black border border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          story.status === 'published'
                            ? 'bg-emerald-500'
                            : story.status === 'draft'
                            ? 'bg-amber-500'
                            : 'bg-black'
                        }`}
                      />
                      <span>{story.status}</span>
                    </span>
                  </div>

                  {/* Story Details */}
                  <div>
                    <h3 className="font-extrabold text-black text-sm leading-snug line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="text-xs text-black font-semibold line-clamp-2 mt-1 leading-relaxed">
                      {story.summary || story.content || '—'}
                    </p>
                  </div>

                  {/* Meta Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {story.category}
                    </span>
                    <span className="text-black font-bold">By {story.author}</span>
                    <span className="text-black/60 font-mono text-[11px] font-bold">
                      {story.views || 0} views
                    </span>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenModal(story)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(story)}
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW (>= 768px): Modern Grouped Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-black border-b border-slate-200/80">
                  <tr>
                    <th className="py-4 px-6 min-w-[300px]">Story Title & Summary</th>
                    <th className="py-4 px-4 min-w-[160px]">Category</th>
                    <th className="py-4 px-4 min-w-[140px]">Author</th>
                    <th className="py-4 px-4 text-center w-28">Status</th>
                    <th className="py-4 px-4 text-center w-24">Views</th>
                    <th className="py-4 px-6 text-right w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-black">
                  {stories.map((story) => (
                    <tr
                      key={story._id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Title & Summary */}
                      <td className="py-4 px-6">
                        <p className="font-extrabold text-black text-sm leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {story.title}
                        </p>
                        <p className="text-xs text-black font-semibold line-clamp-1 mt-0.5 leading-relaxed">
                          {story.summary || story.content || '—'}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {story.category}
                        </span>
                      </td>

                      {/* Author */}
                      <td className="py-4 px-4 text-xs font-bold text-black">
                        {story.author}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            story.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : story.status === 'draft'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-black border border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              story.status === 'published'
                                ? 'bg-emerald-500'
                                : story.status === 'draft'
                                ? 'bg-amber-500'
                                : 'bg-black'
                            }`}
                          />
                          <span>{story.status}</span>
                        </span>
                      </td>

                      {/* Views */}
                      <td className="py-4 px-4 text-center text-xs font-mono text-black font-bold">
                        {story.views || 0}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenModal(story)}
                            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                            title="Edit Story"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(story)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title="Delete Story"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Dynamic Server-Side Pagination ─── */}
          <ServerPagination
            currentPage={page}
            pageSize={pageSize}
            totalRecords={totalRecords}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            showPageSizeDropdown={true}
            loading={loading}
            recordLabel="stories"
          />
        </>
      )}

      {/* ─── Add / Edit Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black">
                  {editingItem ? 'Edit Story' : 'Create New Story'}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Author narrative case stories and enterprise showcases
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Story Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Scaling Enterprise Cloud Services at High Throughput"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Author <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Featured Image URL / Path <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Summary / Synopsis <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Brief synopsis..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Story Body <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Full narrative details..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Publication Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors cursor-pointer"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Story?"
        message="Are you sure you want to permanently delete this story from the database?"
        itemName={deleteTarget?.title}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
