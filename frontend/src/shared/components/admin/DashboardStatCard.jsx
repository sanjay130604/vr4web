import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function DashboardStatCard({
  title,
  value = 0,
  icon: Icon,
  link,
}) {
  return (
    <Link
      to={link}
      className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#2563EB]/40 transition-all duration-200 group flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-200">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] group-hover:translate-x-0.5 transition-transform">
          <span>Manage</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>

      <div>
        <div className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-1">
          {value}
        </div>
        <div className="text-xs font-black text-black uppercase tracking-wider">
          {title}
        </div>
      </div>
    </Link>
  );
}

