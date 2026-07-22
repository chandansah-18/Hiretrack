import * as React from "react";
import { Calendar, Download, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { downloadExcel, exportToCSV, type ExcelColumn, type DateRange } from "@/lib/excel";
import { formatLongDate, monthKey } from "@/lib/utils";

interface SectionDownloadProps {
  data: any[];
  filename: string;
  sheetName: string;
  columns: ExcelColumn[];
  filters?: {
    clientFilter?: string;
    recruiterFilter?: string;
    statusFilter?: string;
    positionId?: string;
    dateRange?: DateRange;
  };
  activeFilters?: any;
  showDateRange?: boolean;
  customActions?: React.ReactNode;
  compact?: boolean;
}

interface DashboardState {
  clients?: Array<{ id: string; name: string }>;
  recruiters?: Array<{ id: string; name: string }>;
  positions?: Array<{ id: string; name: string }>;
}

export function SectionDownload({
  data,
  filename,
  sheetName,
  columns,
  filters,
  activeFilters,
  showDateRange = false,
  customActions,
  compact = false,
}: SectionDownloadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localDateRange, setLocalDateRange] = useState<DateRange | undefined>(
    filters?.dateRange?.fromDate ? filters.dateRange : undefined
  );
  const [downloadFormat, setDownloadFormat] = useState<'excel' | 'csv'>('excel');
  
  const formatFilterSummary = () => {
    const parts: string[] = [];
    
    if (filters?.clientFilter) {
      parts.push(`Client: ${filters.clientFilter}`);
    }
    
    if (filters?.recruiterFilter) {
      parts.push(`Recruiter: ${filters.recruiterFilter}`);
    }
    
    if (filters?.statusFilter) {
      parts.push(`Status: ${filters.statusFilter}`);
    }
    
    if (filters?.dateRange) {
      parts.push(`Period: ${filters.dateRange.fromDate || "All"} to ${filters.dateRange.toDate || "All"}`);
    }
    
    if (filters?.positionId) {
      parts.push(`Position: ${filters.positionId}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'All data';
  }
  
  const isFiltered = () => {
    return !!(filters?.clientFilter || filters?.recruiterFilter || filters?.statusFilter || filters?.dateRange || filters?.positionId);
  }
  
  const getEffectiveFilters = () => {
    const effectiveFilters: any = { ...filters };
    if (filters?.dateRange && !localDateRange?.fromDate) {
      effectiveFilters.dateRange = filters.dateRange;
    }
    return { ...effectiveFilters, dateRange: localDateRange || filters?.dateRange };
  }
  
  const handleDownload = async () => {
    try {
      const effectiveFilters = getEffectiveFilters();
      const effectiveDateRange = localDateRange || effectiveFilters?.dateRange || filters?.dateRange;
      
      if (downloadFormat === 'excel') {
        await downloadExcel(data, filename, sheetName, columns, effectiveDateRange || undefined);
      } else {
        exportToCSV(data, filename, columns);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={data.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        {data.length > 0 && (
          <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
            {data.length} records
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "gap-2",
          isFiltered() && "bg-amber-50 border-amber-200 text-amber-700"
        )}
      >
        <Download className="h-4 w-4" />
        Download
        {data.length > 0 && (
          <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
            {data.length}
          </span>
        )}
        {isFiltered() && (
          <Filter className="h-3 w-3 text-amber-500" />
        )}
      </Button>
      
      {isExpanded && (
        <Panel variant="elevated" className="absolute right-0 top-full mt-2 w-80 z-50 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Export Options</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-xs text-slate-600">
              Filtered: {formatFilterSummary()}
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Format</label>
              <div className="grid grid-cols-2 gap-2">
                {(['excel', 'csv'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setDownloadFormat(format)}
                    className={cn(
                      "px-3 py-2 text-xs border rounded transition-colors",
                      downloadFormat === format
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            {showDateRange && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={localDateRange?.fromDate || ''}
                    onChange={(e) => setLocalDateRange({
                      ...localDateRange,
                      fromDate: e.target.value
                    })}
                    className="px-2 py-1.5 text-xs border border-slate-200 rounded focus:border-amber-500 focus:outline-none"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={localDateRange?.toDate || ''}
                    onChange={(e) => setLocalDateRange({
                      ...localDateRange,
                      toDate: e.target.value
                    })}
                    className="px-2 py-1.5 text-xs border border-slate-200 rounded focus:border-amber-500 focus:outline-none"
                    placeholder="To"
                  />
                </div>
              </div>
            )}
            
            <div className="pt-2 border-t border-slate-100">
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={handleDownload}
                disabled={data.length === 0}
              >
                <Download className="h-4 w-4" />
                Download {data.length} {sheetName}
              </Button>
            </div>
            
            {customActions && (
              <div className="pt-2">
                {customActions}
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
