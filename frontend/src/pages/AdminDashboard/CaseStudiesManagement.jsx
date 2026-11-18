import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import authService from '../../services/authService';
import { getImageUrl } from '../../utils/imageUrl';
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
  Upload,
  Globe,
  TrendingUp,
  FileText,
  Zap,
  Wand2,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sliders,
  Check,
  Calendar,
  Image as ImageIcon,
  Tag,
  ArrowRight,
  Send,
  Save,
  RefreshCw,
  FolderOpen,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Award,
  Star,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Education',
  'Finance',
  'Real Estate',
  'E-commerce',
  'Manufacturing',
  'Professional Services',
  'Other',
];

const CATEGORIES = [
  'Technology',
  'Healthcare',
  'Education',
  'Finance',
  'Real Estate',
  'E-commerce',
  'Manufacturing',
  'Professional Services',
  'Website Development',
  'Web Application Development',
  'Mobile App Development',
  'UI/UX Design',
  'Digital Marketing',
  'SEO',
  'Branding',
  'Software Development',
  'Other',
];

const PROJECT_TYPES = [
  'Website',
  'Web Application',
  'Mobile Application',
  'E-commerce',
  'Branding',
  'Digital Marketing',
  'SEO',
  'Other',
];

export const SECTION_TABS = [
  { id: 'basic', label: '1. Basic Info', shortLabel: 'Basic Info' },
  { id: 'details', label: '2. Project Details', shortLabel: 'Project Details' },
  { id: 'content', label: '3. Case Study Content', shortLabel: 'Content' },
  { id: 'metrics', label: '4. Results & Metrics', shortLabel: 'Results & Metrics' },
  { id: 'seo', label: '5. SEO & Social', shortLabel: 'SEO & Social' },
];

export const isValidHttpUrl = (str) => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  return /^https?:\/\/.+/i.test(trimmed);
};

export const validateBasicInfo = (data) => {
  const errs = {};
  if (!data.title?.trim()) {
    errs.title = 'Case Study Title is required';
  }
  const slug = (data.seo?.slug || data.slug || '').trim();
  if (!slug) {
    errs.slug = 'Slug is required';
  }
  if (!data.clientName?.trim()) {
    errs.clientName = 'Client Name is required';
  }
  if (!data.category?.trim()) {
    errs.category = 'Category is required';
  } else if (data.category === 'Other' && !data.customCategory?.trim()) {
    errs.customCategory = 'Please enter custom category name';
  }
  if (data.industry === 'Other' && !data.customIndustry?.trim()) {
    errs.customIndustry = 'Please enter custom industry name';
  }
  if (data.creationMode === 'quick') {
    if (!data.content?.trim() || data.content.replace(/<[^>]*>/g, '').trim().length === 0) {
      errs.content = 'Rich text content is required';
    }
  } else {
    const desc = (data.projectDescription || data.shortDescription || '').trim();
    if (!desc) {
      errs.shortDescription = 'Project Description is required';
    }
  }
  if (!data.featuredImage?.trim()) {
    errs.featuredImage = 'Featured Cover Image is required';
  }
  return errs;
};

export const validateProjectDetails = (data) => {
  const errs = {};
  // Client Overview & Project Overview are OPTIONAL (defaults to Project Description)
  if (data.projectType === 'Other' && !data.customProjectType?.trim()) {
    errs.customProjectType = 'Please enter custom project type';
  }
  // Project URL is optional; only validate format if user entered a value
  if (data.projectUrl && data.projectUrl.trim() && !isValidHttpUrl(data.projectUrl)) {
    errs.projectUrl = 'Project URL must start with http:// or https:// (e.g. https://example.com)';
  }
  return errs;
};

export const validateCaseStudyContent = (data) => {
  const errs = {};
  if (data.creationMode === 'quick') {
    if (!data.content?.trim() || data.content.replace(/<[^>]*>/g, '').trim().length === 0) {
      errs.content = 'Rich text content is required';
    }
  } else {
    const pairs = Array.isArray(data.challengesAndSolutions) ? data.challengesAndSolutions : [];
    pairs.forEach((pair, idx) => {
      const hasAny = pair.challengeTitle?.trim() || pair.challengeDescription?.trim() || pair.solutionTitle?.trim() || pair.solutionDescription?.trim();
      if (hasAny) {
        if (!pair.challengeTitle?.trim()) {
          errs[`challengeTitle_${idx}`] = `Challenge #${idx + 1} Title is required`;
        }
        if (!pair.challengeDescription?.trim()) {
          errs[`challengeDescription_${idx}`] = `Challenge #${idx + 1} Description is required`;
        }
        if (!pair.solutionTitle?.trim()) {
          errs[`solutionTitle_${idx}`] = `Solution #${idx + 1} Title is required`;
        }
        if (!pair.solutionDescription?.trim()) {
          errs[`solutionDescription_${idx}`] = `Solution #${idx + 1} Description is required`;
        }
      }
    });
  }
  return errs;
};

export const validateResultsMetrics = (data) => {
  const errs = {};
  if (data.creationMode !== 'quick') {
    const metrics = Array.isArray(data.metrics) ? data.metrics : [];
    metrics.forEach((m, idx) => {
      const hasAny = m.value?.trim() || m.label?.trim() || m.description?.trim();
      if (hasAny) {
        if (!m.value?.trim()) {
          errs[`metric_value_${idx}`] = `Value is required`;
        }
        if (!m.label?.trim()) {
          errs[`metric_label_${idx}`] = `Label is required`;
        }
      }
    });
  }
  return errs;
};

export const validateSeoSocial = (data) => {
  const errs = {};
  const metaTitle = (data.seo?.metaTitle || data.metaTitle || '').trim();
  if (!metaTitle) {
    errs.metaTitle = 'SEO Meta Title is required';
  } else if (metaTitle.length > 100) {
    errs.metaTitle = 'SEO Meta Title cannot exceed 100 characters';
  }

  const metaDesc = (data.seo?.metaDescription || data.metaDescription || '').trim();
  if (!metaDesc) {
    errs.metaDescription = 'SEO Meta Description is required';
  } else if (metaDesc.length > 320) {
    errs.metaDescription = 'SEO Meta Description cannot exceed 320 characters';
  }
  return errs;
};

export const validateEntireCaseStudy = (data) => {
  const basicErrors = validateBasicInfo(data);
  const detailsErrors = validateProjectDetails(data);
  const contentErrors = validateCaseStudyContent(data);
  const metricsErrors = validateResultsMetrics(data);
  const seoErrors = validateSeoSocial(data);

  const allErrors = {
    ...basicErrors,
    ...detailsErrors,
    ...contentErrors,
    ...metricsErrors,
    ...seoErrors,
  };

  const sectionStatus = {
    basic: Object.keys(basicErrors).length === 0,
    details: Object.keys(detailsErrors).length === 0,
    content: Object.keys(contentErrors).length === 0,
    metrics: Object.keys(metricsErrors).length === 0,
    seo: Object.keys(seoErrors).length === 0,
  };

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
    sectionStatus,
    sectionErrors: {
      basic: basicErrors,
      details: detailsErrors,
      content: contentErrors,
      metrics: metricsErrors,
      seo: seoErrors,
    },
  };
};

const INITIAL_FORM_STATE = {
  title: '',
  slug: '',
  creationMode: 'manual', // 'manual' | 'quick'
  clientName: '',
  industry: 'Technology',
  customIndustry: '',
  category: 'Website Development',
  customCategory: '',
  shortDescription: '',
  projectDescription: '',
  featuredImage: '',
  additionalImages: [],
  projectCompletionDate: '', // OPTIONAL: clean empty default
  isFeatured: false,
  // Project Details
  clientOverview: '',
  projectOverview: '',
  projectType: 'Website',
  customProjectType: '',
  servicesProvided: ['Website Design', 'UI/UX Design', 'Full-Stack Development'],
  technologiesUsed: ['React', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS'],
  projectDuration: '8 Weeks',
  projectUrl: 'https://vr4web.com',
  clientLocation: 'Sydney, Australia',
  // Structured Content (Manual Fill)
  challenge: '',
  solution: '',
  challengesAndSolutions: [
    {
      challengeTitle: 'The Business Challenge',
      challengeDescription: '',
      solutionTitle: 'Our Strategic Approach',
      solutionDescription: '',
    },
  ],
  implementation: '',
  results: '',
  conclusion: '',
  gallery: [],
  // Results & Metrics
  metrics: [
    { value: '45%', label: 'Conversion Uplift', description: 'Immediate increase in organic sales funnel throughput', icon: 'TrendingUp' },
    { value: '3.2x', label: 'Faster Load Times', description: 'Average Core Web Vitals performance increase across all devices', icon: 'Zap' },
  ],
  beforeAfter: { beforeImage: '', afterImage: '', beforeDescription: '', afterDescription: '' },
  showcaseTitle: '',
  showcaseImage: '',
  // SEO Legacy Top-Level Fields
  metaTitle: '',
  metaDescription: '',
  metaKeywords: ['Case Study', 'Digital Solutions', 'Software Development'],
  canonicalUrl: '',
  ogImage: '',
  ogTitle: '',
  ogDescription: '',
  // Complete SEO Object
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: ['Case Study', 'Digital Solutions', 'Software Development'],
    slug: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
  },
  // Quick Create Rich Text
  content: '',
  status: 'published',
};

export default function CaseStudiesManagement() {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 5 });

  // Creation / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // basic, details, content, metrics, seo
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState({ basic: true });
  const [uploadProgress, setUploadProgress] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Dynamic Validation State
  const currentValidation = validateEntireCaseStudy(formData);
  const isFormValid = currentValidation.isValid;
  const sectionStatus = currentValidation.sectionStatus;
  const sectionErrors = currentValidation.sectionErrors;

  // Quick Create Expandable Accordion
  const [quickDetailsExpanded, setQuickDetailsExpanded] = useState(false);

  // Tag Inputs
  const [serviceInput, setServiceInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  const quillRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch List
  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      const res = await authService.getCaseStudies({
        search,
        industry: industryFilter,
        category: categoryFilter,
        status: statusFilter,
        page,
        limit: pageSize,
      });
      if (res && res.success) {
        setCaseStudies(res.data || []);
        if (res.pagination) setPagination(res.pagination);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load case studies' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCaseStudies();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, industryFilter, categoryFilter, statusFilter, page, pageSize]);

  const handleResetFilters = () => {
    setSearch('');
    setIndustryFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // Stats
  const totalCount = pagination.total || caseStudies.length;
  const publishedCount = caseStudies.filter((c) => c.status === 'published').length;
  const draftCount = caseStudies.filter((c) => c.status === 'draft').length;
  const featuredCount = caseStudies.filter((c) => c.isFeatured).length;

  // Manual override tracking for auto-suggestions
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [isMetaTitleManual, setIsMetaTitleManual] = useState(false);
  const [isMetaDescManual, setIsMetaDescManual] = useState(false);
  const [isOgTitleManual, setIsOgTitleManual] = useState(false);
  const [isOgDescManual, setIsOgDescManual] = useState(false);
  const [isOgImageManual, setIsOgImageManual] = useState(false);

  // Dynamic SEO suggestions on Title Change
  const handleTitleChange = (val) => {
    setFormData((prev) => {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const currentSeo = prev.seo || {};
      const newSlug = isSlugManual ? prev.slug : autoSlug;
      const newMetaTitle = isMetaTitleManual ? currentSeo.metaTitle : (val ? `${val} | VR4Web Case Study` : '');
      const newOgTitle = isOgTitleManual ? currentSeo.ogTitle : newMetaTitle;
      const newCanonical = currentSeo.canonicalUrl && isSlugManual
        ? currentSeo.canonicalUrl
        : `https://vr4web.com/case-studies/${newSlug}`;

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

  // Dynamic SEO suggestions on Short Description Change
  const handleShortDescriptionChange = (val) => {
    setFormData((prev) => {
      const currentSeo = prev.seo || {};
      const newDesc = isMetaDescManual ? currentSeo.metaDescription : val.slice(0, 160);
      const newOgDesc = isOgDescManual ? currentSeo.ogDescription : newDesc;

      return {
        ...prev,
        shortDescription: val,
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
        featuredImage: url,
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

    setErrors((prev) => {
      const copy = { ...prev };
      if ('metaTitle' in updatedFields) delete copy.metaTitle;
      if ('metaDescription' in updatedFields) delete copy.metaDescription;
      if ('slug' in updatedFields) delete copy.slug;
      return copy;
    });
  };

  // Open Modal
  const handleOpenModal = async (item = null) => {
    if (item) {
      setEditingId(item._id);

      // Existing item: mark manual flags so we don't clobber existing edits
      setIsSlugManual(true);
      setIsMetaTitleManual(true);
      setIsMetaDescManual(true);
      setIsOgTitleManual(true);
      setIsOgDescManual(true);
      setIsOgImageManual(true);

      let csPairs = [];
      if (Array.isArray(item.challengesAndSolutions) && item.challengesAndSolutions.length > 0) {
        csPairs = item.challengesAndSolutions.map((cs, idx) => ({
          challengeTitle: cs.challengeTitle || `Challenge ${idx + 1}`,
          challengeDescription: cs.challengeDescription || '',
          solutionTitle: cs.solutionTitle || `Strategic Solution ${idx + 1}`,
          solutionDescription: cs.solutionDescription || '',
        }));
      } else if (item.challenge || item.solution) {
        csPairs = [
          {
            challengeTitle: 'The Business Challenge',
            challengeDescription: item.challenge || '',
            solutionTitle: 'Our Strategic Approach',
            solutionDescription: item.solution || '',
          },
        ];
      } else {
        csPairs = [
          {
            challengeTitle: 'The Business Challenge',
            challengeDescription: '',
            solutionTitle: 'Our Strategic Approach',
            solutionDescription: '',
          },
        ];
      }

      const itemSeo = item.seo || {};
      const initialSeo = {
        metaTitle: itemSeo.metaTitle || item.metaTitle || (item.title ? `${item.title} | VR4Web Case Study` : ''),
        metaDescription: itemSeo.metaDescription || item.metaDescription || item.shortDescription?.slice(0, 160) || '',
        keywords: Array.isArray(itemSeo.keywords) && itemSeo.keywords.length > 0
          ? itemSeo.keywords
          : Array.isArray(item.metaKeywords) && item.metaKeywords.length > 0
          ? item.metaKeywords
          : ['Case Study', 'Digital Solutions', 'Software Development'],
        slug: itemSeo.slug || item.slug || '',
        canonicalUrl: itemSeo.canonicalUrl || item.canonicalUrl || (item.slug ? `https://vr4web.com/case-studies/${item.slug}` : ''),
        ogTitle: itemSeo.ogTitle || item.ogTitle || itemSeo.metaTitle || item.metaTitle || item.title || '',
        ogDescription: itemSeo.ogDescription || item.ogDescription || itemSeo.metaDescription || item.metaDescription || item.shortDescription || '',
        ogImage: itemSeo.ogImage || item.ogImage || item.featuredImage || '/case-study/property.png',
      };

      // Resolve Category and Custom Category for Edit Mode
      const isPredefined = CATEGORIES.includes(item.category) && item.category !== 'Other';
      const resolvedCategory = isPredefined ? item.category : 'Other';
      const resolvedCustomCategory = item.customCategory || (!isPredefined ? item.category : '');

      // Resolve Industry and Custom Industry for Edit Mode
      const isPredefinedInd = INDUSTRIES.includes(item.industry) && item.industry !== 'Other';
      const resolvedIndustry = isPredefinedInd ? item.industry : (item.industry ? 'Other' : 'Technology');
      const resolvedCustomIndustry = item.customIndustry || (!isPredefinedInd ? item.industry : '');

      // Resolve Project Type and Custom Project Type for Edit Mode
      const isPredefinedPT = PROJECT_TYPES.includes(item.projectType) && item.projectType !== 'Other';
      const resolvedProjectType = isPredefinedPT ? item.projectType : (item.projectType ? 'Other' : 'Website');
      const resolvedCustomProjectType = item.customProjectType || (!isPredefinedPT ? item.projectType : '');

      setFormData({
        ...INITIAL_FORM_STATE,
        ...item,
        category: resolvedCategory,
        customCategory: resolvedCustomCategory,
        industry: resolvedIndustry,
        customIndustry: resolvedCustomIndustry,
        projectType: resolvedProjectType,
        customProjectType: resolvedCustomProjectType,
        projectCompletionDate: item.projectCompletionDate || '',
        challengesAndSolutions: csPairs,
        servicesProvided: Array.isArray(item.servicesProvided) ? item.servicesProvided : [],
        technologiesUsed: Array.isArray(item.technologiesUsed) ? item.technologiesUsed : [],
        metrics: Array.isArray(item.metrics) ? item.metrics : [],
        beforeAfter: item.beforeAfter || { beforeImage: '', afterImage: '', beforeDescription: '', afterDescription: '' },
        showcaseTitle: item.showcaseTitle || '',
        showcaseImage: item.showcaseImage || '',
        seo: initialSeo,
        slug: initialSeo.slug,
        metaTitle: initialSeo.metaTitle,
        metaDescription: initialSeo.metaDescription,
        canonicalUrl: initialSeo.canonicalUrl,
        ogTitle: initialSeo.ogTitle,
        ogDescription: initialSeo.ogDescription,
        ogImage: initialSeo.ogImage,
      });
      setErrors({});
      setHasAttemptedSubmit(false);
      setVisitedTabs({ basic: true, details: true, content: true, metrics: true, seo: true });
    } else {
      setEditingId(null);
      setIsSlugManual(false);
      setIsMetaTitleManual(false);
      setIsMetaDescManual(false);
      setIsOgTitleManual(false);
      setIsOgDescManual(false);
      setIsOgImageManual(false);
      setFormData(INITIAL_FORM_STATE);
      setErrors({});
      setHasAttemptedSubmit(false);
      setVisitedTabs({ basic: true });
    }
    setActiveTab('basic');
    setModalOpen(true);
  };

  // Add Another Challenge & Solution Pair
  const handleAddChallengeSolution = () => {
    setFormData((prev) => {
      const nextIndex = (prev.challengesAndSolutions?.length || 0) + 1;
      return {
        ...prev,
        challengesAndSolutions: [
          ...(prev.challengesAndSolutions || []),
          {
            challengeTitle: `Challenge ${nextIndex}`,
            challengeDescription: '',
            solutionTitle: `Strategic Solution ${nextIndex}`,
            solutionDescription: '',
          },
        ],
      };
    });
  };

  // Remove a Challenge & Solution Pair
  const handleRemoveChallengeSolution = (indexToRemove) => {
    setFormData((prev) => {
      const currentList = prev.challengesAndSolutions || [];
      const updated = currentList.filter((_, idx) => idx !== indexToRemove);
      const finalList = updated.length > 0 ? updated : [
        {
          challengeTitle: 'The Business Challenge',
          challengeDescription: '',
          solutionTitle: 'Our Strategic Approach',
          solutionDescription: '',
        },
      ];
      return {
        ...prev,
        challengesAndSolutions: finalList,
        challenge: finalList[0]?.challengeDescription || '',
        solution: finalList[0]?.solutionDescription || '',
      };
    });
  };

  // Update a Challenge & Solution Field
  const handleUpdateChallengeSolution = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.challengesAndSolutions || [])];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        challengesAndSolutions: updated,
        challenge: index === 0 && field === 'challengeDescription' ? value : prev.challenge,
        solution: index === 0 && field === 'solutionDescription' ? value : prev.solution,
      };
    });

    const errorKey = `${field}_${index}`;
    if (errors[errorKey] || errors.challengesAndSolutions) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[errorKey];
        delete copy.challengesAndSolutions;
        return copy;
      });
    }
  };

  // Switch Creation Mode seamlessly
  const handleModeSwitch = (mode) => {
    setFormData((prev) => {
      // If switching from manual to quick and content is empty, compile manual sections into rich HTML
      if (mode === 'quick' && !prev.content) {
        const sectionsHtml = [
          prev.challenge ? `<h2>The Challenge</h2><p>${prev.challenge.replace(/\n/g, '<br/>')}</p>` : '',
          prev.solution ? `<h2>Our Solution</h2><p>${prev.solution.replace(/\n/g, '<br/>')}</p>` : '',
          prev.implementation ? `<h2>Implementation</h2><p>${prev.implementation.replace(/\n/g, '<br/>')}</p>` : '',
          prev.results ? `<h2>Results</h2><p>${prev.results.replace(/\n/g, '<br/>')}</p>` : '',
          prev.conclusion ? `<h2>Conclusion</h2><p>${prev.conclusion.replace(/\n/g, '<br/>')}</p>` : '',
        ].filter(Boolean).join('');

        return { ...prev, creationMode: mode, content: sectionsHtml || prev.content };
      }
      return { ...prev, creationMode: mode };
    });
  };

  // Next section navigation with per-section validation and auto-scroll
  const handleNextSection = (targetTab) => {
    const currentValidator = {
      basic: validateBasicInfo,
      details: validateProjectDetails,
      content: validateCaseStudyContent,
      metrics: validateResultsMetrics,
      seo: validateSeoSocial,
    }[activeTab];

    const currentErrs = currentValidator ? currentValidator(formData) : {};
    if (Object.keys(currentErrs).length > 0) {
      setErrors((prev) => ({ ...prev, ...currentErrs }));
      setVisitedTabs((prev) => ({ ...prev, [activeTab]: true }));
      setFeedback({
        type: 'error',
        message: 'Please complete all mandatory fields in this section before proceeding.',
      });
      setTimeout(() => {
        const firstInvalid = document.querySelector('.border-rose-500, [aria-invalid="true"]');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (firstInvalid.focus) firstInvalid.focus();
        }
      }, 100);
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(currentErrs).forEach((k) => delete next[k]);
      return next;
    });

    setVisitedTabs((prev) => ({ ...prev, [targetTab]: true }));
    setActiveTab(targetTab);
  };

  // Insert Standard Template into Quick Create Editor
  const handleInsertTemplate = () => {
    const template = `
<h2>Introduction</h2>
<p>Provide a high-level executive summary of this client project, strategic vision, and goals...</p>

<h2>Client Background</h2>
<p>Overview of the client organisation, their target demographic, and market challenges...</p>

<h2>The Challenge</h2>
<p>Detail the friction points, legacy technology constraints, or operational bottlenecks faced...</p>

<h2>Our Solution</h2>
<p>Explain the architecture, design principles, modern technology stack, and engineering execution...</p>

<h2>Implementation</h2>
<p>Break down the delivery sprints, testing phases, performance audits, and release strategy...</p>

<h2>Results & Key Achievements</h2>
<p>Highlight verifiable business results, user engagement metrics, and ROI improvements...</p>

<h2>Conclusion</h2>
<p>Summarise project success, ongoing support protocols, and the client's long-term competitive advantage...</p>
`;
    setFormData((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content}<br/>${template}` : template,
    }));
  };

  // Generic Image Uploader supporting both Direct File and Input Event
  const uploadImageFile = async (file, fieldPath = 'featuredImage', onProgress) => {
    if (!file) return null;

    if (file.size > 5 * 1024 * 1024) {
      const err = new Error('File size exceeds the 5 MB limit. Please select a smaller photo.');
      setFeedback({ type: 'error', message: err.message });
      throw err;
    }

    try {
      setUploadProgress(15);
      const res = await authService.uploadCaseStudyImage(file, (percent) => {
        setUploadProgress(percent);
        if (onProgress) onProgress(percent);
      });
      if (res && res.success) {
        setFormData((prev) => {
          if (fieldPath === 'featuredImage') return { ...prev, featuredImage: res.fileUrl };
          if (fieldPath === 'beforeImage') return { ...prev, beforeAfter: { ...prev.beforeAfter, beforeImage: res.fileUrl } };
          if (fieldPath === 'afterImage') return { ...prev, beforeAfter: { ...prev.beforeAfter, afterImage: res.fileUrl } };
          if (fieldPath === 'showcaseImage') return { ...prev, showcaseImage: res.fileUrl };
          if (fieldPath === 'testimonialPhoto') return { ...prev, testimonial: { ...prev.testimonial, photo: res.fileUrl } };
          if (fieldPath === 'additionalImages') return { ...prev, additionalImages: [...prev.additionalImages, res.fileUrl].slice(0, 2) };
          return prev;
        });
        setFeedback({ type: 'success', message: 'Photo uploaded and saved successfully!' });
        return res.fileUrl;
      }
      throw new Error(res?.message || 'Server did not return a valid file URL');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Image upload failed';
      setFeedback({ type: 'error', message: msg });
      throw err;
    } finally {
      setUploadProgress(null);
    }
  };

  const handleFileUpload = async (e, fieldPath) => {
    const file = e.target?.files?.[0] || e;
    await uploadImageFile(file, fieldPath);
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
        setUploadProgress(10);
        const res = await authService.uploadCaseStudyImage(file, (percent) => setUploadProgress(percent));
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

  // Save / Publish with Complete Section Validation
  const handleSave = async (targetStatus) => {
    const desiredStatus = targetStatus || formData.status || 'published';

    // If saving as DRAFT:
    if (desiredStatus === 'draft') {
      if (!formData.title?.trim()) {
        setErrors((prev) => ({ ...prev, title: 'Case Study Title is required to save a draft' }));
        setActiveTab('basic');
        setFeedback({ type: 'error', message: 'Please enter a Case Study Title to save as draft' });
        return;
      }
      setErrors({});
    } else {
      // PUBLISH or UPDATE with published status:
      const validation = validateEntireCaseStudy(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setHasAttemptedSubmit(true);

        const tabOrder = ['basic', 'details', 'content', 'metrics', 'seo'];
        const firstInvalidTab = tabOrder.find((t) => !validation.sectionStatus[t]);
        if (firstInvalidTab) {
          setVisitedTabs((prev) => ({ ...prev, [firstInvalidTab]: true }));
          setActiveTab(firstInvalidTab);
        }

        const invalidSectionNames = tabOrder
          .filter((t) => !validation.sectionStatus[t])
          .map((t) => SECTION_TABS.find((tab) => tab.id === t)?.shortLabel || t)
          .join(', ');

        setFeedback({
          type: 'error',
          message: `Please complete all mandatory fields in: ${invalidSectionNames}`,
        });

        setTimeout(() => {
          const firstErrorEl = document.querySelector('.border-rose-500, [aria-invalid="true"]');
          if (firstErrorEl) {
            firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (firstErrorEl.focus) firstErrorEl.focus();
          }
        }, 120);
        return;
      }
      setErrors({});
    }

    const activeSlug = (formData.seo?.slug || formData.slug || '').trim().toLowerCase();
    if (!activeSlug && desiredStatus === 'published') {
      setFeedback({ type: 'error', message: 'SEO Slug is required' });
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

    const metaT = formData.seo?.metaTitle || formData.metaTitle || (formData.title ? `${formData.title} | VR4Web Case Study` : '');
    const metaD = formData.seo?.metaDescription || formData.metaDescription || (formData.shortDescription ? formData.shortDescription.slice(0, 160) : '');
    const kw = Array.isArray(formData.seo?.keywords) && formData.seo.keywords.length > 0 ? formData.seo.keywords : formData.metaKeywords || [];
    const ogT = formData.seo?.ogTitle || formData.ogTitle || metaT;
    const ogD = formData.seo?.ogDescription || formData.ogDescription || metaD;
    const ogI = formData.seo?.ogImage || formData.ogImage || formData.featuredImage || '/case-study/property.png';

    const seoPayload = {
      metaTitle: metaT,
      metaDescription: metaD,
      keywords: kw,
      slug: activeSlug,
      canonicalUrl: canon || `https://vr4web.com/case-studies/${activeSlug}`,
      ogTitle: ogT,
      ogDescription: ogD,
      ogImage: ogI,
    };

    setSaving(true);
    try {
      const firstPair = formData.challengesAndSolutions?.[0];
      const effectiveCategory =
        formData.category === 'Other'
          ? (formData.customCategory?.trim() || 'Other')
          : formData.category;

      const effectiveIndustry =
        formData.industry === 'Other'
          ? (formData.customIndustry?.trim() || 'Other')
          : (formData.industry || 'Technology');

      const effectiveProjectType =
        formData.projectType === 'Other'
          ? (formData.customProjectType?.trim() || 'Other')
          : (formData.projectType || 'Website');

      const effectiveDescription = (formData.shortDescription || formData.projectDescription || '').trim();
      const payload = {
        ...formData,
        shortDescription: effectiveDescription,
        projectOverview: formData.projectOverview?.trim() || effectiveDescription || formData.title || '',
        clientOverview: formData.clientOverview?.trim() || '',
        category: effectiveCategory,
        customCategory: formData.category === 'Other' ? (formData.customCategory?.trim() || '') : '',
        industry: effectiveIndustry,
        customIndustry: formData.industry === 'Other' ? (formData.customIndustry?.trim() || '') : '',
        projectType: effectiveProjectType,
        customProjectType: formData.projectType === 'Other' ? (formData.customProjectType?.trim() || '') : '',
        projectCompletionDate: formData.projectCompletionDate ? formData.projectCompletionDate.trim() : '',
        slug: activeSlug,
        metaTitle: metaT,
        metaDescription: metaD,
        metaKeywords: kw,
        canonicalUrl: seoPayload.canonicalUrl,
        ogTitle: ogT,
        ogDescription: ogD,
        ogImage: ogI,
        seo: seoPayload,
        challenge: firstPair?.challengeDescription || formData.challenge || '',
        solution: firstPair?.solutionDescription || formData.solution || '',
        featuredImage: formData.featuredImage?.trim() || '/case-study/property.png',
        showcaseTitle: formData.showcaseTitle?.trim() || '',
        showcaseImage: formData.showcaseImage?.trim() || '',
        status: desiredStatus,
      };

      // Completely remove testimonial from submission
      delete payload.testimonial;

      if (editingId) {
        await authService.updateCaseStudy(editingId, payload);
        setFeedback({ type: 'success', message: `Case study updated successfully as ${payload.status}` });
      } else {
        await authService.createCaseStudy(payload);
        setFeedback({ type: 'success', message: `Case study created successfully as ${payload.status}` });
      }

      setModalOpen(false);
      fetchCaseStudies();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSaving(false);
    }
  };

  // Duplicate
  const handleDuplicate = async (id) => {
    try {
      await authService.duplicateCaseStudy(id);
      setFeedback({ type: 'success', message: 'Case study duplicated as Draft' });
      fetchCaseStudies();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Publish / Unpublish Toggle
  const handleTogglePublish = async (item) => {
    try {
      if (item.status === 'published') {
        await authService.unpublishCaseStudy(item._id);
        setFeedback({ type: 'success', message: `"${item.title}" moved to Drafts` });
      } else {
        await authService.publishCaseStudy(item._id);
        setFeedback({ type: 'success', message: `"${item.title}" is now Published live!` });
      }
      fetchCaseStudies();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await authService.deleteCaseStudy(deleteTarget._id);
      setFeedback({ type: 'success', message: 'Case study deleted' });
      setDeleteTarget(null);
      fetchCaseStudies();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Metrics helper
  const handleAddMetric = () => {
    setFormData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, { value: '', label: '', description: '', icon: 'TrendingUp' }],
    }));
  };

  const handleUpdateMetric = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.metrics];
      updated[index][field] = value;
      return { ...prev, metrics: updated };
    });
    const errorKey = field === 'value' ? `metric_value_${index}` : field === 'label' ? `metric_label_${index}` : `metric_desc_${index}`;
    if (errors[errorKey] || errors.metrics) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[errorKey];
        delete copy.metrics;
        return copy;
      });
    }
  };

  const handleRemoveMetric = (index) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index),
    }));
  };

  // Tag input helpers
  const handleAddTag = (field, value, setVal) => {
    if (!value.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...new Set([...(prev[field] || []), value.trim()])],
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    setVal('');
  };

  const handleRemoveTag = (field, tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((t) => t !== tagToRemove),
    }));
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
            <span className="text-blue-600 font-black">Case Studies</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 tracking-tight flex items-center gap-2.5 flex-wrap">
            <span>Case Studies Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black shrink-0">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-black font-medium mt-1 max-w-2xl">
            Create, edit, publish, and manage enterprise client showcases and technical deliverables.
          </p>
        </div>

        {/* Action Controls - Always preserved without awkward line breaking */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={() => fetchCaseStudies()}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-300 text-black hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            title="Refresh case studies"
          >
            <RotateCcw className="w-4 h-4 text-black shrink-0" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 sm:px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] transition-all inline-flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">Add New Case Study</span>
          </button>
        </div>
      </div>

      {/* ─── Feedback Toast ─── */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between border shadow-xs transition-all ${
            feedback.type === 'success'
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

      {/* ─── Metric Stat Cards (Modern Interactive Grid) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Case Studies */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${
            statusFilter === 'all'
              ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/20'
              : 'border-slate-200/80 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              All
            </span>
          </div>
          <div className="mt-2.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-black">Total Studies</p>
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

        {/* Drafts in Progress */}
        <div
          onClick={() => {
            setStatusFilter('draft');
            setPage(1);
          }}
          className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${
            statusFilter === 'draft'
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

        {/* Featured Showcase */}
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

      {/* ─── Search & Filter Bar ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 py-2 px-3.5 sm:px-4 shadow-xs flex flex-col xl:flex-row gap-2.5 items-stretch xl:items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black" />
          <input
            type="text"
            placeholder="Search by case study title, client name, or summary..."
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
          {/* Industry Filter */}
          <select
            value={industryFilter}
            onChange={(e) => {
              setIndustryFilter(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:flex-initial bg-slate-50 border border-slate-300 text-black text-xs sm:text-sm rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 font-bold cursor-pointer"
          >
            <option value="all">All Industries</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:flex-initial bg-slate-50 border border-slate-300 text-black text-xs sm:text-sm rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 font-bold cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="flex-1 sm:flex-initial bg-slate-50 border border-slate-300 text-black text-xs sm:text-sm rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 font-bold cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          {/* Reset Filters */}
          {(search || industryFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all') && (
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

      {/* ─── Case Studies Content Area (Mobile Cards + Desktop Table) ─── */}
      {loading ? (
        <div className="py-20 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex justify-center">
          <LoadingSpinner text="Retrieving case studies..." />
        </div>
      ) : caseStudies.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <EmptyState
            title="No Case Studies Found"
            description="You haven't created any case studies yet or no items match your search. Click below to create your first case study!"
            actionText="Add New Case Study"
            onAction={() => handleOpenModal()}
            icon={FolderOpen}
          />
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< 768px): Responsive card view, NO horizontal scroll */}
          <div className="md:hidden space-y-4">
            {caseStudies.map((study, idx) => {
              const sNo = (page - 1) * pageSize + idx + 1;
              const dateStr = study.createdAt
                ? new Date(study.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—';

              return (
                <div
                  key={study._id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-3.5"
                >
                  {/* Top Bar: S.No + Status + Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-black font-black">#{sNo}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(study)}
                        title="Click to toggle Status"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                          study.status === 'published'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                            : study.status === 'draft'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                            : 'bg-slate-100 text-black border border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            study.status === 'published'
                              ? 'bg-emerald-600'
                              : study.status === 'draft'
                              ? 'bg-amber-600'
                              : 'bg-black'
                          }`}
                        />
                        <span>{study.status}</span>
                      </button>
                      <span className="text-black font-bold font-mono text-[11px]">{dateStr}</span>
                    </div>
                  </div>

                  {/* Thumbnail & Title/Client */}
                  <div className="flex gap-3.5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0">
                      <img
                        src={getImageUrl(study.featuredImage)}
                        alt={study.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/case-study/property.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-black text-sm leading-snug line-clamp-2">
                        {study.title}
                      </h3>
                      <div className="text-[11px] font-mono text-blue-700 font-bold mt-0.5 truncate">
                        /{study.slug}
                      </div>
                    </div>
                  </div>

                  {/* Industry & Category Tags (NO PURPLE) */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                      {study.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-black border border-slate-200">
                      {study.industry}
                    </span>
                    {study.isFeatured && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white flex items-center gap-1 shadow-2xs">
                        <Award className="w-3 h-3 text-white" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>

                  {/* Mobile Actions (NO PURPLE) */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={`/stories/${study.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live</span>
                    </a>
                    <button
                      onClick={() => handleOpenModal(study)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(study._id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(study)}
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

          {/* DESKTOP VIEW (>= 768px): Modern Grouped Table (High contrast black text, NO PURPLE) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-100/90 text-xs font-black uppercase tracking-wider text-black border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3.5 text-center w-12 text-black font-black">#</th>
                    <th className="py-2.5 px-4 min-w-[320px] text-black font-black">Case Study & Overview</th>
                    <th className="py-2.5 px-3.5 min-w-[180px] text-black font-black">Category & Industry</th>
                    <th className="py-2.5 px-3.5 text-center w-32 text-black font-black">Status</th>
                    <th className="py-2.5 px-3.5 w-32 text-black font-black">Created Date</th>
                    <th className="py-2.5 px-4 text-right w-44 text-black font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-black">
                  {caseStudies.map((study, idx) => {
                    const sNo = (page - 1) * pageSize + idx + 1;
                    const dateStr = study.createdAt
                      ? new Date(study.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—';

                    return (
                      <tr
                        key={study._id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* S.No */}
                        <td className="py-2 px-3.5 text-center font-black text-black text-xs">
                          {sNo}
                        </td>

                        {/* Showcase & Slug (Image + Title + Slug) */}
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0">
                              <img
                                src={getImageUrl(study.featuredImage)}
                                alt={study.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/case-study/property.png';
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-black text-sm leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {study.title}
                              </p>
                              <div className="text-[11px] font-mono text-blue-700 font-bold mt-0.5 truncate">
                                /{study.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Industry */}
                        <td className="py-2 px-3.5">
                          <div className="space-y-0.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-800 border border-blue-200">
                              {study.category}
                            </span>
                            <p className="text-xs text-black font-semibold pl-1">
                              {study.industry}
                            </p>
                          </div>
                        </td>

                        {/* Status (Interactive toggle badge) */}
                        <td className="py-2 px-3.5 text-center">
                          <button
                            onClick={() => handleTogglePublish(study)}
                            title="Click to toggle Status"
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                              study.status === 'published'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                                : study.status === 'draft'
                                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                                : 'bg-slate-100 text-black border border-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                study.status === 'published'
                                  ? 'bg-emerald-600'
                                  : study.status === 'draft'
                                  ? 'bg-amber-600'
                                  : 'bg-black'
                              }`}
                            />
                            <span>{study.status}</span>
                          </button>
                        </td>

                        {/* Date */}
                        <td className="py-2 px-3.5 text-xs font-bold text-black font-mono">
                          {dateStr}
                        </td>

                        {/* Actions (NO PURPLE) */}
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Live */}
                            <a
                              href={`/stories/${study.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black transition-colors"
                              title="View Live Showcase"
                            >
                              <Eye className="w-4 h-4" />
                            </a>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenModal(study)}
                              className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer border border-blue-200"
                              title="Edit Case Study"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Duplicate */}
                            <button
                              onClick={() => handleDuplicate(study._id)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black transition-colors cursor-pointer border border-slate-200"
                              title="Duplicate Case Study"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(study)}
                              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer border border-red-200"
                              title="Delete Case Study"
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
            totalRecords={pagination.total || caseStudies.length}
            totalPages={pagination.pages || 1}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            showPageSizeDropdown={true}
            loading={loading}
            recordLabel="case studies"
          />
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATION & EDIT MODAL (TWO CREATION MODES)
         ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Top Header */}
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-black text-lg sm:text-xl">
                    {editingId ? 'Edit Case Study' : 'Create New Case Study'}
                  </h3>
                  <p className="text-xs text-black font-medium mt-0.5">
                    Select your preferred content creation mode below
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-black font-medium hover:text-black p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selection Cards / Tabs */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] bg-white flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => handleModeSwitch('manual')}
                className={`flex-1 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.creationMode === 'manual'
                    ? 'border-[#2563EB] bg-emerald-50/60 shadow-xs'
                    : 'border-[#E5E7EB] hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-black">
                    <Sliders className="w-4 h-4 text-[#2563EB]" />
                    <span>Option 1: Manual Fill</span>
                  </div>
                  {formData.creationMode === 'manual' && (
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  )}
                </div>
                <p className="text-xs text-black font-medium leading-relaxed">
                  Structured fields across tabs: project details, challenge, solution, and metrics.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleModeSwitch('quick')}
                className={`flex-1 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.creationMode === 'quick'
                    ? 'border-[#2563EB] bg-emerald-50/60 shadow-xs'
                    : 'border-[#E5E7EB] hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-black">
                    <Zap className="w-4 h-4 text-[#2563EB]" />
                    <span>Option 2: Quick Create</span>
                  </div>
                  {formData.creationMode === 'quick' && (
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  )}
                </div>
                <p className="text-xs text-black font-medium leading-relaxed">
                  Single rich text editor: copy & paste your complete case study with formatting and images.
                </p>
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#F8FAF9]">
              {/* Modal Feedback Alert */}
              {feedback && (
                <div
                  className={`p-3.5 mb-4 rounded-xl text-xs sm:text-sm flex items-center justify-between border ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-[#16A34A]'
                      : 'bg-red-50 border-red-200 text-[#DC2626]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                    )}
                    <span className="font-medium">{feedback.message}</span>
                  </div>
                  <button onClick={() => setFeedback(null)} className="cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {/* ──────────────────────────────────────────────────
                  MODE 1: MANUAL FILL (5 STRUCTURED TABS)
                 ────────────────────────────────────────────────── */}
              {formData.creationMode === 'manual' ? (
                <div className="space-y-6">
                  {/* Tab Navigation with Dynamic Status Indicators */}
                  <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
                    {SECTION_TABS.map((tab) => {
                      const isComplete = sectionStatus[tab.id];
                      const hasErrors = Object.keys(sectionErrors[tab.id] || {}).length > 0;
                      const showRedIndicator = hasErrors && (hasAttemptedSubmit || visitedTabs[tab.id]);

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setVisitedTabs((prev) => ({ ...prev, [tab.id]: true }));
                            setActiveTab(tab.id);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            activeTab === tab.id
                              ? 'bg-[#2563EB] text-white shadow-xs'
                              : 'bg-white text-black font-medium hover:text-black border border-[#E5E7EB]'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {isComplete ? (
                            <span
                              className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                                activeTab === tab.id ? 'bg-emerald-400 text-white' : 'bg-emerald-100 text-emerald-700'
                              }`}
                              title="Section Completed & Valid"
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          ) : showRedIndicator ? (
                            <span
                              className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                                activeTab === tab.id ? 'bg-rose-400 text-white' : 'bg-rose-100 text-rose-600'
                              }`}
                              title="Incomplete Mandatory Fields"
                            >
                              <AlertCircle className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab 1: Basic Info */}
                  {activeTab === 'basic' && (
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Case Study Title <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => {
                            handleTitleChange(e.target.value);
                            if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                          }}
                          placeholder="Enter a compelling case study title..."
                          className={`w-full px-3.5 py-2.5 bg-[#F8FAF9] border rounded-xl text-black text-sm focus:bg-white focus:outline-none ${
                            errors.title ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                          }`}
                        />
                        {errors.title && (
                          <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.title}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Slug <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.slug}
                          onChange={(e) => {
                            setFormData({ ...formData, slug: e.target.value });
                            if (errors.slug) setErrors((prev) => ({ ...prev, slug: null }));
                          }}
                          placeholder="how-we-improved-business-performance"
                          className={`w-full px-3.5 py-2.5 bg-[#F8FAF9] border rounded-xl text-black text-sm font-mono focus:bg-white focus:outline-none ${
                            errors.slug ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                          }`}
                        />
                        {errors.slug && (
                          <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.slug}</p>
                        )}
                        <p className="text-[11px] text-black font-medium font-mono mt-1">
                          Preview URL: <span className="text-[#2563EB]">yourdomain.com/case-study/{formData.slug || 'your-slug'}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Client Name <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.clientName}
                            onChange={(e) => {
                              setFormData({ ...formData, clientName: e.target.value });
                              if (errors.clientName) setErrors((prev) => ({ ...prev, clientName: null }));
                            }}
                            placeholder="e.g. SMM Consult Pty Ltd"
                            className={`w-full px-3.5 py-2.5 bg-[#F8FAF9] border rounded-xl text-black text-sm focus:bg-white focus:outline-none ${
                              errors.clientName ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                            }`}
                          />
                          {errors.clientName && (
                            <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.clientName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Industry <span className="text-slate-400 font-normal lowercase">(optional)</span>
                          </label>
                          <select
                            value={formData.industry}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({
                                ...formData,
                                industry: val,
                                customIndustry: val === 'Other' ? formData.customIndustry : '',
                              });
                              if (errors.customIndustry) setErrors((prev) => ({ ...prev, customIndustry: null }));
                            }}
                            className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-sm focus:bg-white focus:outline-none focus:border-[#2563EB]"
                          >
                            {INDUSTRIES.map((ind) => (
                              <option key={ind} value={ind}>{ind}</option>
                            ))}
                          </select>
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
                            className={`w-full px-3.5 py-2.5 bg-[#F8FAF9] border rounded-xl text-black text-sm focus:bg-white focus:outline-none ${
                              errors.category ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                            }`}
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          {errors.category && (
                            <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.category}</p>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Custom Industry Box when Other is selected */}
                      {formData.industry === 'Other' && (
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Enter Custom Industry <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.customIndustry || ''}
                            onChange={(e) => {
                              setFormData({ ...formData, customIndustry: e.target.value });
                              if (errors.customIndustry) setErrors((prev) => ({ ...prev, customIndustry: null }));
                            }}
                            placeholder="e.g. Fintech, Biotechnology, Logistics..."
                            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-black text-sm focus:outline-none ${
                              errors.customIndustry ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-amber-300 focus:border-blue-500'
                            }`}
                          />
                          {errors.customIndustry && (
                            <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.customIndustry}</p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1">
                            This custom industry will be saved to the database and shown on frontend cards and details.
                          </p>
                        </div>
                      )}

                      {/* Dynamic Custom Category Box when Other is selected */}
                      {formData.category === 'Other' && (
                        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
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
                            placeholder="e.g. Artificial Intelligence, Cloud Solutions"
                            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-black text-sm focus:outline-none ${
                              errors.customCategory ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-amber-300 focus:border-blue-500'
                            }`}
                          />
                          {errors.customCategory && (
                            <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.customCategory}</p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1">
                            This custom category will be displayed across public case study filters, cards, and detail pages.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Project Description <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={formData.shortDescription || formData.projectDescription || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleShortDescriptionChange(val);
                            setFormData((prev) => ({ ...prev, shortDescription: val, projectDescription: val }));
                            if (errors.shortDescription) setErrors((prev) => ({ ...prev, shortDescription: null }));
                          }}
                          placeholder="Describe the project overview, client objectives, and key deliverables..."
                          className={`w-full px-3.5 py-2.5 bg-[#F8FAF9] border rounded-xl text-black text-sm focus:bg-white focus:outline-none ${
                            errors.shortDescription ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                          }`}
                        />
                        {errors.shortDescription && (
                          <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.shortDescription}</p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1 font-normal">
                          Executive summary and overview of the project shown on case study cards and headers.
                        </p>
                      </div>

                      {/* Featured Image Drag & Drop Upload Zone */}
                      <div>
                        <DragDropImageUpload
                          label="Featured Image (Cover Photo) *"
                          sublabel="Drag & drop your featured cover photo here, or browse files"
                          value={formData.featuredImage}
                          onChange={(url) => {
                            setFormData((prev) => ({ ...prev, featuredImage: url }));
                            handleFeaturedImageChange(url);
                            if (errors.featuredImage) setErrors((prev) => ({ ...prev, featuredImage: null }));
                          }}
                          onUpload={(file, onProgress) => uploadImageFile(file, 'featuredImage', onProgress)}
                          fallback="/case-study/property.png"
                          aspectRatio="aspect-[16/9]"
                          helperText="Recommended resolution: 1200 x 675px. Formats: JPG, PNG, WEBP, SVG (Max: 5 MB)"
                        />
                        {errors.featuredImage && (
                          <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.featuredImage}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Project Completion Date <span className="text-slate-400 font-normal lowercase">(optional)</span>
                          </label>
                          <input
                            type="date"
                            value={formData.projectCompletionDate}
                            onChange={(e) => setFormData({ ...formData, projectCompletionDate: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-sm focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <input
                            type="checkbox"
                            id="isFeatured"
                            checked={formData.isFeatured}
                            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            className="w-4 h-4 text-[#2563EB] rounded focus:ring-0 cursor-pointer"
                          />
                          <label htmlFor="isFeatured" className="text-xs font-bold text-black cursor-pointer">
                            Mark as Featured Case Study (Shows in homepage highlights)
                          </label>
                        </div>
                      </div>

                      {/* Next Section Button */}
                      <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleNextSection('details')}
                          className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Next: Project Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Project Details */}
                  {activeTab === 'details' && (
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Client Overview <span className="text-slate-400 font-normal lowercase">(optional)</span>
                          </label>
                          <textarea
                            rows={3}
                            value={formData.clientOverview}
                            onChange={(e) => {
                              setFormData({ ...formData, clientOverview: e.target.value });
                              if (errors.clientOverview) setErrors((prev) => ({ ...prev, clientOverview: null }));
                            }}
                            placeholder="Describe the client business and background (optional)..."
                            className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-sm focus:bg-white focus:outline-none focus:border-[#2563EB]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Project Overview <span className="text-slate-400 font-normal lowercase">(optional - defaults to Project Description)</span>
                          </label>
                          <textarea
                            rows={3}
                            value={formData.projectOverview}
                            onChange={(e) => {
                              setFormData({ ...formData, projectOverview: e.target.value });
                              if (errors.projectOverview) setErrors((prev) => ({ ...prev, projectOverview: null }));
                            }}
                            placeholder="Describe the primary mission and project objectives (optional)..."
                            className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-sm focus:bg-white focus:outline-none focus:border-[#2563EB]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Project Type <span className="text-slate-400 font-normal lowercase">(optional)</span>
                          </label>
                          <select
                            value={formData.projectType}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({
                                ...formData,
                                projectType: val,
                                customProjectType: val === 'Other' ? formData.customProjectType : '',
                              });
                              if (errors.projectType) setErrors((prev) => ({ ...prev, projectType: null }));
                              if (errors.customProjectType) setErrors((prev) => ({ ...prev, customProjectType: null }));
                            }}
                            className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-sm focus:bg-white focus:outline-none focus:border-[#2563EB]"
                          >
                            {PROJECT_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          {formData.projectType === 'Other' && (
                            <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                              <label className="block text-[11px] font-bold text-black mb-1 uppercase">
                                Enter Custom Project Type <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                value={formData.customProjectType || ''}
                                onChange={(e) => {
                                  setFormData({ ...formData, customProjectType: e.target.value });
                                  if (errors.customProjectType) setErrors((prev) => ({ ...prev, customProjectType: null }));
                                }}
                                placeholder="e.g. Enterprise Web Portal"
                                className={`w-full px-3 py-1.5 bg-white border rounded-lg text-black text-xs focus:outline-none ${
                                  errors.customProjectType ? 'border-rose-500' : 'border-amber-300 focus:border-blue-500'
                                }`}
                              />
                              {errors.customProjectType && (
                                <p className="mt-1 text-[11px] text-rose-500 font-semibold">{errors.customProjectType}</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Duration <span className="text-slate-400 font-normal lowercase">(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={formData.projectDuration}
                            onChange={(e) => setFormData({ ...formData, projectDuration: e.target.value })}
                            placeholder="e.g. 8 Weeks"
                            className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-sm focus:bg-white focus:outline-none focus:border-[#2563EB]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Project URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
                          </label>
                          <input
                            type="url"
                            value={formData.projectUrl}
                            onChange={(e) => {
                              setFormData({ ...formData, projectUrl: e.target.value });
                              if (errors.projectUrl) setErrors((prev) => ({ ...prev, projectUrl: null }));
                            }}
                            placeholder="https://..."
                            className={`w-full px-3.5 py-2.5 bg-[#F8FAF9] border rounded-xl text-black text-sm focus:bg-white focus:outline-none ${
                              errors.projectUrl ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                            }`}
                          />
                          {errors.projectUrl && (
                            <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.projectUrl}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                            Client Location <span className="text-slate-400 font-normal lowercase">(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={formData.clientLocation}
                            onChange={(e) => setFormData({ ...formData, clientLocation: e.target.value })}
                            placeholder="Sydney, NSW"
                            className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-sm focus:bg-white focus:outline-none focus:border-[#2563EB]"
                          />
                        </div>
                      </div>

                      {/* Services Provided Tags */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-black uppercase">
                            Services Provided <span className="text-slate-400 font-normal lowercase">(optional)</span>
                          </label>
                          <span className="text-[11px] text-slate-400 font-normal">Add deliverables or services provided</span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={serviceInput}
                            onChange={(e) => setServiceInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag('servicesProvided', serviceInput, setServiceInput);
                              }
                            }}
                            placeholder="Type service and press Enter..."
                            className="flex-1 px-3.5 py-2 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-xs text-black focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTag('servicesProvided', serviceInput, setServiceInput)}
                            className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer hover:bg-[#1d4ed8]"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {formData.servicesProvided?.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-black border border-emerald-200"
                            >
                              <span>{s}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag('servicesProvided', s)}
                                className="hover:text-red-600 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Technologies Used Tags */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-black uppercase">
                            Technologies Used <span className="text-slate-400 font-normal lowercase">(optional)</span>
                          </label>
                          <span className="text-[11px] text-slate-400 font-normal">Tech stack used for the engagement</span>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={techInput}
                            onChange={(e) => setTechInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag('technologiesUsed', techInput, setTechInput);
                              }
                            }}
                            placeholder="e.g. React, Node.js, Express, MongoDB..."
                            className="flex-1 px-3.5 py-2 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-xs text-black focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTag('technologiesUsed', techInput, setTechInput)}
                            className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold cursor-pointer hover:bg-[#1d4ed8]"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {formData.technologiesUsed?.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#F8FAF9] text-black border border-[#E5E7EB]"
                            >
                              <span>{t}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag('technologiesUsed', t)}
                                className="hover:text-red-600 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Section Navigation Buttons */}
                      <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setActiveTab('basic')}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous: Basic Info</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextSection('content')}
                          className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Next: Content</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Structured Content */}
                  {activeTab === 'content' && (
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] space-y-4">
                      {/* Dynamic Challenges & Solutions Pairs */}
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                                Challenges & Solutions <span className="text-rose-500 font-bold">*</span>
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563EB]/15 text-[#2563EB]">
                                {formData.challengesAndSolutions?.length || 1} {formData.challengesAndSolutions?.length === 1 ? 'Pair' : 'Pairs'}
                              </span>
                            </div>
                            <p className="text-[11px] text-black font-medium mt-0.5">
                              At least one complete Challenge & Solution pair is required. Add as many pairs as needed.
                            </p>
                            {errors.challengesAndSolutions && (
                              <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.challengesAndSolutions}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleAddChallengeSolution}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Pair</span>
                          </button>
                        </div>

                        {/* List of Pairs */}
                        <div className="space-y-4">
                          {(formData.challengesAndSolutions || []).map((pair, idx) => (
                            <div
                              key={idx}
                              className="p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] bg-[#F8FAF9] hover:border-[#2563EB]/30 transition-all space-y-3.5 relative"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-black uppercase tracking-wide">
                                    Challenge & Solution Pair #{idx + 1}
                                  </span>
                                </div>
                                {(formData.challengesAndSolutions || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChallengeSolution(idx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                                    title="Delete this Challenge & Solution pair"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* The Challenge Box */}
                                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">
                                      The Challenge #{idx + 1} Title <span className="text-rose-500 font-bold">*</span>
                                    </label>
                                  </div>
                                  <input
                                    type="text"
                                    value={pair.challengeTitle || ''}
                                    onChange={(e) => handleUpdateChallengeSolution(idx, 'challengeTitle', e.target.value)}
                                    placeholder="Challenge Title (e.g. Legacy System Bottlenecks)"
                                    className={`w-full px-3 py-1.5 bg-[#F8FAF9] border rounded-lg text-xs font-semibold text-black focus:outline-none ${
                                      errors[`challengeTitle_${idx}`] ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                                    }`}
                                  />
                                  {errors[`challengeTitle_${idx}`] && (
                                    <p className="text-[11px] text-rose-500 font-semibold">{errors[`challengeTitle_${idx}`]}</p>
                                  )}
                                  <label className="block text-[11px] font-bold text-[#2563EB] uppercase tracking-wider pt-1">
                                    The Challenge #{idx + 1} Description <span className="text-rose-500 font-bold">*</span>
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={pair.challengeDescription || ''}
                                    onChange={(e) => handleUpdateChallengeSolution(idx, 'challengeDescription', e.target.value)}
                                    placeholder="What core business or technical friction was the client experiencing?"
                                    className={`w-full px-3 py-2 bg-[#F8FAF9] border rounded-lg text-xs text-black focus:outline-none ${
                                      errors[`challengeDescription_${idx}`] ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                                    }`}
                                  />
                                  {errors[`challengeDescription_${idx}`] && (
                                    <p className="text-[11px] text-rose-500 font-semibold">{errors[`challengeDescription_${idx}`]}</p>
                                  )}
                                </div>

                                {/* Our Solution Box */}
                                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-bold text-black uppercase tracking-wider">
                                      Our Solution #{idx + 1} Title <span className="text-rose-500 font-bold">*</span>
                                    </label>
                                  </div>
                                  <input
                                    type="text"
                                    value={pair.solutionTitle || ''}
                                    onChange={(e) => handleUpdateChallengeSolution(idx, 'solutionTitle', e.target.value)}
                                    placeholder="Solution Title (e.g. Modern Full-Stack Architecture)"
                                    className={`w-full px-3 py-1.5 bg-[#F8FAF9] border rounded-lg text-xs font-semibold text-black focus:outline-none ${
                                      errors[`solutionTitle_${idx}`] ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                                    }`}
                                  />
                                  {errors[`solutionTitle_${idx}`] && (
                                    <p className="text-[11px] text-rose-500 font-semibold">{errors[`solutionTitle_${idx}`]}</p>
                                  )}
                                  <label className="block text-[11px] font-bold text-black uppercase tracking-wider pt-1">
                                    Our Solution #{idx + 1} Description <span className="text-rose-500 font-bold">*</span>
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={pair.solutionDescription || ''}
                                    onChange={(e) => handleUpdateChallengeSolution(idx, 'solutionDescription', e.target.value)}
                                    placeholder="What architectural and strategic solutions were engineered?"
                                    className={`w-full px-3 py-2 bg-[#F8FAF9] border rounded-lg text-xs text-black focus:outline-none ${
                                      errors[`solutionDescription_${idx}`] ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB] focus:border-[#2563EB]'
                                    }`}
                                  />
                                  {errors[`solutionDescription_${idx}`] && (
                                    <p className="text-[11px] text-rose-500 font-semibold">{errors[`solutionDescription_${idx}`]}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Another Pair Button */}
                        <button
                          type="button"
                          onClick={handleAddChallengeSolution}
                          className="w-full py-3 border-2 border-dashed border-[#2563EB]/25 hover:border-[#2563EB] hover:bg-orange-50/40 rounded-2xl text-black hover:text-[#2563EB] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Another Challenge & Solution Pair</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Implementation & Delivery <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={formData.implementation}
                          onChange={(e) => {
                            setFormData({ ...formData, implementation: e.target.value });
                            if (errors.implementation) setErrors((prev) => ({ ...prev, implementation: null }));
                          }}
                          placeholder="How were sprints orchestrated and quality gates enforced (optional)?"
                          className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-sm focus:bg-white focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Conclusion <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={formData.conclusion}
                          onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                          placeholder="Concluding summary and future roadmap..."
                          className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-sm focus:outline-none"
                        />
                      </div>

                      {/* Section Navigation Buttons */}
                      <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setActiveTab('details')}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous: Project Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextSection('metrics')}
                          className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Next: Results & Metrics</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Results & Metrics */}
                  {activeTab === 'metrics' && (
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] space-y-6">
                      {/* Results & Key Impact */}
                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Results & Key Impact <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={formData.results}
                          onChange={(e) => {
                            setFormData({ ...formData, results: e.target.value });
                            if (errors.results) setErrors((prev) => ({ ...prev, results: null }));
                          }}
                          placeholder="What quantifiable outcomes, commercial growth, and operational benefits resulted (optional)?"
                          className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-black text-sm focus:bg-white focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      {/* Metric Cards */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-xs font-bold text-black uppercase">
                              Metric Cards <span className="text-rose-500 font-bold">*</span>
                            </h4>
                            <p className="text-xs text-black font-medium">
                              At least 1 complete KPI card is required (e.g. 45% Increase in Conversions)
                            </p>
                            {errors.metrics && (
                              <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.metrics}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleAddMetric}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold cursor-pointer hover:bg-[#1d4ed8]"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Metric</span>
                          </button>
                        </div>

                        <div className="space-y-3">
                          {formData.metrics.map((m, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAF9] flex flex-col gap-2"
                            >
                              <div className="flex flex-col sm:flex-row gap-3 items-center">
                                <div className="w-full sm:w-28">
                                  <input
                                    type="text"
                                    value={m.value}
                                    onChange={(e) => handleUpdateMetric(idx, 'value', e.target.value)}
                                    placeholder="Value (e.g. 45%) *"
                                    className={`w-full px-3 py-2 bg-white border rounded-lg text-xs font-bold text-black focus:outline-none ${
                                      errors[`metric_value_${idx}`] ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB]'
                                    }`}
                                  />
                                  {errors[`metric_value_${idx}`] && (
                                    <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{errors[`metric_value_${idx}`]}</p>
                                  )}
                                </div>

                                <div className="w-full sm:w-48">
                                  <input
                                    type="text"
                                    value={m.label}
                                    onChange={(e) => handleUpdateMetric(idx, 'label', e.target.value)}
                                    placeholder="Title/Label *"
                                    className={`w-full px-3 py-2 bg-white border rounded-lg text-xs font-semibold text-black focus:outline-none ${
                                      errors[`metric_label_${idx}`] ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB]'
                                    }`}
                                  />
                                  {errors[`metric_label_${idx}`] && (
                                    <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{errors[`metric_label_${idx}`]}</p>
                                  )}
                                </div>

                                <div className="flex-1 w-full">
                                  <input
                                    type="text"
                                    value={m.description}
                                    onChange={(e) => handleUpdateMetric(idx, 'description', e.target.value)}
                                    placeholder="Brief description *..."
                                    className={`w-full px-3 py-2 bg-white border rounded-lg text-xs text-black font-medium focus:outline-none ${
                                      errors[`metric_desc_${idx}`] ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-[#E5E7EB]'
                                    }`}
                                  />
                                  {errors[`metric_desc_${idx}`] && (
                                    <p className="text-[10px] text-rose-500 font-semibold mt-0.5">{errors[`metric_desc_${idx}`]}</p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveMetric(idx)}
                                  className="p-2 text-red-500 hover:text-red-700 cursor-pointer"
                                  title="Remove Metric"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* After Solution Image & Description */}
                      <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-black uppercase">Project Result / Solution Image (Optional)</h4>
                          {formData.beforeAfter?.afterImage && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, beforeAfter: { ...formData.beforeAfter, afterImage: '' } })}
                              className="text-[11px] text-red-500 hover:underline cursor-pointer"
                            >
                              Remove Image
                            </button>
                          )}
                        </div>
                        <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAF9] space-y-3">
                          <div>
                            <span className="block text-xs font-bold text-black mb-1.5">Upload Image</span>
                            <div className="flex gap-2 items-center">
                              {formData.beforeAfter?.afterImage && (
                                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-200 border border-[#E5E7EB] flex-shrink-0">
                                  <img
                                    src={getImageUrl(formData.beforeAfter.afterImage, '')}
                                    alt="Uploaded preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <input
                                type="text"
                                value={formData.beforeAfter?.afterImage || ''}
                                onChange={(e) => setFormData({ ...formData, beforeAfter: { ...formData.beforeAfter, afterImage: e.target.value } })}
                                placeholder="/case-study/after.png or upload image"
                                className="flex-1 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-black focus:outline-none"
                              />
                              <label className="p-2.5 rounded-lg bg-[#2563EB] text-white cursor-pointer hover:bg-emerald-900 transition-colors flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                <span className="text-xs font-semibold hidden sm:inline">Upload</span>
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'afterImage')} />
                              </label>
                            </div>
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-black mb-1.5">Description</span>
                            <input
                              type="text"
                              value={formData.beforeAfter?.afterDescription || ''}
                              onChange={(e) => setFormData({ ...formData, beforeAfter: { ...formData.beforeAfter, afterDescription: e.target.value } })}
                              placeholder="High-converting modern web application / delivered project results..."
                              className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-black focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section Navigation Buttons */}
                      <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setActiveTab('content')}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous: Content</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNextSection('seo')}
                          className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Next: SEO & Social</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 5: SEO & Social */}
                  {activeTab === 'seo' && (
                    <div className="space-y-4">
                      <SeoFormSection
                        contentType="case-study"
                        seoData={formData.seo || {}}
                        onChange={handleSeoChange}
                        sourceTitle={formData.title}
                        sourceSummary={formData.shortDescription}
                        sourceFeaturedImage={formData.featuredImage}
                        currentId={editingId}
                        uploadImageHandler={(file) => uploadImageFile(file, 'featuredImage')}
                        errors={errors}
                      />
                      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] flex items-center justify-start">
                        <button
                          type="button"
                          onClick={() => setActiveTab('metrics')}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous: Results & Metrics</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ──────────────────────────────────────────────────
                   MODE 2: QUICK CREATE (SINGLE QUILL RICH TEXT EDITOR)
                   ────────────────────────────────────────────────── */
                <div className="space-y-3.5">
                  {/* Basic Inputs for Quick Mode */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                        Case Study Title <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => {
                          handleTitleChange(e.target.value);
                          if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                        }}
                        placeholder="Enter case study title..."
                        className={`w-full px-3.5 py-2.5 bg-[#F8FAF9] border rounded-xl text-black text-sm font-bold focus:bg-white focus:outline-none focus:border-[#2563EB] ${
                          errors.title ? 'border-rose-500' : 'border-[#E5E7EB]'
                        }`}
                      />
                      {errors.title && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.title}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Slug <span className="text-slate-400 font-normal">(Auto)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          className="w-full px-3.5 py-2 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Client Name <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.clientName}
                          onChange={(e) => {
                            setFormData({ ...formData, clientName: e.target.value });
                            if (errors.clientName) setErrors((prev) => ({ ...prev, clientName: null }));
                          }}
                          placeholder="Client Company"
                          className={`w-full px-3.5 py-2 bg-[#F8FAF9] border rounded-xl text-xs ${
                            errors.clientName ? 'border-rose-500' : 'border-[#E5E7EB]'
                          }`}
                        />
                        {errors.clientName && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.clientName}</p>}
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
                            if (errors.customCategory) setErrors((prev) => ({ ...prev, customCategory: null }));
                          }}
                          className="w-full px-3.5 py-2 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-xs font-bold"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-black mb-1.5 uppercase">
                          Industry <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <select
                          value={formData.industry}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData({
                              ...formData,
                              industry: val,
                              customIndustry: val === 'Other' ? formData.customIndustry : '',
                            });
                            if (errors.customIndustry) setErrors((prev) => ({ ...prev, customIndustry: null }));
                          }}
                          className="w-full px-3.5 py-2 bg-[#F8FAF9] border border-[#E5E7EB] rounded-xl text-xs font-bold"
                        >
                          {INDUSTRIES.map((ind) => (
                            <option key={ind} value={ind}>
                              {ind}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formData.industry === 'Other' && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl animate-fadeIn">
                        <label className="block text-xs font-bold text-black mb-1">
                          Enter Custom Industry <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.customIndustry || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, customIndustry: e.target.value });
                            if (errors.customIndustry) setErrors((prev) => ({ ...prev, customIndustry: null }));
                          }}
                          placeholder="e.g. Fintech, BioTech, Logistics..."
                          className={`w-full px-3 py-2 bg-white border rounded-lg text-xs font-bold text-black focus:outline-none ${
                            errors.customIndustry ? 'border-rose-500' : 'border-amber-300 focus:border-blue-500'
                          }`}
                        />
                        {errors.customIndustry && (
                          <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.customIndustry}</p>
                        )}
                      </div>
                    )}

                    {formData.category === 'Other' && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl animate-fadeIn">
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
                          placeholder="e.g. Artificial Intelligence, Logistics, Automotive..."
                          className={`w-full px-3 py-2 bg-white border rounded-lg text-xs font-bold text-black focus:outline-none ${
                            errors.customCategory ? 'border-rose-500' : 'border-amber-300 focus:border-blue-500'
                          }`}
                        />
                        {errors.customCategory && (
                          <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.customCategory}</p>
                        )}
                      </div>
                    )}

                    {/* Featured Image Drag & Drop for Quick Mode */}
                    <div className="pt-1">
                      <DragDropImageUpload
                        label="Featured Cover Photo"
                        sublabel="Drag & drop your case study cover photo here, or browse files"
                        value={formData.featuredImage}
                        onChange={(url) => {
                          setFormData((prev) => ({ ...prev, featuredImage: url }));
                          handleFeaturedImageChange(url);
                        }}
                        onUpload={(file, onProgress) => uploadImageFile(file, 'featuredImage', onProgress)}
                        fallback="/case-study/property.png"
                        aspectRatio="aspect-[16/9]"
                        compact={true}
                        helperText="Visual cover displayed on case study listings and social shares (Max: 5 MB)"
                      />
                    </div>
                  </div>

                  {/* Single Quill Rich Text Editor */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#E5E7EB]">
                      <div>
                        <h4 className="text-xs font-bold text-black uppercase">Rich Text Content Editor</h4>
                        <p className="text-[11px] text-black font-medium">
                          Copy & paste complete case study documents from Word or Docs with formatting preserved.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleInsertTemplate}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-black border border-emerald-200 text-xs font-bold cursor-pointer transition-colors"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>Insert Case Study Template</span>
                        </button>
                      </div>
                    </div>

                    {uploadProgress !== null && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#2563EB] font-semibold flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading image: {uploadProgress}%</span>
                      </div>
                    )}

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
                        placeholder="Write or paste your complete case study here..."
                      />
                    </div>
                    {errors.content && (
                      <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.content}</p>
                    )}
                  </div>

                  {/* Optional Quick Create Details Accordion */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuickDetailsExpanded(!quickDetailsExpanded)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F8FAF9] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-black uppercase">
                        <Sliders className="w-4 h-4 text-[#2563EB]" />
                        <span>Additional Details (Optional)</span>
                      </div>
                      {quickDetailsExpanded ? <ChevronUp className="w-4 h-4 text-black font-medium" /> : <ChevronDown className="w-4 h-4 text-black font-medium" />}
                    </button>

                    {quickDetailsExpanded && (
                      <div className="p-6 pt-2 border-t border-[#E5E7EB] space-y-4 bg-[#F8FAF9]">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-black mb-1">Project Type</label>
                            <select
                              value={formData.projectType}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData({
                                  ...formData,
                                  projectType: val,
                                  customProjectType: val === 'Other' ? formData.customProjectType : '',
                                });
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                            >
                              {PROJECT_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            {formData.projectType === 'Other' && (
                              <input
                                type="text"
                                value={formData.customProjectType || ''}
                                onChange={(e) => setFormData({ ...formData, customProjectType: e.target.value })}
                                placeholder="Enter custom project type..."
                                className="w-full mt-1 px-3 py-1 bg-white border border-amber-300 rounded-lg text-xs"
                              />
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-black mb-1">Duration</label>
                            <input
                              type="text"
                              value={formData.projectDuration}
                              onChange={(e) => setFormData({ ...formData, projectDuration: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-black mb-1">Live URL</label>
                            <input
                              type="url"
                              value={formData.projectUrl}
                              onChange={(e) => setFormData({ ...formData, projectUrl: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-black mb-1">Short Description</label>
                          <textarea
                            rows={2}
                            value={formData.shortDescription}
                            onChange={(e) => handleShortDescriptionChange(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SEO & Social Management for Quick Create Mode */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB]">
                    <SeoFormSection
                      contentType="case-study"
                      seoData={formData.seo || {}}
                      onChange={handleSeoChange}
                      sourceTitle={formData.title}
                      sourceSummary={formData.shortDescription}
                      sourceFeaturedImage={formData.featuredImage}
                      currentId={editingId}
                      uploadImageHandler={(file) => uploadImageFile(file, 'featuredImage')}
                      errors={errors}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Action Footer */}
            <div className="p-4 sm:p-5 border-t border-[#E5E7EB] bg-white flex flex-col md:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-black font-medium hover:text-black hover:bg-[#F8FAF9] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {/* Incomplete / Complete Sections Indicator */}
              <div className="flex-1 flex justify-center w-full md:w-auto">
                {!isFormValid ? (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Incomplete sections:</span>
                    {SECTION_TABS.filter((t) => !sectionStatus[t.id]).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setVisitedTabs((prev) => ({ ...prev, [t.id]: true }));
                          setActiveTab(t.id);
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-rose-300 text-rose-700 text-[11px] font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                        title={`Navigate to ${t.label}`}
                      >
                        {t.shortLabel}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All 5 sections validated. Ready to {editingId ? 'update' : 'publish'}!</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                {/* Save Draft */}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('draft')}
                  className="px-4 py-2.5 rounded-xl border border-[#2563EB] text-black hover:bg-[#F8FAF9] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Save work in progress as draft (does not require all sections)"
                >
                  <Save className="w-3.5 h-3.5 text-[#2563EB]" />
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

                {/* Publish / Update Case Study Button */}
                <button
                  type="button"
                  disabled={!isFormValid || saving}
                  onClick={() => handleSave(editingId ? (formData.status || 'published') : 'published')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 ${
                    isFormValid && !saving
                      ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-75'
                  }`}
                  title={
                    !isFormValid
                      ? 'Publish / Update is disabled until all 5 sections are completed'
                      : editingId
                      ? 'Update Case Study'
                      : 'Publish Case Study'
                  }
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {saving
                      ? editingId
                        ? 'Updating...'
                        : 'Publishing...'
                      : editingId
                      ? 'Update Case Study'
                      : 'Publish Case Study'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          LIVE PREVIEW MODAL
         ───────────────────────────────────────────────────────────── */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#2563EB] text-white">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#2563EB]" />
                <span className="font-bold text-sm">Public Details Page Live Preview</span>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="text-white hover:text-[#2563EB]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
              {/* Preview Hero */}
              <div className="border-b border-[#E5E7EB] pb-6">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-black border border-emerald-200">
                  {formData.category} · {formData.industry}
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-black mt-3">
                  {formData.title || 'Case Study Title'}
                </h1>
                <p className="text-black font-medium text-sm sm:text-base mt-2 max-w-2xl">
                  {formData.shortDescription || 'Short overview and summary of this client case study.'}
                </p>
                {formData.clientName && (
                  <p className="text-xs text-[#2563EB] font-semibold mt-2">
                    Client: {formData.clientName}
                  </p>
                )}
              </div>

              {/* Preview Featured Image */}
              {formData.featuredImage && (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[#E5E7EB] bg-slate-100 shadow-xs">
                  <img
                    src={getImageUrl(formData.featuredImage, '/case-study/property.png')}
                    alt={formData.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/case-study/property.png';
                    }}
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#2563EB]/90 text-white text-xs font-bold backdrop-blur-xs">
                    {formData.clientName || 'Case Study Cover'}
                  </div>
                </div>
              )}

              {/* Main Content Render */}
              {formData.creationMode === 'quick' ? (
                <div
                  className="prose max-w-none text-black"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content || '<p>No content entered yet...</p>') }}
                />
              ) : (
                <div className="space-y-6 text-black">
                  {formData.challengesAndSolutions?.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-black">Challenges & Strategic Solutions</h3>
                      <div className="space-y-3">
                        {formData.challengesAndSolutions.map((cs, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAF9] space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[11px] font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-black uppercase">Pair #{idx + 1}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="border-l-2 border-[#2563EB] pl-3">
                                <div className="text-xs font-bold text-[#2563EB] uppercase mb-1">
                                  {cs.challengeTitle || `Challenge ${idx + 1}`}
                                </div>
                                <p className="text-xs text-black font-medium leading-relaxed whitespace-pre-line">
                                  {cs.challengeDescription || 'No challenge description provided'}
                                </p>
                              </div>
                              <div className="border-l-2 border-[#2563EB] pl-3">
                                <div className="text-xs font-bold text-black uppercase mb-1">
                                  {cs.solutionTitle || `Strategic Solution ${idx + 1}`}
                                </div>
                                <p className="text-xs text-black font-medium leading-relaxed whitespace-pre-line">
                                  {cs.solutionDescription || 'No solution description provided'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {formData.challenge && (
                        <div>
                          <h3 className="text-xl font-bold text-black mb-2">The Challenge</h3>
                          <p className="text-sm text-black font-medium leading-relaxed whitespace-pre-line">{formData.challenge}</p>
                        </div>
                      )}
                      {formData.solution && (
                        <div>
                          <h3 className="text-xl font-bold text-black mb-2">Our Solution</h3>
                          <p className="text-sm text-black font-medium leading-relaxed whitespace-pre-line">{formData.solution}</p>
                        </div>
                      )}
                    </>
                  )}
                  {formData.implementation && (
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">Implementation</h3>
                      <p className="text-sm text-black font-medium leading-relaxed whitespace-pre-line">{formData.implementation}</p>
                    </div>
                  )}
                  {formData.results && (
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">Results & Impact</h3>
                      <p className="text-sm text-black font-medium leading-relaxed whitespace-pre-line">{formData.results}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Metrics Preview */}
              {formData.metrics?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB]">
                  {formData.metrics.map((m, i) => (
                    <div key={i} className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAF9]">
                      <div className="text-2xl font-black text-black">{m.value}</div>
                      <div className="text-xs font-bold text-[#2563EB] uppercase mt-0.5">{m.label}</div>
                      <div className="text-xs text-black font-medium mt-1">{m.description}</div>
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
        isOpen={!!deleteTarget}
        title="Delete Case Study?"
        message="Are you sure you want to delete this case study? This action will remove it from the public listing."
        itemName={deleteTarget?.title}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

