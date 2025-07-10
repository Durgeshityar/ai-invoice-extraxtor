import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import type { InvoiceRecord } from '@/types/invoice'

export class SheetsClient {
  private doc: GoogleSpreadsheet | null = null

  private async getDocument(): Promise<GoogleSpreadsheet> {
    if (this.doc) {
      return this.doc
    }

    const sheetId = process.env.GOOGLE_SHEET_ID
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID environment variable is required')
    }

    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Google service account credentials are required')
    }

    try {
      // Create JWT auth client
      const serviceAccountAuth = new JWT({
        email: serviceAccountEmail,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      // Initialize the document with auth
      this.doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth)
      await this.doc.loadInfo()

      return this.doc
    } catch (error) {
      console.error('Error initializing Google Sheets client:', error)
      throw new Error(
        `Failed to initialize Google Sheets client: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  async addInvoiceRow(invoice: InvoiceRecord): Promise<void> {
    try {
      const doc = await this.getDocument()

      // Get the first sheet or create one if it doesn't exist
      let sheet = doc.sheetsByIndex[0]

      if (!sheet) {
        // Create new sheet with headers
        sheet = await doc.addSheet({
          title: 'Invoices',
          headerValues: [
            'Sender',
            'Invoice Date',
            'Amount',
            'Processed At',
            'Status',
          ],
        })
      } else {
        // Load the sheet to check its current state
        await sheet.loadCells('A1:E1') // Load first row to check headers

        // Check if the first row is empty or doesn't have proper headers
        const firstRowEmpty =
          !sheet.getCell(0, 0).value &&
          !sheet.getCell(0, 1).value &&
          !sheet.getCell(0, 2).value

        if (firstRowEmpty) {
          // Set up headers manually by updating cells
          sheet.getCell(0, 0).value = 'Sender'
          sheet.getCell(0, 1).value = 'Invoice Date'
          sheet.getCell(0, 2).value = 'Amount'
          sheet.getCell(0, 3).value = 'Processed At'
          sheet.getCell(0, 4).value = 'Status'

          // Save the header row
          await sheet.saveUpdatedCells()

          // Now load the header row so the sheet knows about it
          await sheet.loadHeaderRow()
        } else {
          // Try to load existing headers
          try {
            await sheet.loadHeaderRow()
          } catch (headerError) {
            console.warn(
              'Could not load existing headers, attempting to reset:',
              headerError
            )
            // If loading headers fails, reset them
            sheet.getCell(0, 0).value = 'Sender'
            sheet.getCell(0, 1).value = 'Invoice Date'
            sheet.getCell(0, 2).value = 'Amount'
            sheet.getCell(0, 3).value = 'Processed At'
            sheet.getCell(0, 4).value = 'Status'
            await sheet.saveUpdatedCells()
            await sheet.loadHeaderRow()
          }
        }
      }

      // Add the invoice row
      await sheet.addRow({
        Sender: invoice.sender,
        'Invoice Date': invoice.invoiceDate.toISOString().split('T')[0], // YYYY-MM-DD format
        Amount: invoice.amount,
        'Processed At':
          invoice.processedAt?.toISOString() || new Date().toISOString(),
        Status: invoice.status,
      })

      console.log(`Successfully added invoice ${invoice.id} to Google Sheets`)
    } catch (error) {
      console.error('Error adding invoice to Google Sheets:', error)
      throw new Error(
        `Failed to add invoice to Google Sheets: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  async addInvoiceRowRetry(
    invoice: InvoiceRecord,
    maxRetries: number = 3
  ): Promise<void> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.addInvoiceRow(invoice)
        return // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.warn(
          `Attempt ${attempt} failed to add invoice to Google Sheets:`,
          lastError.message
        )

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
        }
      }
    }

    throw (
      lastError ||
      new Error('Failed to add invoice to Google Sheets after retries')
    )
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getDocument()
      return true
    } catch (error) {
      console.error('Google Sheets connection test failed:', error)
      return false
    }
  }
}

// Export a singleton instance
export const sheetsClient = new SheetsClient()
