import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 text-red-600 bg-red-50 border border-red-200 rounded m-4">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <p className="font-mono text-sm bg-white p-4 rounded border border-red-100 overflow-auto">
                        {this.state.error && this.state.error.toString()}
                    </p>
                    <details className="mt-4 text-xs text-gray-500 font-mono whitespace-pre-wrap">
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
