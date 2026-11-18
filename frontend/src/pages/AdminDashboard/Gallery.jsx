import { useState, useEffect } from 'react';
import galleryService from '../../services/galleryService';
import { getImageUrl } from '../../utils/imageUrl';
import DragDropImageUpload from '../../shared/components/admin/DragDropImageUpload';
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
  Image as GalleryIcon,
  Eye,
  RotateCcw,
  Calendar,
  Clock,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Star,
  Layers,
} from 'lucide-react';

const GALLERY_CATEGORIES = [
  'General',
  'Digital Marketing',
  'Web Development',
  'Mobile App Development',
  'UI/UX Design',
  'E-commerce',
  'Branding',
  'Other',
];

const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  imageUrl: '',
  image: {
    url: '',
    alt: '',
  },
  status: 'published', // 'published' | 'draft'
  category: 'General',
  customCategory: '',
  aspectRatio: '16/9',
  isFeatured: false,
  displayOrder: 0,
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [tabFilter, setTabFilter] = useState('all'); // 'all' | 'published' | 'featured' | 'draft' | 'trash'
  const [counts, setCounts] = useState({ active: 0, published: 0, draft: 0, featured: 0, deleted: 0, total: 0 });

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Feedback & Undo state
  const [feedback, setFeedback] = useState(null);
  const [undoTarget, setUndoTarget] = useState(null);

  // Fetch gallery list
  const fetchGallery = async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
        page,
        limit: pageSize,
      };

      if (tabFilter === 'trash') {
        params.deleted = 'deleted';
      } else {
        params.deleted = 'active';
        if (tabFilter === 'published') {
          params.status = 'published';
        } else if (tabFilter === 'draft') {
          params.status = 'draft';
        } else if (tabFilter === 'featured') {
          params.featured = 'true';
        } else if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
      }

      const res = await galleryService.getAdminGalleryImages(params);
      if (res && res.success) {
        setImages(res.data || []);
        const total = res.pagination?.totalRecords ?? res.total ?? (res.data || []).length;
        setTotalItems(total);
        setTotalPages(res.pagination?.totalPages ?? res.pagination?.pages ?? Math.ceil(total / pageSize) ?? 1);
        if (res.counts) {
          setCounts(res.counts);
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error loading gallery items' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGallery();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, tabFilter, page, pageSize]);

  // Open modal for Create / Edit
  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      const isPredefined = GALLERY_CATEGORIES.includes(item.category) && item.category !== 'Other';
      const resolvedCategory = isPredefined ? (item.category || 'General') : (item.category ? 'Other' : 'General');
      const resolvedCustom = item.customCategory || (!isPredefined ? item.category : '');
      setFormData({
        title: item.title || '',
        description: item.description || item.caption || '',
        imageUrl: item.image?.url || item.imageUrl || '',
        image: {
          url: item.image?.url || item.imageUrl || '',
          alt: item.image?.alt || item.title || '',
        },
        status: item.status || 'published',
        category: resolvedCategory,
        customCategory: resolvedCustom || '',
        aspectRatio: item.aspectRatio || '16/9',
        isFeatured: Boolean(item.isFeatured),
        displayOrder: Number(item.displayOrder ?? item.order ?? 0),
      });
    } else {
      setEditingItem(null);
      setFormData(INITIAL_FORM_STATE);
    }
    setErrors({});
    setModalOpen(true);
  };

  // Open View Details Modal
  const handleOpenView = (item) => {
    setViewingItem(item);
    setViewModalOpen(true);
  };

  // Save (Create / Update)
  const handleSave = async (targetStatus = null) => {
    const newErrors = {};
    const finalImageUrl = formData.image?.url || formData.imageUrl;
    if (!finalImageUrl) {
      newErrors.image = 'Please upload a gallery image before saving.';
    }
    if (!formData.title?.trim()) {
      newErrors.title = 'Please provide an image title.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFeedback({ type: 'error', message: 'Please complete all mandatory fields marked with *' });
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      const effectiveCategory =
        formData.category === 'Other'
          ? (formData.customCategory?.trim() || 'Other')
          : (formData.category || 'General');

      const payload = {
        ...formData,
        category: effectiveCategory,
        customCategory: formData.category === 'Other' ? (formData.customCategory?.trim() || '') : '',
        imageUrl: finalImageUrl,
        image: {
          url: finalImageUrl,
          alt: formData.image?.alt || formData.title,
        },
        status: targetStatus || formData.status || 'published',
        isFeatured: Boolean(formData.isFeatured),
        displayOrder: Number(formData.displayOrder || 0),
      };

      if (editingItem) {
        await galleryService.updateGalleryImage(editingItem._id, payload);
        setFeedback({ type: 'success', message: 'Gallery image updated successfully!' });
      } else {
        await galleryService.createGalleryImage(payload);
        setFeedback({ type: 'success', message: 'New gallery image created successfully!' });
      }

      setModalOpen(false);
      fetchGallery();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error saving gallery image' });
    } finally {
      setSaving(false);
    }
  };

  // Quick 1-click Toggle Homepage Featured
  const handleToggleFeatured = async (item) => {
    try {
      const newFeatured = !item.isFeatured;
      await galleryService.toggleFeatured(item._id, newFeatured);
      setFeedback({
        type: 'success',
        message: newFeatured
          ? `"${item.title}" added to Homepage Featured Gallery`
          : `"${item.title}" removed from Homepage Featured Gallery`,
      });
      fetchGallery();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to toggle homepage featured status' });
    }
  };

  // Toggle status inline
  const handleStatusToggle = async (item) => {
    const newStatus = item.status === 'published' || item.status === 'visible' || item.status === 'active' ? 'draft' : 'published';
    try {
      await galleryService.updateGalleryImage(item._id, { status: newStatus });
      setFeedback({ type: 'success', message: `Image marked as ${newStatus}` });
      fetchGallery();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to toggle status' });
    }
  };

  // Soft Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await galleryService.deleteGalleryImage(deleteTarget._id);
      setUndoTarget({ id: deleteTarget._id, title: deleteTarget.title });
      setFeedback({
        type: 'success',
        message: `"${deleteTarget.title}" moved to trash.`,
      });
      setDeleteTarget(null);
      fetchGallery();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error deleting image' });
    } finally {
      setDeleting(false);
    }
  };

  // Restore
  const handleRestore = async (id, title = 'Image') => {
    try {
      await galleryService.restoreGalleryImage(id);
      setFeedback({ type: 'success', message: `"${title}" restored successfully!` });
      setUndoTarget(null);
      fetchGallery();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to restore image' });
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTabFilter('all');
    setPage(1);
  };

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all' || tabFilter !== 'all';

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full min-w-0 pb-12 font-sans">
      {/* ========================================================= */}
      {/* 1. PAGE HEADER (Matching Dashboard Overview Style)        */}
      {/* ========================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] min-w-0">
        <div className="min-w-0 flex-1">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-black font-bold mb-1.5 flex-wrap">
            <span className="text-black font-bold">VR4Web</span>
            <span className="text-slate-400">/</span>
            <span className="text-black font-bold">Admin</span>
            <span className="text-slate-400">/</span>
            <span className="text-blue-600 font-extrabold">Gallery Management</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight flex items-center gap-2.5">
            <span>Gallery Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 font-mono font-bold">
              {counts.active || counts.total || 0} Assets
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-black font-medium mt-1">
            Manage public portfolio images and select featured artwork for the Homepage Gallery.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Image</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
            {undoTarget && (
              <button
                onClick={() => handleRestore(undoTarget.id, undoTarget.title)}
                className="underline font-bold text-blue-700 hover:text-blue-900 ml-2 cursor-pointer"
              >
                Undo
              </button>
            )}
          </div>
          <button onClick={() => setFeedback(null)} className="cursor-pointer text-black hover:text-blue-600 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SUMMARY STATISTICS CARDS (5 Interactive Filter Cards)   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Total Active Assets */}
        <div
          onClick={() => {
            setTabFilter('all');
            setStatusFilter('all');
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-blue-500 hover:shadow-[0_20px_40px_-12px_rgba(37,99,235,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
            tabFilter === 'all' && statusFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-115 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
              <GalleryIcon className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
              All
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-blue-900">
              Active Assets
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
              {counts.active || counts.total || 0}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-black group-hover:text-blue-600 font-bold flex items-center justify-between w-full">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Published Live */}
        <div
          onClick={() => {
            setTabFilter('published');
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-emerald-500 hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
            tabFilter === 'published' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-115 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
              Live
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-emerald-900">
              Published Live
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
              {counts.published}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-black group-hover:text-emerald-600 font-bold flex items-center justify-between w-full">
              <span>Filter Live</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Featured on Homepage */}
        <div
          onClick={() => {
            setTabFilter('featured');
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-amber-500 hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
            tabFilter === 'featured' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-115 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
              Homepage
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-amber-900">
              Featured on Home
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
              {counts.featured || 0}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-black group-hover:text-amber-600 font-bold flex items-center justify-between w-full">
              <span>Filter Featured</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Drafts */}
        <div
          onClick={() => {
            setTabFilter('draft');
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-indigo-500 hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
            tabFilter === 'draft' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-115 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold">
              Draft
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-indigo-900">
              Draft Images
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
              {counts.draft}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-black group-hover:text-indigo-600 font-bold flex items-center justify-between w-full">
              <span>Filter Drafts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 5: Trash / Deleted */}
        <div
          onClick={() => {
            setTabFilter('trash');
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-rose-500 hover:shadow-[0_20px_40px_-12px_rgba(244,63,94,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
            tabFilter === 'trash' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-115 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold">
              Trash
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-rose-900">
              Trash / Archive
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
              {counts.deleted}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-black group-hover:text-rose-600 font-bold flex items-center justify-between w-full">
              <span>View Trash</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SEARCH & FILTERS BAR                                   */}
      {/* ========================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search images by title, description or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-bold text-black placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
            {[
              { id: 'all', label: 'All Assets', count: counts.active || counts.total },
              { id: 'published', label: 'Published Live', count: counts.published },
              { id: 'featured', label: 'Homepage Featured', count: counts.featured },
              { id: 'draft', label: 'Drafts', count: counts.draft },
              { id: 'trash', label: 'Trash', count: counts.deleted },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setTabFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  tabFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-black'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      tabFilter === tab.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-black'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-black text-xs font-bold transition-colors cursor-pointer shrink-0 ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. GALLERY ITEMS LIST (Table & Mobile Cards)              */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" message="Loading gallery assets..." />
          </div>
        ) : images.length === 0 ? (
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={GalleryIcon}
              title={tabFilter === 'trash' ? 'Trash is Empty' : 'No Gallery Assets Found'}
              description={
                tabFilter === 'trash'
                  ? 'There are no deleted images in the archive.'
                  : tabFilter === 'featured'
                  ? 'No images are currently selected for the Homepage Featured Gallery. Check "Show in Homepage Featured Gallery" on any image to feature it.'
                  : search
                  ? `No images matched your search for "${search}".`
                  : 'Start by uploading your first portfolio gallery image to showcase on the website.'
              }
              actionLabel={tabFilter === 'trash' ? null : 'Upload First Image'}
              onAction={tabFilter === 'trash' ? null : () => handleOpenModal()}
            />
          </div>
        ) : (
          <>
            {/* ---------------------------------------------------- */}
            {/* A. MOBILE CARDS VIEW (< 768px)                       */}
            {/* ---------------------------------------------------- */}
            <div className="block md:hidden divide-y divide-slate-100">
              {images.map((item) => {
                const isPublished = item.status === 'published' || item.status === 'visible' || item.status === 'active';
                const imgSrc = item.image?.url || item.imageUrl || '/banner/3.jpg';

                return (
                  <div key={item._id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div
                        onClick={() => handleOpenView(item)}
                        className="relative aspect-[16/9] w-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer"
                      >
                        <img
                          src={getImageUrl(imgSrc, '/banner/3.jpg')}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-black text-sm truncate">{item.title}</div>
                        <p className="text-black text-xs line-clamp-1 mt-0.5">
                          {item.description || item.caption || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-black">
                            {item.category || 'General'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">
                            Order #{item.displayOrder ?? item.order ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {/* Status Toggle */}
                        <button
                          type="button"
                          disabled={item.isDeleted}
                          onClick={() => handleStatusToggle(item)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-black border-slate-300'
                          }`}
                        >
                          {isPublished ? '● Live' : '○ Draft'}
                        </button>

                        {/* Homepage Featured Toggle */}
                        <button
                          type="button"
                          disabled={item.isDeleted}
                          onClick={() => handleToggleFeatured(item)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                            item.isFeatured
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          {item.isFeatured ? '⭐ Home Featured' : '☆ Not on Home'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.isDeleted ? (
                          <button
                            onClick={() => handleRestore(item._id, item.title)}
                            className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="p-1.5 rounded-xl border border-slate-200 bg-white text-black font-bold"
                              title="Edit Image"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-xl border border-slate-200 bg-white text-rose-600 font-bold"
                              title="Delete Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ---------------------------------------------------- */}
            {/* B. TABLE VIEW FOR TABLET & DESKTOP (>= 768px)         */}
            {/* ---------------------------------------------------- */}
            <div className="hidden md:block overflow-x-auto min-w-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black text-black uppercase tracking-wider">
                    <th className="py-2.5 px-3.5 w-12 text-center font-mono">#</th>
                    <th className="py-2.5 px-3.5 w-32">Thumbnail</th>
                    <th className="py-2.5 px-3.5 min-w-[200px]">Image Details</th>
                    <th className="py-2.5 px-3.5 w-28 text-center">Category</th>
                    <th className="py-2.5 px-3.5 w-32 text-center">Homepage</th>
                    <th className="py-2.5 px-3.5 w-28 text-center">Status</th>
                    <th className="py-2.5 px-3.5 w-32">Created Date</th>
                    <th className="py-2.5 px-3.5 w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {images.map((item, idx) => {
                    const isPublished = item.status === 'published' || item.status === 'visible' || item.status === 'active';
                    const imgSrc = item.image?.url || item.imageUrl || '/banner/3.jpg';
                    const serialNumber = (page - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={item._id}
                        className={`hover:bg-slate-50/70 transition-colors group cursor-default ${
                          item.isDeleted ? 'bg-rose-50/30 opacity-75' : ''
                        }`}
                      >
                        {/* S.No */}
                        <td className="py-2 px-3.5 text-center font-mono font-black text-black align-middle">
                          {serialNumber}
                        </td>

                        {/* Thumbnail */}
                        <td className="py-2 px-3.5 align-middle">
                          <div
                            onClick={() => handleOpenView(item)}
                            className="relative aspect-[16/9] w-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 group/thumb cursor-pointer shadow-2xs hover:border-blue-500 transition-all"
                            title="Click to preview full image"
                          >
                            <img
                              src={getImageUrl(imgSrc, '/banner/3.jpg')}
                              alt={item.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/banner/3.jpg';
                              }}
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        </td>

                        {/* Image Title & Description */}
                        <td className="py-2 px-3.5 align-middle">
                          <div className="font-extrabold text-black text-sm leading-snug">
                            {item.title}
                          </div>
                          <p className="text-black font-medium text-xs line-clamp-1 mt-0.5">
                            {item.description || item.caption || 'No description provided.'}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              Display Order: #{item.displayOrder ?? item.order ?? 0}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-2 px-3.5 text-center align-middle">
                          <span className="inline-block text-[11px] font-bold text-black bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {item.category || 'General'}
                          </span>
                        </td>

                        {/* Homepage Featured Quick Toggle */}
                        <td className="py-2 px-3.5 text-center align-middle">
                          <button
                            type="button"
                            disabled={item.isDeleted}
                            onClick={() => handleToggleFeatured(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              item.isFeatured
                                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 shadow-2xs'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-black'
                            }`}
                            title={item.isFeatured ? 'Click to remove from Homepage' : 'Click to feature on Homepage'}
                          >
                            <Star className={`w-3.5 h-3.5 ${item.isFeatured ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                            <span>{item.isFeatured ? 'Featured' : 'Off'}</span>
                          </button>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-2 px-3.5 text-center align-middle">
                          <button
                            type="button"
                            disabled={item.isDeleted}
                            onClick={() => handleStatusToggle(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer border ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-black border-slate-300 hover:bg-slate-200'
                            }`}
                            title={`Click to switch to ${isPublished ? 'Draft' : 'Live'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPublished ? 'bg-emerald-500' : 'bg-black'
                              }`}
                            />
                            <span>{isPublished ? 'Live' : 'Draft'}</span>
                          </button>
                        </td>

                        {/* Created Date */}
                        <td className="py-2 px-3.5 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-black font-bold">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3.5 text-right align-middle whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View */}
                            <button
                              type="button"
                              onClick={() => handleOpenView(item)}
                              className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-blue-300 bg-white hover:bg-blue-50 text-black hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs font-bold"
                              title="View Full Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Restore if Deleted */}
                            {item.isDeleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestore(item._id, item.title)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs shadow-2xs"
                                title="Restore from Trash"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <>
                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenModal(item)}
                                  className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-blue-300 bg-white hover:bg-blue-50 text-black hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs font-bold"
                                  title="Edit Gallery Image"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(item)}
                                  className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-rose-300 bg-white hover:bg-rose-50 text-black hover:text-rose-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs font-bold"
                                  title="Move to Trash"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* 5. DYNAMIC SERVER-SIDE PAGINATION                          */}
        {/* ========================================================= */}
        {totalItems > 0 && (
          <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50">
            <ServerPagination
              currentPage={page}
              pageSize={pageSize}
              totalRecords={totalItems}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              showPageSizeDropdown={true}
              loading={loading}
              recordLabel="assets"
            />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 6. ADD / EDIT MODAL                                        */}
      {/* ========================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs font-sans">
          <div className="bg-white border border-slate-200/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
                  {editingItem ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-black text-black text-lg">
                    {editingItem ? 'Edit Gallery Image' : 'Upload New Gallery Image'}
                  </h3>
                  <p className="text-xs text-black font-medium">
                    {editingItem
                      ? 'Update image photo, title, description, category, or homepage featured status'
                      : 'Upload photo, configure details, and choose homepage placement'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-xl border border-slate-200/80 hover:bg-slate-100 text-black hover:text-blue-600 transition-colors flex items-center justify-center cursor-pointer font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-white text-xs">
              {/* Field 1: Gallery Image (16:9 Drag & Drop) */}
              <div>
                <label className="block text-xs font-black text-black mb-1.5 uppercase">
                  Gallery Image <span className="text-rose-500 font-bold">*</span>
                </label>
                <DragDropImageUpload
                  label="16:9 Gallery Image Photo"
                  sublabel="Drag & drop high-resolution image here, or browse computer"
                  value={formData.image?.url || formData.imageUrl}
                  onChange={(url) => {
                    setFormData((prev) => ({
                      ...prev,
                      imageUrl: url,
                      image: { ...prev.image, url },
                    }));
                    if (errors.image) setErrors((prev) => ({ ...prev, image: null }));
                  }}
                  onUpload={(file, onProgress) =>
                    galleryService.uploadGalleryImage(file, onProgress).then((res) => res.fileUrl)
                  }
                  fallback="/banner/3.jpg"
                  aspectRatio="aspect-[16/9]"
                  helperText="Recommended: 16:9 ratio (1920×1080px or 1280×720px). JPG, JPEG, PNG, WEBP (Max 10 MB)"
                />
                {errors.image && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.image}</p>}
              </div>

              {/* Field 2: Image Title */}
              <div>
                <label className="block text-xs font-black text-black mb-1.5 uppercase">
                  Image Title <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                  }}
                  placeholder="e.g. Answer Engine Optimization"
                  className={`w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border rounded-xl text-black text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all ${
                    errors.title ? 'border-rose-500' : 'border-slate-200/80'
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.title}</p>}
              </div>

              {/* Field 3: Short Description (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-black uppercase">
                    Short Description <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  <span className="text-[11px] font-mono text-black font-bold">
                    {formData.description.length} / 150 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Helping businesses improve visibility across AI-powered search engines."
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-black text-xs font-medium leading-relaxed focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-sans"
                />
              </div>

              {/* Field 4: Category & Display Order Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-black text-black mb-1.5 uppercase">
                    Category (Optional)
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        category: val,
                        customCategory: val === 'Other' ? formData.customCategory : '',
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-black text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer"
                  >
                    {GALLERY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {formData.category === 'Other' && (
                    <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl animate-fadeIn">
                      <label className="block text-[11px] font-bold text-black mb-1 uppercase">
                        Enter Custom Category <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.customCategory || ''}
                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                        placeholder="e.g. Photography, 3D Rendering, Motion..."
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-black text-xs font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-xs font-black text-black mb-1.5 uppercase">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })
                    }
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-black text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Lower numbers appear first (#1 is main featured position).</p>
                </div>
              </div>

              {/* Field 5: Homepage Featured Toggle */}
              <div className={`p-4 rounded-2xl border transition-all ${
                formData.isFeatured ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
              } flex items-center justify-between gap-4`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    formData.isFeatured ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-black">
                      Show in Homepage Featured Gallery
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium block mt-0.5">
                      When enabled, this image will be featured on the homepage in the &quot;Beyond Color. Pure Emotion.&quot; showcase.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, isFeatured: !prev.isFeatured }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isFeatured ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.isFeatured ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Field 6: Status Selection */}
              <div>
                <label className="block text-xs font-black text-black mb-1.5 uppercase">
                  Publication Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
                      formData.status === 'draft' || formData.status === 'inactive'
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10'
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs text-black">Draft (Inactive)</div>
                      <div className="text-[11px] text-black font-medium">Hidden from all public pages</div>
                    </div>
                    {(formData.status === 'draft' || formData.status === 'inactive') && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'published' })}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
                      formData.status === 'published' || formData.status === 'active' || formData.status === 'visible'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs text-black">Published (Active)</div>
                      <div className="text-[11px] text-black font-medium">Visible on public gallery</div>
                    </div>
                    {(formData.status === 'published' || formData.status === 'active' || formData.status === 'visible') && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-black text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(formData.status)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingItem ? 'Update Gallery Image' : 'Save & Publish Image'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. VIEW DETAILS MODAL                                      */}
      {/* ========================================================= */}
      {viewModalOpen && viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs font-sans">
          <div className="bg-white border border-slate-200/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-black text-base">Gallery Image View</h3>
                  <p className="text-xs text-black font-bold">{viewingItem.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="w-9 h-9 rounded-xl border border-slate-200/80 hover:bg-slate-100 text-black hover:text-blue-600 transition-colors flex items-center justify-center cursor-pointer font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Full Image */}
              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm">
                <img
                  src={getImageUrl(viewingItem.image?.url || viewingItem.imageUrl, '/banner/3.jpg')}
                  alt={viewingItem.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-base font-extrabold text-black">{viewingItem.title}</h4>
                  <div className="flex items-center gap-2">
                    {viewingItem.isFeatured && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                        ⭐ Homepage Featured
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        viewingItem.status === 'published' || viewingItem.status === 'visible' || viewingItem.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-black border-slate-300'
                      }`}
                    >
                      ● {viewingItem.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span>Category: <strong className="text-black">{viewingItem.category || 'General'}</strong></span>
                  <span>Display Order: <strong className="text-black">#{viewingItem.displayOrder ?? viewingItem.order ?? 0}</strong></span>
                </div>

                <p className="text-xs text-black font-medium leading-relaxed font-sans pt-1 border-t border-slate-100">
                  {viewingItem.description || viewingItem.caption || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-black text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Move Gallery Image to Trash?"
        message={`Are you sure you want to remove "${deleteTarget?.title}" from the active gallery? It will be removed from the public website and homepage immediately, and can be restored anytime from Trash.`}
        confirmText="Yes, Move to Trash"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
