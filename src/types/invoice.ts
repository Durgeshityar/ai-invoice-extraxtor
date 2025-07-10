import { Invoice, Status } from '@prisma/client'

export type InvoiceRecord = Invoice

export type CreateInvoiceInput = {
  emailId: string
  sender: string
  invoiceDate: Date
  amount: number
  status?: Status
  errorMessage?: string
}

export type UpdateInvoiceInput = {
  sender?: string
  invoiceDate?: Date
  amount?: number
  status?: Status
  errorMessage?: string
  processedAt?: Date
}

export type ExtractedInvoiceData = {
  sender: string | null
  invoiceDate: string | null // YYYY-MM-DD format
  amount: number | null
}

export type EmailData = {
  id: string
  subject: string
  content: string
  from: string
  receivedAt: Date
}
