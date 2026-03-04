import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AttendanceRecord } from '../services/attendanceService';

interface EmployeeDashboardCalendarProps {
    history: AttendanceRecord[];
}

export const EmployeeDashboardCalendar: React.FC<EmployeeDashboardCalendarProps> = ({ history }) => {
    // Current month state
    const [currentDate, setCurrentDate] = React.useState(new Date());

    const { daysInMonth, startDayIndex } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
        return { daysInMonth, startDayIndex };
    }, [currentDate]);

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getDayStatus = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = history.find(r => r.date === dateStr);

        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
        const isFuture = dateObj > new Date();

        if (isFuture) return 'future';

        if (record) {
            if (record.isAbsent) return 'absent';
            if (record.records && record.records.length > 0) return 'present';
        }

        if (isWeekend) return 'weekend';

        // If it's a past weekday and no record, we can assume absent or un-punched (which is absent)
        return 'absent';
    };

    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'present':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'absent':
                return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'weekend':
                return 'bg-slate-100 text-slate-500 border-slate-200 opacity-70';
            case 'future':
            default:
                return 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50';
        }
    };

    const days = [];
    // Padding days for start of month
    for (let i = 0; i < startDayIndex; i++) {
        days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
        const status = getDayStatus(i);
        days.push(
            <div
                key={i}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-sm font-medium transition-colors cursor-default ${getStatusClasses(status)}`}
                title={status.charAt(0).toUpperCase() + status.slice(1)}
            >
                {i}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Attendance Calendar</h3>
                <div className="flex items-center space-x-4">
                    <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold text-slate-700 min-w-[120px] text-center">{monthName}</span>
                    <button
                        onClick={nextMonth}
                        disabled={new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {days}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 mt-6 border-t border-slate-100 text-xs font-medium text-slate-600">
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 mr-2"></div>
                    Present
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-rose-400 mr-2"></div>
                    Absent / Leave
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-slate-300 mr-2"></div>
                    Weekend
                </div>
            </div>
        </div>
    );
};
