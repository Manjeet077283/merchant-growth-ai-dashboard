import React from 'react';
import { X } from 'lucide-react';
import { VoiceAiAssistant } from './VoiceAiAssistant';
import { ActionItem } from '../../types';

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onActionTrigger?: (action: ActionItem) => void;
}

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  isOpen,
  onClose,
  onActionTrigger,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-100">
        {/* Drawer Header Close Button */}
        <div className="p-3 px-6 bg-white border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-[#172B4D]">Merchant Growth Copilot</span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Embedded Voice & Text AI Assistant */}
        <div className="flex-1 overflow-hidden p-3 bg-[#F5F7FA]">
          <VoiceAiAssistant onActionTrigger={onActionTrigger} isStandalonePage={false} />
        </div>
      </div>
    </div>
  );
};
