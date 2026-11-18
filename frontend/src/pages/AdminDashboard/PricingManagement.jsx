import { useState, useEffect, useMemo } from 'react';
import pricingService from '../../services/pricingService';
import ConfirmDeleteModal from '../../shared/components/admin/ConfirmDeleteModal';
import LoadingSpinner from '../../shared/components/admin/LoadingSpinner';
import EmptyState from '../../shared/components/admin/EmptyState';
import ServerPagination from '../../components/common/ServerPagination';
import {
  Tag,
  Plus,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  Star,
  Layers,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Award,
  AlertCircle,
  Clock,
  DollarSign,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const DURATION_TYPES = ['Days', 'Months', 'Years', 'One Time', 'Custom'];
const LISTING_TYPES = ['Standard', 'Featured', 'Premium'];
const BADGE_OPTIONS = ['None', 'Popular', 'Best Value', 'Recommended', 'Limited Offer', 'Custom'];
const CTA_BEHAVIOURS = [
  { value: 'enquiry', label: 'Enquiry Form (with pre-filled package)' },
  { value: 'contact', label: 'Contact Us Page' },
  { value: 'whatsapp', label: 'Direct WhatsApp Chat' },
  { value: 'custom', label: 'Custom URL Link' },
];

const PRESET_ACCENT_COLORS = [
  { name: 'Primary Blue', hex: '#2563EB' },
  { name: 'Gold / Amber', hex: '#E8890C' },
  { name: 'Deep Emerald', hex: '#0F3D2E' },
  { name: 'Vibrant Green', hex: '#16A34A' },
  { name: 'Royal Purple', hex: '#7C3AED' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Rose', hex: '#E11D48' },
];

const DEFAULT_CATEGORIES = [
  'Website Development Packages',
  'Business Packages',
  'E-Commerce Solutions',
  'Digital Marketing Packages',
  'Cloud & DevOps Packages',
  'Custom Enterprise Solutions',
  'Other',
];

const STANDARD_WEB_PRESET_FEATURES = [
  { name: 'Mobile-Responsive Custom Layout', description: 'Fluid design across smartphones, tablets & desktop', isIncluded: true, displayOrder: 1 },
  { name: 'Fast Turnaround & Rapid Delivery', description: 'Structured milestone deployment', isIncluded: true, displayOrder: 2 },
  { name: 'Lead Contact Form & WhatsApp Integration', description: 'Instant conversion notifications to team', isIncluded: true, displayOrder: 3 },
  { name: 'Search Engine Optimization (SEO)', description: 'Technical SEO, sitemaps and schema markup', isIncluded: true, displayOrder: 4 },
  { name: 'Free SSL Certificate & Security Shield', description: '256-bit enterprise encryption', isIncluded: true, displayOrder: 5 },
  { name: 'High-Speed Cloud Hosting Setup', description: '99.9% uptime SLA configuration', isIncluded: true, displayOrder: 6 },
  { name: 'Ongoing Technical Support', description: 'Priority ticketing and email assistance', isIncluded: true, displayOrder: 7 },
  { name: 'Custom ERP / CRM API Integration', description: 'Two-way database synchronisation', isIncluded: false, displayOrder: 8 },
];

const INITIAL_FORM_STATE = {
  packageName: '',
  tagline: '',
  description: '',
  price: '',
  duration: 1,
  durationType: 'Years',
  buttonText: 'Get Started',
  listingType: 'Standard',
  badge: 'None',
  customBadgeText: '',
  accentColor: '#2563EB',
  isFeatured: false,
  isHighlighted: false,
  isActive: true,
  category: 'Website Development Packages',
  customCategory: '',
  targetAudience: '',
  features: [
    { name: 'Responsive Website Design', description: '', isIncluded: true, displayOrder: 1 },
    { name: 'Mobile-Friendly Layout', description: '', isIncluded: true, displayOrder: 2 },
    { name: 'SEO Optimization', description: '', isIncluded: true, displayOrder: 3 },
    { name: 'Contact Form Integration', description: '', isIncluded: true, displayOrder: 4 },
    { name: 'SSL Certificate & Hosting', description: '', isIncluded: true, displayOrder: 5 },
    { name: 'Technical Support', description: '', isIncluded: true, displayOrder: 6 },
  ],
  additionalNotes: '',
  termsAndConditions: '',
  offerExpiryDate: '',
  ctaType: 'enquiry',
  ctaLink: '',
  status: 'Published',
  displayOrder: 1,
};

export default function PricingManagement() {
  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState({
    totalPackages: 0,
    publishedPackages: 0,
    draftPackages: 0,
    featuredPackages: 0,
  });
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [listingTypeFilter, setListingTypeFilter] = useState('All');
  const [durationTypeFilter, setDurationTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('displayOrder');
  const [sortOrder, setSortOrder] = useState('asc');
  const [tabFilter, setTabFilter] = useState('all');

  // Pagination State (5, 10, 25, 50, 100)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState('info');

  // New Feature Input in Modal
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [newFeatureIncluded, setNewFeatureIncluded] = useState(true);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Quick View Modal
  const [viewingPackage, setViewingPackage] = useState(null);

  // Fetch Packages & Stats
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [packagesRes, statsRes] = await Promise.all([
        pricingService.getAdminPricing({
          search,
          status: statusFilter,
          listingType: listingTypeFilter,
          durationType: durationTypeFilter,
          category: categoryFilter,
          sortBy: sortBy === 'price-desc' || sortBy === 'price-asc' ? 'price' : sortBy,
          sortOrder: sortBy === 'price-desc' ? 'desc' : sortOrder,
          page: currentPage,
          limit: pageSize,
        }),
        pricingService.getPricingStats(),
      ]);

      if (packagesRes && packagesRes.success) {
        setPackages(packagesRes.packages || []);
        const total = packagesRes.totalCount ?? (packagesRes.packages || []).length;
        setTotalCount(total);
        setTotalPages(packagesRes.totalPages || Math.ceil(total / pageSize) || 1);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes.stats || stats);
        if (statsRes.categories && statsRes.categories.length) {
          const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...statsRes.categories]));
          setCategories(merged);
        }
      }
    } catch (err) {
      console.error('Error fetching pricing data:', err);
      showFeedback('error', 'Failed to load pricing packages: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, listingTypeFilter, durationTypeFilter, categoryFilter, sortBy, sortOrder, currentPage, pageSize]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setListingTypeFilter('All');
    setDurationTypeFilter('All');
    setCategoryFilter('All');
    setSortBy('displayOrder');
    setSortOrder('asc');
    setTabFilter('all');
    setCurrentPage(1);
    setCurrentPage(1);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setErrors({});
    const nextOrder = packages.length ? Math.max(...packages.map((p) => p.displayOrder || 0)) + 1 : 1;
    setFormData({
      ...INITIAL_FORM_STATE,
      displayOrder: nextOrder,
    });
    setActiveFormTab('info');
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (pkg) => {
    setEditingId(pkg._id);
    setErrors({});
    const isPredefined = DEFAULT_CATEGORIES.includes(pkg.category) && pkg.category !== 'Other';
    const resolvedCat = isPredefined ? pkg.category : 'Other';
    const resolvedCustomCat = pkg.customCategory || (!isPredefined ? pkg.category : '');

    setFormData({
      packageName: pkg.packageName || '',
      tagline: pkg.tagline || '',
      description: pkg.description || '',
      price: pkg.price !== undefined ? pkg.price : '',
      duration: pkg.duration || 1,
      durationType: pkg.durationType || 'Years',
      buttonText: pkg.buttonText || 'Get Started',
      listingType: pkg.listingType || 'Standard',
      badge: pkg.badge || 'None',
      customBadgeText: pkg.customBadgeText || '',
      accentColor: pkg.accentColor || '#2563EB',
      isFeatured: !!pkg.isFeatured,
      isHighlighted: !!pkg.isHighlighted,
      isActive: pkg.isActive !== false,
      category: resolvedCat,
      customCategory: resolvedCustomCat,
      targetAudience: pkg.targetAudience || '',
      features: Array.isArray(pkg.features) ? JSON.parse(JSON.stringify(pkg.features)) : [],
      additionalNotes: pkg.additionalNotes || '',
      termsAndConditions: pkg.termsAndConditions || '',
      offerExpiryDate: pkg.offerExpiryDate ? pkg.offerExpiryDate.split('T')[0] : '',
      ctaType: pkg.ctaType || 'enquiry',
      ctaLink: pkg.ctaLink || '',
      status: pkg.status || 'Published',
      displayOrder: pkg.displayOrder || 1,
    });
    setActiveFormTab('info');
    setModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmitPackage = async (overrideStatus) => {
    const newErrors = {};

    if (!formData.packageName || !formData.packageName.trim()) {
      newErrors.packageName = 'Package Name is required.';
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      newErrors.price = 'Please enter a valid non-negative Price ($).';
    }

    if (!formData.category || !formData.category.trim()) {
      newErrors.category = 'Package Category is required.';
    } else if (formData.category === 'Other' && !formData.customCategory?.trim()) {
      newErrors.customCategory = 'Please enter custom category name.';
    }

    if (!formData.duration || formData.duration < 1) {
      newErrors.duration = 'Duration must be at least 1.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (newErrors.packageName || newErrors.category) {
        setActiveFormTab('info');
      } else if (newErrors.price || newErrors.duration) {
        setActiveFormTab('pricing');
      }
      showFeedback('error', 'Please complete all mandatory fields marked with *');
      return;
    }
    setErrors({});

    setSubmitting(true);
    const effectiveCategory =
      formData.category === 'Other'
        ? (formData.customCategory?.trim() || 'Other')
        : formData.category;

    const payload = {
      ...formData,
      category: effectiveCategory,
      customCategory: formData.category === 'Other' ? (formData.customCategory?.trim() || '') : '',
      price: priceNum,
      offerExpiryDate: formData.offerExpiryDate ? formData.offerExpiryDate : null,
      status: overrideStatus || formData.status,
    };

    try {
      if (editingId) {
        const res = await pricingService.updatePricing(editingId, payload);
        if (res.success) {
          showFeedback('success', `Pricing package "${formData.packageName}" updated successfully.`);
        }
      } else {
        const res = await pricingService.createPricing(payload);
        if (res.success) {
          showFeedback('success', `Pricing package "${formData.packageName}" created successfully.`);
        }
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Submit error:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to save pricing package.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (pkg) => {
    try {
      const res = await pricingService.toggleStatus(pkg._id);
      if (res.success) {
        showFeedback('success', `Package "${pkg.packageName}" is now ${res.status}.`);
        fetchData();
      }
    } catch (err) {
      showFeedback('error', 'Failed to toggle status: ' + (err.response?.data?.message || err.message));
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (pkg) => {
    try {
      const res = await pricingService.toggleFeatured(pkg._id);
      if (res.success) {
        showFeedback('success', `Package "${pkg.packageName}" ${res.isFeatured ? 'is now Featured' : 'is no longer Featured'}.`);
        fetchData();
      }
    } catch (err) {
      showFeedback('error', 'Failed to update featured flag: ' + (err.response?.data?.message || err.message));
    }
  };

  // Reorder Item
  const handleReorder = async (pkg, direction) => {
    try {
      await pricingService.updateOrder(pkg._id, { direction });
      fetchData();
    } catch (err) {
      showFeedback('error', 'Failed to update display order.');
    }
  };

  // Duplicate Package
  const handleDuplicate = async (pkg) => {
    try {
      const res = await pricingService.duplicatePricing(pkg._id);
      if (res.success) {
        showFeedback('success', `Duplicated "${pkg.packageName}" as Draft.`);
        fetchData();
      }
    } catch (err) {
      showFeedback('error', 'Failed to duplicate package: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete Package
  const handleConfirmDelete = async () => {
    if (!packageToDelete) return;
    setDeleting(true);
    try {
      const res = await pricingService.deletePricing(packageToDelete._id);
      if (res.success) {
        showFeedback('success', `Package "${packageToDelete.packageName}" deleted.`);
        setDeleteModalOpen(false);
        setPackageToDelete(null);
        fetchData();
      }
    } catch (err) {
      showFeedback('error', 'Failed to delete package: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(false);
    }
  };

  // Dynamic Feature Handlers in Modal
  const handleAddFeature = () => {
    if (!newFeatureName.trim()) return;
    const newFeature = {
      name: newFeatureName.trim(),
      description: newFeatureDesc.trim(),
      isIncluded: newFeatureIncluded,
      displayOrder: formData.features.length + 1,
    };
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, newFeature],
    }));
    setNewFeatureName('');
    setNewFeatureDesc('');
    setNewFeatureIncluded(true);
  };

  const handleRemoveFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleToggleFeatureIncluded = (index) => {
    setFormData((prev) => {
      const updated = [...prev.features];
      updated[index] = { ...updated[index], isIncluded: !updated[index].isIncluded };
      return { ...prev, features: updated };
    });
  };

  const handleMoveFeature = (index, dir) => {
    setFormData((prev) => {
      const updated = [...prev.features];
      const targetIndex = index + dir;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, features: updated };
    });
  };

  const handleLoadPresetFeatures = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...STANDARD_WEB_PRESET_FEATURES],
    }));
  };

  // Badge Text Preview Resolver
  const effectiveBadgeText = useMemo(() => {
    if (formData.badge === 'None') return '';
    if (formData.badge === 'Custom') return formData.customBadgeText || 'Special';
    return formData.badge;
  }, [formData.badge, formData.customBadgeText]);

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full min-w-0 pb-12 font-sans">
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
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="cursor-pointer text-black hover:text-blue-600 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            <span className="text-blue-600 font-extrabold">Pricing Management</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight flex items-center gap-2.5">
            <span>Pricing Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 font-mono font-bold">
              {stats.totalPackages || totalCount || packages.length} Packages
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-black font-medium mt-1">
            Manage public pricing packages, listing tiers, promotional badges and client CTA behaviors.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="w-11 h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-black flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh pricing data"
          >
            <RotateCcw className={`w-4 h-4 text-black ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Package</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SUMMARY STATISTICS CARDS (5 Interactive Filter Cards)  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1: Total Packages */}
        <div
          onClick={() => {
            setTabFilter('all');
            setStatusFilter('All');
            setListingTypeFilter('All');
            setCurrentPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-blue-500 hover:shadow-[0_20px_40px_-12px_rgba(37,99,235,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
            tabFilter === 'all' && statusFilter === 'All' && listingTypeFilter === 'All'
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-115 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
              <Tag className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
              All
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-blue-900">
              Total Packages
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
              {stats.totalPackages || totalCount || packages.length}
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
            setStatusFilter('Published');
            setListingTypeFilter('All');
            setCurrentPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-emerald-500 hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
            tabFilter === 'published'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200/80'
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
              {stats.publishedPackages || 0}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-black group-hover:text-emerald-600 font-bold flex items-center justify-between w-full">
              <span>Filter Live</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Featured Plans */}
        <div
          onClick={() => {
            setTabFilter('featured');
            setStatusFilter('All');
            setListingTypeFilter('Featured');
            setCurrentPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-amber-500 hover:shadow-[0_20px_40px_-12px_rgba(245,158,11,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
            tabFilter === 'featured'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200/80'
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
              {stats.featuredPackages || 0}
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
            setStatusFilter('Draft');
            setListingTypeFilter('All');
            setCurrentPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-indigo-500 hover:shadow-[0_20px_40px_-12px_rgba(99,102,241,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
            tabFilter === 'draft'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200/80'
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
              Draft Packages
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
              {stats.draftPackages || 0}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-black group-hover:text-indigo-600 font-bold flex items-center justify-between w-full">
              <span>Filter Drafts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 5: Premium Tier */}
        <div
          onClick={() => {
            setTabFilter('premium');
            setStatusFilter('All');
            setListingTypeFilter('Premium');
            setCurrentPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-purple-500 hover:shadow-[0_20px_40px_-12px_rgba(168,85,247,0.2)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
            tabFilter === 'premium'
              ? 'border-purple-500 ring-2 ring-purple-500/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-115 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600">
              <Award className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-800 text-[10px] font-bold">
              Premium
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-purple-900">
              Premium Tier
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight">
              {packages.filter((p) => p.listingType === 'Premium').length}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-black group-hover:text-purple-600 font-bold flex items-center justify-between w-full">
              <span>Filter Premium</span>
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
                setCurrentPage(1);
              }}
              placeholder="Search packages by name, tagline, or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-bold text-black placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
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
              { id: 'all', label: 'All Packages', count: stats.totalPackages || totalCount || packages.length },
              { id: 'published', label: 'Published Live', count: stats.publishedPackages },
              { id: 'featured', label: 'Homepage Featured', count: stats.featuredPackages },
              { id: 'draft', label: 'Drafts', count: stats.draftPackages },
              { id: 'premium', label: 'Premium Tier', count: packages.filter((p) => p.listingType === 'Premium').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setTabFilter(tab.id);
                  if (tab.id === 'all') {
                    setStatusFilter('All');
                    setListingTypeFilter('All');
                  } else if (tab.id === 'published') {
                    setStatusFilter('Published');
                    setListingTypeFilter('All');
                  } else if (tab.id === 'featured') {
                    setStatusFilter('All');
                    setListingTypeFilter('Featured');
                  } else if (tab.id === 'draft') {
                    setStatusFilter('Draft');
                    setListingTypeFilter('All');
                  } else if (tab.id === 'premium') {
                    setStatusFilter('All');
                    setListingTypeFilter('Premium');
                  }
                  setCurrentPage(1);
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

            {(search ||
              categoryFilter !== 'All' ||
              durationTypeFilter !== 'All' ||
              sortBy !== 'displayOrder' ||
              tabFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setTabFilter('all');
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-black text-xs font-bold transition-colors cursor-pointer shrink-0 ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Secondary Dropdown Filter Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-black cursor-pointer focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={durationTypeFilter}
            onChange={(e) => {
              setDurationTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-black cursor-pointer focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Durations</option>
            {DURATION_TYPES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-black cursor-pointer focus:outline-none focus:border-blue-600"
          >
            <option value="displayOrder">Sort: Display Order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="createdAt">Date Created</option>
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. PACKAGES TABLE (Matching Gallery Assets Table Style)    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs sm:text-sm font-black text-black">Loading pricing packages...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={Tag}
              title="No Pricing Packages Found"
              description={
                search || statusFilter !== 'All' || tabFilter !== 'all'
                  ? 'No packages match the active filter criteria. Try clearing your search filters.'
                  : 'Start by creating your first package to display on the public website.'
              }
              actionLabel="Add New Package"
              onAction={handleOpenCreateModal}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto min-w-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-black text-black uppercase tracking-wider">
                    <th className="py-2.5 px-3.5 w-12 text-center font-mono whitespace-nowrap">#</th>
                    <th className="py-2.5 px-3.5">Package Details</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Category & Tier</th>
                    <th className="py-2.5 px-3.5 whitespace-nowrap">Price</th>
                    <th className="py-2.5 px-3.5 text-center whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {packages.map((pkg, idx) => {
                    const isPublished = pkg.status === 'Published';
                    const serialNumber = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={pkg._id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-default"
                      >
                        {/* Display Order */}
                        <td className="py-2 px-3.5 text-center font-mono font-black text-black align-middle whitespace-nowrap">
                          {pkg.displayOrder || serialNumber}
                        </td>

                        {/* Package Details */}
                        <td className="py-2 px-3.5 align-middle">
                          <div className="flex items-start gap-2.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 shadow-xs"
                              style={{ backgroundColor: pkg.accentColor || '#2563EB' }}
                              title={`Accent: ${pkg.accentColor}`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-black text-sm leading-snug group-hover:text-blue-600 transition-colors">
                                  {pkg.packageName}
                                </span>
                                {pkg.badge && pkg.badge !== 'None' && (
                                  <span
                                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white shadow-2xs"
                                    style={{ backgroundColor: pkg.accentColor || '#2563EB' }}
                                  >
                                    {pkg.badge === 'Custom' ? pkg.customBadgeText || 'Custom' : pkg.badge}
                                  </span>
                                )}
                                {pkg.isFeatured && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                    Featured
                                  </span>
                                )}
                              </div>
                              {pkg.tagline && (
                                <p className="text-xs text-black font-medium truncate mt-0.5 max-w-xs sm:max-w-sm" title={pkg.tagline}>
                                  {pkg.tagline}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category & Listing Tier Combined */}
                        <td className="py-2 px-3.5 whitespace-nowrap align-middle">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-black border border-slate-200 text-xs font-bold whitespace-nowrap shadow-2xs">
                              {pkg.category}
                            </span>
                            <span
                              className={`inline-flex items-center text-[10px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap text-black ${
                                pkg.listingType === 'Premium'
                                  ? 'bg-purple-100 border border-purple-300'
                                  : pkg.listingType === 'Featured'
                                  ? 'bg-amber-100 border border-amber-300'
                                  : 'bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {pkg.listingType}
                            </span>
                          </div>
                        </td>

                        {/* Price & Duration */}
                        <td className="py-2 px-3.5 whitespace-nowrap align-middle">
                          <div className="font-black text-black">
                            ${pkg.price?.toLocaleString('en-US')}
                            <span className="text-xs font-bold text-black">
                              {' '}
                              / {pkg.duration > 1 ? `${pkg.duration} ` : ''}
                              {pkg.durationType}
                            </span>
                          </div>
                        </td>

                        {/* Status Pill / Toggle */}
                        <td className="py-2 px-3.5 text-center whitespace-nowrap align-middle">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(pkg)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black whitespace-nowrap transition-colors cursor-pointer border ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-black border-slate-300 hover:bg-slate-200'
                            }`}
                            title="Click to toggle status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPublished ? 'bg-emerald-500' : 'bg-black'
                              }`}
                            />
                            <span>{isPublished ? 'Live' : 'Draft'}</span>
                          </button>
                        </td>

                        {/* Actions (Matching Gallery Assets buttons) */}
                        <td className="py-2 px-3.5 text-right whitespace-nowrap align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview */}
                            <button
                              type="button"
                              onClick={() => setViewingPackage(pkg)}
                              className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-blue-300 bg-white hover:bg-blue-50 text-black hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs font-bold"
                              title="Preview Card"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(pkg)}
                              className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-blue-300 bg-white hover:bg-blue-50 text-black hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs font-bold"
                              title="Edit Package"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={() => handleDuplicate(pkg)}
                              className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-blue-300 bg-white hover:bg-blue-50 text-black hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs font-bold"
                              title="Duplicate Package"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => {
                                setPackageToDelete(pkg);
                                setDeleteModalOpen(true);
                              }}
                              className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-rose-300 bg-white hover:bg-rose-50 text-black hover:text-rose-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs font-bold"
                              title="Delete Package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ========================================================= */}
            {/* 5. DYNAMIC SERVER-SIDE PAGINATION                          */}
            {/* ========================================================= */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50">
              <ServerPagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalRecords={totalCount}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setCurrentPage(1);
                }}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                showPageSizeDropdown={true}
                loading={loading}
                recordLabel="packages"
              />
            </div>
          </>
        )}
      </div>

      {/* ─── ADD / EDIT PACKAGE MODAL WITH LIVE PREVIEW (No Gray Text) ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-6xl w-full max-h-[95vh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-scaleUp text-black">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/90">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-black text-black">
                    {editingId ? 'Edit Pricing Package' : 'Create New Pricing Package'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-black font-semibold line-clamp-1 sm:line-clamp-none">
                    Configure package information, dynamic features, tier settings, and preview live.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 sm:p-2 rounded-xl text-black hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 bg-white">
              {[
                { id: 'info', label: '1. Package Info' },
                { id: 'pricing', label: '2. Pricing & Tier' },
                { id: 'appearance', label: '3. Appearance & Badge' },
                { id: 'features', label: `4. Features (${formData.features.length})` },
                { id: 'additional', label: '5. Additional & CTA' },
                { id: 'publishing', label: '6. Publishing' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFormTab(tab.id)}
                  className={`py-3 px-3 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeFormTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-black hover:text-blue-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
              {/* Form Section */}
              <div className="lg:col-span-7 space-y-6">
                {/* ─── TAB 1: Package Info ─── */}
                {activeFormTab === 'info' && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-black">
                      Section 1: Package Information
                    </h4>

                    {/* Package Name */}
                    <div>
                      <label className="block text-xs font-black text-black mb-1">
                        Package Name <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.packageName}
                        onChange={(e) => {
                          setFormData({ ...formData, packageName: e.target.value });
                          if (errors.packageName) setErrors((prev) => ({ ...prev, packageName: null }));
                        }}
                        placeholder="e.g. Professional Business or Premium Growth"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold text-black placeholder:text-black/40 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors ${
                          errors.packageName ? 'border-rose-500 bg-rose-50/30' : 'bg-slate-50 border-slate-300'
                        }`}
                      />
                      {errors.packageName && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.packageName}</p>}
                    </div>

                    {/* Tagline */}
                    <div>
                      <label className="block text-xs font-black text-black mb-1">
                        Tagline <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="e.g. Maximum visibility, maximum growth."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-bold text-black placeholder:text-black/40 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-black text-black mb-1">
                        Customer-Facing Description <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="A complete digital solution designed to help businesses improve their online presence and reach more customers..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-black placeholder:text-black/40 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="block text-xs font-black text-black mb-1">
                        Package Category Section <span className="text-rose-500 font-bold">*</span>
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
                          if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
                          if (errors.customCategory) setErrors((prev) => ({ ...prev, customCategory: null }));
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-black text-black cursor-pointer focus:outline-none focus:border-blue-600 ${
                          errors.category ? 'border-rose-500 bg-rose-50/30' : 'bg-slate-50 border-slate-300'
                        }`}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {errors.category && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.category}</p>}

                      {formData.category === 'Other' && (
                        <div className="mt-2.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl animate-fadeIn">
                          <label className="block text-xs font-bold text-black mb-1">
                            Enter Custom Category <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.customCategory || ''}
                            onChange={(e) => {
                              setFormData({ ...formData, customCategory: e.target.value });
                              if (errors.customCategory) setErrors((prev) => ({ ...prev, customCategory: null }));
                            }}
                            placeholder="e.g. AI Automation Packages, Mobile App Retainers..."
                            className={`w-full px-3.5 py-2 bg-white border rounded-xl text-black text-xs font-bold focus:outline-none ${
                              errors.customCategory ? 'border-rose-500' : 'border-amber-300 focus:border-blue-500'
                            }`}
                          />
                          {errors.customCategory && (
                            <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.customCategory}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: Pricing & Tier ─── */}
                {activeFormTab === 'pricing' && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      Section 2: Pricing & Duration
                    </h4>

                    {/* Price in Dollar ($) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-black mb-1">
                          Price ($ USD / AUD) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-black">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.price}
                            onChange={(e) => {
                              setFormData({ ...formData, price: e.target.value });
                              if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
                            }}
                            placeholder="e.g. 1499"
                            className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-black text-black focus:outline-none focus:border-blue-600 focus:bg-white ${
                              errors.price ? 'border-rose-500 bg-rose-50/30' : 'bg-slate-50 border-slate-300'
                            }`}
                          />
                        </div>
                        {errors.price && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.price}</p>}
                      </div>

                      {/* Duration & Duration Type */}
                      <div>
                        <label className="block text-xs font-black text-black mb-1">
                          Duration & Cycle <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min="1"
                            value={formData.duration}
                            onChange={(e) => {
                              setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 1 });
                              if (errors.duration) setErrors((prev) => ({ ...prev, duration: null }));
                            }}
                            className={`px-3.5 py-2.5 rounded-xl border text-xs font-black text-black text-center focus:outline-none focus:border-blue-600 focus:bg-white ${
                              errors.duration ? 'border-rose-500 bg-rose-50/30' : 'bg-slate-50 border-slate-300'
                            }`}
                          />
                          <select
                            value={formData.durationType}
                            onChange={(e) => setFormData({ ...formData, durationType: e.target.value })}
                            className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-black text-black cursor-pointer focus:outline-none focus:border-blue-600"
                          >
                            {DURATION_TYPES.map((dt) => (
                              <option key={dt} value={dt}>
                                {dt}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors.duration && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.duration}</p>}
                      </div>
                    </div>

                    {/* Button Text & Listing Tier */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-black mb-1">CTA Button Text</label>
                        <input
                          type="text"
                          value={formData.buttonText}
                          onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                          placeholder="e.g. Get Started or Claim Your Plan"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-black focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-black mb-1">Listing Tier</label>
                        <select
                          value={formData.listingType}
                          onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-black text-black cursor-pointer focus:outline-none focus:border-blue-600"
                        >
                          {LISTING_TYPES.map((lt) => (
                            <option key={lt} value={lt}>
                              {lt} Tier
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Display Order */}
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Display Order</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                        className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-black text-black focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: Appearance & Badge ─── */}
                {activeFormTab === 'appearance' && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      Section 3: Package Appearance & Badges
                    </h4>

                    {/* Badge Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-black mb-1">Package Badge</label>
                        <select
                          value={formData.badge}
                          onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-black text-black cursor-pointer focus:outline-none focus:border-blue-600"
                        >
                          {BADGE_OPTIONS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.badge === 'Custom' && (
                        <div>
                          <label className="block text-xs font-black text-black mb-1">Custom Badge Text</label>
                          <input
                            type="text"
                            value={formData.customBadgeText}
                            onChange={(e) => setFormData({ ...formData, customBadgeText: e.target.value })}
                            placeholder="e.g. Special Deal or Limited Edition"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-black focus:outline-none focus:border-blue-600 focus:bg-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Card Theme Accent Color */}
                    <div>
                      <label className="block text-xs font-black text-black mb-2">
                        Card Accent Color
                      </label>
                      <div className="flex items-center gap-2.5 flex-wrap mb-2">
                        {PRESET_ACCENT_COLORS.map((clr) => (
                          <button
                            key={clr.hex}
                            type="button"
                            onClick={() => setFormData({ ...formData, accentColor: clr.hex })}
                            className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                              formData.accentColor === clr.hex ? 'scale-115 border-black shadow-md' : 'border-white hover:scale-105'
                            }`}
                            style={{ backgroundColor: clr.hex }}
                            title={clr.name}
                          >
                            {formData.accentColor === clr.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 max-w-xs">
                        <input
                          type="color"
                          value={formData.accentColor}
                          onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                          className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.accentColor}
                          onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                          placeholder="#2563EB"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-black text-black"
                        />
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200">
                        <div>
                          <p className="text-xs font-black text-black">Featured Package</p>
                          <p className="text-[11px] text-black font-medium">
                            Give this package a highlighted border, elevated shadow and badge.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200">
                        <div>
                          <p className="text-xs font-black text-black">Active Visibility</p>
                          <p className="text-[11px] text-black font-medium">
                            Show on the public website when status is Published.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* ─── TAB 4: Dynamic Features (Unlimited) ─── */}
                {activeFormTab === 'features' && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        Section 4: Dynamic Package Features
                      </h4>
                      <button
                        type="button"
                        onClick={handleLoadPresetFeatures}
                        className="text-xs font-black text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Load Web Presets
                      </button>
                    </div>

                    {/* Add Feature Inputs */}
                    <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2.5">
                      <p className="text-xs font-black text-black">Add New Feature</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFeatureName}
                          onChange={(e) => setNewFeatureName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddFeature();
                            }
                          }}
                          placeholder="Feature name (e.g. Free 1-Year Cloud Hosting)"
                          className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-black focus:outline-none focus:border-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => setNewFeatureIncluded(!newFeatureIncluded)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                            newFeatureIncluded ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-rose-100 text-rose-950 border border-rose-300'
                          }`}
                        >
                          {newFeatureIncluded ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
                          {newFeatureIncluded ? 'Included' : 'Excluded'}
                        </button>
                        <button
                          type="button"
                          onClick={handleAddFeature}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-colors cursor-pointer shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {formData.features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 group hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleFeatureIncluded(idx)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer ${
                                feat.isIncluded ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                              title={feat.isIncluded ? 'Mark as Not Included' : 'Mark as Included'}
                            >
                              {feat.isIncluded ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <span
                              className={`text-xs font-bold truncate ${
                                feat.isIncluded ? 'text-black' : 'text-black/40 line-through'
                              }`}
                            >
                              {feat.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveFeature(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 rounded text-black disabled:opacity-20 cursor-pointer"
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveFeature(idx, 1)}
                              disabled={idx === formData.features.length - 1}
                              className="p-1 rounded text-black disabled:opacity-20 cursor-pointer"
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(idx)}
                              className="p-1 rounded text-black hover:text-rose-600 cursor-pointer ml-1"
                              title="Remove feature"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── TAB 5: Additional Info & CTA ─── */}
                {activeFormTab === 'additional' && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-600" />
                      Section 5: Additional Information & CTA Behaviour
                    </h4>

                    {/* Target Audience */}
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Target Audience</label>
                      <input
                        type="text"
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                        placeholder="e.g. Startups, Consultants, and Local Service Providers"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-black focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>

                    {/* CTA Behaviour */}
                    <div>
                      <label className="block text-xs font-black text-black mb-1">CTA Button Action</label>
                      <select
                        value={formData.ctaType}
                        onChange={(e) => setFormData({ ...formData, ctaType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-black text-black cursor-pointer focus:outline-none focus:border-blue-600"
                      >
                        {CTA_BEHAVIOURS.map((cta) => (
                          <option key={cta.value} value={cta.value}>
                            {cta.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.ctaType === 'custom' && (
                      <div>
                        <label className="block text-xs font-black text-black mb-1">Custom CTA URL</label>
                        <input
                          type="text"
                          value={formData.ctaLink}
                          onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                          placeholder="https://example.com/checkout or /custom-page"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-black focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                    )}

                    {/* Additional Notes & Terms */}
                    <div>
                      <label className="block text-xs font-black text-black mb-1">
                        Terms & Conditions / Disclaimer
                      </label>
                      <textarea
                        rows={2}
                        value={formData.termsAndConditions}
                        onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                        placeholder="e.g. Price excludes 18% GST. Annual renewal applies."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-black focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* ─── TAB 6: Publishing Settings ─── */}
                {activeFormTab === 'publishing' && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Section 6: Publishing Status
                    </h4>

                    {/* Status Toggle */}
                    <div>
                      <label className="block text-xs font-black text-black mb-1">Publication Status</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: 'Published' })}
                          className={`p-3.5 rounded-xl border text-left font-black text-xs transition-all cursor-pointer ${
                            formData.status === 'Published'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                              : 'border-slate-300 bg-white text-black hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Published (Live)</span>
                          </div>
                          <p className="text-[11px] font-medium text-black mt-1">
                            Visible immediately on the public website.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: 'Draft' })}
                          className={`p-3.5 rounded-xl border text-left font-black text-xs transition-all cursor-pointer ${
                            formData.status === 'Draft'
                              ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20'
                              : 'border-slate-300 bg-white text-black hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Save as Draft</span>
                          </div>
                          <p className="text-[11px] font-medium text-black mt-1">
                            Hidden from public view until published.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label className="block text-xs font-black text-black mb-1">
                        Offer Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formData.offerExpiryDate}
                        onChange={(e) => setFormData({ ...formData, offerExpiryDate: e.target.value })}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-black focus:outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── LIVE INTERACTIVE CARD PREVIEW (5 Columns - High Contrast) ─── */}
              <div className="lg:col-span-5 flex flex-col items-center w-full">
                <div className="w-full max-w-md lg:max-w-none lg:sticky lg:top-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      Live Package Preview
                    </span>
                    <span className="text-[10px] font-black text-black">Updates in real time</span>
                  </div>

                  {/* Rendered Preview Card - Responsive & No Inner Scrollbar */}
                  <div
                    className={`relative w-full rounded-2xl sm:rounded-3xl bg-white border-2 p-5 sm:p-6 shadow-xl transition-all duration-300 flex flex-col justify-between ${
                      formData.isFeatured
                        ? 'border-blue-600 shadow-blue-500/15 ring-4 ring-blue-500/10'
                        : 'border-slate-300 shadow-slate-200/50'
                    }`}
                  >
                    {/* Top Badge */}
                    {effectiveBadgeText && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span
                          className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-md inline-block whitespace-nowrap"
                          style={{ backgroundColor: formData.accentColor || '#2563EB' }}
                        >
                          {effectiveBadgeText}
                        </span>
                      </div>
                    )}

                    <div>
                      {/* Category Pill */}
                      <p className="text-[10px] font-black uppercase tracking-wider text-black mb-1">
                        {formData.category || 'Package Category'}
                      </p>

                      {/* Package Name */}
                      <h4 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                        {formData.packageName || 'Package Name'}
                      </h4>

                      {/* Tagline */}
                      {formData.tagline && (
                        <p className="text-xs text-black font-bold mt-1 leading-snug">
                          {formData.tagline}
                        </p>
                      )}

                      {/* Pricing Tag */}
                      <div className="mt-4 pb-4 border-b border-black/10 flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: formData.accentColor || '#2563EB' }}>
                          ${formData.price ? Number(formData.price).toLocaleString('en-US') : '0'}
                        </span>
                        <span className="text-xs font-bold text-black">
                          {' '}
                          / {formData.duration > 1 ? `${formData.duration} ` : ''}
                          {formData.durationType}
                        </span>
                      </div>

                      {/* Description */}
                      {formData.description && (
                        <p className="text-xs text-black font-medium mt-3 leading-relaxed line-clamp-2">
                          {formData.description}
                        </p>
                      )}

                      {/* Features List - No Inner Scrollbar */}
                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-wider text-black">
                          What's Included:
                        </p>
                        <div className="space-y-1.5">
                          {formData.features.map((feat, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                  feat.isIncluded
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-black/10 text-black/50'
                                }`}
                              >
                                {feat.isIncluded ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[2.5]" />}
                              </span>
                              <span
                                className={`leading-tight break-words ${
                                  feat.isIncluded ? 'text-black font-bold' : 'text-black/40 line-through'
                                }`}
                              >
                                {feat.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Preview CTA Button */}
                    <div className="mt-6 pt-3">
                      <button
                        type="button"
                        className="w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        style={{ backgroundColor: formData.accentColor || '#2563EB' }}
                      >
                        <span>{formData.buttonText || 'Get Started'}</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-[10px] text-center text-black font-bold mt-2">
                        Destination: {formData.ctaType === 'enquiry' ? 'Enquiry Form' : formData.ctaType}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl border border-slate-300 text-black hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitPackage('Draft')}
                  className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 hover:bg-amber-100 text-xs font-black transition-colors cursor-pointer disabled:opacity-50 text-center"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitPackage('Published')}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  <span>{editingId ? 'Update & Publish' : 'Publish Package'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── QUICK CARD VIEW MODAL ─── */}
      {viewingPackage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-300 relative animate-scaleUp text-black">
            <button
              onClick={() => setViewingPackage(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-black">
                {viewingPackage.category}
              </p>
              <h3 className="text-2xl font-black text-black mt-1">{viewingPackage.packageName}</h3>
              {viewingPackage.tagline && (
                <p className="text-xs font-bold text-black mt-1">{viewingPackage.tagline}</p>
              )}
              <div className="mt-3">
                <span className="text-3xl font-black" style={{ color: viewingPackage.accentColor || '#2563EB' }}>
                  ${viewingPackage.price?.toLocaleString('en-US')}
                </span>
                <span className="text-xs font-bold text-black">
                  {' '}
                  / {viewingPackage.duration > 1 ? `${viewingPackage.duration} ` : ''}
                  {viewingPackage.durationType}
                </span>
              </div>
            </div>

            <div className="border-t border-b border-black/10 py-3 my-3 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-black">Included Features:</p>
              {viewingPackage.features?.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      f.isIncluded ? 'bg-emerald-100 text-emerald-800' : 'bg-black/10 text-black/50'
                    }`}
                  >
                    {f.isIncluded ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[2.5]" />}
                  </span>
                  <span className={f.isIncluded ? 'text-black font-bold' : 'text-black/40 line-through'}>
                    {f.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setViewingPackage(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-black text-xs font-black hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const pkg = viewingPackage;
                  setViewingPackage(null);
                  handleOpenEditModal(pkg);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black hover:bg-blue-500 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE MODAL ─── */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        title="Delete Pricing Package?"
        message="Are you sure you want to permanently delete this pricing package? It will immediately disappear from both the admin dashboard and the public website."
        itemName={packageToDelete?.packageName}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPackageToDelete(null);
        }}
        loading={deleting}
      />
    </div>
  );
}
