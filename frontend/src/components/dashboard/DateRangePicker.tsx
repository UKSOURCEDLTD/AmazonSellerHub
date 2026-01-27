import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

export type DateRange = {
    label: string;
    start: Date;
    end: Date;
};

interface DateRangePickerProps {
    currentRange: DateRange;
    onRangeChange: (range: DateRange) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ currentRange, onRangeChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getPresetRange = (label: string): DateRange => {
        let end = new Date(); // default end is now/today
        let start = new Date();

        switch (label) {
            case 'Today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'Lifetime':
                start = new Date('2015-01-01'); // Start of tracking
                end.setHours(23, 59, 59, 999);
                break;
            case 'Yesterday':
                start.setDate(start.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case 'Last 7 Days':
                start.setDate(start.getDate() - 7);
                break;
            case 'Last 30 Days':
                start.setDate(start.getDate() - 30);
                break;
            case 'Month to Date':
                start.setDate(1); // 1st of current month
                break;
            case 'Week to Date':
                // Assuming week starts on Monday (ISO) or Sunday? Let's use Sunday for generic US/UK mix or just subtract day of week
                const day = start.getDay(); // 0 (Sun) to 6 (Sat)
                const diff = start.getDate() - day + (day == 0 ? -6 : 1); // Adjust for start day... keeping simple: 
                // Simple WTD: Start of this week (Sunday)
                start.setDate(start.getDate() - start.getDay());
                break;
            case 'Custom':
                // handled differently
                return { label, start: new Date(), end: new Date() };
            default:
                break;
        }
        return { label, start, end };
    };

    const handleSelectPreset = (label: string) => {
        if (label === 'Custom') {
            // Just keep open, maybe focus inputs?
            return;
        }
        const range = getPresetRange(label);
        onRangeChange(range);
        setIsOpen(false);
    };

    const handleApplyCustom = () => {
        if (!customStart || !customEnd) return;
        const start = new Date(customStart);
        const end = new Date(customEnd);
        // Set end of day for end date
        end.setHours(23, 59, 59, 999);

        onRangeChange({
            label: 'Custom',
            start,
            end
        });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
                <Calendar size={16} className="text-gray-400" />
                <span>{currentRange.label}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 space-y-1">
                        {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Month to Date', 'Week to Date', 'Lifetime'].map((label) => (
                            <button
                                key={label}
                                onClick={() => handleSelectPreset(label)}
                                className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${currentRange.label === label ? 'bg-amber-50 text-amber-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {label}
                                {currentRange.label === label && <Check size={14} className="text-amber-600" />}
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Custom Range</p>
                        <div className="flex gap-2 mb-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 mb-1 block">Start</label>
                                <input
                                    type="date"
                                    className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-gray-500 mb-1 block">End</label>
                                <input
                                    type="date"
                                    className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                />
                            </div>

                        </div>
                        <button
                            onClick={handleApplyCustom}
                            disabled={!customStart || !customEnd}
                            className="w-full py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Apply Range
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
