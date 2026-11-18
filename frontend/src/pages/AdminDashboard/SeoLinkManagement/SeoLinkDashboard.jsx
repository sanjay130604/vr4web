import React, { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Plus,
  Download,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Award,
  Layers,
  ChevronLeft,
  ChevronRight,
  Target,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import seoLinkService from '../../../services/seoLinkService';
import AddEditLinkModal from './AddEditLinkModal';
import PageAuditModal from './PageAuditModal';
import PageTargetsModal from './PageTargetsModal';
import PageLinksDrawer from './PageLinksDrawer';

export default function SeoLinkDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'pages' | 'links' | 'broken'

  // Analytics & Stats State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Pages Table State
  const [pages, setPages] = useState([]);
  const [pageTotal, setPageTotal] = useState(0);
  const [pagePage, setPagePage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [pageSearch, setPageSearch] = useState('');
  const [pageTypeFilter, setPageTypeFilter] = useState('');
  const [pageHealthFilter, setPageHealthFilter] = useState('');
  const [loadingPages, setLoadingPages] = useState(false);

  // Links Table State
  const [links, setLinks] = useState([]);
  const [linkTotal, setLinkTotal] = useState(0);
  const [linkPage, setLinkPage] = useState(1);
  const [linkLimit, setLinkLimit] = useState(10);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkTypeFilter, setLinkTypeFilter] = useState('');
  const [linkPlacementFilter, setLinkPlacementFilter] = useState('');
  const [linkStatusFilter, setLinkStatusFilter] = useState('');
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Broken Links State
  const [brokenLinks, setBrokenLinks] = useState([]);
  const [loadingBroken, setLoadingBroken] = useState(false);

  // Global Actions State
  const [syncing, setSyncing] = useState(false);
  const [validatingBatch, setValidatingBatch] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Modals & Drawers State
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [initialPageIdForLink, setInitialPageIdForLink] = useState(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedAuditPage, setSelectedAuditPage] = useState(null);

  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [selectedTargetsPage, setSelectedTargetsPage] = useState(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState(null);

  // Fetch Analytics Overview
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoadingAnalytics(true);
      const res = await seoLinkService.getAnalytics();
      if (res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Error fetching SEO analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Fetch Pages List
  const fetchPages = useCallback(async () => {
    try {
      setLoadingPages(true);
      const res = await seoLinkService.getPages({
        page: pagePage,
        limit: pageLimit,
        search: pageSearch,
        type: pageTypeFilter,
        health: pageHealthFilter,
      });
      if (res.success && res.data) {
        setPages(res.data.pages || []);
        setPageTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoadingPages(false);
    }
  }, [pagePage, pageLimit, pageSearch, pageTypeFilter, pageHealthFilter]);

  // Fetch Links List
  const fetchLinks = useCallback(async () => {
    try {
      setLoadingLinks(true);
      const res = await seoLinkService.getLinks({
        page: linkPage,
        limit: linkLimit,
        search: linkSearch,
        linkType: linkTypeFilter,
        placement: linkPlacementFilter,
        status: linkStatusFilter,
      });
      if (res.success && res.data) {
        setLinks(res.data.links || []);
        setLinkTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching links:', err);
    } finally {
      setLoadingLinks(false);
    }
  }, [linkPage, linkLimit, linkSearch, linkTypeFilter, linkPlacementFilter, linkStatusFilter]);

  // Fetch Broken Links
  const fetchBrokenLinks = useCallback(async () => {
    try {
      setLoadingBroken(true);
      const res = await seoLinkService.getBrokenLinks();
      if (res.success && res.data) {
        setBrokenLinks(res.data.brokenLinks || []);
      }
    } catch (err) {
      console.error('Error fetching broken links:', err);
    } finally {
      setLoadingBroken(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (activeTab === 'pages') fetchPages();
  }, [activeTab, fetchPages]);

  useEffect(() => {
    if (activeTab === 'links') fetchLinks();
  }, [activeTab, fetchLinks]);

  useEffect(() => {
    if (activeTab === 'broken') fetchBrokenLinks();
  }, [activeTab, fetchBrokenLinks]);

  // Handler: Sync Website Pages from dynamic modules
  const handleSyncPages = async () => {
    try {
      setSyncing(true);
      const res = await seoLinkService.syncPages();
      setActionMessage({ type: 'success', text: res.message || 'Synced website pages successfully.' });
      await fetchAnalytics();
      await fetchPages();
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.response?.data?.message || 'Sync failed.' });
    } finally {
      setSyncing(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Handler: Batch Validate All Links
  const handleValidateAll = async () => {
    try {
      setValidatingBatch(true);
      const res = await seoLinkService.validateAllLinks();
      setActionMessage({
        type: 'success',
        text: `Validation completed: ${res.data?.validatedCount || 0} links verified. ${res.data?.brokenCount || 0} broken.`,
      });
      await fetchAnalytics();
      if (activeTab === 'pages') await fetchPages();
      if (activeTab === 'links') await fetchLinks();
      if (activeTab === 'broken') await fetchBrokenLinks();
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.response?.data?.message || 'Validation failed.' });
    } finally {
      setValidatingBatch(false);
      setTimeout(() => setActionMessage(null), 6000);
    }
  };

  // Handler: Export CSV
  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await seoLinkService.exportLinks('csv');
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `seo-links-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed: ' + (err.message || 'Error downloading file'));
    } finally {
      setExporting(false);
    }
  };

  // Handler: Delete Single Link
  const handleDeleteLink = async (id) => {
    if (!window.confirm('Are you sure you want to delete this SEO link?')) return;
    try {
      await seoLinkService.deleteLink(id);
      await fetchLinks();
      await fetchAnalytics();
      if (activeTab === 'broken') await fetchBrokenLinks();
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  // Handler: Validate Single Link in Links Table
  const handleValidateSingleInTable = async (id) => {
    try {
      await seoLinkService.validateLink(id);
      await fetchLinks();
      await fetchAnalytics();
    } catch (err) {
      alert(err?.response?.data?.message || 'Validation failed');
    }
  };

  // Score Badge Formatter
  const getScoreBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (score >= 75) return { label: 'Good', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (score >= 50) return { label: 'Needs Improvement', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Poor', bg: 'bg-red-50 text-red-700 border-red-200' };
  };

  // Validation Status Badge Formatter
  const getValidationBadge = (status, code) => {
    switch (status) {
      case 'working':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Working {code ? `(${code})` : ''}
          </span>
        );
      case 'broken':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Broken {code ? `(${code})` : ''}
          </span>
        );
      case 'redirected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw className="w-3 h-3 text-amber-600" />
            Redirect ({code || 301})
          </span>
        );
      case 'temporary_error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Clock className="w-3 h-3 text-orange-600" />
            Timeout / Temp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#0F3D2E] to-[#1E5D46] p-6 rounded-2xl text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/20 rounded-full text-white">
              SEO Engine 2.0
            </span>
            <span className="text-xs text-white/75">&bull; Full Internal & External Link Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            SEO Link Management System
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl">
            Monitor link architecture, ensure target compliance, detect broken URLs, eliminate duplicate anchors, and optimize 100-point algorithmic SEO scores across every VR4Web page.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncPages}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl transition border border-white/20 shadow-sm"
            title="Scan database and register all pages, case studies, blogs, and services"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Pages'}
          </button>

          <button
            onClick={handleValidateAll}
            disabled={validatingBatch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl transition shadow-sm"
            title="Check HTTP status and detect broken or redirected links"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${validatingBatch ? 'animate-spin' : ''}`} />
            {validatingBatch ? 'Checking...' : 'Validate All'}
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 disabled:opacity-50 rounded-xl transition shadow-sm"
            title="Export full link inventory as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={() => {
              setEditingLink(null);
              setInitialPageIdForLink(null);
              setIsAddEditOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-[#E8890C] hover:bg-[#d47b0a] rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Add New Link
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-[#0F3D2E] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Overview & Analytics
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pages'
              ? 'bg-[#0F3D2E] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Page-Wise Link Management ({analytics?.totalPages || 0})
        </button>

        <button
          onClick={() => setActiveTab('links')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'links'
              ? 'bg-[#0F3D2E] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          All Managed Links ({analytics?.totalLinks || 0})
        </button>

        <button
          onClick={() => setActiveTab('broken')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'broken'
              ? 'bg-[#0F3D2E] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Broken Links ({analytics?.brokenLinks || 0})
          {(analytics?.brokenLinks || 0) > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & ANALYTICS DASHBOARD
      ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 6 Analytics KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Card 1: Total Pages */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Website Pages</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0F3D2E] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  {analytics?.totalPages ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Discovered Pages</span>
              </div>
            </div>

            {/* Card 2: Total Internal Links */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Internal Links</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  {analytics?.internalLinks ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Site Architecture</span>
              </div>
            </div>

            {/* Card 3: Total External Links */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">External Links</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  {analytics?.externalLinks ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Authoritative Outbound</span>
              </div>
            </div>

            {/* Card 4: Broken Links */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Broken Links</span>
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className={`text-2xl font-black ${(analytics?.brokenLinks || 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {analytics?.brokenLinks ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Requires Immediate Fix</span>
              </div>
            </div>

            {/* Card 5: Duplicate Links */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Duplicate Links</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className={`text-2xl font-black ${(analytics?.duplicateLinks || 0) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {analytics?.duplicateLinks ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Duplicate URL on Page</span>
              </div>
            </div>

            {/* Card 6: Average SEO Link Score */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Avg SEO Score</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  {analytics?.avgScore ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Out of 100 benchmark</span>
              </div>
            </div>
          </div>

          {/* Visual Performance & Score Distribution Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Internal vs External Ratio */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Internal vs External Ratio</h3>
                  <p className="text-xs text-slate-500">Distribution of managed links on VR4Web</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                  Total: {(analytics?.internalLinks || 0) + (analytics?.externalLinks || 0)}
                </span>
              </div>

              {/* Progress visual */}
              {(() => {
                const total = (analytics?.internalLinks || 0) + (analytics?.externalLinks || 0);
                const intPct = total > 0 ? Math.round(((analytics?.internalLinks || 0) / total) * 100) : 50;
                const extPct = total > 0 ? 100 - intPct : 50;
                return (
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-blue-600 h-full transition-all duration-500"
                        style={{ width: `${intPct}%` }}
                        title={`Internal: ${intPct}%`}
                      />
                      <div
                        className="bg-purple-600 h-full transition-all duration-500"
                        style={{ width: `${extPct}%` }}
                        title={`External: ${extPct}%`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                        <span className="text-slate-600 font-medium">
                          Internal Links: <strong>{analytics?.internalLinks || 0}</strong> ({intPct}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
                        <span className="text-slate-600 font-medium">
                          External Links: <strong>{analytics?.externalLinks || 0}</strong> ({extPct}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                <span className="font-semibold text-slate-800">Best Practice Guidance:</span> A healthy site typically maintains a 70:30 or 80:20 ratio of internal cross-linking to authoritative external reference links.
              </div>
            </div>

            {/* Chart 2: SEO Score Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">SEO Score Distribution</h3>
                  <p className="text-xs text-slate-500">Page health across 100-point audit benchmarks</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Avg: {analytics?.avgScore || 0}/100
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Excellent (90-100)</span>
                  <span className="text-2xl font-black text-emerald-800 mt-1 block">
                    {analytics?.scoreDistribution?.excellent ?? 0}
                  </span>
                  <span className="text-[10px] text-emerald-600">pages</span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block">Good (75-89)</span>
                  <span className="text-2xl font-black text-blue-800 mt-1 block">
                    {analytics?.scoreDistribution?.good ?? 0}
                  </span>
                  <span className="text-[10px] text-blue-600">pages</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Needs Work (50-74)</span>
                  <span className="text-2xl font-black text-amber-800 mt-1 block">
                    {analytics?.scoreDistribution?.needsImprovement ?? 0}
                  </span>
                  <span className="text-[10px] text-amber-600">pages</span>
                </div>

                <div className="p-3 rounded-xl bg-red-50/60 border border-red-200/80 text-center">
                  <span className="text-[10px] font-bold text-red-700 uppercase block">Poor (0-49)</span>
                  <span className="text-2xl font-black text-red-800 mt-1 block">
                    {analytics?.scoreDistribution?.poor ?? 0}
                  </span>
                  <span className="text-[10px] text-red-600">pages</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200/60 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Internal Audit Metric:</strong> Scores are calculated against configured link targets, factor criteria, and broken link penalties.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Resolution: Top Broken Links & Recent Additions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Broken Links Quick Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold text-slate-900">Broken Links Report</h3>
                </div>
                <button
                  onClick={() => setActiveTab('broken')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  View All &rarr;
                </button>
              </div>

              {analytics?.brokenLinksList && analytics.brokenLinksList.length > 0 ? (
                <div className="space-y-2">
                  {analytics.brokenLinksList.slice(0, 5).map((b) => (
                    <div
                      key={b._id}
                      className="p-3 bg-red-50/50 border border-red-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 truncate">"{b.anchorText}"</span>
                          <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[10px] font-bold rounded">
                            {b.httpStatusCode || 404}
                          </span>
                        </div>
                        <p className="text-red-700 font-mono text-[11px] truncate mt-0.5">
                          {b.destinationUrl}
                        </p>
                        <p className="text-slate-400 text-[10px] mt-0.5">
                          Page: {b.sourcePageId?.pageName || 'Unknown'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingLink(b);
                          setIsAddEditOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 shrink-0"
                      >
                        Fix
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-bold">Zero Broken Links Detected</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">All verified links are currently reachable.</p>
                </div>
              )}
            </div>

            {/* Quick Action: Recommended Page Targets Reference */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#0F3D2E]" />
                  <h3 className="text-sm font-bold text-slate-900">Recommended Target Guidelines</h3>
                </div>
                <button
                  onClick={() => setActiveTab('pages')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Configure Pages &rarr;
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block">Home Page</span>
                  <span className="text-[11px] text-slate-500">Internal: 8–12 &bull; External: 2–3</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block">About Us</span>
                  <span className="text-[11px] text-slate-500">Internal: 4–6 &bull; External: 2–3</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block">Services Listing</span>
                  <span className="text-[11px] text-slate-500">Internal: 6–10 &bull; External: 3–5</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block">Case Studies</span>
                  <span className="text-[11px] text-slate-500">Internal: 4–6 &bull; External: 2–4</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block">Blog Articles</span>
                  <span className="text-[11px] text-slate-500">Internal: 4–8 &bull; External: 2–4</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block">Contact & Leads</span>
                  <span className="text-[11px] text-slate-500">Internal: 3–5 &bull; External: 1–2</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Note: Targets represent healthy guidelines, not mandatory limits. Pages with fewer relevant links remain valid without forcing artificial cross-links.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PAGE-WISE LINK MANAGEMENT
      ========================================================================= */}
      {activeTab === 'pages' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Controls: Search, Filters, Page Limit */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search page name or URL slug..."
                  value={pageSearch}
                  onChange={(e) => {
                    setPageSearch(e.target.value);
                    setPagePage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:bg-white"
                />
              </div>

              <select
                value={pageTypeFilter}
                onChange={(e) => {
                  setPageTypeFilter(e.target.value);
                  setPagePage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="system">Core System Pages</option>
                <option value="service">Services</option>
                <option value="case-study">Case Studies</option>
                <option value="blog">Blogs</option>
                <option value="news">News</option>
                <option value="custom">Custom</option>
              </select>

              <select
                value={pageHealthFilter}
                onChange={(e) => {
                  setPageHealthFilter(e.target.value);
                  setPagePage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="">All Health</option>
                <option value="healthy">Healthy</option>
                <option value="needs_attention">Needs Attention</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rows per page:</span>
              <select
                value={pageLimit}
                onChange={(e) => {
                  setPageLimit(Number(e.target.value));
                  setPagePage(1);
                }}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                  <th className="py-3 px-3">Page Name</th>
                  <th className="py-3 px-3">Page URL</th>
                  <th className="py-3 px-3 text-center">Internal (Actual / Target)</th>
                  <th className="py-3 px-3 text-center">External (Actual / Target)</th>
                  <th className="py-3 px-3 text-center">SEO Score</th>
                  <th className="py-3 px-3 text-center">Health</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingPages ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F3D2E]" />
                      Loading pages...
                    </td>
                  </tr>
                ) : pages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No website pages found. Try clicking "Sync Pages" above.
                    </td>
                  </tr>
                ) : (
                  pages.map((p) => {
                    const badge = getScoreBadge(p.seoScore || 0);
                    return (
                      <tr key={p._id} className="hover:bg-slate-50/60 transition">
                        {/* Page Name */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {p.pageName}
                            {p.publishedStatus === 'draft' && (
                              <span className="px-1.5 py-0.2 text-[9px] bg-slate-100 text-slate-500 rounded font-semibold">
                                Draft
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                            Type: {p.pageType}
                          </span>
                        </td>

                        {/* Page URL */}
                        <td className="py-3 px-3">
                          <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {p.pageUrl}
                          </span>
                        </td>

                        {/* Internal Count */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-bold ${
                              (p.internalLinkCount || 0) < (p.internalLinkTarget || 0)
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {p.internalLinkCount || 0}
                          </span>
                          <span className="text-slate-400 font-normal"> / {p.internalLinkTarget || 0}</span>
                        </td>

                        {/* External Count */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-bold ${
                              (p.externalLinkCount || 0) < (p.externalLinkTarget || 0)
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {p.externalLinkCount || 0}
                          </span>
                          <span className="text-slate-400 font-normal"> / {p.externalLinkTarget || 0}</span>
                        </td>

                        {/* SEO Score */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedAuditPage(p);
                              setIsAuditModalOpen(true);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold transition hover:scale-105 ${badge.bg}`}
                            title="Click to view full 100-point breakdown"
                          >
                            <Award className="w-3 h-3" />
                            {p.seoScore ?? 0}/100
                          </button>
                        </td>

                        {/* Health */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              p.linkHealth === 'healthy'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.linkHealth === 'needs_attention'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {p.linkHealth?.replace('_', ' ') || 'healthy'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Links Drawer */}
                            <button
                              onClick={() => {
                                setDrawerPage(p);
                                setIsDrawerOpen(true);
                              }}
                              title="Manage Links for this page"
                              className="p-1.5 text-slate-500 hover:text-[#0F3D2E] hover:bg-slate-100 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Add Link */}
                            <button
                              onClick={() => {
                                setEditingLink(null);
                                setInitialPageIdForLink(p._id);
                                setIsAddEditOpen(true);
                              }}
                              title="Add link to this page"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Plus className="w-4 h-4" />
                            </button>

                            {/* Targets Modal */}
                            <button
                              onClick={() => {
                                setSelectedTargetsPage(p);
                                setIsTargetsModalOpen(true);
                              }}
                              title="Configure Targets"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Target className="w-4 h-4" />
                            </button>

                            {/* Run Audit */}
                            <button
                              onClick={() => {
                                setSelectedAuditPage(p);
                                setIsAuditModalOpen(true);
                              }}
                              title="View / Run Audit"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>
              Showing {pages.length > 0 ? (pagePage - 1) * pageLimit + 1 : 0} to{' '}
              {Math.min(pagePage * pageLimit, pageTotal)} of {pageTotal} pages
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagePage <= 1}
                onClick={() => setPagePage((p) => p - 1)}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-700">
                Page {pagePage} of {Math.ceil(pageTotal / pageLimit) || 1}
              </span>
              <button
                disabled={pagePage >= Math.ceil(pageTotal / pageLimit)}
                onClick={() => setPagePage((p) => p + 1)}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ALL MANAGED LINKS TABLE
      ========================================================================= */}
      {activeTab === 'links' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Controls: Search, Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-1 max-w-xl flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search anchor text or destination URL..."
                  value={linkSearch}
                  onChange={(e) => {
                    setLinkSearch(e.target.value);
                    setLinkPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20"
                />
              </div>

              <select
                value={linkTypeFilter}
                onChange={(e) => {
                  setLinkTypeFilter(e.target.value);
                  setLinkPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="internal">Internal Links</option>
                <option value="external">External Links</option>
              </select>

              <select
                value={linkPlacementFilter}
                onChange={(e) => {
                  setLinkPlacementFilter(e.target.value);
                  setLinkPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="">All Placements</option>
                <option value="content_body">Content Body</option>
                <option value="related_links">Related Links</option>
                <option value="content_top">Content Top</option>
                <option value="content_bottom">Content Bottom</option>
                <option value="sidebar">Sidebar</option>
                <option value="header">Header</option>
                <option value="footer">Footer</option>
              </select>

              <select
                value={linkStatusFilter}
                onChange={(e) => {
                  setLinkStatusFilter(e.target.value);
                  setLinkPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Rows:</span>
              <select
                value={linkLimit}
                onChange={(e) => {
                  setLinkLimit(Number(e.target.value));
                  setLinkPage(1);
                }}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Links Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold">
                  <th className="py-3 px-3">Anchor Text</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Source Page</th>
                  <th className="py-3 px-3">Destination URL</th>
                  <th className="py-3 px-3">Placement</th>
                  <th className="py-3 px-3">Rel / Target</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Validation</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingLinks ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F3D2E]" />
                      Loading links...
                    </td>
                  </tr>
                ) : links.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No links matching current criteria.
                    </td>
                  </tr>
                ) : (
                  links.map((link) => (
                    <tr key={link._id} className="hover:bg-slate-50/60 transition">
                      {/* Anchor Text */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block break-words max-w-xs">
                          "{link.anchorText}"
                        </span>
                        {link.isDuplicate && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-bold mt-0.5">
                            Duplicate Anchor/URL
                          </span>
                        )}
                      </td>

                      {/* Link Type */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            link.linkType === 'internal'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {link.linkType === 'internal' ? (
                            <Link2 className="w-3 h-3" />
                          ) : (
                            <ExternalLink className="w-3 h-3" />
                          )}
                          {link.linkType}
                        </span>
                      </td>

                      {/* Source Page */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 block truncate max-w-[140px]">
                          {link.sourcePageId?.pageName || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate block">
                          {link.sourcePageId?.pageUrl || ''}
                        </span>
                      </td>

                      {/* Destination URL */}
                      <td className="py-3 px-3">
                        <a
                          href={link.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-600 hover:text-blue-800 hover:underline block truncate max-w-[200px]"
                        >
                          {link.destinationUrl}
                        </a>
                      </td>

                      {/* Placement */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium capitalize">
                          {link.placement?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Rel / Target */}
                      <td className="py-3 px-3 text-[11px] text-slate-500 font-mono">
                        <div>rel="{link.relAttribute}"</div>
                        <div>target="{link.targetAttribute}"</div>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            link.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {link.status}
                        </span>
                      </td>

                      {/* Validation Status */}
                      <td className="py-3 px-3 text-center">
                        {getValidationBadge(link.validationStatus, link.httpStatusCode)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleValidateSingleInTable(link._id)}
                            title="Validate Live"
                            className="p-1.5 text-slate-500 hover:text-[#0F3D2E] hover:bg-slate-100 rounded-lg transition"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingLink(link);
                              setIsAddEditOpen(true);
                            }}
                            title="Edit Link"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link._id)}
                            title="Delete Link"
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>
              Showing {links.length > 0 ? (linkPage - 1) * linkLimit + 1 : 0} to{' '}
              {Math.min(linkPage * linkLimit, linkTotal)} of {linkTotal} links
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={linkPage <= 1}
                onClick={() => setLinkPage((p) => p - 1)}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-700">
                Page {linkPage} of {Math.ceil(linkTotal / linkLimit) || 1}
              </span>
              <button
                disabled={linkPage >= Math.ceil(linkTotal / linkLimit)}
                onClick={() => setLinkPage((p) => p + 1)}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BROKEN LINKS DEDICATED REPORT
      ========================================================================= */}
      {activeTab === 'broken' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Confirmed Broken Links Report
              </h3>
              <p className="text-xs text-slate-500">
                Links that returned 404, 500, or invalid host responses during automated validation.
              </p>
            </div>
            <button
              onClick={handleValidateAll}
              disabled={validatingBatch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0F3D2E] hover:bg-[#165641] disabled:opacity-50 rounded-xl transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${validatingBatch ? 'animate-spin' : ''}`} />
              Re-Check All Links
            </button>
          </div>

          {loadingBroken ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F3D2E]" />
              Scanning broken links...
            </div>
          ) : brokenLinks.length === 0 ? (
            <div className="py-16 text-center text-emerald-700 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold">No Broken Links Detected!</p>
              <p className="text-xs text-emerald-600 mt-1">
                All internal and external URLs are responding with healthy 200 HTTP codes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                    <th className="py-3 px-3">Anchor Text</th>
                    <th className="py-3 px-3">Broken Destination URL</th>
                    <th className="py-3 px-3">Source Page</th>
                    <th className="py-3 px-3">Error / Status Code</th>
                    <th className="py-3 px-3">Last Checked</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brokenLinks.map((b) => (
                    <tr key={b._id} className="hover:bg-red-50/30 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        "{b.anchorText}"
                      </td>
                      <td className="py-3 px-3 font-mono text-red-600 break-all">
                        {b.destinationUrl}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 block">
                          {b.sourcePageId?.pageName || 'Unknown Page'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {b.sourcePageId?.pageUrl}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          {b.httpStatusCode ? `HTTP ${b.httpStatusCode}` : b.validationError || 'Unreachable'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {b.lastCheckedAt ? new Date(b.lastCheckedAt).toLocaleString() : 'Recently'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingLink(b);
                              setIsAddEditOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                          >
                            Fix URL
                          </button>
                          <button
                            onClick={() => handleDeleteLink(b._id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS & DRAWERS
      ========================================================================= */}
      {/* 1. Add / Edit Link Modal */}
      <AddEditLinkModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        editingLink={editingLink}
        initialPageId={initialPageIdForLink}
        pages={pages}
        onSaved={async () => {
          await fetchAnalytics();
          if (activeTab === 'pages') await fetchPages();
          if (activeTab === 'links') await fetchLinks();
          if (activeTab === 'broken') await fetchBrokenLinks();
        }}
      />

      {/* 2. Page 100-Point SEO Audit Modal */}
      <PageAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        page={selectedAuditPage}
        onAuditUpdated={async () => {
          await fetchAnalytics();
          await fetchPages();
        }}
      />

      {/* 3. Page Targets Configuration Modal */}
      <PageTargetsModal
        isOpen={isTargetsModalOpen}
        onClose={() => setIsTargetsModalOpen(false)}
        page={selectedTargetsPage}
        onTargetsSaved={async () => {
          await fetchAnalytics();
          await fetchPages();
        }}
      />

      {/* 4. Page Links Side Drawer */}
      <PageLinksDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        page={drawerPage}
        onAddLink={(pageId) => {
          setEditingLink(null);
          setInitialPageIdForLink(pageId);
          setIsAddEditOpen(true);
        }}
        onEditLink={(link) => {
          setEditingLink(link);
          setIsAddEditOpen(true);
        }}
        onLinksChanged={async () => {
          await fetchAnalytics();
          await fetchPages();
          if (activeTab === 'links') await fetchLinks();
        }}
      />
    </div>
  );
}

