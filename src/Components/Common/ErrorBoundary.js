import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
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
              marginTop: '20px'
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

