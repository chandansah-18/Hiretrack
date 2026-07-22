"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(`[ErrorBoundary${this.props.name ? ` ${this.props.name}` : ""}]`, error.message, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-sm font-medium text-red-700">
            {this.props.name ?? "Section"} unavailable
          </p>
          <p className="text-xs text-red-500">
            {this.state.error?.message ?? "An unexpected error occurred"}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
