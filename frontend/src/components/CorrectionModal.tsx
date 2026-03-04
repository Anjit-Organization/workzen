import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { attendanceService } from '../services/attendanceService';

interface CorrectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    attendanceId: string;
    date: string;
    onSuccess: () => void;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({ isOpen, onClose, attendanceId, date, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [punchIn, setPunchIn] = useState('');
    const [punchOut, setPunchOut] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!punchIn || !punchOut || !reason) {
            toast.error('Please fill all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            // Combine with date
            const correctedPunchIn = new Date(`${date}T${punchIn}`).toISOString();
            const correctedPunchOut = new Date(`${date}T${punchOut}`).toISOString();

            if (new Date(correctedPunchOut) <= new Date(correctedPunchIn)) {
                toast.error('Punch Out must be after Punch In');
                setIsSubmitting(false);
                return;
            }

            await attendanceService.submitCorrection({
                attendanceId,
                date,
                reason,
                correctedPunchIn,
                correctedPunchOut
            });
            toast.success('Correction request submitted');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Submission error', error);
            // Error handling is managed heavily by Axios Interceptors
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">Request Attendance Correction</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                        <input
                            type="text"
                            value={date}
                            disabled
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Missing Punch In</label>
                            <input
                                type="time"
                                value={punchIn}
                                onChange={(e) => setPunchIn(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Missing Punch Out</label>
                            <input
                                type="time"
                                value={punchOut}
                                onChange={(e) => setPunchOut(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Correction</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="E.g., Forgot to punch out, system issue..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            required
                        />
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
