import { aiExtractor } from './ai-extractor'
import { sheetsClient } from './sheets-client'
import { invoiceDb } from './prisma'
import type { EmailData } from '@/types/invoice'

export class InvoiceProcessor {
  async processEmailInvoice(
    emailData: EmailData
  ): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    let invoiceId: string | undefined

    try {
      console.log(`Processing email invoice: ${emailData.id}`)

      // Step 1: Create pending invoice record
      const pendingInvoice = await invoiceDb.create({
        emailId: emailData.id,
        sender: emailData.from, // Temporary value, will be updated with AI extraction
        invoiceDate: emailData.receivedAt, // Temporary value
        amount: 0, // Temporary value
        status: 'PENDING',
      })

      invoiceId = pendingInvoice.id
      console.log(`Created pending invoice record: ${invoiceId}`)

      // Step 2: Extract invoice data using AI
      console.log('Extracting invoice data with AI...')
      const extractedData = await aiExtractor.extractInvoiceData(emailData)

      // Validate extracted data
      if (
        !extractedData.sender ||
        !extractedData.invoiceDate ||
        !extractedData.amount
      ) {
        throw new Error(
          `Incomplete extraction: sender=${extractedData.sender}, date=${extractedData.invoiceDate}, amount=${extractedData.amount}`
        )
      }

      // Convert date string to Date object
      const invoiceDate = new Date(extractedData.invoiceDate)
      if (isNaN(invoiceDate.getTime())) {
        throw new Error(`Invalid date format: ${extractedData.invoiceDate}`)
      }

      // Step 3: Update invoice record with extracted data and mark as processed
      console.log('Updating invoice record with extracted data...')
      const updatedInvoice = await invoiceDb.update(invoiceId, {
        sender: extractedData.sender,
        invoiceDate: invoiceDate,
        amount: extractedData.amount,
        status: 'PROCESSED',
        processedAt: new Date(),
      })

      // Step 4: Add to Google Sheets
      console.log('Adding invoice to Google Sheets...')
      await sheetsClient.addInvoiceRowRetry(updatedInvoice)

      console.log(`Successfully processed invoice: ${invoiceId}`)
      return { success: true, invoiceId }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      console.error(`Error processing invoice ${invoiceId}:`, errorMessage)

      // Update invoice record with error
      if (invoiceId) {
        try {
          await invoiceDb.update(invoiceId, {
            status: 'FAILED',
            errorMessage,
            processedAt: new Date(),
          })
        } catch (updateError) {
          console.error('Error updating failed invoice record:', updateError)
        }
      }

      return { success: false, invoiceId, error: errorMessage }
    }
  }

  async reprocessInvoice(
    invoiceId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Reprocessing invoice: ${invoiceId}`)

      const invoice = await invoiceDb.findById(invoiceId)
      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Reset status to pending
      await invoiceDb.update(invoiceId, {
        status: 'PENDING',
        errorMessage: undefined,
        processedAt: undefined,
      })

      // Create email data from invoice record
      const emailData: EmailData = {
        id: invoice.emailId,
        subject: 'Tech Invoice', // We don't store this, so use default
        content: `From: ${invoice.sender}\nAmount: ${invoice.amount}`, // Reconstructed content
        from: invoice.sender,
        receivedAt: invoice.createdAt,
      }

      // Process again
      const result = await this.processEmailInvoice(emailData)
      return { success: result.success, error: result.error }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      console.error(`Error reprocessing invoice ${invoiceId}:`, errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  async getProcessingStats(): Promise<{
    total: number
    processed: number
    failed: number
    pending: number
    successRate: number
  }> {
    const stats = await invoiceDb.getStats()
    const successRate =
      stats.total > 0 ? (stats.processed / stats.total) * 100 : 0

    return {
      ...stats,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    }
  }

  async validateEmailForProcessing(
    emailData: EmailData
  ): Promise<{ isValid: boolean; reason?: string }> {
    // Check if subject contains "tech invoice"
    if (!emailData.subject.toLowerCase().includes('tech invoice')) {
      return {
        isValid: false,
        reason: 'Subject does not contain "tech invoice"',
      }
    }

    // Check if email has content
    if (!emailData.content || emailData.content.trim().length === 0) {
      return { isValid: false, reason: 'Email has no content' }
    }

    // Check if we've already processed this email
    const existingInvoice = await invoiceDb.findMany(1, 0)
    const alreadyProcessed = existingInvoice.some(
      (invoice) => invoice.emailId === emailData.id
    )

    if (alreadyProcessed) {
      return { isValid: false, reason: 'Email already processed' }
    }

    return { isValid: true }
  }
}

// Export a singleton instance
export const invoiceProcessor = new InvoiceProcessor()
