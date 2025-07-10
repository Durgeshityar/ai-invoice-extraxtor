'use client'

import { useState } from 'react'
import type { InvoiceRecord } from '@/types/invoice'

interface InvoiceTableProps {
  invoices: InvoiceRecord[]
  onReprocess?: (invoiceId: string) => Promise<void>
}

export function InvoiceTable({ invoices, onReprocess }: InvoiceTableProps) {
  const [reprocessingIds, setReprocessingIds] = useState<Set<string>>(new Set())

  const handleReprocess = async (invoiceId: string) => {
    if (!onReprocess) return

    setReprocessingIds((prev) => new Set(prev.add(invoiceId)))
    try {
      await onReprocess(invoiceId)
    } finally {
      setReprocessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(invoiceId)
        return newSet
      })
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
    switch (status) {
      case 'PROCESSED':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'FAILED':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No invoices found</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sender
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {invoice.sender}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(invoice.invoiceDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatAmount(invoice.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={getStatusBadge(invoice.status)}>
                  {invoice.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(invoice.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {invoice.status === 'FAILED' && onReprocess && (
                  <button
                    onClick={() => handleReprocess(invoice.id)}
                    disabled={reprocessingIds.has(invoice.id)}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reprocessingIds.has(invoice.id)
                      ? 'Processing...'
                      : 'Retry'}
                  </button>
                )}
                {invoice.errorMessage && (
                  <div
                    className="mt-1 text-xs text-red-600 max-w-xs truncate"
                    title={invoice.errorMessage}
                  >
                    {invoice.errorMessage}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
