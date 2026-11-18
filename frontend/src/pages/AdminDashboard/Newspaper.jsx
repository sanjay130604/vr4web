import { useState, useEffect, useRef } from 'react';
import newspaperService from '../../services/newspaperService';
import ConfirmDeleteModal from '../../shared/components/admin/ConfirmDeleteModal';
import EmptyState from '../../shared/components/admin/EmptyState';
import LoadingSpinner from '../../shared/components/admin/LoadingSpinner';
import ServerPagination from '../../components/common/ServerPagination';
import { getImageUrl } from '../../utils/imageUrl';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Newspaper as NewspaperIcon,
  FileText,
  UploadCloud,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Layers,
  RotateCcw,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const NEWSPAPER_CATEGORIES = [
  'Editorial Publication',
  'Press Release',
  'Industry News',
  'Special Report',
  'Research Whitepaper',
  'Company Announcement',
  'Other',
];

const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  category: 'Editorial Publication',
  customCategory: '',
  image: {
    url: '',
    alt: '',
  },
  imageUrl: '',
  pdf: {
    url: '',
    fileName: '',
    fileSize: 0,
  },
  pdfUrl: '',
  fileName: '',
  fileSize: 0,
  status: 'draft',
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

// Format bytes into readable string (e.g., 2.4 MB)
function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function Newspaper() {
  const [newspapers, setNewspapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 5 });

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form Data State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});

  // Upload progress states
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  // Drag and drop dragover state
  const [imageDragging, setImageDragging] = useState(false);
  const [pdfDragging, setPdfDragging] = useState(false);

  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // Fetch Newspapers
  const fetchNewspapers = async () => {
    try {
      setLoading(true);
      const res = await newspaperService.getAdminNewspapers({
        search,
        status: statusFilter,
        page,
        limit: pageSize,
      });
      if (res && res.success) {
        setNewspapers(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error loading newspaper publications',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNewspapers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page, pageSize]);

  // Open Modal for Add or Edit
  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      const imgUrl = item.image?.url || item.imageUrl || '';
      const imgAlt = item.image?.alt || item.title || '';
      const docUrl = item.pdf?.url || item.pdfUrl || '';
      const docName = item.pdf?.fileName || item.fileName || '';
      const docSize = item.pdf?.fileSize || item.fileSize || 0;

      const isPredefined = NEWSPAPER_CATEGORIES.includes(item.category) && item.category !== 'Other';
      const resolvedCategory = isPredefined ? (item.category || 'Editorial Publication') : (item.category ? 'Other' : 'Editorial Publication');
      const resolvedCustom = item.customCategory || (!isPredefined ? item.category : '');

      setFormData({
        title: item.title || '',
        description: item.description || item.summary || '',
        category: resolvedCategory,
        customCategory: resolvedCustom || '',
        image: { url: imgUrl, alt: imgAlt },
        imageUrl: imgUrl,
        pdf: { url: docUrl, fileName: docName, fileSize: docSize },
        pdfUrl: docUrl,
        fileName: docName,
        fileSize: docSize,
        status: item.status || 'draft',
      });
    } else {
      setEditingId(null);
      setFormData(INITIAL_FORM_STATE);
    }
    setErrors({});
    setImageProgress(0);
    setPdfProgress(0);
    setModalOpen(true);
  };

  // Image Upload Handler
  const handleImageFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Please upload an image file (JPG, PNG, WEBP, SVG).' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Image size must be 10MB or less.' });
      return;
    }

    try {
      setImageUploading(true);
      setImageProgress(10);
      const res = await newspaperService.uploadNewspaperImage(file, (percent) => {
        setImageProgress(percent);
      });
      if (res && res.success && res.url) {
        setFormData((prev) => ({
          ...prev,
          image: { url: res.url, alt: prev.title || 'Newspaper cover' },
          imageUrl: res.url,
        }));
        setFeedback({ type: 'success', message: 'Cover image uploaded successfully' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Image upload failed' });
    } finally {
      setImageUploading(false);
    }
  };

  // PDF Upload Handler
  const handlePdfFile = async (file) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFeedback({ type: 'error', message: 'Invalid file format. Please upload a PDF file only.' });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'PDF size must be 50MB or less.' });
      return;
    }

    try {
      setPdfUploading(true);
      setPdfProgress(10);
      const res = await newspaperService.uploadNewspaperPdf(file, (percent) => {
        setPdfProgress(percent);
      });
      if (res && res.success && res.url) {
        setFormData((prev) => ({
          ...prev,
          pdf: {
            url: res.url,
            fileName: res.fileName || file.name,
            fileSize: res.fileSize || file.size,
          },
          pdfUrl: res.url,
          fileName: res.fileName || file.name,
          fileSize: res.fileSize || file.size,
        }));
        setFeedback({ type: 'success', message: 'PDF document uploaded successfully' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'PDF upload failed' });
    } finally {
      setPdfUploading(false);
    }
  };

  // Save / Update Handler
  const handleSave = async (submitStatus = null) => {
    const newErrors = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Newspaper Title is required.';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Newspaper Description is required.';
    }
    if (!formData.image.url && !formData.imageUrl) {
      newErrors.image = 'Please upload a Newspaper cover image.';
    }
    if (!formData.pdf.url && !formData.pdfUrl) {
      newErrors.pdf = 'Please upload the Newspaper PDF document.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFeedback({ type: 'error', message: 'Please complete all mandatory fields marked with *' });
      return;
    }
    setErrors({});

    const effectiveCategory =
      formData.category === 'Other'
        ? (formData.customCategory?.trim() || 'Other')
        : (formData.category || 'Editorial Publication');

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: effectiveCategory,
      customCategory: formData.category === 'Other' ? (formData.customCategory?.trim() || '') : '',
      image: {
        url: formData.image.url || formData.imageUrl,
        alt: formData.image.alt || formData.title.trim(),
      },
      imageUrl: formData.image.url || formData.imageUrl,
      pdf: {
        url: formData.pdf.url || formData.pdfUrl,
        fileName: formData.pdf.fileName || formData.fileName || 'document.pdf',
        fileSize: formData.pdf.fileSize || formData.fileSize || 0,
      },
      pdfUrl: formData.pdf.url || formData.pdfUrl,
      fileName: formData.pdf.fileName || formData.fileName || 'document.pdf',
      fileSize: formData.pdf.fileSize || formData.fileSize || 0,
      status: submitStatus || formData.status || 'draft',
    };

    setSaving(true);
    try {
      if (editingId) {
        await newspaperService.updateNewspaper(editingId, payload);
        setFeedback({ type: 'success', message: 'Newspaper publication updated successfully' });
      } else {
        await newspaperService.createNewspaper(payload);
        setFeedback({ type: 'success', message: 'Newspaper publication created successfully' });
      }
      setModalOpen(false);
      fetchNewspapers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to save newspaper publication',
      });
    } finally {
      setSaving(false);
    }
  };

  // Quick Status Toggle (Publish / Unpublish)
  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      await newspaperService.updateNewspaperStatus(item._id, nextStatus);
      setFeedback({
        type: 'success',
        message: `Publication marked as ${nextStatus === 'published' ? 'Published' : 'Draft'}`,
      });
      fetchNewspapers();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Status update failed' });
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await newspaperService.deleteNewspaper(deleteTarget._id);
      setFeedback({ type: 'success', message: 'Newspaper publication deleted successfully' });
      setDeleteTarget(null);
      fetchNewspapers();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete newspaper' });
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  // Stats calculation
  const totalCount = pagination.total || newspapers.length;
  const publishedCount = newspapers.filter((n) => n.status === 'published').length;
  const draftCount = newspapers.filter((n) => n.status === 'draft').length;

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
            <span className="text-blue-600 font-bold">Newspaper Articles</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 tracking-tight flex items-center gap-2.5 flex-wrap">
            <span>Newspaper Articles</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold shrink-0">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-black font-semibold mt-1 max-w-2xl">
            Manage press releases, newspaper features, and downloadable editorial PDFs.
          </p>
        </div>

        {/* Action Controls - Always preserved without awkward line breaking */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={() => fetchNewspapers()}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-black hover:bg-slate-50 font-bold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            title="Refresh publications"
          >
            <RotateCcw className="w-4 h-4 text-black shrink-0" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 sm:px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">Add New Newspaper</span>
          </button>
        </div>
      </div>

      {/* ─── Feedback Toast ─── */}
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

      {/* ─── Metric Stat Cards (Modern Interactive Grid) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Publications */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${
            statusFilter === 'all'
              ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20'
              : 'border-slate-200/80 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              All
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-black">Total Publications</p>
            <p className="text-2xl font-black text-black mt-0.5">{totalCount}</p>
          </div>
        </div>

        {/* Published Live */}
        <div
          onClick={() => {
            setStatusFilter('published');
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${
            statusFilter === 'published'
              ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20'
              : 'border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-black">Published Live</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{publishedCount}</p>
          </div>
        </div>

        {/* Drafts in Progress */}
        <div
          onClick={() => {
            setStatusFilter('draft');
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${
            statusFilter === 'draft'
              ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50/20'
              : 'border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Draft
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-black">Drafts in Progress</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{draftCount}</p>
          </div>
        </div>
      </div>

      {/* ─── Search & Status Filter Bar ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 py-2 px-3.5 sm:px-4 shadow-xs flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black" />
          <input
            type="text"
            placeholder="Search newspapers by title, description, or PDF filename..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-black placeholder:text-black/60 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors font-bold"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-blue-600 cursor-pointer font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          {/* Status Dropdown */}
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
          </select>

          {/* Reset Filters Button */}
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

      {/* ─── Newspaper Content Area (Mobile Cards + Desktop Table) ─── */}
      {loading ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex justify-center">
          <LoadingSpinner text="Loading newspapers from database..." />
        </div>
      ) : newspapers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <EmptyState
            title="No Newspapers Found"
            description="You haven't added any newspaper publications yet or no items match your search. Click below to add one!"
            actionText="Add New Newspaper"
            onAction={() => handleOpenModal()}
            icon={NewspaperIcon}
          />
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< 768px): Responsive card view, NO horizontal scroll */}
          <div className="md:hidden space-y-4">
            {newspapers.map((item, idx) => {
              const sNo = (page - 1) * pageSize + (idx + 1);
              const coverImg = getImageUrl(item.image?.url || item.imageUrl, '/white-paper.png');
              const pdfUrl = item.pdf?.url || item.pdfUrl;
              const pdfName = item.pdf?.fileName || item.fileName || 'Document.pdf';
              const pdfSize = formatFileSize(item.pdf?.fileSize || item.fileSize);
              const dateStr = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—';

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
                >
                  {/* Top Bar: S.No + Status + Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-black font-black">#{sNo}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        title="Click to toggle Status"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          item.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span>{item.status === 'published' ? 'Published' : 'Draft'}</span>
                      </button>
                      <span className="text-black font-mono font-bold text-[11px]">{dateStr}</span>
                    </div>
                  </div>

                  {/* Thumbnail & Title/Description */}
                  <div className="flex gap-3.5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0">
                      <img
                        src={coverImg}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/white-paper.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-black text-sm leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-black font-medium line-clamp-2 mt-1 leading-relaxed">
                        {item.description || item.summary || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Attached PDF Preview Link */}
                  {pdfUrl ? (
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-bold text-blue-900 truncate">
                          {pdfName}
                        </span>
                        <span className="text-[10px] font-mono text-blue-600 shrink-0">
                          ({pdfSize})
                        </span>
                      </div>
                      <a
                        href={getImageUrl(pdfUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-white text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                        title="Download / View PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-black font-medium italic">No PDF document attached</div>
                  )}

                  {/* Mobile Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
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

          {/* DESKTOP VIEW (>= 768px): Structured modern table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-black border-b border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-3.5 text-center w-12">#</th>
                    <th className="py-2.5 px-4 min-w-[320px]">Publication & Overview</th>
                    <th className="py-2.5 px-3.5 min-w-[180px]">PDF Document</th>
                    <th className="py-2.5 px-3.5 text-center w-32">Status</th>
                    <th className="py-2.5 px-3.5 w-32">Date</th>
                    <th className="py-2.5 px-4 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-black">
                  {newspapers.map((item, idx) => {
                    const sNo = (page - 1) * pageSize + (idx + 1);
                    const coverImg = getImageUrl(item.image?.url || item.imageUrl, '/white-paper.png');
                    const pdfUrl = item.pdf?.url || item.pdfUrl;
                    const pdfName = item.pdf?.fileName || item.fileName || 'Document.pdf';
                    const pdfSize = formatFileSize(item.pdf?.fileSize || item.fileSize);
                    const dateStr = item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—';

                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* S.No */}
                        <td className="py-2 px-3.5 text-center font-black text-black text-xs">
                          {sNo}
                        </td>

                        {/* Publication Info (Thumbnail + Title + Snippet) */}
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0">
                              <img
                                src={coverImg}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.src = '/white-paper.png';
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-black text-sm leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </p>
                              <p className="text-xs text-black font-medium line-clamp-1 mt-0.5 leading-relaxed">
                                {item.description || item.summary || '—'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* PDF File */}
                        <td className="py-2 px-3.5">
                          {pdfUrl ? (
                            <div className="space-y-0.5">
                              <a
                                href={getImageUrl(pdfUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors max-w-[200px] truncate"
                                title={`Open PDF: ${pdfName}`}
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                                <span className="truncate">{pdfName}</span>
                              </a>
                              {item.pdf?.fileSize > 0 && (
                                <span className="block text-[11px] text-black font-mono font-bold pl-1">
                                  {pdfSize}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-black font-medium italic">No PDF attached</span>
                          )}
                        </td>

                        {/* Status (Interactive toggle badge) */}
                        <td className="py-2 px-3.5 text-center">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title="Click to toggle Status"
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              item.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            <span>{item.status === 'published' ? 'Published' : 'Draft'}</span>
                          </button>
                        </td>

                        {/* Date */}
                        <td className="py-2 px-3.5 text-xs font-bold text-black font-mono">
                          {dateStr}
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewItem(item)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black transition-colors cursor-pointer font-bold"
                              title="Preview Publication"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer font-bold"
                              title="Edit Publication"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer font-bold"
                              title="Delete Publication"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Dynamic Server-Side Pagination ─── */}
          <ServerPagination
            currentPage={page}
            pageSize={pageSize}
            totalRecords={pagination.total || newspapers.length}
            totalPages={pagination.pages || 1}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            showPageSizeDropdown={true}
            loading={loading}
            recordLabel="newspapers"
          />
        </>
      )}

      {/* ─── Add / Edit Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black">
                  {editingId ? 'Edit Newspaper Article' : 'Add New Newspaper Article'}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Upload cover photography and attached PDF edition
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
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Newspaper Title <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., VR4Web Featured in Tech Chronicle Quarterly..."
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors ${
                    errors.title ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.title}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category <span className="text-rose-500 font-bold">*</span>
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
                  className="w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold text-slate-900 bg-slate-50 border-slate-200 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors cursor-pointer"
                >
                  {NEWSPAPER_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {formData.category === 'Other' && (
                  <div className="mt-2.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl animate-fadeIn">
                    <label className="block text-xs font-bold text-black mb-1">
                      Enter Custom Category <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customCategory || ''}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      placeholder="e.g. Special Feature, Tech Insights..."
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-black text-xs font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Editorial Summary / Description <span className="text-rose-500 font-bold">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide an overview of the publication and press coverage..."
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
                  }}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-normal text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors ${
                    errors.description ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                  }`}
                />
                {errors.description && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.description}</p>}
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cover Photo / Graphic <span className="text-rose-500 font-bold">*</span>
                </label>
                {errors.image && <p className="mb-2 text-xs text-rose-500 font-semibold">{errors.image}</p>}

                {formData.image.url || formData.imageUrl ? (
                  <div className="relative rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(formData.image.url || formData.imageUrl)}
                        alt="Preview"
                        className="w-16 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <span className="text-xs font-bold text-slate-700">Cover photo selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, image: { url: '', alt: '' }, imageUrl: '' })
                        }
                        className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setImageDragging(true);
                    }}
                    onDragLeave={() => setImageDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setImageDragging(false);
                      if (e.dataTransfer.files?.[0]) handleImageFile(e.dataTransfer.files[0]);
                    }}
                    className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                      imageDragging
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-300 hover:border-blue-500 bg-slate-50/60'
                    }`}
                  >
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
                      }}
                      className="hidden"
                    />

                    {imageUploading ? (
                      <div className="space-y-2 py-2">
                        <div className="w-8 h-8 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-slate-700">
                          Uploading image... {imageProgress}%
                        </p>
                        <div className="w-48 mx-auto h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-200"
                            style={{ width: `${imageProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-black">
                          Drag & drop newspaper cover photo here
                        </p>
                        <p className="text-xs text-black font-semibold mt-1">
                          Supports JPG, PNG, WEBP, or SVG (Up to 10MB)
                        </p>
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors cursor-pointer shadow-xs"
                        >
                          Browse Image
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* PDF Document Upload */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                  PDF Publication Document <span className="text-rose-500 font-bold">*</span>
                </label>
                {errors.pdf && <p className="mb-2 text-xs text-rose-500 font-semibold">{errors.pdf}</p>}

                {formData.pdf.url || formData.pdfUrl ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-900 truncate max-w-[220px]">
                          {formData.pdf.fileName || formData.fileName || 'Document.pdf'}
                        </p>
                        <p className="text-[11px] text-blue-600 font-mono">
                          {formatFileSize(formData.pdf.fileSize || formData.fileSize)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-50 cursor-pointer shadow-2xs"
                      >
                        Replace PDF
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            pdf: { url: '', fileName: '', fileSize: 0 },
                            pdfUrl: '',
                            fileName: '',
                            fileSize: 0,
                          })
                        }
                        className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setPdfDragging(true);
                    }}
                    onDragLeave={() => setPdfDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setPdfDragging(false);
                      if (e.dataTransfer.files?.[0]) handlePdfFile(e.dataTransfer.files[0]);
                    }}
                    className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                      pdfDragging
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-300 hover:border-blue-500 bg-slate-50/60'
                    }`}
                  >
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handlePdfFile(e.target.files[0]);
                      }}
                      className="hidden"
                    />

                    {pdfUploading ? (
                      <div className="space-y-2 py-2">
                        <div className="w-8 h-8 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-blue-900">
                          Uploading PDF... {pdfProgress}%
                        </p>
                        <div className="w-48 mx-auto h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-200"
                            style={{ width: `${pdfProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-black">
                          Drag & drop the newspaper PDF here
                        </p>
                        <p className="text-xs text-black font-semibold mt-1">Accepts PDF format (Up to 50MB)</p>
                        <button
                          type="button"
                          onClick={() => pdfInputRef.current?.click()}
                          className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors cursor-pointer shadow-xs"
                        >
                          Browse PDF
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Status Radio Buttons */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                  Initial Publication Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                    className={`py-3 px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      formData.status === 'draft'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-black border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>Save as Draft</span>
                    {formData.status === 'draft' && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'published' })}
                    className={`py-3 px-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      formData.status === 'published'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-slate-50 text-black border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>Publish Live</span>
                    {formData.status === 'published' && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl border border-slate-300 bg-white text-black font-bold text-xs sm:text-sm hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update Publication' : 'Create Publication'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Preview Modal ─── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-64 bg-slate-900 overflow-hidden">
              <img
                src={getImageUrl(previewItem.image?.url || previewItem.imageUrl)}
                alt={previewItem.title}
                className="w-full h-full object-cover opacity-90"
              />
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    previewItem.status === 'published'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {previewItem.status === 'published' ? 'Published Live' : 'Draft'}
                </span>
                <span className="text-xs text-white/80 font-mono">
                  {new Date(previewItem.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-xl font-black text-slate-900 leading-snug">
                {previewItem.title}
              </h3>
              <p className="text-sm text-black font-medium leading-relaxed whitespace-pre-line">
                {previewItem.description || previewItem.summary || 'No description provided.'}
              </p>

              {(previewItem.pdf?.url || previewItem.pdfUrl) && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-blue-900 truncate max-w-[200px]">
                        {previewItem.pdf?.fileName || previewItem.fileName || 'Attached Document'}
                      </p>
                      <p className="text-[11px] text-blue-600 font-mono">
                        {formatFileSize(previewItem.pdf?.fileSize || previewItem.fileSize)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={getImageUrl(previewItem.pdf?.url || previewItem.pdfUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Newspaper Publication"
        message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
