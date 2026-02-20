import React, { useState } from 'react'

function App() {
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState(null)
    const [error, setError] = useState(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile && selectedFile.name.endsWith('.csv')) {
            setFile(selectedFile)
            setError(null)
        } else {
            setError('Please select a valid CSV file')
            setFile(null)
        }
    }

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first')
            return
        }

        setLoading(true)
        setError(null)
        setUploadProgress(0)

        const formData = new FormData()
        formData.append('file', file)

        console.log('📤 Starting upload of file:', file.name)

        try {
            // Create a timeout promise
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

            console.log('🔗 Sending request to http://localhost:5500/api/analyze')
            const response = await fetch('http://localhost:5500/api/analyze', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            console.log('📨 Response received:', response.status, response.statusText)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Server error: ${response.status}`)
            }

            const data = await response.json()
            console.log('✅ Data received:', data)
            setResults(data)
            setUploadProgress(100)
        } catch (err) {
            console.error('❌ Error:', err)
            if (err.name === 'AbortError') {
                setError('Request timeout - server took too long to respond. Please try again.')
            } else {
                setError(err.message || 'An error occurred during upload')
            }
        } finally {
            setLoading(false)
        }
    }

    const downloadResults = () => {
        const dataStr = JSON.stringify(results, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'fraud_detection_results.json'
        link.click()
    }

    return (
        <div className="app">
            <div className="header">
                <h1>💰 Money Muling Detection System</h1>
                <p>Advanced Fraud Detection Using Graph Analysis</p>
            </div>

            <div className="container">
                <section className="upload-section">
                    <h2>Upload Transaction Data</h2>
                    <p className="info-text">Upload a CSV file with columns: transaction_id, sender_id, receiver_id, amount, timestamp</p>

                    <div className="file-input-wrapper">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            id="fileInput"
                            className="file-input"
                        />
                        <label htmlFor="fileInput" className="file-label">
                            📁 Choose CSV File
                        </label>
                        {file && <span className="file-name">{file.name}</span>}
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}

                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className="upload-button"
                    >
                        {loading ? '🔄 Analyzing...' : '🚀 Analyze Transactions'}
                    </button>

                    {loading && (
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    )}
                </section>

                {results && (
                    <section className="results-section">
                        <div className="results-header">
                            <h2>📊 Analysis Results</h2>
                            <button onClick={downloadResults} className="download-button">
                                ⬇️ Download JSON
                            </button>
                        </div>

                        {/* Summary Section */}
                        <div className="summary-cards">
                            <div className="summary-card">
                                <div className="card-icon">🏦</div>
                                <div className="card-content">
                                    <h3>Total Accounts</h3>
                                    <p className="card-value">{results.summary.total_accounts_analyzed}</p>
                                </div>
                            </div>
                            <div className="summary-card suspicious">
                                <div className="card-icon">⚠️</div>
                                <div className="card-content">
                                    <h3>Suspicious Accounts</h3>
                                    <p className="card-value">{results.summary.suspicious_accounts_flagged}</p>
                                </div>
                            </div>
                            <div className="summary-card fraud">
                                <div className="card-icon">🚨</div>
                                <div className="card-content">
                                    <h3>Fraud Rings</h3>
                                    <p className="card-value">{results.summary.fraud_rings_detected}</p>
                                </div>
                            </div>
                            <div className="summary-card">
                                <div className="card-icon">⏱️</div>
                                <div className="card-content">
                                    <h3>Processing Time</h3>
                                    <p className="card-value">{results.summary.processing_time_seconds}s</p>
                                </div>
                            </div>
                        </div>

                        {/* Fraud Rings Section */}
                        {results.fraud_rings.length > 0 && (
                            <div className="fraud-rings-section">
                                <h3>🔗 Detected Fraud Rings</h3>
                                <div className="rings-grid">
                                    {results.fraud_rings.map((ring) => (
                                        <div key={ring.ring_id} className="ring-card">
                                            <div className="ring-header">
                                                <span className="ring-id">{ring.ring_id}</span>
                                                <span className={`pattern-badge ${ring.pattern_type}`}>
                                                    {ring.pattern_type.replace(/_/g, ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ring-risk">
                                                <span className="risk-label">Risk Score:</span>
                                                <span className="risk-value">{ring.risk_score}%</span>
                                            </div>
                                            <div className="ring-members">
                                                <span className="members-label">Members ({ring.member_accounts.length}):</span>
                                                <div className="members-list">
                                                    {ring.member_accounts.map((account) => (
                                                        <span key={account} className="member-badge">{account}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suspicious Accounts Section */}
                        {results.suspicious_accounts.length > 0 && (
                            <div className="accounts-section">
                                <h3>👤 Flagged Suspicious Accounts</h3>
                                <div className="accounts-table">
                                    <div className="table-header">
                                        <div className="col account-id">Account ID</div>
                                        <div className="col score">Score</div>
                                        <div className="col patterns">Detected Patterns</div>
                                        <div className="col ring">Ring</div>
                                    </div>
                                    {results.suspicious_accounts.slice(0, 20).map((account) => (
                                        <div key={account.account_id} className="table-row">
                                            <div className="col account-id">
                                                <code>{account.account_id}</code>
                                            </div>
                                            <div className="col score">
                                                <div className="score-badge" style={{
                                                    backgroundColor: account.suspicion_score > 90 ? '#ef4444' :
                                                        account.suspicion_score > 70 ? '#f97316' : '#fbbf24'
                                                }}>
                                                    {account.suspicion_score.toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className="col patterns">
                                                {account.detected_patterns.map((pattern) => (
                                                    <span key={pattern} className="pattern-tag">
                                                        {pattern.replace(/_/g, ' ')}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="col ring">
                                                <code className="ring-link">{account.ring_id}</code>
                                            </div>
                                        </div>
                                    ))}
                                    {results.suspicious_accounts.length > 20 && (
                                        <div className="table-footer">
                                            +{results.suspicious_accounts.length - 20} more accounts
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {results.suspicious_accounts.length === 0 && results.fraud_rings.length === 0 && (
                            <div className="no-results">
                                <h3>✅ Good News!</h3>
                                <p>No suspicious activity detected in this transaction data.</p>
                            </div>
                        )}
                    </section>
                )}
            </div>

            <footer className="footer">
                <p>Money Muling Detection System v1.0 • Powered by Graph Analysis & Network Detection</p>
            </footer>
        </div>
    )
}

export default App
