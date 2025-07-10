import { NextRequest, NextResponse } from 'next/server'
import { invoiceProcessor } from '@/lib/invoice-processor'
import { invoiceDb } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Check if invoice exists
    const invoice = await invoiceDb.findById(invoiceId)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Reprocess the invoice
    console.log(`Manual reprocessing requested for invoice: ${invoiceId}`)
    const result = await invoiceProcessor.reprocessInvoice(invoiceId)

    if (result.success) {
      return NextResponse.json({
        message: 'Invoice reprocessed successfully',
        invoiceId,
      })
    } else {
      return NextResponse.json(
        {
          error: 'Failed to reprocess invoice',
          details: result.error,
          invoiceId,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in process API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Get invoice details
    const invoice = await invoiceDb.findById(invoiceId)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error in process API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
