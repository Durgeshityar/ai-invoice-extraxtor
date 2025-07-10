# AI Invoice Processing System

An AI-powered invoice processing system that automatically extracts data from emails containing tech invoices and saves them to a database and Google Sheets.

## Features

- 🤖 **AI-Powered Extraction**: Uses OpenAI GPT-4 to extract sender, invoice date, and amount from emails
- 📧 **Email Webhook Processing**: Automatically processes emails with "tech invoice" in the subject line
- 📊 **Google Sheets Integration**: Automatically adds processed invoices to Google Sheets
- 💾 **Database Storage**: Stores all invoice data with processing status tracking
- 📈 **Dashboard**: Clean, modern dashboard to monitor processing statistics
- 🔄 **Retry Logic**: Automatic retry for failed Google Sheets operations
- 🛠️ **Manual Reprocessing**: Ability to retry failed invoice processing

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-4 API
- **Integrations**: Google Sheets API
- **Deployment**: Vercel

## Setup

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database (or use SQLite for local development)
- OpenAI API key
- Google Service Account for Sheets API

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/invoice_db"
# For local development with SQLite (alternative):
# DATABASE_URL="file:./dev.db"

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Google Sheets Integration
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email_here
GOOGLE_PRIVATE_KEY="your_private_key_here"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: View database in Prisma Studio
npx prisma studio
```

### 5. Google Sheets Setup

1. Create a Google Cloud Project
2. Enable the Google Sheets API
3. Create a Service Account
4. Download the service account JSON file
5. Share your Google Sheet with the service account email
6. Copy the Sheet ID from the URL and service account details to your `.env` file

### 6. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### Email Webhook

The system processes emails via webhook at `/api/webhook/email`. Send POST requests with this structure:

```json
{
  "id": "unique_email_id",
  "subject": "Tech Invoice from Company ABC",
  "content": "Invoice details...",
  "from": "company@example.com",
  "receivedAt": "2024-01-15T10:00:00Z"
}
```

### API Endpoints

- `POST /api/webhook/email` - Process incoming emails
- `GET /api/invoices?action=stats` - Get processing statistics
- `GET /api/invoices?action=recent&limit=10` - Get recent invoices
- `GET /api/invoices` - Get all invoices (with pagination)
- `POST /api/process/[id]` - Reprocess specific invoice
- `GET /api/process/[id]` - Get invoice details

### Dashboard

Access the dashboard at `/dashboard` to:

- View processing statistics (total, processed, failed, pending)
- Monitor recent invoices
- Retry failed processing
- See error messages for failed invoices

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── webhook/email/route.ts     # Email webhook handler
│   │   ├── process/[id]/route.ts      # Reprocess invoices
│   │   └── invoices/route.ts          # Invoice data API
│   ├── dashboard/
│   │   └── page.tsx                   # Dashboard page
│   └── page.tsx                       # Home page
├── lib/
│   ├── ai-extractor.ts               # OpenAI integration
│   ├── sheets-client.ts              # Google Sheets integration
│   ├── invoice-processor.ts          # Main processing pipeline
│   └── prisma.ts                     # Database client
├── components/
│   └── InvoiceTable.tsx              # Invoice table component
├── types/
│   └── invoice.ts                    # TypeScript interfaces
└── prisma/
    └── schema.prisma                 # Database schema
```

## Database Schema

```prisma
model Invoice {
  id           String    @id @default(cuid())
  emailId      String    @map("email_id")
  sender       String
  invoiceDate  DateTime  @map("invoice_date")
  amount       Float
  status       Status    @default(PENDING)
  errorMessage String?   @map("error_message")
  createdAt    DateTime  @default(now()) @map("created_at")
  processedAt  DateTime? @map("processed_at")

  @@map("invoices")
}

enum Status {
  PENDING
  PROCESSED
  FAILED
}
```

## AI Extraction

The system uses GPT-4 with this prompt template:

```
Extract invoice information from this email and return ONLY a JSON object:

Email: [EMAIL_CONTENT]

Return JSON with these exact fields:
{
  "sender": "company or person name",
  "invoiceDate": "YYYY-MM-DD format",
  "amount": number (just the number, no currency symbols)
}

If any field cannot be determined, use null.
```

## Error Handling

- All API routes have comprehensive error handling
- Failed invoices are stored in the database with error messages
- Google Sheets operations have retry logic with exponential backoff
- The dashboard displays error states and allows manual retry
- All async operations are wrapped in try-catch blocks

## Development Notes

### Google Sheets API Issues

If you encounter Google Sheets API compatibility issues, you may need to adjust the authentication method in `src/lib/sheets-client.ts` based on your version of the `google-spreadsheet` library.

### Database

- The system supports both PostgreSQL (production) and SQLite (development)
- Change the `DATABASE_URL` in your `.env` file to switch between them
- Prisma handles the database abstraction

### AI Extraction

- The system uses temperature 0.1 for consistent extraction
- Extracted data is validated before saving
- Invalid dates or amounts are set to null and marked as failed

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set all required environment variables:

- `DATABASE_URL` (PostgreSQL connection string)
- `OPENAI_API_KEY`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open a GitHub issue or contact the development team.
