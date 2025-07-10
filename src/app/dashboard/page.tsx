'use client'

import { useState, useEffect } from 'react'
import { InvoiceTable } from '@/components/InvoiceTable'
import type { InvoiceRecord } from '@/types/invoice'

interface Stats {
  total: number
  processed: number
  failed: number
  pending: number
  successRate: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch stats and recent invoices in parallel
      const [statsResponse, invoicesResponse] = await Promise.all([
        fetch('/api/invoices?action=stats'),
        fetch('/api/invoices?action=recent&limit=20'),
      ])

      if (!statsResponse.ok || !invoicesResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const [statsData, invoicesData] = await Promise.all([
        statsResponse.json(),
        invoicesResponse.json(),
      ])

      setStats(statsData)
      setRecentInvoices(invoicesData)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleReprocess = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/process/${invoiceId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reprocess invoice')
      }

      // Refresh data after reprocessing
      await fetchData()
    } catch (err) {
      console.error('Error reprocessing invoice:', err)
      alert(
        `Failed to reprocess invoice: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      )
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium">
            Error loading dashboard
          </div>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    color = 'blue',
  }: {
    title: string
    value: string | number
    subtitle?: string
    color?: 'blue' | 'green' | 'red' | 'yellow'
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    }

    return (
      <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-sm opacity-70 mt-1">{subtitle}</p>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Invoice Processing Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage your invoice processing pipeline
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard title="Total Invoices" value={stats.total} color="blue" />
            <StatCard title="Processed" value={stats.processed} color="green" />
            <StatCard title="Failed" value={stats.failed} color="red" />
            <StatCard title="Pending" value={stats.pending} color="yellow" />
            <StatCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              subtitle={
                stats.total > 0
                  ? `${stats.processed}/${stats.total}`
                  : 'No data'
              }
              color="green"
            />
          </div>
        )}

        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Invoices
            </h2>
            <button
              onClick={fetchData}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
          <div className="p-6">
            <InvoiceTable
              invoices={recentInvoices}
              onReprocess={handleReprocess}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
