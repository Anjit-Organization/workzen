import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationService } from '../services/notificationService';
import { employeeService, Employee } from '../services/employeeService';

interface SendNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetUserId, setTargetUserId] = useState<string>('all');
    const [link, setLink] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            employeeService.getAll({}).then(data => setEmployees(data.data)).catch(err => console.error(err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !message.trim() || !targetUserId) {
            toast.error('Title, Message, and Recipient are required');
            return;
        }

        setIsSubmitting(true);
        try {
            await notificationService.sendManualNotification({
                title,
                message,
                targetUserId,
                link: link.trim() || undefined
            });
            toast.success('Notification sent successfully');

            // Reset form
            setTitle('');
            setMessage('');
            setTargetUserId('all');
            setLink('');

            onClose();
        } catch (error) {
            console.error('Submission error', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">Send Notification</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Recipient</label>
                        <select
                            value={targetUserId}
                            onChange={(e) => setTargetUserId(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                            <option value="all">Broadcast to All Employees</option>
                            {employees.map(emp => emp.userId ? (
                                <option key={emp._id} value={emp.userId._id}>{emp.name} ({emp.email})</option>
                            ) : null)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notification Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="E.g., Company Holiday Tomorrow"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            placeholder="Detailed message content..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Action Link (Optional)</label>
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="E.g., /leaves or https://example.com"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">If provided, clicking the notification will open this link.</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
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
                            className={`flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Sending...' : 'Send Notification'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
