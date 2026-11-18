import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-[#0F172A]">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 border-4 border-[#DBEAFE] border-t-[#2563EB] rounded-full animate-spin"></div>
          <Loader2 className="w-6 h-6 text-[#2563EB] absolute animate-pulse" />
        </div>
        <p className="mt-4 text-[#64748B] text-xs tracking-widest font-mono uppercase font-semibold">
          Verifying Admin Access...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
