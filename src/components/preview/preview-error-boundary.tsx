'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
  /** Changing this value resets the boundary (e.g. the resume id/section count),
   *  so an edit that fixes the bad data clears the error automatically. */
  resetKey?: unknown;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render errors from the resume templates so a single malformed section
 * (e.g. AI-corrupted content) degrades to an inline message instead of taking
 * down the whole editor route (issue #87).
 */
export class PreviewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Resume preview failed to render:', error);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
