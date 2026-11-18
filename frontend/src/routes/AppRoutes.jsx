import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Main from '../core/Main';
import Home from '../components/Home';
import SectorsPage from '../components/SectorsPage';
import AboutUs from '../components/AboutUs';
import HowWeWork from '../components/HowWeWork';
import Gallery from '../components/Gallery';
import Client from '../components/Client';
import BrandsPartners from '../components/BrandsPartners';
import Testimonials from '../components/Testimonials';
import Contact from '../components/Contact';
import Product from '../components/Product';
import EnquiryPage from '../shared/components/Enquirypage';
import Stories from '../components/Stories';
import CaseStudyDetails from '../components/CaseStudyDetails';
import Blogs from '../components/Blogs';
import BlogDetails from '../components/BlogDetails';
import Whitepaper from '../shared/components/Whitepaper';
import ServicesDetails from '../shared/components/servicesdetails';
import PrivacyPolicy from '../components/PrivacyPolicy';
import PricingPage from '../components/PricingPage';

// Admin Auth & Dashboard Components
import AdminLogin from '../pages/AdminLogin/AdminLogin';
import AdminRoute from './AdminRoute';
import DashboardLayout from '../pages/AdminDashboard/DashboardLayout';
import DashboardHome from '../pages/AdminDashboard/DashboardHome';
import CaseStudiesManagement from '../pages/AdminDashboard/CaseStudiesManagement';
import StoriesModule from '../pages/AdminDashboard/Stories';
import BlogsModule from '../pages/AdminDashboard/Blogs';
import NewspaperModule from '../pages/AdminDashboard/Newspaper';
import GalleryModule from '../pages/AdminDashboard/Gallery';
import PricingManagement from '../pages/AdminDashboard/PricingManagement';
import ContactLeads from '../pages/AdminDashboard/ContactLeads';
import EnquiryLeads from '../pages/AdminDashboard/EnquiryLeads';
import NotFound from '../components/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Admin Login Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/login" element={<AdminLogin />} />

      {/* Legacy Fallback Redirects (Removes demo from URL while preserving existing links) */}
      <Route path="/demo/vr4web/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/demo/login" element={<Navigate to="/admin/login" replace />} />

      {/* Protected Admin Dashboard Suite */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <DashboardLayout />
          </AdminRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="case-studies" element={<CaseStudiesManagement />} />
        <Route path="stories" element={<CaseStudiesManagement />} />
        <Route path="stories-legacy" element={<StoriesModule />} />
        <Route path="blogs" element={<BlogsModule />} />
        <Route path="newspaper" element={<NewspaperModule />} />
        <Route path="gallery" element={<GalleryModule />} />
        <Route path="pricing" element={<PricingManagement />} />
        <Route path="contact-leads" element={<ContactLeads />} />
        <Route path="enquiry-leads" element={<EnquiryLeads />} />
        <Route path="*" element={<NotFound isAdmin={true} />} />
      </Route>

      {/* Public Website Routes (Wrapped with Header and Footer) */}
      <Route element={<Main />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/how-we-work" element={<HowWeWork />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/brands-partners" element={<BrandsPartners />} />
        <Route path="/client" element={<Client />} />
        <Route path="/services" element={<ServicesDetails />} />
        <Route path="/services/:categorySlug" element={<ServicesDetails />} />
        <Route path="/services/:categorySlug/:subServiceSlug" element={<ServicesDetails />} />
        <Route path="/sectors" element={<SectorsPage />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/stories/:id" element={<CaseStudyDetails />} />
        <Route path="/stories/:slug" element={<CaseStudyDetails />} />
        <Route path="/case-studies" element={<Stories />} />
        <Route path="/case-studies/:id" element={<CaseStudyDetails />} />
        <Route path="/case-studies/:slug" element={<CaseStudyDetails />} />
        <Route path="/case-study/:id" element={<CaseStudyDetails />} />
        <Route path="/case-study/:slug" element={<CaseStudyDetails />} />
        <Route path="/our-work" element={<Stories />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:id" element={<BlogDetails />} />
        <Route path="/blogs/:slug" element={<BlogDetails />} />
        <Route path="/blog/:id" element={<BlogDetails />} />
        <Route path="/blog/:slug" element={<BlogDetails />} />
        <Route path="/journal" element={<Blogs />} />
        <Route path="/newspaper" element={<Whitepaper />} />
        <Route path="/newspapers" element={<Whitepaper />} />
        <Route path="/white-paper" element={<Whitepaper />} />
        <Route path="/whitepaper" element={<Whitepaper />} />
        <Route path="/whitepapers" element={<Whitepaper />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/prices" element={<PricingPage />} />
        <Route path="/plans" element={<PricingPage />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/get-a-quote" element={<EnquiryPage />} />
        <Route path="/get-quote" element={<EnquiryPage />} />
        <Route path="/enquiry" element={<EnquiryPage />} />
        <Route path="/product" element={<Product />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/404" element={<NotFound />} />
        {/* Catch-all 404 handler */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}