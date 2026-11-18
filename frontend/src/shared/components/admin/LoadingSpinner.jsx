import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading data...' }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-[#0F172A]">
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-10 h-10 border-3 border-[#DBEAFE] border-t-[#2563EB] rounded-full animate-spin"></div>
        <Loader2 className="w-5 h-5 text-[#2563EB] absolute animate-pulse" />
      </div>
      <p className="text-xs font-medium tracking-wide uppercase font-mono text-[#64748B]">{text}</p>
    </div>
  );
}

