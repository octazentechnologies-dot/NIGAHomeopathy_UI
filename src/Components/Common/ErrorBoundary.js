import React from 'react';
import { reportClientIssue } from '../../helpers/client_error_reporter';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, traceId: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const traceId = "ui-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    console.error("ErrorBoundary caught an error:", traceId, error, errorInfo);
    reportClientIssue({
      source: "window",
      url: window.location.href,
      status: 500,
      method: "CLIENT",
      message: error ? String(error) : "React render error",
      stack: error && error.stack ? error.stack : "",
      componentStack: errorInfo && errorInfo.componentStack ? errorInfo.componentStack : "",
      traceId: traceId,
    });
    this.setState({
      traceId: traceId,
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '50px', 
          textAlign: 'center',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ color: '#dc3545' }}>Something went wrong.</h1>
          <p>Please try again. If it keeps happening, share this reference: {this.state.traceId}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null, traceId: "" })}
            style={{
              padding: '10px 20px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px',
              marginRight: '8px'
            }}
          >
            Try again
          </button>
          <details style={{ 
            whiteSpace: 'pre-wrap',
            marginTop: '20px',
            textAlign: 'left',
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '5px',
            maxWidth: '800px',
            margin: '20px auto'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Click for error details
            </summary>
            <p style={{ marginTop: '10px' }}>
              {this.state.error && this.state.error.toString()}
            </p>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </p>
          </details>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px',
              marginLeft: '8px'
            }}
          >
            Go to Login
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

