import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import blogService from '../../services/blogService';
import { getImageUrl, isValidImageUrl } from '../../utils/imageUrl';
import DragDropImageUpload from '../../shared/components/admin/DragDropImageUpload';
import ConfirmDeleteModal from '../../shared/components/admin/ConfirmDeleteModal';
import EmptyState from '../../shared/components/admin/EmptyState';
import LoadingSpinner from '../../shared/components/admin/LoadingSpinner';
import SeoFormSection from '../../shared/components/admin/SeoFormSection';
import ServerPagination from '../../components/common/ServerPagination';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Zap,
  Wand2,
  Sliders,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Calendar,
  Clock,
  User,
  Tag,
  Star,
  Check,
  RefreshCw,
  Image as ImageIcon,
  UploadCloud,
  Globe,
  Share2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Award,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const CATEGORIES = [
  'Mobile Development',
  'Web Application Development',
  'Technology & AI',
  'UI/UX Design',
  'Cloud & DevOps',
  'Digital Marketing',
  'SEO',
  'Enterprise Systems',
  'Other',
];

const INITIAL_FORM_STATE = {
  title: '',
  slug: '',
  category: 'Mobile Development',
  customCategory: '',
  author: 'VR4Web Technology Team',
  readTime: '6 min read',
  tags: ['Mobile Apps', 'React Native', 'Android', 'iOS'],
  summary: '',
  featuredImage: {
    url: '',
    alt: '',
  },
  imageUrl: '',
  contentType: 'manual', // 'manual' | 'quick'
  content: '',
  sections: [
    {
      heading: 'Summary & Overview',
      subheading: 'Why modern digital architectures drive competitive advantage',
      body: 'Mobile applications and modern web platforms have become indispensable pillars of how businesses connect with customers, streamline operations, and deliver lasting value.',
      image: { url: '', alt: '' },
      order: 1,
    },
    {
      heading: 'Technical Evolution & Architecture',
      subheading: 'Transitioning to cloud-native microservices and resilient frontends',
      body: 'Modern engineering standards prioritize sub-second interface responses, end-to-end encrypted transactions, and automated telemetry that delivers predictable business ROI.',
      image: { url: '', alt: '' },
      order: 2,
    },
    {
      heading: 'Core Frameworks & Implementation',
      subheading: 'Engineering execution across mobile and cloud stacks',
      body: 'We architect scalable ecosystems using modern, battle-tested software stacks that guarantee long-term stability and effortless maintainability across iOS, Android, and web platforms.',
      image: { url: '', alt: '' },
      order: 3,
    },
  ],
  // SEO & Social Media Metadata
  metaTitle: '',
  metaDescription: '',
  metaKeywords: ['Mobile Apps', 'Software Development', 'VR4Web Insights'],
  canonicalUrl: '',
  ogImage: '',
  ogTitle: '',
  ogDescription: '',
  // Complete SEO Object
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: ['Mobile Apps', 'Software Development', 'VR4Web Insights'],
    slug: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
  },
  status: 'published',
  isFeatured: false,
  publishedAt: '', // OPTIONAL: clean empty default so blogs can be created without publish date
};

export const SECTION_TABS = [
  { id: 'basic', label: '1. Basic Info' },
  { id: 'image', label: '2. Featured Cover' },
  { id: 'sections', label: '3. Content Sections' },
  { id: 'seo', label: '4. SEO & Social' },
];

export const validateBasicInfo = (data) => {
  const errs = {};
  if (!data.title?.trim()) {
    errs.title = 'Blog Title is required';
  }
  const slug = (data.slug || data.seo?.slug || '').trim();
  if (!slug) {
    errs.slug = 'URL Slug is required';
  }
  if (!data.category?.trim()) {
    errs.category = 'Blog Category is required';
  } else if (data.category === 'Other' && !data.customCategory?.trim()) {
    errs.customCategory = 'Please enter custom category name';
  }
  if (!data.summary?.trim()) {
    errs.summary = 'Short Description / Summary is required';
  }
  return errs;
};

export const validateFeaturedCover = (data) => {
  const errs = {};
  const imgUrl = (data.featuredImage?.url || data.imageUrl || '').trim();
  if (!imgUrl) {
    errs.featuredImage = 'Featured Cover Photo is required';
  }
  return errs;
};

export const validateContentSections = (data) => {
  const errs = {};
  if (data.contentType === 'quick') {
    const rawContent = data.content ? data.content.replace(/<[^>]*>/g, '').trim() : '';
    if (!rawContent) {
      errs.content = 'Article Body Content is required';
    }
  } else {
    const sections = Array.isArray(data.sections) ? data.sections : [];
    if (sections.length === 0) {
      errs.sections = 'At least one content section is required';
    } else {
      sections.forEach((sec, idx) => {
        if (!sec.heading?.trim()) {
          errs[`section_heading_${idx}`] = `Section #${idx + 1} Heading is required`;
        }
        if (!sec.body?.trim()) {
          errs[`section_body_${idx}`] = `Section #${idx + 1} Body Content is required`;
        }
      });
    }
  }
  return errs;
};

export const validateSeoSocial = (data) => {
  const errs = {};
  const metaTitle = (data.seo?.metaTitle || data.metaTitle || '').trim();
  const metaDescription = (data.seo?.metaDescription || data.metaDescription || '').trim();

  if (!metaTitle) {
    errs.metaTitle = 'SEO Meta Title is required';
  } else if (metaTitle.length > 100) {
    errs.metaTitle = 'SEO Meta Title must be 100 characters or less';
  }

  if (!metaDescription) {
    errs.metaDescription = 'SEO Meta Description is required';
  } else if (metaDescription.length > 320) {
    errs.metaDescription = 'SEO Meta Description must be 320 characters or less';
  }

  const canon = (data.seo?.canonicalUrl || data.canonicalUrl || '').trim();
  if (canon && !/^https?:\/\/.+/i.test(canon)) {
    errs.canonicalUrl = 'Canonical URL must be a valid URL starting with http:// or https://';
  }

  return errs;
};

export const validateEntireBlog = (data) => {
  if (data?.contentType === 'quick') {
    const errs = {};
    const rawContent = data.content ? data.content.replace(/<[^>]*>/g, '').trim() : '';
    if (!rawContent) {
      errs.content = 'Article Body Content is required';
    }
    return errs;
  }
  return {
    ...validateBasicInfo(data),
    ...validateFeaturedCover(data),
    ...validateContentSections(data),
    ...validateSeoSocial(data),
  };
};

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 5 });

  // Creation / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'image' | 'sections' | 'seo'
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [visitedTabs, setVisitedTabs] = useState(new Set());
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const isQuick = formData.contentType === 'quick';
  const rawContent = formData.content ? formData.content.replace(/<[^>]*>/g, '').trim() : '';

  // Real-time validations (only evaluate manual sections if in manual mode)
  const currentValidation = {
    basic: isQuick ? {} : validateBasicInfo(formData),
    image: isQuick ? {} : validateFeaturedCover(formData),
    sections: isQuick ? {} : validateContentSections(formData),
    seo: isQuick ? {} : validateSeoSocial(formData),
  };

  const sectionStatus = {
    basic: isQuick ? true : Object.keys(currentValidation.basic).length === 0,
    image: isQuick ? true : Object.keys(currentValidation.image).length === 0,
    sections: isQuick ? true : Object.keys(currentValidation.sections).length === 0,
    seo: isQuick ? true : Object.keys(currentValidation.seo).length === 0,
  };

  const sectionErrors = {
    basic: currentValidation.basic,
    image: currentValidation.image,
    sections: currentValidation.sections,
    seo: currentValidation.seo,
  };

  const entireBlogErrors = validateEntireBlog(formData);
  const isFormValid = isQuick ? Boolean(rawContent.length > 0) : Object.keys(entireBlogErrors).length === 0;

  // Step-by-step Next Section Navigation with validation
  const handleNextSection = (targetTab) => {
    let currentTabErrors = {};
    let tabName = '';

    if (activeTab === 'basic') {
      currentTabErrors = validateBasicInfo(formData);
      tabName = '1. Basic Info';
    } else if (activeTab === 'image') {
      currentTabErrors = validateFeaturedCover(formData);
      tabName = '2. Featured Cover';
    } else if (activeTab === 'sections') {
      currentTabErrors = validateContentSections(formData);
      tabName = '3. Content Sections';
    } else if (activeTab === 'seo') {
      currentTabErrors = validateSeoSocial(formData);
      tabName = '4. SEO & Social';
    }

    if (Object.keys(currentTabErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...currentTabErrors }));
      setVisitedTabs((prev) => new Set([...prev, activeTab]));
      setFeedback({
        type: 'error',
        message: `Please complete all mandatory fields in ${tabName} before continuing`,
      });

      setTimeout(() => {
        const errorEl = document.querySelector('.border-rose-500, .text-rose-500');
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setVisitedTabs((prev) => new Set([...prev, activeTab]));
    setActiveTab(targetTab);
  };

  // Safe Date Formatter (Prevents 'Invalid Date')
  const formatDateSafe = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
  };

  // Quick Create toggles
  const [quickDetailsExpanded, setQuickDetailsExpanded] = useState(false);
  const [quickSeoExpanded, setQuickSeoExpanded] = useState(true);

  // Tag & SEO Keyword Input Drafts
  const [tagInput, setTagInput] = useState('');
  const [seoKeywordInput, setSeoKeywordInput] = useState('');

  const quillRef = useRef(null);

  // Fetch List
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await blogService.getAdminBlogs({
        search,
        category: categoryFilter,
        status: statusFilter,
        page,
        limit: pageSize,
      });
      if (res && res.success) {
        setBlogs(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error loading blogs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBlogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter, page, pageSize]);

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // Stats calculation
  const totalCount = pagination.total || blogs.length;
  const publishedCount = blogs.filter((b) => b.status === 'published').length;
  const draftCount = blogs.filter((b) => b.status === 'draft').length;
  const featuredCount = blogs.filter((b) => b.isFeatured).length;

  // Manual override tracking for auto-suggestions
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [isMetaTitleManual, setIsMetaTitleManual] = useState(false);
  const [isMetaDescManual, setIsMetaDescManual] = useState(false);
  const [isOgTitleManual, setIsOgTitleManual] = useState(false);
  const [isOgDescManual, setIsOgDescManual] = useState(false);
  const [isOgImageManual, setIsOgImageManual] = useState(false);

  // Handle Title Change (auto slug & auto metaTitle)
  const handleTitleChange = (val) => {
    setFormData((prev) => {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const currentSeo = prev.seo || {};
      const newSlug = isSlugManual ? prev.slug : autoSlug;
      const newMetaTitle = isMetaTitleManual ? currentSeo.metaTitle : (val ? `${val} | VR4Web` : '');
      const newOgTitle = isOgTitleManual ? currentSeo.ogTitle : newMetaTitle;
      const newCanonical = currentSeo.canonicalUrl && isSlugManual
        ? currentSeo.canonicalUrl
        : `https://vr4web.com/blog/${newSlug}`;

      return {
        ...prev,
        title: val,
        slug: newSlug,
        metaTitle: newMetaTitle,
        ogTitle: newOgTitle,
        canonicalUrl: newCanonical,
        seo: {
          ...currentSeo,
          slug: newSlug,
          metaTitle: newMetaTitle,
          ogTitle: newOgTitle,
          canonicalUrl: newCanonical,
        },
      };
    });
  };

  // Dynamic SEO suggestions on Summary Change
  const handleSummaryChange = (val) => {
    setFormData((prev) => {
      const currentSeo = prev.seo || {};
      const newDesc = isMetaDescManual ? currentSeo.metaDescription : val.slice(0, 160);
      const newOgDesc = isOgDescManual ? currentSeo.ogDescription : newDesc;

      return {
        ...prev,
        summary: val,
        metaDescription: newDesc,
        ogDescription: newOgDesc,
        seo: {
          ...currentSeo,
          metaDescription: newDesc,
          ogDescription: newOgDesc,
        },
      };
    });
  };

  // Dynamic SEO suggestions on Featured Image Change
  const handleFeaturedImageChange = (url) => {
    setFormData((prev) => {
      const currentSeo = prev.seo || {};
      const newOgImg = isOgImageManual ? currentSeo.ogImage : url;
      return {
        ...prev,
        imageUrl: url,
        featuredImage: { ...prev.featuredImage, url },
        ogImage: newOgImg,
        seo: {
          ...currentSeo,
          ogImage: newOgImg,
        },
      };
    });
  };

  // SEO Field Handler
  const handleSeoChange = (updatedFields) => {
    setFormData((prev) => {
      const currentSeo = prev.seo || {};
      const newSeo = { ...currentSeo, ...updatedFields };

      if ('slug' in updatedFields) setIsSlugManual(true);
      if ('metaTitle' in updatedFields) setIsMetaTitleManual(true);
      if ('metaDescription' in updatedFields) setIsMetaDescManual(true);
      if ('ogTitle' in updatedFields) setIsOgTitleManual(true);
      if ('ogDescription' in updatedFields) setIsOgDescManual(true);
      if ('ogImage' in updatedFields) setIsOgImageManual(true);

      return {
        ...prev,
        seo: newSeo,
        ...(updatedFields.slug !== undefined ? { slug: updatedFields.slug } : {}),
        ...(updatedFields.metaTitle !== undefined ? { metaTitle: updatedFields.metaTitle } : {}),
        ...(updatedFields.metaDescription !== undefined ? { metaDescription: updatedFields.metaDescription } : {}),
        ...(updatedFields.keywords !== undefined ? { metaKeywords: updatedFields.keywords } : {}),
        ...(updatedFields.canonicalUrl !== undefined ? { canonicalUrl: updatedFields.canonicalUrl } : {}),
        ...(updatedFields.ogTitle !== undefined ? { ogTitle: updatedFields.ogTitle } : {}),
        ...(updatedFields.ogDescription !== undefined ? { ogDescription: updatedFields.ogDescription } : {}),
        ...(updatedFields.ogImage !== undefined ? { ogImage: updatedFields.ogImage } : {}),
      };
    });
  };

  // SEO Keyword Handlers (kept for backwards compatibility)
  const handleAddKeyword = () => {
    const trimmed = seoKeywordInput.trim();
    if (!trimmed) return;
    if (!formData.metaKeywords.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        metaKeywords: [...prev.metaKeywords, trimmed],
      }));
    }
    setSeoKeywordInput('');
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setFormData((prev) => ({
      ...prev,
      metaKeywords: prev.metaKeywords.filter((k) => k !== keywordToRemove),
    }));
  };

  // Open Creation / Edit Modal
  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item._id);
      setIsSlugManual(true);
      setIsMetaTitleManual(true);
      setIsMetaDescManual(true);
      setIsOgTitleManual(true);
      setIsOgDescManual(true);
      setIsOgImageManual(true);

      const initialTags = Array.isArray(item.tags)
        ? item.tags
        : typeof item.tags === 'string'
          ? item.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [];

      const itemSeo = item.seo || {};
      const initialKeywords = Array.isArray(itemSeo.keywords) && itemSeo.keywords.length > 0
        ? itemSeo.keywords
        : Array.isArray(item.metaKeywords) && item.metaKeywords.length > 0
          ? item.metaKeywords
          : initialTags.length > 0
            ? initialTags
            : ['Mobile Apps', 'Software Development', 'VR4Web Insights'];

      const initialSections = Array.isArray(item.sections) && item.sections.length > 0
        ? item.sections
        : [
          {
            heading: 'Introduction',
            subheading: '',
            body: item.summary || '',
            image: { url: '', alt: '' },
            order: 1,
          },
        ];

      const initialSeo = {
        metaTitle: itemSeo.metaTitle || item.metaTitle || (item.title ? `${item.title} | VR4Web` : ''),
        metaDescription: itemSeo.metaDescription || item.metaDescription || item.summary?.slice(0, 160) || '',
        keywords: initialKeywords,
        slug: itemSeo.slug || item.slug || '',
        canonicalUrl: itemSeo.canonicalUrl || item.canonicalUrl || (item.slug ? `https://vr4web.com/blog/${item.slug}` : ''),
        ogTitle: itemSeo.ogTitle || item.ogTitle || itemSeo.metaTitle || item.metaTitle || item.title || '',
        ogDescription: itemSeo.ogDescription || item.ogDescription || itemSeo.metaDescription || item.metaDescription || item.summary || '',
        ogImage: itemSeo.ogImage || item.ogImage || item.featuredImage?.url || item.imageUrl || '/blogs/blogs-banner.png',
      };

      // Resolve Category and Custom Category for Edit Mode
      const isPredefined = CATEGORIES.includes(item.category) && item.category !== 'Other';
      const resolvedCategory = isPredefined ? item.category : 'Other';
      const resolvedCustomCategory = item.customCategory || (!isPredefined ? item.category : '');

      setFormData({
        ...INITIAL_FORM_STATE,
        ...item,
        category: resolvedCategory,
        customCategory: resolvedCustomCategory,
        tags: initialTags,
        sections: initialSections,
        seo: initialSeo,
        slug: initialSeo.slug,
        metaTitle: initialSeo.metaTitle,
        metaDescription: initialSeo.metaDescription,
        metaKeywords: initialKeywords,
        canonicalUrl: initialSeo.canonicalUrl,
        ogTitle: initialSeo.ogTitle,
        ogDescription: initialSeo.ogDescription,
        ogImage: initialSeo.ogImage,
        featuredImage: {
          url: item.featuredImage?.url || item.imageUrl || '',
          alt: item.featuredImage?.alt || item.title || '',
        },
        imageUrl: item.imageUrl || item.featuredImage?.url || '',
        contentType: item.contentType || (item.content ? 'quick' : 'manual'),
        publishedAt: item.publishedAt
          ? new Date(item.publishedAt).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditingId(null);
      setIsSlugManual(false);
      setIsMetaTitleManual(false);
      setIsMetaDescManual(false);
      setIsOgTitleManual(false);
      setIsOgDescManual(false);
      setIsOgImageManual(false);
      setFormData(INITIAL_FORM_STATE);
    }
    setVisitedTabs(new Set());
    setHasAttemptedSubmit(false);
    setErrors({});
    setSeoKeywordInput('');
    setActiveTab('basic');
    setModalOpen(true);
  };

  // Switch Creation Mode seamlessly
  const handleModeSwitch = (mode) => {
    setFormData((prev) => {
      // If switching from manual to quick and content is empty, compile manual sections into rich HTML
      if (mode === 'quick' && !prev.content) {
        const sectionsHtml = (prev.sections || [])
          .map((sec) => `
            ${sec.heading ? `<h2>${sec.heading}</h2>` : ''}
            ${sec.subheading ? `<h4>${sec.subheading}</h4>` : ''}
            ${sec.body ? `<p>${sec.body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>` : ''}
            ${sec.image?.url ? `<img src="${sec.image.url}" alt="${sec.image.alt || sec.heading || ''}" />` : ''}
          `)
          .join('');
        return { ...prev, contentType: mode, content: sectionsHtml || prev.content };
      }
      return { ...prev, contentType: mode };
    });
  };

  // Insert Standard Template into Quick Create Editor
  const handleInsertTemplate = () => {
    const template = `
<h2>1. Summary & Overview</h2>
<p>Modern mobile and digital applications have become an indispensable pillar of modern enterprise longevity. Detail the strategic context and business drivers here...</p>

<h2>2. Technical Evolution & Architecture</h2>
<p>Explain the architecture patterns, state management, edge latency benchmarks, and cloud-native backend considerations...</p>

<h2>3. Core Frameworks & Implementation</h2>
<p>Deep dive into modern engineering stacks (React Native, Flutter, Swift, Node.js) and key features implemented:</p>
<ul>
  <li><strong>Cross-Platform Parity:</strong> Delivering fluid 60fps native performance with unified codebase maintenance.</li>
  <li><strong>Offline Resilience:</strong> Real-time caching and background sync during low-connectivity workflows.</li>
  <li><strong>Security Standards:</strong> End-to-end encrypted payloads and biometric token authentication.</li>
</ul>

<h2>4. Real-World Business Impact & ROI</h2>
<p>Summarize conversion metrics, operational efficiency improvements, and telemetry insights achieved...</p>

<h2>5. Conclusion & Next Steps</h2>
<p>Concluding takeaways, future feature roadmap, and executive summary...</p>
`;
    setFormData((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content}<br/>${template}` : template,
    }));
  };

  // Editor Inline Image Handler
  const handleEditorImageUpload = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/png, image/jpeg, image/webp');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        setUploadProgress(15);
        const res = await blogService.uploadBlogImage(file, (percent) => setUploadProgress(percent));
        if (res && res.success) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', res.fileUrl);
            quill.setSelection(range.index + 1);
          }
        }
      } catch (err) {
        setFeedback({ type: 'error', message: 'Failed to insert image into editor' });
      } finally {
        setUploadProgress(null);
      }
    };
  };

  // Save / Publish
  const handleSave = async (targetStatus) => {
    setHasAttemptedSubmit(true);

    const isQuickMode = formData.contentType === 'quick';
    const plainText = formData.content ? formData.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

    if (targetStatus === 'published') {
      if (isQuickMode) {
        if (!plainText) {
          setErrors({ content: 'Article Body Content is required to publish' });
          setFeedback({
            type: 'error',
            message: 'Please write or paste your article content in the editor before publishing',
          });
          return;
        }
      } else {
        const allErrors = validateEntireBlog(formData);
        if (Object.keys(allErrors).length > 0) {
          setErrors(allErrors);
          setVisitedTabs(new Set(['basic', 'image', 'sections', 'seo']));

          // Auto-switch to the first incomplete tab
          if (Object.keys(validateBasicInfo(formData)).length > 0) {
            setActiveTab('basic');
          } else if (Object.keys(validateFeaturedCover(formData)).length > 0) {
            setActiveTab('image');
          } else if (Object.keys(validateContentSections(formData)).length > 0) {
            setActiveTab('sections');
          } else if (Object.keys(validateSeoSocial(formData)).length > 0) {
            setActiveTab('seo');
          }

          setFeedback({
            type: 'error',
            message: 'Please complete all mandatory fields across all 4 sections before publishing',
          });

          setTimeout(() => {
            const errorEl = document.querySelector('.border-rose-500, .text-rose-500');
            if (errorEl) {
              errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          return;
        }
      }
    } else {
      // Draft mode: only title is mandatory for manual
      if (!isQuickMode && !formData.title?.trim()) {
        setErrors({ title: 'Blog Title is required to save as Draft' });
        setActiveTab('basic');
        setFeedback({ type: 'error', message: 'Blog Title is required to save as Draft' });
        return;
      }
    }

    setErrors({});

    // Auto-detect and populate missing fields for Quick Create
    let effectiveTitle = (formData.title || '').trim();
    if (!effectiveTitle && isQuickMode) {
      const headingMatch = formData.content ? formData.content.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i) : null;
      if (headingMatch && headingMatch[1]) {
        effectiveTitle = headingMatch[1].replace(/<[^>]*>/g, '').trim();
      } else if (plainText) {
        effectiveTitle = plainText.slice(0, 60).trim();
      } else {
        effectiveTitle = 'Quick Article';
      }
    }

    let effectiveSummary = (formData.summary || '').trim();
    if (!effectiveSummary && isQuickMode) {
      effectiveSummary = plainText ? plainText.slice(0, 160).trim() : effectiveTitle;
    }

    const activeSlug =
      (formData.seo?.slug || formData.slug || '').trim() ||
      (effectiveTitle || 'blog-article')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') ||
      `blog-${Date.now()}`;

    if (!activeSlug && !isQuickMode) {
      setFeedback({ type: 'error', message: 'Blog URL slug is required' });
      return;
    }

    const canon = (formData.seo?.canonicalUrl || formData.canonicalUrl || '').trim();
    if (canon && !/^https?:\/\/.+/i.test(canon)) {
      setFeedback({
        type: 'error',
        message: 'Canonical URL must be a valid absolute URL starting with http:// or https://',
      });
      return;
    }

    setSaving(true);
    try {
      const inlineImgMatch = formData.content ? formData.content.match(/<img[^>]+src="([^">]+)"/i) : null;
      const featuredImgUrl =
        formData.featuredImage?.url?.trim() ||
        formData.imageUrl?.trim() ||
        (inlineImgMatch ? inlineImgMatch[1] : '/blogs/blogs-banner.png');

      // Ensure section image URLs are valid image paths/URLs and not plain descriptive text
      const cleanedSections = (formData.sections || []).map((sec) => {
        let rawUrl = (sec.image?.url || '').trim();
        let rawAlt = (sec.image?.alt || sec.heading || '').trim();

        if (rawUrl && !isValidImageUrl(rawUrl)) {
          // If the user typed arbitrary text into URL, preserve it as alt text and clear URL
          rawAlt = rawUrl;
          rawUrl = '';
        }

        return {
          ...sec,
          image: {
            url: rawUrl,
            alt: rawAlt,
          },
        };
      });

      const metaTitleVal =
        (formData.seo?.metaTitle && formData.seo.metaTitle.trim()) ||
        (formData.metaTitle && formData.metaTitle.trim()) ||
        (effectiveTitle ? `${effectiveTitle.trim()} | VR4Web` : 'VR4Web Blog Article');

      const metaDescVal =
        (formData.seo?.metaDescription && formData.seo.metaDescription.trim()) ||
        (formData.metaDescription && formData.metaDescription.trim()) ||
        effectiveSummary ||
        '';

      const metaKeywordsVal =
        Array.isArray(formData.seo?.keywords) && formData.seo.keywords.length > 0
          ? formData.seo.keywords
          : Array.isArray(formData.metaKeywords) && formData.metaKeywords.length > 0
            ? formData.metaKeywords
            : formData.tags?.length ? formData.tags : ['VR4Web', 'Blog'];

      const ogTitleVal =
        (formData.seo?.ogTitle && formData.seo.ogTitle.trim()) ||
        formData.ogTitle ||
        metaTitleVal;

      const ogDescVal =
        (formData.seo?.ogDescription && formData.seo.ogDescription.trim()) ||
        formData.ogDescription ||
        metaDescVal;

      const ogImageVal =
        (formData.seo?.ogImage && formData.seo.ogImage.trim()) ||
        formData.ogImage ||
        featuredImgUrl;

      const seoPayload = {
        metaTitle: metaTitleVal,
        metaDescription: metaDescVal,
        keywords: metaKeywordsVal,
        slug: activeSlug,
        canonicalUrl: canon || `https://vr4web.com/blog/${activeSlug}`,
        ogTitle: ogTitleVal,
        ogDescription: ogDescVal,
        ogImage: ogImageVal,
      };

      const effectiveCategory =
        formData.category === 'Other'
          ? (formData.customCategory?.trim() || 'Other')
          : (formData.category || 'Technology & AI');

      const payload = {
        ...formData,
        title: effectiveTitle || formData.title,
        summary: effectiveSummary || formData.summary,
        category: effectiveCategory,
        customCategory: formData.category === 'Other' ? (formData.customCategory?.trim() || '') : '',
        slug: activeSlug,
        sections: cleanedSections,
        imageUrl: featuredImgUrl,
        featuredImage: {
          url: featuredImgUrl,
          alt: formData.featuredImage?.alt || effectiveTitle,
        },
        metaTitle: metaTitleVal,
        metaDescription: metaDescVal,
        metaKeywords: metaKeywordsVal,
        canonicalUrl: seoPayload.canonicalUrl,
        ogTitle: ogTitleVal,
        ogDescription: ogDescVal,
        ogImage: ogImageVal,
        seo: seoPayload,
        publishedAt: formData.publishedAt?.trim() ? formData.publishedAt.trim() : null,
        status: targetStatus || formData.status,
      };

      if (editingId) {
        await blogService.updateBlog(editingId, payload);
        setFeedback({ type: 'success', message: `Blog saved as ${payload.status}` });
      } else {
        await blogService.createBlog(payload);
        setFeedback({ type: 'success', message: `Blog published as ${payload.status}` });
      }

      setModalOpen(false);
      fetchBlogs();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  // Duplicate
  const handleDuplicate = async (id) => {
    try {
      await blogService.duplicateBlog(id);
      setFeedback({ type: 'success', message: 'Blog duplicated as Draft' });
      fetchBlogs();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Publish / Unpublish Toggle
  const handleTogglePublish = async (item) => {
    try {
      if (item.status === 'published') {
        await blogService.updateBlogStatus(item._id, 'draft');
        setFeedback({ type: 'success', message: `"${item.title}" moved to Drafts` });
      } else {
        await blogService.updateBlogStatus(item._id, 'published');
        setFeedback({ type: 'success', message: `"${item.title}" is now Published live!` });
      }
      fetchBlogs();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (item) => {
    try {
      await blogService.updateBlogFeatured(item._id, !item.isFeatured);
      setFeedback({
        type: 'success',
        message: item.isFeatured ? 'Removed from Featured' : 'Marked as Featured Blog',
      });
      fetchBlogs();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await blogService.deleteBlog(deleteTarget._id);
      setFeedback({ type: 'success', message: 'Blog article deleted' });
      setDeleteTarget(null);
      fetchBlogs();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Tag Handlers
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim();
    if (!formData.tags.includes(clean)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  // Section Helpers (Add, Remove, Move Up, Move Down)
  const handleAddSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...(prev.sections || []),
        {
          heading: `Section ${(prev.sections?.length || 0) + 1}`,
          subheading: '',
          body: '',
          image: { url: '', alt: '' },
          order: (prev.sections?.length || 0) + 1,
        },
      ],
    }));
  };

  const handleRemoveSection = (idxToRemove) => {
    setFormData((prev) => {
      const filtered = (prev.sections || []).filter((_, i) => i !== idxToRemove);
      return {
        ...prev,
        sections: filtered.map((sec, i) => ({ ...sec, order: i + 1 })),
      };
    });
  };

  const handleMoveSection = (fromIdx, toIdx) => {
    setFormData((prev) => {
      const arr = [...(prev.sections || [])];
      if (toIdx < 0 || toIdx >= arr.length) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return {
        ...prev,
        sections: arr.map((sec, i) => ({ ...sec, order: i + 1 })),
      };
    });
  };

  const handleUpdateSection = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.sections || [])];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, sections: updated };
    });
  };

  // Quill Toolbar Modules
  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }, { align: [] }],
        ['link', 'image', 'clean'],
      ],
      handlers: {
        image: handleEditorImageUpload,
      },
    },
  };

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
            <span className="text-blue-600 font-black">Blogs & Insights</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 tracking-tight flex items-center gap-2.5 flex-wrap">
            <span>Blogs & Insights</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black shrink-0">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-black font-medium mt-1 max-w-2xl">
            Author, schedule, and curate engineering thought leadership articles and industry news.
          </p>
        </div>

        {/* Action Controls - Always preserved without awkward line breaking */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={() => fetchBlogs()}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-black hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            title="Refresh articles"
          >
            <RotateCcw className="w-4 h-4 text-black shrink-0" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 sm:px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">Add New Blog</span>
          </button>
        </div>
      </div>

      {/* ─── Feedback Toast ─── */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between border shadow-xs transition-all ${feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
            : 'bg-red-50 border-red-300 text-red-950 font-bold'
            }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-bold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="cursor-pointer text-black hover:text-red-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Metric Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Blogs */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${statusFilter === 'all'
            ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/20'
            : 'border-slate-200/80 hover:border-blue-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              All
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-black">Total Articles</p>
            <p className="text-2xl font-black text-black mt-0.5">{totalCount}</p>
          </div>
        </div>

        {/* Published Live */}
        <div
          onClick={() => {
            setStatusFilter('published');
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${statusFilter === 'published'
            ? 'border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/20'
            : 'border-slate-200/80 hover:border-emerald-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-black">Published</p>
            <p className="text-2xl font-black text-black mt-0.5">{publishedCount}</p>
          </div>
        </div>

        {/* Drafts */}
        <div
          onClick={() => {
            setStatusFilter('draft');
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${statusFilter === 'draft'
            ? 'border-amber-600 ring-2 ring-amber-100 bg-amber-50/20'
            : 'border-slate-200/80 hover:border-amber-300'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Draft
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-black">Drafts</p>
            <p className="text-2xl font-black text-black mt-0.5">{draftCount}</p>
          </div>
        </div>

        {/* Featured */}
        <div
          className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 hover:border-black"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Award className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-black bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">
              Featured
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-black">Featured</p>
            <p className="text-2xl font-black text-black mt-0.5">{featuredCount}</p>
          </div>
        </div>
      </div>

      {/* ─── Search & Filter Controls ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 py-2 px-3.5 sm:px-4 shadow-xs flex flex-col xl:flex-row gap-2.5 items-stretch xl:items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black" />
          <input
            type="text"
            placeholder="Search blogs by title, summary, author, or tag..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-black font-semibold placeholder:text-black/50 focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-red-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-300 text-black text-xs sm:text-sm rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 font-bold cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-300 text-black text-xs sm:text-sm rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 font-bold cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {(search || categoryFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-black" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Blogs Content Area (Mobile Cards + Desktop Table) ─── */}
      {loading ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex justify-center">
          <LoadingSpinner text="Fetching blog articles..." />
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <EmptyState
            icon={FileText}
            title="No Blog Articles Found"
            description="Start authoring engineering insights, architectural analyses, and company news."
            actionText="Add First Blog"
            onAction={() => handleOpenModal()}
          />
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< 768px): Responsive card view, NO horizontal scroll */}
          <div className="md:hidden space-y-4">
            {blogs.map((b, idx) => {
              const sNo = (page - 1) * pageSize + idx + 1;
              const bImg = b.featuredImage?.url || b.imageUrl || '/blogs/blogs-banner.png';
              const dateStr = formatDateSafe(b.publishedAt);

              return (
                <div
                  key={b._id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
                >
                  {/* Top Bar: S.No + Status + Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-black font-black">#{sNo}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(b)}
                        title="Click to toggle Status"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${b.status === 'published'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          : b.status === 'draft'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                            : 'bg-slate-100 text-black border border-slate-300'
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${b.status === 'published'
                            ? 'bg-emerald-600'
                            : b.status === 'draft'
                              ? 'bg-amber-600'
                              : 'bg-black'
                            }`}
                        />
                        <span>{b.status}</span>
                      </button>
                      <span className="text-black font-bold font-mono text-[11px]">{dateStr}</span>
                    </div>
                  </div>

                  {/* Thumbnail & Title */}
                  <div className="flex gap-3.5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0">
                      <img
                        src={getImageUrl(bImg, '/blogs/blogs-banner.png')}
                        alt={b.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/blogs/blogs-banner.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-black text-sm leading-snug line-clamp-2">
                        {b.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-black truncate">
                          By {b.author || 'VR4Web'}
                        </span>
                        <span className="text-[11px] font-mono text-blue-700 font-bold truncate">
                          /{b.slug}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category & Tags (NO PURPLE) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                      {b.category || 'General'}
                    </span>
                    {b.readTime && (
                      <span className="text-xs text-black font-bold">
                        • {b.readTime}
                      </span>
                    )}
                    {b.isFeatured && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white flex items-center gap-1 shadow-2xs">
                        <Award className="w-3 h-3 text-white" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>

                  {/* Mobile Actions (NO PURPLE) */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={`/blog/${b.slug || b._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live</span>
                    </a>
                    <button
                      onClick={() => handleToggleFeatured(b)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer border ${b.isFeatured ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-100 text-black border-slate-200'
                        }`}
                      title={b.isFeatured ? 'Featured' : 'Mark Featured'}
                    >
                      <Star className={`w-3.5 h-3.5 ${b.isFeatured ? 'fill-amber-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleOpenModal(b)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-blue-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(b._id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW (>= 768px): Modern Grouped Table (High contrast black text, NO PURPLE) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100/90 text-xs font-black uppercase tracking-wider text-black border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-2 text-center w-10 text-black font-black">#</th>
                    <th className="py-2.5 px-3 text-black font-black min-w-[200px]">Article & Overview</th>
                    <th className="py-2.5 px-2.5 w-36 text-black font-black">Category & Author</th>
                    <th className="py-2.5 px-2 text-center w-28 text-black font-black">Status</th>
                    <th className="py-2.5 px-2 w-28 text-black font-black whitespace-nowrap">Published Date</th>
                    <th className="py-2.5 px-3 text-right w-40 text-black font-black whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-black">
                  {blogs.map((b, idx) => {
                    const sNo = (page - 1) * pageSize + idx + 1;
                    const bImg = b.featuredImage?.url || b.imageUrl || '/blogs/blogs-banner.png';
                    const dateStr = formatDateSafe(b.publishedAt);

                    return (
                      <tr
                        key={b._id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* S.No */}
                        <td className="py-2.5 px-2 text-center font-black text-black text-xs">
                          {sNo}
                        </td>

                        {/* Article & Overview */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0">
                              <img
                                src={getImageUrl(bImg, '/blogs/blogs-banner.png')}
                                alt={b.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/blogs/blogs-banner.png';
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="font-black text-black text-xs sm:text-sm leading-snug truncate group-hover:text-blue-600 transition-colors" title={b.title}>
                                  {b.title}
                                </p>
                                {b.isFeatured && (
                                  <Star
                                    className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0"
                                    title="Featured Blog"
                                  />
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-blue-700 font-bold mt-0.5 truncate max-w-[200px] sm:max-w-[280px]" title={`/${b.slug}`}>
                                /{b.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Author */}
                        <td className="py-2.5 px-2.5">
                          <div className="space-y-0.5 max-w-[140px]">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-800 border border-blue-200 truncate max-w-full" title={b.category || 'General'}>
                              {b.category || 'General'}
                            </span>
                            <p className="text-[11px] text-black font-semibold truncate" title={`By ${b.author || 'VR4Web'}`}>
                              By {b.author || 'VR4Web'}
                            </p>
                          </div>
                        </td>

                        {/* Status (Interactive toggle badge) */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleTogglePublish(b)}
                            title="Click to toggle Status"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black transition-all cursor-pointer ${b.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                              : b.status === 'draft'
                                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                                : 'bg-slate-100 text-black border border-slate-300'
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${b.status === 'published'
                                ? 'bg-emerald-600'
                                : b.status === 'draft'
                                  ? 'bg-amber-600'
                                  : 'bg-black'
                                }`}
                            />
                            <span>{b.status}</span>
                          </button>
                        </td>

                        {/* Date */}
                        <td className="py-2.5 px-2 text-xs font-bold text-black font-mono whitespace-nowrap">
                          {dateStr}
                        </td>

                        {/* Actions (NO PURPLE) */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Public View Link */}
                            <a
                              href={`/blog/${b.slug || b._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-black transition-colors shrink-0"
                              title="View Public Article"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </a>

                            {/* Toggle Featured */}
                            <button
                              onClick={() => handleToggleFeatured(b)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer border shrink-0 ${b.isFeatured
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-slate-100 text-black border-slate-200 hover:text-amber-600 hover:bg-slate-200'
                                }`}
                              title={b.isFeatured ? 'Unmark Featured' : 'Mark as Featured'}
                            >
                              <Star className={`w-3.5 h-3.5 ${b.isFeatured ? 'fill-amber-500' : ''}`} />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicate(b._id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-black transition-colors cursor-pointer border border-slate-200 shrink-0"
                              title="Duplicate as Draft"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenModal(b)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer border border-blue-200 shrink-0"
                              title="Edit Blog"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(b)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer border border-red-200 shrink-0"
                              title="Delete Blog"
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
          </div>

          {/* ─── Dynamic Server-Side Pagination ─── */}
          <ServerPagination
            currentPage={page}
            pageSize={pageSize}
            totalRecords={pagination.total || blogs.length}
            totalPages={pagination.pages || 1}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            showPageSizeDropdown={true}
            loading={loading}
            recordLabel="blogs"
          />
        </>
      )}

      {/* ════════════════ CREATION & EDIT MODAL (WITH TWO CREATION MODES) ════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Top Header */}
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-black tracking-tight">
                    {editingId ? 'Edit Blog Article' : 'Create New Blog Article'}
                  </h3>
                  <p className="text-xs text-black font-medium">
                    Choose between structured Manual Fill or single Quick Create rich editor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-black font-medium hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selection Cards / Tabs */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] bg-white flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => handleModeSwitch('manual')}
                className={`flex-1 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${formData.contentType === 'manual'
                  ? 'border-[#2563EB] bg-emerald-50/60 shadow-xs'
                  : 'border-[#E5E7EB] hover:border-slate-300 bg-white'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-black">
                    <Sliders className="w-4 h-4 text-[#2563EB]" />
                    <span>Option 1: Manual Fill</span>
                  </div>
                  {formData.contentType === 'manual' && (
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  )}
                </div>
                <p className="text-xs text-black font-medium leading-relaxed">
                  Structured multi-section form: basic information, featured cover photo, and modular content sections.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleModeSwitch('quick')}
                className={`flex-1 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${formData.contentType === 'quick'
                  ? 'border-[#2563EB] bg-emerald-50/60 shadow-xs'
                  : 'border-[#E5E7EB] hover:border-slate-300 bg-white'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-black">
                    <Zap className="w-4 h-4 text-[#2563EB]" />
                    <span>Option 2: Quick Create</span>
                  </div>
                  {formData.contentType === 'quick' && (
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  )}
                </div>
                <p className="text-xs text-black font-medium leading-relaxed">
                  Single rich text editor: copy & paste complete formatted articles with headings, lists, quotes, and images.
                </p>
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#F8FAF9]">
              {/* Option 1: Manual Fill */}
              {formData.contentType === 'manual' ? (
                <div className="space-y-6">
                  {/* Tab Navigation */}
                  <div className="flex border-b border-[#E5E7EB] gap-2 pb-1 overflow-x-auto">
                    {SECTION_TABS.map((tab) => {
                      const isComplete = sectionStatus[tab.id];
                      const hasError = !isComplete && (visitedTabs.has(tab.id) || hasAttemptedSubmit);

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setVisitedTabs((prev) => new Set([...prev, activeTab]));
                            setActiveTab(tab.id);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${activeTab === tab.id
                            ? 'bg-[#2563EB] text-white shadow-xs'
                            : 'text-black font-medium hover:text-black hover:bg-slate-100'
                            }`}
                        >
                          <span>{tab.label}</span>
                          {isComplete && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                          {hasError && (
                            <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shrink-0">
                              <AlertCircle className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab 1: Basic Information */}
                  {activeTab === 'basic' && (
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Blog Title <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => {
                            handleTitleChange(e.target.value);
                            if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                          }}
                          placeholder="e.g. Mobile Application Development Services for Modern Businesses"
                          className={`w-full px-3.5 py-2.5 bg-[#F8FAF9] border rounded-xl text-black text-sm focus:outline-none focus:border-[#2563EB] ${errors.title ? 'border-rose-500' : 'border-[#E5E7EB]'
                            }`}
                        />
                        {errors.title && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.title}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            URL Slug <span className="text-rose-500 font-bold">*</span> <span className="text-slate-400 font-normal text-[11px]">(Auto)</span>
                          </label>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => {
                              setFormData({ ...formData, slug: e.target.value });
                              if (errors.slug) setErrors((prev) => ({ ...prev, slug: null }));
                            }}
                            placeholder="mobile-application-development-services"
                            className={`w-full px-3.5 py-2 bg-[#F8FAF9] border rounded-xl text-black text-xs font-mono focus:outline-none focus:border-[#2563EB] ${errors.slug ? 'border-rose-500' : 'border-[#E5E7EB]'
                              }`}
                          />
                          {errors.slug && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.slug}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
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
                              if (errors.category) setErrors((prev) => ({ ...prev, category: null }));
                              if (errors.customCategory) setErrors((prev) => ({ ...prev, customCategory: null }));
                            }}
                            className={`w-full px-3.5 py-2 bg-[#F8FAF9] border rounded-xl text-black text-xs focus:outline-none focus:border-[#2563EB] cursor-pointer font-bold ${errors.category ? 'border-rose-500' : 'border-[#E5E7EB]'
                              }`}
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          {errors.category && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.category}</p>}
                        </div>
                      </div>

                      {/* Dynamic Custom Category Box when Other is selected */}
                      {formData.category === 'Other' && (
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 animate-fadeIn">
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Enter Custom Category <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.customCategory || ''}
                            onChange={(e) => {
                              setFormData({ ...formData, customCategory: e.target.value });
                              if (errors.customCategory) setErrors((prev) => ({ ...prev, customCategory: null }));
                            }}
                            placeholder="e.g. Artificial Intelligence, Blockchain, Quantum Computing"
                            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-black text-xs font-bold focus:outline-none ${errors.customCategory ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-amber-300 focus:border-blue-500'
                              }`}
                          />
                          {errors.customCategory && (
                            <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.customCategory}</p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1">
                            This custom category will be displayed on the blog card, detail view, and public category filters.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Author Name <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={formData.author}
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                            placeholder="VR4Web Technology Team"
                            className="w-full px-3.5 py-2 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-xs focus:outline-none focus:border-[#2563EB]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Read Time <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={formData.readTime}
                            onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                            placeholder="e.g. 6 min read"
                            className="w-full px-3.5 py-2 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-xs focus:outline-none focus:border-[#2563EB]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Publish Date <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                          </label>
                          <input
                            type="date"
                            value={formData.publishedAt || ''}
                            onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                            className="w-full px-3.5 py-2 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-xs focus:outline-none focus:border-[#2563EB]"
                          />
                        </div>
                      </div>

                      {/* Summary / Excerpt */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-black uppercase">
                            Short Description / Summary <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <span className="text-[11px] font-mono text-black font-semibold">
                            {formData.summary?.length || 0} chars
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={formData.summary}
                          onChange={(e) => {
                            handleSummaryChange(e.target.value);
                            if (errors.summary) setErrors((prev) => ({ ...prev, summary: null }));
                          }}
                          placeholder="Brief summary displayed on blog listings, search cards, and meta tags..."
                          className={`w-full px-3.5 py-2.5 bg-[#F8FAF9] border rounded-xl text-black text-xs focus:outline-none focus:border-[#2563EB] ${errors.summary ? 'border-rose-500' : 'border-[#E5E7EB]'
                            }`}
                        />
                        {errors.summary && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.summary}</p>}
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Article Tags <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                              }
                            }}
                            placeholder="Type a tag and press Add..."
                            className="flex-1 px-3.5 py-2 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-xs focus:outline-none focus:border-[#2563EB]"
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#2563EB] transition-colors cursor-pointer"
                          >
                            Add Tag
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags?.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-black border border-emerald-200"
                            >
                              <span>{t}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(t)}
                                className="hover:text-red-600"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Featured Checkbox & Status */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#E5E7EB]">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isFeatured}
                            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-gray-300"
                          />
                          <span className="text-xs font-bold text-black">
                            Mark as Featured Article (Highlight on Home & Blog page)
                          </span>
                        </label>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-black uppercase">Status:</span>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="bg-[#F8FAF9] border border-[#E5E7EB] text-black text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none"
                          >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                      </div>

                      {/* Section 1 Footer Next Button */}
                      <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => handleNextSection('image')}
                          className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                          <span>Next: Featured Cover</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Featured Cover Image */}
                  {activeTab === 'image' && (
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] space-y-4">
                      <DragDropImageUpload
                        label="Featured Cover Photo *"
                        sublabel="Drag & drop your blog cover photo here, or browse files"
                        value={formData.featuredImage?.url || formData.imageUrl}
                        onChange={(url) => {
                          handleFeaturedImageChange(url);
                          if (errors.featuredImage) setErrors((prev) => ({ ...prev, featuredImage: null }));
                        }}
                        onUpload={(file, onProgress) =>
                          blogService.uploadBlogImage(file, onProgress).then((res) => res.fileUrl)
                        }
                        fallback="/blogs/blogs-banner.png"
                        aspectRatio="aspect-[16/9]"
                        helperText="Displays across blog cards, hero banner, and social shares (Max: 5 MB)"
                      />
                      {errors.featuredImage && (
                        <p className="mt-1 text-xs text-rose-500 font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.featuredImage}</span>
                        </p>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex justify-between items-center pt-4 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => setActiveTab('basic')}
                          className="px-4 py-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-100 text-black text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous: Basic Info</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextSection('sections')}
                          className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                          <span>Next: Content Sections</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Content Sections (Structured Multi-Section) */}
                  {activeTab === 'sections' && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                              Structured Content Sections
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563EB]/15 text-[#2563EB]">
                              {formData.sections?.length || 0} Sections
                            </span>
                          </div>
                          <p className="text-[11px] text-black font-medium mt-0.5">
                            Organize your article into modular chapters with dedicated headings, narratives, and illustrations.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSection}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Section</span>
                        </button>
                      </div>

                      {/* Global Sections Error Banner */}
                      {errors.sections && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2 font-bold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errors.sections}</span>
                        </div>
                      )}

                      {/* Sections List */}
                      <div className="space-y-4">
                        {(formData.sections || []).map((sec, idx) => (
                          <div
                            key={idx}
                            className="p-5 rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#2563EB]/30 transition-all space-y-3.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-bold text-black uppercase tracking-wide">
                                  Section #{idx + 1}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveSection(idx, idx - 1)}
                                  className="p-1 rounded-lg text-black font-bold hover:text-blue-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                  title="Move Section Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === (formData.sections || []).length - 1}
                                  onClick={() => handleMoveSection(idx, idx + 1)}
                                  className="p-1 rounded-lg text-black font-bold hover:text-blue-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                  title="Move Section Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                {(formData.sections || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSection(idx)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer ml-1"
                                    title="Delete Section"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                                  Section Heading <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={sec.heading || ''}
                                  onChange={(e) => {
                                    handleUpdateSection(idx, 'heading', e.target.value);
                                    if (errors[`section_heading_${idx}`]) {
                                      setErrors((prev) => ({ ...prev, [`section_heading_${idx}`]: null }));
                                    }
                                  }}
                                  placeholder="e.g. Technical Evolution & Architecture"
                                  className={`w-full px-3.5 py-2 bg-[#F8FAF9] border rounded-xl text-xs font-bold text-black focus:outline-none focus:border-[#2563EB] ${errors[`section_heading_${idx}`] ? 'border-rose-500' : 'border-[#E5E7EB]'
                                    }`}
                                />
                                {errors[`section_heading_${idx}`] && (
                                  <p className="mt-1 text-xs text-rose-500 font-semibold">{errors[`section_heading_${idx}`]}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-black font-medium uppercase mb-1">
                                  Section Subheading / Caption (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={sec.subheading || ''}
                                  onChange={(e) => handleUpdateSection(idx, 'subheading', e.target.value)}
                                  placeholder="e.g. Cloud-native mobile backends and reactive frontends"
                                  className="w-full px-3.5 py-1.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-xs text-black focus:outline-none focus:border-[#2563EB]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-black uppercase mb-1">
                                  Section Body Content <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                  rows={4}
                                  value={sec.body || ''}
                                  onChange={(e) => {
                                    handleUpdateSection(idx, 'body', e.target.value);
                                    if (errors[`section_body_${idx}`]) {
                                      setErrors((prev) => ({ ...prev, [`section_body_${idx}`]: null }));
                                    }
                                  }}
                                  placeholder="Write section narrative, technical explanations, or bulleted insights..."
                                  className={`w-full px-3.5 py-2 bg-[#F8FAF9] border rounded-xl text-xs text-black focus:outline-none focus:border-[#2563EB] ${errors[`section_body_${idx}`] ? 'border-rose-500' : 'border-[#E5E7EB]'
                                    }`}
                                />
                                {errors[`section_body_${idx}`] && (
                                  <p className="mt-1 text-xs text-rose-500 font-semibold">{errors[`section_body_${idx}`]}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-black font-medium uppercase mb-1">
                                  Inline Illustration / Diagram (Optional)
                                </label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  <input
                                    type="text"
                                    value={sec.image?.url || ''}
                                    onChange={(e) =>
                                      handleUpdateSection(idx, 'image', {
                                        url: e.target.value,
                                        alt: sec.heading || '',
                                      })
                                    }
                                    placeholder="Image URL (e.g. /uploads/... or click Upload)"
                                    className="flex-1 px-3.5 py-1.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-xs text-black focus:outline-none focus:border-[#2563EB]"
                                  />
                                  <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#2563EB]/20 text-black hover:bg-[#2563EB] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0">
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>Upload Image</span>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          const res = await blogService.uploadBlogImage(file);
                                          if (res?.success && res.url) {
                                            handleUpdateSection(idx, 'image', {
                                              url: res.url,
                                              alt: sec.heading || file.name,
                                            });
                                            setFeedback({ type: 'success', message: 'Section image uploaded successfully' });
                                          }
                                        } catch (err) {
                                          setFeedback({ type: 'error', message: 'Failed to upload section image' });
                                        }
                                      }}
                                    />
                                  </label>
                                  {sec.image?.url && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSection(idx, 'image', { url: '', alt: '' })}
                                      className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 cursor-pointer"
                                      title="Remove Section Image"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {sec.image?.url && isValidImageUrl(sec.image.url) && (
                                  <div className="mt-2 flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 w-fit">
                                    <img
                                      src={getImageUrl(sec.image.url)}
                                      alt="Section Preview"
                                      className="w-12 h-9 object-cover rounded border border-slate-200"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <span className="text-[11px] text-black font-mono font-medium truncate max-w-[240px]">
                                      {sec.image.url}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Another Section Button */}
                      <button
                        type="button"
                        onClick={handleAddSection}
                        className="w-full py-3.5 border-2 border-dashed border-[#2563EB]/25 hover:border-[#2563EB] hover:bg-orange-50/40 rounded-2xl text-black hover:text-[#2563EB] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Another Content Section</span>
                      </button>

                      {/* Section 3 Footer Navigation */}
                      <div className="flex justify-between items-center pt-4 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => setActiveTab('image')}
                          className="px-4 py-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-100 text-black text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous: Featured Cover</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextSection('seo')}
                          className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                          <span>Next: SEO & Social</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: SEO & Social Media */}
                  {activeTab === 'seo' && (
                    <div className="space-y-4">
                      <SeoFormSection
                        contentType="blog"
                        seoData={formData.seo || {}}
                        onChange={handleSeoChange}
                        sourceTitle={formData.title}
                        sourceSummary={formData.summary}
                        sourceFeaturedImage={formData.featuredImage?.url || formData.imageUrl}
                        currentId={editingId}
                        errors={errors}
                        uploadImageHandler={(file) =>
                          blogService.uploadBlogImage(file).then((res) => res.fileUrl)
                        }
                      />
                      {/* Section 4 Footer Navigation */}
                      <div className="flex justify-start items-center pt-4 border-t border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => setActiveTab('sections')}
                          className="px-4 py-2 rounded-xl border border-[#E5E7EB] hover:bg-slate-100 text-black text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous: Content Sections</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Option 2: Quick Create Rich Text */
                <div className="space-y-6">
                  {/* Quick Basic Info Bar */}
                  <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                        Blog Title <span className="text-slate-400 font-normal text-[10px] lowercase">(optional — auto-detected from article)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                          handleTitleChange(e.target.value);
                          if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                        }}
                        placeholder="e.g. Mobile Application Development Services for Modern Businesses (or auto-detected from article)"
                        className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border rounded-xl text-black text-sm font-bold focus:outline-none focus:border-[#2563EB] border-[#E5E7EB]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-black uppercase mb-1">
                          Category <span className="text-slate-400 font-normal text-[10px] lowercase">(optional)</span>
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
                          className="w-full px-3 py-1.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Dynamic Custom Category Box for Quick Mode */}
                      {formData.category === 'Other' && (
                        <div className="col-span-full p-3 bg-amber-50/70 border border-amber-200 rounded-xl animate-fadeIn">
                          <label className="block text-xs font-bold text-black mb-1">
                            Enter Custom Category
                          </label>
                          <input
                            type="text"
                            value={formData.customCategory || ''}
                            onChange={(e) => {
                              setFormData({ ...formData, customCategory: e.target.value });
                            }}
                            placeholder="e.g. Artificial Intelligence, Blockchain, Quantum Computing"
                            className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-black focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-black uppercase mb-1">
                          Author <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.author}
                          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                          className="w-full px-3 py-1.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-black uppercase mb-1">
                          Read Time <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.readTime}
                          onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                          className="w-full px-3 py-1.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Single Quill Rich Text Editor */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#E5E7EB]">
                      <div>
                        <h4 className="text-xs font-bold text-black uppercase">
                          Article Body (Quill Rich Text Editor) <span className="text-rose-500 font-bold">*</span>
                        </h4>
                        <p className="text-[11px] text-black font-medium">
                          Copy & paste your complete Word or Google Docs article directly with formatting.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleInsertTemplate}
                        className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#2563EB] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Insert Standard Template</span>
                      </button>
                    </div>

                    <div className="quill-quick-editor">
                      <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={formData.content}
                        onChange={(val) => {
                          setFormData({ ...formData, content: val });
                          if (errors.content) setErrors((prev) => ({ ...prev, content: null }));
                        }}
                        modules={quillModules}
                        placeholder="Write or paste your complete article here with headings, bullet points, blockquotes, and inline photos..."
                      />
                    </div>
                    {errors.content && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.content}</p>}
                  </div>

                  {/* Quick Create Details Accordion */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuickDetailsExpanded(!quickDetailsExpanded)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F8FAF9] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-black uppercase">
                        <Sliders className="w-4 h-4 text-[#2563EB]" />
                        <span>Additional Metadata & Cover Photo (Optional)</span>
                      </div>
                      {quickDetailsExpanded ? (
                        <ChevronUp className="w-4 h-4 text-black font-medium" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-black font-medium" />
                      )}
                    </button>

                    {quickDetailsExpanded && (
                      <div className="p-5 border-t border-[#E5E7EB] bg-[#F8FAF9] space-y-4">
                        <DragDropImageUpload
                          label="Featured Cover Photo *"
                          sublabel="Drag & drop your blog cover photo here, or browse files"
                          value={formData.featuredImage?.url || formData.imageUrl}
                          onChange={(url) => {
                            handleFeaturedImageChange(url);
                            if (errors.featuredImage) setErrors((prev) => ({ ...prev, featuredImage: null }));
                          }}
                          onUpload={(file, onProgress) =>
                            blogService.uploadBlogImage(file, onProgress).then((res) => res.fileUrl)
                          }
                          fallback="/blogs/blogs-banner.png"
                          aspectRatio="aspect-[16/9]"
                        />
                        {errors.featuredImage && (
                          <p className="mt-1 text-xs text-rose-500 font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.featuredImage}</span>
                          </p>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Short Summary <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                          </label>
                          <textarea
                            rows={2}
                            value={formData.summary}
                            onChange={(e) => handleSummaryChange(e.target.value)}
                            placeholder="Executive summary for search previews..."
                            className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs text-black"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                              URL Slug <span className="text-slate-400 font-normal text-[11px]">(Auto)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.slug}
                              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                              className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                              Publish Date <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                            </label>
                            <input
                              type="date"
                              value={formData.publishedAt || ''}
                              onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                              className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SEO & Social Management for Quick Create Mode */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB]">
                    <SeoFormSection
                      contentType="blog"
                      seoData={formData.seo || {}}
                      onChange={handleSeoChange}
                      sourceTitle={formData.title}
                      sourceSummary={formData.summary}
                      sourceFeaturedImage={formData.featuredImage?.url || formData.imageUrl}
                      currentId={editingId}
                      errors={errors}
                      uploadImageHandler={(file) =>
                        blogService.uploadBlogImage(file).then((res) => res.fileUrl)
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-[#E5E7EB] bg-white flex flex-col gap-3">
              {/* Incomplete Sections Helper Banner or Ready Confirmation Banner */}
              {!isFormValid ? (
                <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {isQuick
                        ? 'Please enter or paste your article content in the editor to publish'
                        : 'Complete all mandatory fields before publishing:'}
                    </span>
                  </div>
                  {!isQuick && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {SECTION_TABS.map((tab) => {
                        if (!sectionStatus[tab.id]) {
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(tab.id);
                                setVisitedTabs((prev) => new Set([...prev, tab.id]));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Jump to {tab.label} →
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isQuick
                      ? 'Quick Create article ready to publish!'
                      : 'All 4 sections validated. Ready to publish/update!'}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E5E7EB] hover:bg-slate-100 text-black font-medium text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Save Draft */}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave('draft')}
                    className="px-4 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E5E7EB] hover:bg-slate-100 text-black text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>Save as Draft</span>
                  </button>

                  {/* Preview */}
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#E5E7EB] hover:bg-slate-100 text-black text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Preview</span>
                  </button>

                  {/* Publish / Update */}
                  <button
                    type="button"
                    disabled={!isFormValid || saving}
                    onClick={() => handleSave('published')}
                    title={
                      !isFormValid
                        ? 'Please complete all mandatory fields in all 4 sections to publish'
                        : ''
                    }
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${!isFormValid || saving
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                      : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white cursor-pointer'
                      }`}
                  >
                    {saving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                    <span>
                      {saving
                        ? 'Saving...'
                        : editingId
                          ? 'Update Blog'
                          : 'Publish Blog'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ LIVE PREVIEW MODAL ════════════════ */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#2563EB] text-white">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-sm">Public Blog Details Page Live Preview</span>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-white hover:text-[#2563EB] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-[#FDFEFE]">
              {/* Centered Hero Banner Preview */}
              <div className="bg-[rgb(240,231,195)] p-8 rounded-2xl text-center space-y-4 border border-slate-200">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2563EB] text-black text-xs font-black uppercase tracking-widest shadow-xs">
                  <Award className="w-3.5 h-3.5" />
                  <span>{formData.category}</span>
                  <span>•</span>
                  <span>{formData.readTime}</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight leading-tight">
                  {formData.title || 'Untitled Blog Article'}
                </h1>

                <p className="text-xs sm:text-sm text-black/80 font-medium">
                  By {formData.author || 'VR4Web'} • Published {formData.publishedAt ? formatDateSafe(formData.publishedAt) : 'Draft / Unscheduled'}
                </p>
              </div>

              {/* Cover Photo */}
              {(formData.featuredImage?.url || formData.imageUrl) && (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[#E5E7EB] bg-slate-100 shadow-xs">
                  <img
                    src={getImageUrl(formData.featuredImage?.url || formData.imageUrl)}
                    alt={formData.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/blogs/blogs-banner.png';
                    }}
                  />
                </div>
              )}

              {/* Content Preview */}
              {formData.contentType === 'quick' ? (
                <div
                  className="prose prose-lg max-w-none text-black
                    [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-black [&_h1]:mt-6 [&_h1]:mb-3
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-6 [&_h2]:mb-3
                    [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-slate-700
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
                    [&_img]:rounded-2xl [&_img]:my-6 [&_img]:max-w-full"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(formData.content || '<p>No content entered yet...</p>'),
                  }}
                />
              ) : (
                <div className="space-y-8">
                  {formData.summary && (
                    <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                      <h4 className="text-xs font-bold text-black uppercase mb-1">Executive Summary</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">{formData.summary}</p>
                    </div>
                  )}

                  {(formData.sections || []).map((sec, i) => (
                    <div key={i} className="space-y-2 border-b border-slate-200 pb-6 last:border-b-0">
                      <h3 className="text-xl font-black text-black">{sec.heading}</h3>
                      {sec.subheading && (
                        <h4 className="text-xs font-bold text-[#2563EB] uppercase">{sec.subheading}</h4>
                      )}
                      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{sec.body}</p>
                      {sec.image?.url && (
                        <div className="rounded-xl overflow-hidden aspect-[16/9] border border-slate-200 my-4">
                          <img src={getImageUrl(sec.image.url)} alt={sec.heading} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Blog Article"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will permanently remove the article from the website.`}
        confirmText="Yes, Delete Article"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
