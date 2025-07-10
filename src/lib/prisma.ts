import { PrismaClient } from '@prisma/client'
import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/types/invoice'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database operations for invoices
export const invoiceDb = {
  // Create a new invoice record
  async create(data: CreateInvoiceInput) {
    return await prisma.invoice.create({
      data,
    })
  },

  // Update an existing invoice
  async update(id: string, data: UpdateInvoiceInput) {
    return await prisma.invoice.update({
      where: { id },
      data,
    })
  },

  // Get invoice by ID
  async findById(id: string) {
    return await prisma.invoice.findUnique({
      where: { id },
    })
  },

  // Get all invoices with pagination
  async findMany(limit: number = 50, offset: number = 0) {
    return await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  },

  // Get invoice statistics
  async getStats() {
    const [total, processed, failed, pending] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PROCESSED' } }),
      prisma.invoice.count({ where: { status: 'FAILED' } }),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
    ])

    return { total, processed, failed, pending }
  },

  // Get recent invoices for dashboard
  async getRecent(limit: number = 10) {
    return await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },
}
