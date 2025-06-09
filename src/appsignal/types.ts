// AppSignal API Types

// Sample Entry Interface (from samples index)
export interface SampleEntry {
  id: string;
  action: string;
  path: string;
  duration: number | null;
  status: number | null;
  time: number;
  is_exception: boolean;
  exception: {
    name: string | null;
  };
}

// Error Sample Interface (from samples show)
export interface ErrorSample {
  id: string;
  action: string;
  db_runtime: number;
  duration: number | null;
  environment: Record<string, any>;
  hostname: string;
  is_exception: boolean;
  kind: string;
  params: Record<string, any>;
  path: string;
  request_format: string;
  request_method: string;
  session_data: Record<string, any>;
  status: string;
  view_runtime: number;
  time: number;
  end: number;
  events: any[];
  tags?: Record<string, any>;
  exception: {
    message: string;
    name: string;
    backtrace: string[];
  } | null;
}

// Performance Sample Interface
export interface PerformanceSample {
  id: string;
  action: string;
  db_runtime: number;
  duration: number;
  environment: Record<string, any>;
  hostname: string;
  is_exception: null;
  kind: string;
  params: Record<string, any>;
  path: string;
  request_format: string;
  request_method: string;
  session_data: Record<string, any>;
  status: string;
  view_runtime: number;
  time: number;
  end: number;
  allocation_count?: number;
  events: Array<{
    action: string;
    duration: number;
    group: string;
    name: string;
    payload: Record<string, any>;
    time: number;
    end: number;
    digest?: number;
    allocation_count?: number;
  }>;
  exception: null;
}

// Union type for any sample
export type Sample = ErrorSample | PerformanceSample;

// Sample type enum
export enum SampleType {
  ALL = 'all',
  ERROR = 'errors',
  PERFORMANCE = 'performance'
}

// Search Filters Interface
export interface SampleFilters {
  action_id?: string;
  exception?: string;
  since?: string | number;
  before?: string | number;
  limit?: number;
  count_only?: boolean;
}

// API Response Interfaces
export interface SampleResponse {
  id: string;
  action: string;
  // ... and other fields depending on sample type
}

export interface SamplesResponse {
  count: number;
  log_entries: SampleEntry[];
}

// Error Interface
export interface AppSignalError {
  status: number;
  statusText: string;
  body?: any;
  message?: string;
}