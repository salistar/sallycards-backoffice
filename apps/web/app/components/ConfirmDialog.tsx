'use client';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  loading?: boolean;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmer', onConfirm, onCancel, isDestructive = false, loading = false }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 border border-gray-200 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
        <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ${isDestructive ? 'bg-red-50' : 'bg-emerald-50'}`}>
          {isDestructive ? '⚠️' : '✓'}
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2 tracking-tighter">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ease-out disabled:opacity-50 active:scale-95 ${
              isDestructive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {loading ? '...' : confirmLabel}
          </button>
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 ease-out">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
