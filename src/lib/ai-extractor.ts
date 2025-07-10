import OpenAI from 'openai'
import type { ExtractedInvoiceData, EmailData } from '@/types/invoice'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const EXTRACTION_PROMPT = `Extract invoice information from this email and return ONLY a JSON object.

Email: [EMAIL_CONTENT]

Return JSON with these exact fields:
{
  "sender": "company or person name",
  "invoiceDate": "YYYY-MM-DD format",
  "amount": number (just the number, no currency symbols)
}

If any field cannot be determined, use null.`

export class AIExtractor {
  async extractInvoiceData(
    emailData: EmailData
  ): Promise<ExtractedInvoiceData> {
    try {
      const emailContent = `
Subject: ${emailData.subject}
From: ${emailData.from}
Content: ${emailData.content}
      `.trim()

      const prompt = EXTRACTION_PROMPT.replace('[EMAIL_CONTENT]', emailContent)

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at extracting structured invoice data from emails. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      // Parse the JSON response
      const extractedData = JSON.parse(response) as ExtractedInvoiceData

      // Validate the response structure
      if (typeof extractedData !== 'object' || extractedData === null) {
        throw new Error('Invalid response format from AI')
      }

      // Ensure required fields exist (can be null)
      const result: ExtractedInvoiceData = {
        sender: extractedData.sender || null,
        invoiceDate: extractedData.invoiceDate || null,
        amount: extractedData.amount || null,
      }

      // Validate amount is a number if not null
      if (
        result.amount !== null &&
        (typeof result.amount !== 'number' || isNaN(result.amount))
      ) {
        result.amount = null
      }

      // Validate date format if not null
      if (result.invoiceDate !== null) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(result.invoiceDate)) {
          result.invoiceDate = null
        }
      }

      return result
    } catch (error) {
      console.error('Error extracting invoice data:', error)
      throw new Error(
        `Failed to extract invoice data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  async testExtraction(emailContent: string): Promise<ExtractedInvoiceData> {
    // Helper method for testing
    const testEmailData: EmailData = {
      id: 'test',
      subject: 'Tech Invoice',
      content: emailContent,
      from: 'test@example.com',
      receivedAt: new Date(),
    }

    return this.extractInvoiceData(testEmailData)
  }
}

// Export a singleton instance
export const aiExtractor = new AIExtractor()
