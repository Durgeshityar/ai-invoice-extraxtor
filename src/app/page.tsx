import Link from 'next/link'
import EndToEndTestComponent from '@/components/EndToEndTestComponent'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Invoice Processing System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Automatically process tech invoices with AI-powered data extraction
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  1. Email Webhook
                </h3>
                <p className="text-gray-600">
                  Receives emails with &quot;tech invoice&quot; in the subject
                  line
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  2. AI Extraction
                </h3>
                <p className="text-gray-600">
                  Uses GPT-4 to extract sender, date, and amount from emails
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  3. Auto Processing
                </h3>
                <p className="text-gray-600">
                  Automatically saves to database and updates Google Sheets
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Dashboard
            </Link>
            <a
              href="/api/webhook/email"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Test Webhook Endpoint
            </a>
          </div>

          {/* End-to-End Test Component */}
          <div className="mt-12">
            <EndToEndTestComponent />
          </div>

          <div className="mt-12 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              API Endpoints
            </h3>
            <div className="text-left space-y-2">
              <div className="font-mono text-sm">
                <span className="text-green-600 font-semibold">POST</span>{' '}
                /api/webhook/email - Process incoming emails
              </div>
              <div className="font-mono text-sm">
                <span className="text-blue-600 font-semibold">GET</span>{' '}
                /api/invoices?action=stats - Get processing statistics
              </div>
              <div className="font-mono text-sm">
                <span className="text-blue-600 font-semibold">GET</span>{' '}
                /api/invoices?action=recent - Get recent invoices
              </div>
              <div className="font-mono text-sm">
                <span className="text-orange-600 font-semibold">POST</span>{' '}
                /api/process/[id] - Reprocess specific invoice
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
