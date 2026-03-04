import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl p-4 md:h-auto">
                <div className="relative bg-white rounded-xl shadow-lg border border-slate-100">
                    <div className="flex items-start justify-between p-5 border-b border-slate-100 rounded-t-xl">
                        <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                        <button
                            onClick={onClose}
                            type="button"
                            className="text-slate-400 bg-transparent hover:bg-slate-100 hover:text-slate-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-6">{children}</div>
                </div>
            </div>
        </div>
    );
};
