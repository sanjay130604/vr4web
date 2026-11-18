import { FolderOpen, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'No Records Found',
  description = 'There are no items created yet. Add your first record to get started.',
  actionText = 'Add New',
  onAction,
  icon: Icon = FolderOpen,
}) {
  return (
    <div className="py-16 px-4 text-center bg-white rounded-2xl border border-[#E5E7EB] shadow-sm max-w-lg mx-auto my-8">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
        <Icon className="w-7 h-7 text-[#2563EB]" />
      </div>
      <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-[#64748B] font-semibold mt-1.5 max-w-sm mx-auto">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1E40AF] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}

