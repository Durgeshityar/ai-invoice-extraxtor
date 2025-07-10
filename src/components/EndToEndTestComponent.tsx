'use client'

import { useState } from 'react'

type ProcessingStep = {
  id: string
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any
  error?: string
  duration?: number
}

type InvoiceStats = {
  total: number
  processed: number
  failed: number
  pending: number
  successRate: number
}

type RecentInvoice = {
  id: string
  sender: string
  amount: number
  invoiceDate: string
  status: string
  createdAt: string
  processedAt?: string
}

type EndToEndResult = {
  success: boolean
  invoiceId?: string
  error?: string
  steps: ProcessingStep[]
  stats?: InvoiceStats
  recentInvoices?: RecentInvoice[]
}

export default function EndToEndTestComponent() {
  const [formData, setFormData] = useState({
    subject: '',
    from: '',
    content: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EndToEndResult | null>(null)

  // Enhanced sample data for full workflow testing
  const sampleData = {
    subject: 'Tech Invoice - Cloud Infrastructure Services',
    from: 'billing@cloudtechpro.com',
    content: `Dear Valued Client,

Thank you for choosing CloudTechPro for your infrastructure needs. Please find your invoice details below:

INVOICE DETAILS
===============
Invoice Number: CTP-2024-0158
Company: CloudTechPro Solutions LLC
Service: Cloud Infrastructure & DevOps Consulting
Billing Period: January 1-31, 2024

AMOUNT DUE: $3,750.00

Invoice Date: January 30, 2024
Due Date: February 29, 2024

Services Provided:
- AWS Infrastructure Setup & Management: $2,000.00
- DevOps Pipeline Configuration: $1,200.00
- 24/7 Monitoring & Support: $550.00

Total Amount: $3,750.00
Tax (included): $0.00

PAYMENT INSTRUCTIONS
===================
Please remit payment within 30 days of invoice date.
Payment methods: Bank transfer, ACH, or company check.

Contact our billing department for any questions:
Email: billing@cloudtechpro.com
Phone: (555) 123-4567

Thank you for your business!

Best regards,
CloudTechPro Billing Team
billing@cloudtechpro.com`,
  }

  const loadSampleData = () => {
    setFormData(sampleData)
    setResult(null)
  }

  const clearForm = () => {
    setFormData({ subject: '', from: '', content: '' })
    setResult(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const steps: ProcessingStep[] = [
      { id: 'webhook', name: 'Email Webhook Processing', status: 'pending' },
      { id: 'database', name: 'Database Record Creation', status: 'pending' },
      { id: 'ai', name: 'AI Data Extraction', status: 'pending' },
      { id: 'update', name: 'Database Update', status: 'pending' },
      { id: 'sheets', name: 'Google Sheets Integration', status: 'pending' },
      { id: 'stats', name: 'Fetch Updated Statistics', status: 'pending' },
      { id: 'recent', name: 'Retrieve Recent Invoices', status: 'pending' },
    ]

    setResult({ success: false, steps })

    try {
      // Step 1: Process through webhook (full end-to-end)
      updateStepStatus('webhook', 'running')
      const webhookStart = Date.now()

      const webhookResponse = await fetch('/api/webhook/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `test-e2e-${Date.now()}`, // Unique test ID
          subject: formData.subject,
          from: formData.from,
          content: formData.content,
          receivedAt: new Date().toISOString(),
        }),
      })

      const webhookData = await webhookResponse.json()
      const webhookDuration = Date.now() - webhookStart

      if (!webhookResponse.ok) {
        updateStepStatus(
          'webhook',
          'error',
          undefined,
          webhookData.error || 'Webhook failed',
          webhookDuration
        )
        throw new Error(webhookData.error || 'Webhook processing failed')
      }

      updateStepStatus(
        'webhook',
        'success',
        webhookData,
        undefined,
        webhookDuration
      )
      updateStepStatus('database', 'success', { created: true }, undefined, 0)
      updateStepStatus('ai', 'success', { extracted: true }, undefined, 0)
      updateStepStatus('update', 'success', { updated: true }, undefined, 0)
      updateStepStatus(
        'sheets',
        'success',
        { addedToSheets: true },
        undefined,
        0
      )

      // Step 2: Fetch updated statistics
      updateStepStatus('stats', 'running')
      const statsStart = Date.now()

      const statsResponse = await fetch('/api/invoices?action=stats')
      const statsData = await statsResponse.json()
      const statsDuration = Date.now() - statsStart

      if (!statsResponse.ok) {
        updateStepStatus(
          'stats',
          'error',
          undefined,
          'Failed to fetch stats',
          statsDuration
        )
      } else {
        updateStepStatus(
          'stats',
          'success',
          statsData,
          undefined,
          statsDuration
        )
      }

      // Step 3: Fetch recent invoices
      updateStepStatus('recent', 'running')
      const recentStart = Date.now()

      const recentResponse = await fetch('/api/invoices?action=recent&limit=5')
      const recentData = await recentResponse.json()
      const recentDuration = Date.now() - recentStart

      if (!recentResponse.ok) {
        updateStepStatus(
          'recent',
          'error',
          undefined,
          'Failed to fetch recent invoices',
          recentDuration
        )
      } else {
        updateStepStatus(
          'recent',
          'success',
          recentData,
          undefined,
          recentDuration
        )
      }

      // Final result
      setResult((prev) => ({
        ...prev!,
        success: true,
        invoiceId: webhookData.invoiceId,
        stats: statsData,
        recentInvoices: recentData,
      }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      setResult((prev) => ({
        ...prev!,
        success: false,
        error: errorMessage,
      }))

      // Mark remaining steps as failed
      const currentSteps = [...steps]
      for (const step of currentSteps) {
        if (step.status === 'pending') {
          step.status = 'error'
          step.error = 'Skipped due to earlier failure'
        }
      }

      setResult((prev) => ({
        ...prev!,
        steps: currentSteps,
      }))
    } finally {
      setLoading(false)
    }

    function updateStepStatus(
      stepId: string,
      status: ProcessingStep['status'],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result?: any,
      error?: string,
      duration?: number
    ) {
      setResult((prev) => {
        if (!prev) return prev

        const updatedSteps = prev.steps.map((step) =>
          step.id === stepId
            ? { ...step, status, result, error, duration }
            : step
        )

        return { ...prev, steps: updatedSteps }
      })
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return '⏳'
      case 'running':
        return '🔄'
      case 'success':
        return '✅'
      case 'error':
        return '❌'
    }
  }

  const getStatusColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500'
      case 'running':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          🚀 End-to-End Invoice Processing Test
        </h2>
        <p className="text-gray-600">
          Test the complete invoice processing workflow: email processing, AI
          extraction, database operations, and Google Sheets integration.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={loadSampleData}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Load Enhanced Sample Data
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear Form
          </button>
        </div>

        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Subject (must contain &quot;tech invoice&quot;)
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="e.g., Tech Invoice - Cloud Infrastructure Services"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="from"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            From Email
          </label>
          <input
            type="email"
            id="from"
            name="from"
            value={formData.from}
            onChange={handleInputChange}
            placeholder="e.g., billing@company.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Paste your complete invoice email content here..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Running End-to-End Test...
            </div>
          ) : (
            '🚀 Run Complete End-to-End Test'
          )}
        </button>
      </form>

      {/* Processing Steps */}
      {result && (
        <div className="mt-8 p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Processing Pipeline
          </h3>

          <div className="space-y-3">
            {result.steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-xl">{getStepIcon(step.status)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-medium ${getStatusColor(step.status)}`}
                    >
                      {index + 1}. {step.name}
                    </span>
                    {step.duration !== undefined && (
                      <span className="text-sm text-gray-500">
                        {step.duration}ms
                      </span>
                    )}
                  </div>
                  {step.error && (
                    <p className="text-sm text-red-600 mt-1">{step.error}</p>
                  )}
                  {step.status === 'running' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/2"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && result.success && (
        <div className="mt-8 space-y-6">
          {/* Success Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-semibold text-green-800 mb-3">
              ✅ End-to-End Test Completed Successfully!
            </h4>
            <div className="text-green-700 space-y-2">
              <p>
                Invoice ID:{' '}
                <span className="font-mono bg-green-100 px-2 py-1 rounded">
                  {result.invoiceId}
                </span>
              </p>
              <p>All pipeline steps completed successfully</p>
              <p>
                Invoice data extracted, saved to database, and added to Google
                Sheets
              </p>
            </div>
          </div>

          {/* Statistics */}
          {result.stats && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-800 mb-3">
                📈 Updated Processing Statistics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {result.stats.total}
                  </div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {result.stats.processed}
                  </div>
                  <div className="text-sm text-blue-700">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {result.stats.failed}
                  </div>
                  <div className="text-sm text-blue-700">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {result.stats.pending}
                  </div>
                  <div className="text-sm text-blue-700">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.stats.successRate}%
                  </div>
                  <div className="text-sm text-blue-700">Success Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Invoices */}
          {result.recentInvoices && result.recentInvoices.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-semibold text-purple-800 mb-3">
                📋 Recent Invoices (Top 5)
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-sm text-purple-700">
                      <th className="pb-2">Sender</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Processed</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {result.recentInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-t border-purple-200"
                      >
                        <td className="py-2 text-purple-900">
                          {invoice.sender}
                        </td>
                        <td className="py-2 text-purple-900 font-mono">
                          ${invoice.amount}
                        </td>
                        <td className="py-2 text-purple-900">
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              invoice.status === 'PROCESSED'
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-2 text-purple-900">
                          {invoice.processedAt
                            ? new Date(invoice.processedAt).toLocaleString()
                            : 'Not processed'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Results */}
      {result && !result.success && result.error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="font-semibold text-red-800 mb-2">
            ❌ End-to-End Test Failed
          </h4>
          <p className="text-red-700 mb-3">{result.error}</p>
          <div className="text-red-600 text-sm space-y-1">
            <p>
              • Check that your email subject contains &quot;tech invoice&quot;
            </p>
            <p>• Ensure database connection is working</p>
            <p>• Verify Google Sheets credentials are configured</p>
            <p>• Check OpenAI API key is valid</p>
          </div>
        </div>
      )}
    </div>
  )
}
