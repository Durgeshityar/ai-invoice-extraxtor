import { NextRequest, NextResponse } from 'next/server'
import { invoiceProcessor } from '@/lib/invoice-processor'
import type { EmailData } from '@/types/invoice'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields from webhook payload
    if (!body.id || !body.subject || !body.content || !body.from) {
      return NextResponse.json(
        { error: 'Missing required fields: id, subject, content, from' },
        { status: 400 }
      )
    }

    // Create email data object
    const emailData: EmailData = {
      id: body.id,
      subject: body.subject,
      content: body.content,
      from: body.from,
      receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date(),
    }

    // Validate email for processing
    const validation = await invoiceProcessor.validateEmailForProcessing(
      emailData
    )
    if (!validation.isValid) {
      console.log(
        `Email ${emailData.id} not valid for processing: ${validation.reason}`
      )
      return NextResponse.json(
        {
          message: 'Email not processed',
          reason: validation.reason,
        },
        { status: 200 } // Return 200 for webhook acknowledgment even if not processed
      )
    }

    // Process the email invoice
    console.log(`Processing email webhook for: ${emailData.id}`)
    const result = await invoiceProcessor.processEmailInvoice(emailData)

    if (result.success) {
      return NextResponse.json({
        message: 'Invoice processed successfully',
        invoiceId: result.invoiceId,
      })
    } else {
      return NextResponse.json(
        {
          error: 'Failed to process invoice',
          details: result.error,
          invoiceId: result.invoiceId,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in email webhook:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    message: 'Email webhook endpoint is running',
    timestamp: new Date().toISOString(),
  })
}
