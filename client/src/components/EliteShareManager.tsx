import { useState } from 'react';

const LINK_A_COMPARTIR = typeof window !== 'undefined' ? window.location.href : 'https://tu-app.replit.dev/';

interface ShareProps {
  isOpen: boolean;
  onClose: () => void;
}

const EliteShareManager: React.FC<ShareProps> = ({ isOpen, onClose }) => {
  const [estadoCopiado, setEstadoCopiado] = useState<string | null>(null);

  const marcarCopiado = () => {
    setEstadoCopiado('¡Enlace Copiado! 🚀');
    setTimeout(() => {
      setEstadoCopiado(null);
      onClose();
    }, 1500);
  };

  const copiarConExecCommand = () => {
    try {
      const area = document.createElement('textarea');
      area.value = LINK_A_COMPARTIR;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.focus();
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      marcarCopiado();
    } catch {
      setEstadoCopiado('Copia el link manualmente');
    }
  };

  const handleCopiarEnlace = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(LINK_A_COMPARTIR)
          .then(marcarCopiado)
          .catch(copiarConExecCommand);
      } else {
        copiarConExecCommand();
      }
    } catch {
      copiarConExecCommand();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[999]">
      <div className="bg-[#0a0a0a] border border-[#39FF14]/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(57,255,20,0.1)]">
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
          {estadoCopiado || 'Comparte la App'}
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          {estadoCopiado === 'Copia el link manualmente'
            ? LINK_A_COMPARTIR
            : 'Copia el enlace de la demo para enviarlo por mensaje o redes:'}
        </p>
        <button
          data-testid="button-copy-link"
          onClick={handleCopiarEnlace}
          className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl tracking-wider hover:bg-[#32e612] transition-all"
        >
          {estadoCopiado === '¡Enlace Copiado! 🚀' ? '¡COPIADO CON ÉXITO!' : 'COPIAR LINK'}
        </button>
        <button
          data-testid="button-share-cancel"
          onClick={onClose}
          className="w-full mt-4 py-2 text-gray-500 font-bold uppercase text-xs hover:text-white transition-colors"
        >
          Cerrar ventana
        </button>
      </div>
    </div>
  );
};

export default EliteShareManager;
