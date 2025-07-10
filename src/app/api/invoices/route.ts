import { NextRequest, NextResponse } from 'next/server'
import { invoiceDb } from '@/lib/prisma'
import { invoiceProcessor } from '@/lib/invoice-processor'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    switch (action) {
      case 'stats':
        const stats = await invoiceProcessor.getProcessingStats()
        return NextResponse.json(stats)

      case 'recent':
        const recentLimit = parseInt(url.searchParams.get('limit') || '10')
        const recentInvoices = await invoiceDb.getRecent(recentLimit)
        return NextResponse.json(recentInvoices)

      default:
        // Get all invoices with pagination
        const invoices = await invoiceDb.findMany(limit, offset)
        const totalCount = await invoiceDb.getStats()

        return NextResponse.json({
          invoices,
          pagination: {
            limit,
            offset,
            total: totalCount.total,
            hasMore: offset + limit < totalCount.total,
          },
        })
    }
  } catch (error) {
    console.error('Error in invoices API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
