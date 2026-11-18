import React, { useState, useEffect } from 'react';
import ServerPagination from '../../components/common/ServerPagination';
import {
  Mail,
  Phone,
  Search,
  Filter,
  Eye,
  Trash2,
  PhoneCall,
  Send,
  X,
  CheckCircle,
  Calendar,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  MessageSquare,
  Bell,
  RotateCcw,
} from 'lucide-react';
import contactLeadService from '../../services/contactLeadService';
import LoadingSpinner from '../../shared/components/admin/LoadingSpinner';
import EmptyState from '../../shared/components/admin/EmptyState';

const STATUS_CONFIG = {
  New: {
    label: 'New',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200/80',
    dot: 'bg-amber-500',
  },
  Contacted: {
    label: 'Contacted',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200/80',
    dot: 'bg-blue-500',
  },
  Visited: {
    label: 'Visited',
    bg: 'bg-slate-100',
    text: 'text-black font-bold',
    border: 'border-slate-300',
    dot: 'bg-black',
  },
  'Not Visited': {
    label: 'Not Visited',
    bg: 'bg-slate-100',
    text: 'text-black font-bold',
    border: 'border-slate-300',
    dot: 'bg-black',
  },
  Closed: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

export default function ContactLeads() {
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    visited: 0,
    notVisited: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // Default page size: 5 records
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Modals state
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Reply Form state
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  // Status updating state
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Fetch Contact Leads
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: dateFilter || undefined,
        endDate: dateFilter || undefined,
      };

      const res = await contactLeadService.getLeads(params);
      if (res && res.success) {
        setLeads(res.data || []);
        setTotalLeads(res.total || 0);
        setTotalPages(res.totalPages || Math.ceil((res.total || 0) / pageSize) || 1);
        if (res.counts) {
          setCounts(res.counts);
        }
      }
    } catch (err) {
      console.error('Failed to load contact leads:', err);
      showNotification('Failed to load contact leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, pageSize, statusFilter, dateFilter]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLeads();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateFilter('');
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== '' || statusFilter !== 'all' || dateFilter !== '';

  // Open View Modal (Auto-transitions 'Not Visited' or 'New' -> 'Visited')
  const handleView = async (lead) => {
    let currentLead = lead;
    if (lead.status === 'Not Visited' || lead.status === 'New') {
      currentLead = { ...lead, status: 'Visited' };
      setLeads((prev) =>
        prev.map((item) => (item._id === lead._id ? { ...item, status: 'Visited' } : item))
      );
      contactLeadService
        .updateStatus(lead._id, 'Visited')
        .then(() => fetchLeads())
        .catch((err) => console.error('Failed to auto-update status to Visited:', err));
    }
    setSelectedLead(currentLead);
    setViewModalOpen(true);
  };

  // Call User (Auto-transitions -> 'Contacted')
  const handleCall = async (lead) => {
    if (!lead) return;
    if (lead.status !== 'Contacted' && lead.status !== 'Closed') {
      setLeads((prev) =>
        prev.map((item) => (item._id === lead._id ? { ...item, status: 'Contacted' } : item))
      );
      if (selectedLead && selectedLead._id === lead._id) {
        setSelectedLead((prev) => ({ ...prev, status: 'Contacted' }));
      }
      contactLeadService
        .updateStatus(lead._id, 'Contacted')
        .then(() => {
          showNotification(`Lead "${lead.name}" marked as Contacted`);
          fetchLeads();
        })
        .catch((err) => console.error('Failed to auto-update status to Contacted on call:', err));
    }
  };

  // Open Reply Modal
  const handleOpenReply = (lead) => {
    setSelectedLead(lead);
    setReplySubject(lead.subject ? `Re: ${lead.subject}` : 'Re: Website Contact Inquiry - VR4Web');
    setReplyMessage('');
    setReplyModalOpen(true);
  };

  // Submit Reply (Auto-transitions -> 'Contacted')
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replySubject.trim() || !replyMessage.trim()) {
      showNotification('Please fill in both subject and reply message', 'error');
      return;
    }

    try {
      setReplying(true);
      const res = await contactLeadService.sendReply(selectedLead._id, {
        subject: replySubject.trim(),
        message: replyMessage.trim(),
      });

      if (res && res.success) {
        showNotification(`Reply sent successfully to ${selectedLead.email}! (Marked as Contacted)`);
        setReplyModalOpen(false);
        if (selectedLead && viewModalOpen) {
          setSelectedLead({ ...res.data, status: 'Contacted' });
        }
        setLeads((prev) =>
          prev.map((item) =>
            item._id === selectedLead._id ? { ...item, status: 'Contacted' } : item
          )
        );
        fetchLeads();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to send reply', 'error');
    } finally {
      setReplying(false);
    }
  };

  // Update Status
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      setUpdatingStatusId(leadId);
      const res = await contactLeadService.updateStatus(leadId, newStatus);
      if (res && res.success) {
        showNotification(`Status updated to "${newStatus}"`);
        setLeads((prev) =>
          prev.map((item) => (item._id === leadId ? { ...item, status: newStatus } : item))
        );
        if (selectedLead && selectedLead._id === leadId) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
        fetchLeads();
      }
    } catch (err) {
      showNotification('Failed to update lead status', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Delete Lead
  const handleDelete = async () => {
    if (!selectedLead) return;
    try {
      const res = await contactLeadService.deleteLead(selectedLead._id);
      if (res && res.success) {
        showNotification('Contact lead deleted successfully');
        setDeleteModalOpen(false);
        if (viewModalOpen) setViewModalOpen(false);
        fetchLeads();
      }
    } catch (err) {
      showNotification('Failed to delete contact lead', 'error');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full min-w-0 pb-12 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all border ${
            notification.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. CONTACT LEADS PAGE HEADER (Matching Dashboard Overview) */}
      {/* ========================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] min-w-0">
        <div className="min-w-0 flex-1">
          {/* Breadcrumb Navigation: VR4Web / Admin / Contact Leads */}
          <div className="flex items-center gap-1.5 text-xs text-black font-bold mb-1.5 flex-wrap">
            <span className="text-black font-bold">VR4Web</span>
            <span className="text-black/50 font-bold">/</span>
            <span className="text-blue-600 font-bold">Admin</span>
            <span className="text-black/50 font-bold">/</span>
            <span className="text-black font-black">Contact Leads</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 tracking-tight">
            Contact Leads
          </h1>
          <p className="text-xs sm:text-sm text-black font-semibold mt-0.5 max-w-2xl">
            Monitor, review, and reply directly to incoming website contact inquiries.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-black hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            title="Refresh latest contact leads"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SUMMARY CARDS (Matching Dashboard Overview Style)       */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {/* Card 1: Total Leads */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-blue-500 hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.22),0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:-translate-y-2.5 hover:scale-[1.04] transition-all duration-300 ease-out flex flex-col justify-between group cursor-pointer relative hover:z-30 ${
            statusFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-125 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-lg group-hover:shadow-blue-500/35 group-hover:-translate-y-0.5">
              <Mail className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
            </div>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-bold font-sans shadow-2xs">
              Total
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-blue-900 transition-colors">
              Total Leads
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight group-hover:text-blue-950 transition-colors">
              {counts.total}
            </div>
            <p className="text-[11px] text-black font-medium mt-1 truncate">
              All website contact submissions
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-blue-100 flex items-center justify-between text-xs transition-colors">
            <span className="text-black group-hover:text-blue-600 font-bold flex items-center justify-between w-full transition-colors">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5 text-black group-hover:text-blue-600 group-hover:translate-x-1.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div
          onClick={() => {
            setStatusFilter('New');
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-amber-500 hover:shadow-[0_25px_50px_-12px_rgba(245,158,11,0.22),0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:-translate-y-2.5 hover:scale-[1.04] transition-all duration-300 ease-out flex flex-col justify-between group cursor-pointer relative hover:z-30 ${
            statusFilter === 'New' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-125 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 group-hover:shadow-lg group-hover:shadow-amber-500/35 group-hover:-translate-y-0.5">
              <Bell className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
            </div>
            <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-bold font-sans shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              New
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-amber-900 transition-colors">
              New Leads
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight group-hover:text-amber-950 transition-colors">
              {counts.new}
            </div>
            <p className="text-[11px] text-black font-medium mt-1 truncate">
              Pending initial review
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-amber-100 flex items-center justify-between text-xs transition-colors">
            <span className="text-black group-hover:text-amber-600 font-bold flex items-center justify-between w-full transition-colors">
              <span>Filter New</span>
              <ChevronRight className="w-3.5 h-3.5 text-black group-hover:text-amber-600 group-hover:translate-x-1.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 3: Contacted Leads */}
        <div
          onClick={() => {
            setStatusFilter('Contacted');
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-blue-500 hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.22),0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:-translate-y-2.5 hover:scale-[1.04] transition-all duration-300 ease-out flex flex-col justify-between group cursor-pointer relative hover:z-30 ${
            statusFilter === 'Contacted' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-125 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:shadow-lg group-hover:shadow-blue-500/35 group-hover:-translate-y-0.5">
              <Send className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
            </div>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/80 text-blue-800 text-[11px] font-bold font-sans shadow-2xs">
              Contacted
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-blue-900 transition-colors">
              Contacted Leads
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight group-hover:text-blue-950 transition-colors">
              {counts.contacted}
            </div>
            <p className="text-[11px] text-black font-medium mt-1 truncate">
              Replies or calls initiated
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-blue-100 flex items-center justify-between text-xs transition-colors">
            <span className="text-black group-hover:text-blue-600 font-bold flex items-center justify-between w-full transition-colors">
              <span>Filter Contacted</span>
              <ChevronRight className="w-3.5 h-3.5 text-black group-hover:text-blue-600 group-hover:translate-x-1.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 4: Visited Leads (High contrast Black/Slate, NO PURPLE) */}
        <div
          onClick={() => {
            setStatusFilter('Visited');
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-black hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.22),0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:-translate-y-2.5 hover:scale-[1.04] transition-all duration-300 ease-out flex flex-col justify-between group cursor-pointer relative hover:z-30 ${
            statusFilter === 'Visited' ? 'border-black ring-2 ring-black/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-125 group-hover:bg-black group-hover:text-white group-hover:border-black group-hover:shadow-lg group-hover:shadow-black/25 group-hover:-translate-y-0.5">
              <Eye className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
            </div>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-black text-[11px] font-black font-sans shadow-2xs">
              Visited
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-black transition-colors">
              Visited Leads
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight group-hover:text-black transition-colors">
              {counts.visited}
            </div>
            <p className="text-[11px] text-black font-medium mt-1 truncate">
              Inspected by administrator
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-slate-300 flex items-center justify-between text-xs transition-colors">
            <span className="text-black group-hover:text-black font-black flex items-center justify-between w-full transition-colors">
              <span>Filter Visited</span>
              <ChevronRight className="w-3.5 h-3.5 text-black group-hover:text-black group-hover:translate-x-1.5 transition-transform" />
            </span>
          </div>
        </div>

        {/* Card 5: Closed / Completed Leads */}
        <div
          onClick={() => {
            setStatusFilter('Closed');
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-emerald-500 hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.22),0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:-translate-y-2.5 hover:scale-[1.04] transition-all duration-300 ease-out flex flex-col justify-between group cursor-pointer relative hover:z-30 ${
            statusFilter === 'Closed' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-125 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 group-hover:shadow-lg group-hover:shadow-emerald-500/35 group-hover:-translate-y-0.5">
              <CheckCircle className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold font-sans shadow-2xs">
              Completed
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs font-bold text-black block group-hover:text-emerald-900 transition-colors">
              Completed Leads
            </span>
            <div className="text-2xl sm:text-3xl font-black text-black mt-1 tracking-tight group-hover:text-emerald-950 transition-colors">
              {counts.closed}
            </div>
            <p className="text-[11px] text-black font-medium mt-1 truncate">
              Resolved or archived
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-emerald-100 flex items-center justify-between text-xs transition-colors">
            <span className="text-black group-hover:text-emerald-600 font-bold flex items-center justify-between w-full transition-colors">
              <span>Filter Completed</span>
              <ChevronRight className="w-3.5 h-3.5 text-black group-hover:text-emerald-600 group-hover:translate-x-1.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SEARCH & FILTERS SECTION (Clean Horizontal Layout)      */}
      {/* ========================================================= */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="text"
              placeholder="Search by name, email, phone number, subject, or message..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-black placeholder:text-black/60 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-bold"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-blue-600 text-xs cursor-pointer p-0.5 font-bold"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-black">
              <Filter className="w-3.5 h-3.5 text-black shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-black text-black focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses ({counts.total})</option>
                <option value="New">● New ({counts.new})</option>
                <option value="Contacted">● Contacted ({counts.contacted})</option>
                <option value="Visited">● Visited ({counts.visited})</option>
                <option value="Not Visited">● Not Visited ({counts.notVisited || 0})</option>
                <option value="Closed">● Completed ({counts.closed})</option>
              </select>
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-black">
              <Calendar className="w-3.5 h-3.5 text-black shrink-0" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-black text-black focus:outline-none cursor-pointer"
                title="Filter by submission date"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-black hover:text-blue-600 text-xs cursor-pointer ml-1 font-bold"
                  title="Clear date"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Clear / Reset Filters Button */}
            <button
              onClick={handleResetFilters}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap ${
                hasActiveFilters
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300'
                  : 'bg-slate-50 border-slate-200/80 text-black hover:bg-slate-100 hover:text-blue-600'
              }`}
              title="Clear and reset all filters to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. REDESIGNED LEADS TABLE & MOBILE CARD LIST               */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-blue-600 text-base">All Contact Leads</h3>
              <p className="text-xs text-black font-medium">
                Client messages submitted through website contact channels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-100 text-black text-xs font-black border border-slate-300 font-mono">
              {totalLeads} {totalLeads === 1 ? 'Lead' : 'Leads'} Found
            </span>
          </div>
        </div>

        {/* Content Loading & Empty States */}
        {loading ? (
          <div className="py-16">
            <LoadingSpinner text="Loading contact leads..." />
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Contact Leads Found"
              description={
                hasActiveFilters
                  ? 'No contact submissions match your current search and filter settings. Try resetting filters.'
                  : 'New contact form messages submitted on the website will automatically appear here.'
              }
              icon={Mail}
              actionText={hasActiveFilters ? 'Clear All Filters' : undefined}
              onAction={hasActiveFilters ? handleResetFilters : undefined}
            />
          </div>
        ) : (
          <>
            {/* ---------------------------------------------------- */}
            {/* A. MOBILE VIEW: Compact Cards (No Horizontal Scroll)  */}
            {/* ---------------------------------------------------- */}
            <div className="md:hidden divide-y divide-slate-100">
              {leads.map((lead, idx) => {
                const statusStyle = STATUS_CONFIG[lead.status] || STATUS_CONFIG.New;
                const dateObj = new Date(lead.createdAt);
                const serialNumber = (page - 1) * pageSize + idx + 1;

                return (
                  <div key={lead._id} className="p-4 space-y-3 hover:bg-slate-50/70 transition-colors">
                    {/* Top Row: Serial #, Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-black font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {serialNumber}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-black text-sm truncate">{lead.name}</h4>
                          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] mt-1 border border-blue-200/80">
                            {lead.subject || 'Website Contact Form'}
                          </span>
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <select
                        value={lead.status}
                        disabled={updatingStatusId === lead._id}
                        onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                        className={`text-xs font-black px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none shrink-0 shadow-2xs ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        <option value="New">● New</option>
                        <option value="Contacted">● Contacted</option>
                        <option value="Visited">● Visited</option>
                        <option value="Not Visited">● Not Visited</option>
                        <option value="Closed">● Completed</option>
                      </select>
                    </div>

                    {/* Contact Details: Email & Phone */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-black font-medium pt-0.5">
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1 hover:text-blue-600 truncate max-w-[200px]"
                        title={lead.email}
                      >
                        <Mail className="w-3.5 h-3.5 text-black shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </a>
                      <a
                        href={`tel:${lead.phoneCode || ''}${lead.phone}`}
                        onClick={() => handleCall(lead)}
                        className="inline-flex items-center gap-1 font-mono font-bold hover:text-blue-600 text-black"
                        title="Click to Call"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{lead.phoneCode ? `${lead.phoneCode} ` : ''}{lead.phone}</span>
                      </a>
                    </div>

                    {/* Message Preview */}
                    {lead.message && (
                      <p className="text-xs text-black font-medium line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-sans">
                        {lead.message}
                      </p>
                    )}

                    {/* Date/Time & Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                      <span className="text-[11px] text-black font-mono font-bold">
                        {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleView(lead)}
                          className="w-8 h-8 rounded-xl border border-slate-200/80 bg-white hover:bg-blue-50 text-black hover:text-blue-600 flex items-center justify-center shadow-2xs font-bold"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenReply(lead)}
                          className="w-8 h-8 rounded-xl border border-slate-200/80 bg-white hover:bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs font-bold"
                          title="Send Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`tel:${lead.phoneCode || ''}${lead.phone}`}
                          onClick={() => handleCall(lead)}
                          className="w-8 h-8 rounded-xl border border-slate-200/80 bg-white hover:bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs"
                          title="Call"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setDeleteModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-xl border border-slate-200/80 bg-white hover:bg-rose-50 text-black hover:text-rose-600 flex items-center justify-center shadow-2xs"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                    <th className="py-2.5 px-4 min-w-[240px]">Contact Information</th>
                    <th className="py-2.5 px-4 min-w-[240px]">Inquiry Subject & Message</th>
                    <th className="py-2.5 px-4 w-36">Status</th>
                    <th className="py-2.5 px-4 w-36">Submitted On</th>
                    <th className="py-2.5 px-4 w-36 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {leads.map((lead, idx) => {
                    const statusStyle = STATUS_CONFIG[lead.status] || STATUS_CONFIG.New;
                    const dateObj = new Date(lead.createdAt);
                    const serialNumber = (page - 1) * pageSize + idx + 1;

                    return (
                      <tr
                        key={lead._id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-default"
                      >
                        {/* S.No */}
                        <td className="py-2 px-3.5 text-center font-mono font-black text-black align-top pt-3">
                          {serialNumber}
                        </td>

                        {/* 1. Contact Information Column (Name, Email, Phone combined) */}
                        <td className="py-2 px-4 align-top">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs uppercase shadow-2xs">
                              {lead.name ? lead.name.charAt(0) : 'U'}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="font-extrabold text-black text-sm truncate flex items-center gap-1.5">
                                <span>{lead.name}</span>
                                {lead.emailHistory?.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-bold border border-blue-100">
                                    <Send className="w-2.5 h-2.5" />
                                    <span>{lead.emailHistory.length}</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black font-medium pt-0.5">
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="inline-flex items-center gap-1 text-black font-semibold hover:text-blue-600 hover:underline transition-colors truncate max-w-[200px]"
                                  title={lead.email}
                                >
                                  <Mail className="w-3 h-3 text-black shrink-0" />
                                  <span className="truncate">{lead.email}</span>
                                </a>
                                <a
                                  href={`tel:${lead.phoneCode || ''}${lead.phone}`}
                                  onClick={() => handleCall(lead)}
                                  className="inline-flex items-center gap-1 text-black font-bold hover:text-blue-600 font-mono hover:underline transition-colors shrink-0"
                                  title="Click to Call (marks as Contacted)"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>
                                    {lead.phoneCode ? `${lead.phoneCode} ` : ''}
                                    {lead.phone}
                                  </span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Inquiry Details Column (Subject badge, Message preview) */}
                        <td className="py-2 px-4 align-top">
                          <div className="space-y-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 font-bold text-xs">
                              {lead.subject || 'Website Contact Form'}
                            </span>
                            {lead.message && (
                              <p className="text-xs text-black font-medium line-clamp-1 max-w-md font-sans">
                                {lead.message}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 3. Status Column with Live Interactive Dropdown */}
                        <td className="py-2 px-4 align-top">
                          <div className="pt-0.5">
                            <select
                              value={lead.status}
                              disabled={updatingStatusId === lead._id}
                              onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                              className={`text-xs font-black px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none transition-all shadow-2xs ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                            >
                              <option value="New">● New</option>
                              <option value="Contacted">● Contacted</option>
                              <option value="Visited">● Visited</option>
                              <option value="Not Visited">● Not Visited</option>
                              <option value="Closed">● Completed</option>
                            </select>
                          </div>
                        </td>

                        {/* 4. Date & Time Combined Column */}
                        <td className="py-2 px-4 align-top whitespace-nowrap">
                          <div className="text-xs pt-0.5">
                            <span className="font-black text-black block">
                              {dateObj.toLocaleDateString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-[11px] text-black font-mono font-bold block mt-0.5">
                              {dateObj.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </span>
                          </div>
                        </td>

                        {/* 5. Actions Column (Compact Icon Buttons with Tooltips) */}
                        <td className="py-2 px-4 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 pt-0.5">
                            {/* View Lead Details */}
                            <button
                              onClick={() => handleView(lead)}
                              className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-blue-300 bg-white hover:bg-blue-50 text-black hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs group/btn font-bold"
                              title="View Full Lead Details"
                            >
                              <Eye className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
                            </button>

                            {/* Send Email Reply */}
                            <button
                              onClick={() => handleOpenReply(lead)}
                              className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-blue-300 bg-white hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs group/btn font-bold"
                              title="Send Email Reply"
                            >
                              <Mail className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
                            </button>

                            {/* Call Contact */}
                            <a
                              href={`tel:${lead.phoneCode || ''}${lead.phone}`}
                              onClick={() => handleCall(lead)}
                              className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs group/btn"
                              title="Call Contact (Marks as Contacted)"
                            >
                              <PhoneCall className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
                            </a>

                            {/* Delete Lead */}
                            <button
                              onClick={() => {
                                setSelectedLead(lead);
                                setDeleteModalOpen(true);
                              }}
                              className="w-8 h-8 rounded-xl border border-slate-200/80 hover:border-rose-300 bg-white hover:bg-rose-50 text-black hover:text-rose-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs group/btn font-bold"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
                            </button>
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
        {totalLeads > 0 && (
          <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/70">
            <ServerPagination
              currentPage={page}
              pageSize={pageSize}
              totalRecords={totalLeads}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              showPageSizeDropdown={true}
              loading={loading}
              recordLabel="leads"
            />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 6. VIEW DETAILS MODAL                                      */}
      {/* ========================================================= */}
      {viewModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider font-mono">
                  Contact Lead Details
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 flex items-center gap-2.5">
                  <span>{selectedLead.name}</span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      STATUS_CONFIG[selectedLead.status]?.bg || 'bg-slate-100'
                    } ${STATUS_CONFIG[selectedLead.status]?.text || 'text-black font-bold'} ${
                      STATUS_CONFIG[selectedLead.status]?.border || 'border-slate-300'
                    }`}
                  >
                    {STATUS_CONFIG[selectedLead.status]?.label || selectedLead.status}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="w-9 h-9 rounded-xl border border-slate-200/80 hover:bg-slate-100 text-black hover:text-blue-600 transition-colors flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-black font-black block uppercase text-[10px]">
                    Client Name
                  </span>
                  <span className="text-black font-black text-sm">{selectedLead.name}</span>
                </div>
                <div>
                  <span className="text-black font-black block uppercase text-[10px]">
                    Inquiry Subject
                  </span>
                  <span className="text-black font-bold">
                    {selectedLead.subject || 'Website Contact Form'}
                  </span>
                </div>
                <div>
                  <span className="text-black font-black block uppercase text-[10px]">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    {selectedLead.email}
                  </a>
                </div>
                <div>
                  <span className="text-black font-black block uppercase text-[10px]">
                    Phone Number
                  </span>
                  <a
                    href={`tel:${selectedLead.phoneCode || ''}${selectedLead.phone}`}
                    onClick={() => handleCall(selectedLead)}
                    className="text-black font-bold hover:text-blue-600 flex items-center gap-1.5"
                    title="Click to Call (marks as Contacted)"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {selectedLead.phoneCode ? `${selectedLead.phoneCode} ` : ''}
                      {selectedLead.phone}
                    </span>
                  </a>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-black font-black block uppercase text-[10px]">
                    Submission Date & Time
                  </span>
                  <span className="text-black font-bold font-mono">
                    {new Date(selectedLead.createdAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              {/* Message */}
              <div>
                <span className="text-black font-black uppercase text-[10px] block mb-1.5">
                  Message Content
                </span>
                <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl text-black font-medium text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedLead.message || 'No message provided.'}
                </div>
              </div>

              {/* Quick Status Update Selector */}
              <div className="pt-3 border-t border-slate-100">
                <label className="text-black font-black uppercase text-[10px] block mb-2">
                  Update Lead Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'New', label: 'New' },
                    { key: 'Contacted', label: 'Contacted' },
                    { key: 'Visited', label: 'Visited' },
                    { key: 'Not Visited', label: 'Not Visited' },
                    { key: 'Closed', label: 'Completed' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleStatusChange(selectedLead._id, key)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                        selectedLead.status === key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-black border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sent Email History */}
              {selectedLead.emailHistory && selectedLead.emailHistory.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <span className="text-black font-black uppercase text-[10px] flex items-center gap-1.5">
                    <Send className="w-3 h-3 text-blue-600" />
                    Sent Email Replies History ({selectedLead.emailHistory.length})
                  </span>
                  <div className="space-y-2.5">
                    {selectedLead.emailHistory.map((hist, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-black">
                          <span>{hist.subject}</span>
                          <span className="text-[10px] font-mono text-black font-semibold">
                            {new Date(hist.sentAt).toLocaleString('en-US', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-black font-medium whitespace-pre-wrap">{hist.message}</p>
                        <div className="text-[10px] text-black font-semibold pt-1">
                          Sent by: {hist.sentBy} &bull; Status: {hist.emailStatus}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-black text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                Back to Leads
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedLead.phoneCode || ''}${selectedLead.phone}`}
                  onClick={() => handleCall(selectedLead)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Call User (Marks as Contacted)"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {selectedLead.phone}</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleOpenReply(selectedLead)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. REPLY VIA EMAIL MODAL                                  */}
      {/* ========================================================= */}
      {replyModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-200">
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Reply to {selectedLead.name}</h3>
                  <p className="text-xs text-blue-100">
                    Direct email response to {selectedLead.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-black font-black uppercase text-[10px] mb-1">
                  Recipient (To)
                </label>
                <input
                  type="text"
                  disabled
                  value={`${selectedLead.name} <${selectedLead.email}>`}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-black font-bold font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-black font-black uppercase text-[10px] mb-1">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Subject of your reply..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-black font-bold focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-black font-black uppercase text-[10px] mb-1">
                  Message Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your official reply message here..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-black font-medium leading-relaxed focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-sans"
                />
                <p className="text-[11px] text-black font-semibold mt-1">
                  This email will be dispatched using the configured SMTP server and archived in MongoDB.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-black font-bold hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replying}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {replying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                  <span>{replying ? 'Sending...' : 'Send Reply Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. DELETE CONFIRMATION MODAL                               */}
      {/* ========================================================= */}
      {deleteModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200/80 shadow-2xl p-6 text-center space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black">Delete Contact Lead?</h3>
              <p className="text-xs text-black font-medium mt-1">
                Are you sure you want to delete the lead from{' '}
                <strong className="text-black font-black">{selectedLead.name}</strong>? This action cannot be
                undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-black font-bold text-xs hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
