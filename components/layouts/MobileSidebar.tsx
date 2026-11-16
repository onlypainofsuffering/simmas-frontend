'use client';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  if (!open) return null;

  return (
    <button
      aria-label="Tutup menu"
      className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
      onClick={onClose}
    />
  );
}
