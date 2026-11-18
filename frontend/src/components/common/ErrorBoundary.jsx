import React from 'react';
import NotFound from '../NotFound';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[VR4Web ErrorBoundary] Caught component error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <NotFound
          isError={true}
          errorMessage="An unexpected issue occurred while rendering this section. Don't worry — your session is safe and you can navigate back to any page of our website below."
          resetErrorBoundary={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

