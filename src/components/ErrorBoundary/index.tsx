import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h2>Something went wrong.</h2>
                    <p>Please refresh the page and try again.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '16px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
