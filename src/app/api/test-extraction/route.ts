import { NextRequest, NextResponse } from 'next/server'
import { aiExtractor } from '@/lib/ai-extractor'
import type { EmailData } from '@/types/invoice'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.subject || !body.content || !body.from) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, content, from' },
        { status: 400 }
      )
    }

    // Create email data object for testing
    const emailData: EmailData = {
      id: 'test-' + Date.now(), // Generate test ID
      subject: body.subject,
      content: body.content,
      from: body.from,
      receivedAt: new Date(),
    }

    // Extract invoice data using AI
    console.log('Testing AI extraction for:', emailData.subject)
    const extractedData = await aiExtractor.extractInvoiceData(emailData)

    // Return the extracted data
    return NextResponse.json({
      success: true,
      extractedData,
      originalEmail: {
        subject: emailData.subject,
        from: emailData.from,
        content: emailData.content.substring(0, 200) + '...', // Truncate for response
      },
    })
  } catch (error) {
    console.error('Error in test extraction:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to extract invoice data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Health check for test endpoint
  return NextResponse.json({
    message: 'AI extraction test endpoint is running',
    timestamp: new Date().toISOString(),
  })
}
