import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    background: 'rgba(255,0,0,0.1)',
                    color: '#ff4081',
                    borderRadius: '8px',
                    border: '1px solid #ff4081',
                    margin: '20px',
                    fontSize: '0.8rem',
                    backdropFilter: 'blur(10px)'
                }}>
                    <h3>Something went wrong in {this.props.name || 'this component'}.</h3>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        style={{
                            background: 'white',
                            color: 'black',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
