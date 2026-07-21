"use client";

import {Component, type ReactNode} from "react";

type AstryxViewBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  onFailure(error: Error): void;
  resetKey: number | null;
};

type AstryxViewBoundaryState = {failed: boolean};

/** Keeps a failed lazy or render-time Astryx view from replacing the current view. */
export class AstryxViewBoundary extends Component<AstryxViewBoundaryProps, AstryxViewBoundaryState> {
  state: AstryxViewBoundaryState = {failed: false};

  static getDerivedStateFromError(): AstryxViewBoundaryState {
    return {failed: true};
  }

  componentDidCatch(error: Error): void {
    this.props.onFailure(error);
  }

  componentDidUpdate(previousProps: AstryxViewBoundaryProps): void {
    if (this.state.failed && previousProps.resetKey !== this.props.resetKey) {
      this.setState({failed: false});
    }
  }

  render(): ReactNode {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
