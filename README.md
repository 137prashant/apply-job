# Job Application Manager

A comprehensive Next.js application for managing job applications, tracking email communications, and automating personalized job application emails. This tool helps job seekers efficiently manage multiple job applications with automated email sending, tracking, and analytics.

## 🚀 Features

### 📧 Email Management
- **Bulk Email Import**: Add multiple email addresses at once (comma, semicolon, or newline separated)
- **Smart Email Filtering**: Automatically filters out personal email providers (Gmail, Yahoo, Hotmail, etc.)
- **Duplicate Detection**: Automatically removes duplicate email addresses
- **Email Validation**: Validates email format before adding to database
- **Automatic Name & Company Extraction**: 
  - Extracts recipient name from email address (e.g., `niketan@optimite.net` → Name: "Niketan")
  - Extracts company name from domain (e.g., `niketan@optimite.net` → Company: "Optimite")
- **Manual Editing**: Edit names and company names directly in the UI
- **HR Reply Tracking**: Track which companies have replied to your applications

### 📤 Email Sending
- **Personalized Email Templates**: Automatically personalized with recipient name and company
- **Bulk Email Sending**: Send emails to multiple recipients with random delays (10-100 seconds) to avoid spam detection
- **CV Attachment**: Automatically attaches your resume/CV to emails
- **Email Preview**: Preview emails before sending
- **Progress Tracking**: Real-time progress bar showing email sending status
- **Gmail Safety**: Built-in safety features with random delays and rate limiting awareness

### 📊 Application Tracking
- **Application Status**: Track which applications have been sent (Applied/Pending)
- **Application Count**: Track how many times you've applied to each company
- **Statistics Dashboard**: View comprehensive statistics including:
  - Total applications
  - Applied vs Pending count
  - HR reply status
  - Application history
- **Advanced Filtering**: Filter by status, application count, name, company, and HR reply status
- **Search Functionality**: Search across emails, names, and company names
- **Export to Excel**: Export all application data to Excel for external analysis

### 🎯 Smart Features
- **Company Name Extraction**: Automatically extracts company name from email domain
- **Name Extraction**: Extracts recipient name from email local part
- **Default Fallbacks**: Uses "your company" if company name not found, "Hiring Manager" if name not found
- **Email Template Customization**: Professional email template with company-specific personalization

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4
- **Frontend**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **Database**: SQLite3
- **Email Service**: Nodemailer
- **Excel Export**: XLSX
- **Language**: JavaScript

## 📋 Prerequisites

- Node.js 18+ and npm
- Gmail account (or other email provider) with App Password enabled
- A resume/CV file (PDF format recommended)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jobapply
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the project root:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Configure Gmail App Password** (if using Gmail)
   
   - Enable 2-factor authentication on your Google account
   - Go to [Google Account Settings](https://myaccount.google.com/) → Security → App passwords
   - Generate an App Password for "Mail"
   - Use this App Password (not your regular password) in `EMAIL_PASS`

5. **Add your CV**
   
   Place your resume file in the `public/` directory as `Niketan-Wadaskar-Resume.pdf` (or update the path in the code)

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Adding Email Addresses

1. Go to the **"Email Management"** tab
2. Paste email addresses in the text area (separated by commas, semicolons, or new lines)
3. The system will automatically:
   - Filter out Gmail addresses
   - Remove duplicates
   - Extract names and company names from email addresses
   - Validate email formats
4. Click **"Add Emails"**

**Example:**
```
niketan@optimite.net
john.doe@techcorp.com
hr@startup.io
```

### Editing Names and Companies

1. In the **Email Management** tab, find the email you want to edit
2. Click **"Edit"** next to the name or company field
3. Enter the new value
4. Press **Enter** to save or **Escape** to cancel

### Sending Emails

1. Go to the **"Send Emails"** tab
2. Use filters to find the emails you want to send to:
   - Search by email, name, or company
   - Filter by status (All/Applied/Pending)
   - Filter by application count
   - Filter by name status
   - Exclude HR replied emails
3. Select emails using checkboxes (or click "Select All")
4. Optionally specify a custom CV path (defaults to `public/Niketan-Wadaskar-Resume.pdf`)
5. Click **"Preview"** to see how the email will look
6. Click **"Send to X emails"** to send
7. Monitor progress with the progress bar

**Note**: The system automatically adds random delays (10-100 seconds) between emails to avoid spam detection.

### Tracking Applications

1. Go to the **"Application Tracker"** tab
2. View statistics:
   - Total applications
   - Applied count
   - Pending count
   - HR replied count
3. Use filters to find specific applications
4. Export data to Excel using the **"Export to Excel"** button

### Marking HR Replies

1. In **Email Management** or **Application Tracker** tab
2. Check the **"HR Replied"** checkbox for companies that have responded
3. Optionally add notes about the reply
4. The system will track this for analytics

## 📧 Email Template

The application uses a professional email template that includes:

**Subject**: `Application for Frontend Developer – [Company Name]`

**Body**:
```
Dear [Name/Hiring Manager],

I'm applying for the Frontend Developer role at [Company Name]. With 3.7 years of experience, I build fast, scalable, and maintainable web applications using React, Next.js, and TypeScript, backed by Node.js and Express for API development.

I've worked on production systems involving SSR/SSG, performance optimization, clean component architecture, REST APIs, authentication flows, and backend integrations. I'm comfortable owning features end-to-end—from UI to server logic—and collaborating closely with product and backend teams.

I'm available to join immediately and would love to discuss how I can contribute to [Company Name]'s frontend and web platform initiatives.

Best regards,
Niketan Wadaskar

📞 +91 7387162902
🔗 LinkedIn: [Your LinkedIn URL]
💻 GitHub: [Your GitHub URL]
```

The template automatically:
- Uses the extracted/edited name in the greeting
- Inserts the company name throughout the email
- Falls back to "your company" if company name is not set
- Falls back to "Hiring Manager" if name is not set

## 📁 Project Structure

```
jobapply/
├── app/
│   ├── api/
│   │   ├── emails/
│   │   │   ├── route.js              # Email CRUD operations
│   │   │   ├── send/route.js         # Email sending endpoint
│   │   │   └── [email]/route.js      # Individual email operations
│   │   ├── excel/
│   │   │   └── export/route.js       # Excel export functionality
│   │   └── test-email/route.js       # Email testing endpoint
│   ├── components/
│   │   ├── EmailManager.js           # Email management interface
│   │   ├── ApplicationTracker.js     # Application tracking & analytics
│   │   └── EmailSender.js            # Email sending interface
│   ├── page.js                       # Main page component
│   ├── layout.js                     # Root layout
│   └── globals.css                   # Global styles
├── lib/
│   ├── database.js                   # SQLite database operations
│   ├── emailService.js               # Email sending service (Nodemailer)
│   ├── emailFilter.js                # Email filtering, validation, extraction
│   ├── emailTemplate.js              # Email template generation
│   └── excelService.js               # Excel import/export
├── public/
│   ├── Niketan-Wadaskar-Resume.pdf   # Default CV file
│   └── [icons and assets]
├── job_applications.db               # SQLite database (auto-generated)
├── .env.local                        # Environment variables (create this)
├── package.json
└── README.md
```

## 🗄️ Database Schema

The SQLite database (`job_applications.db`) stores:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| email | TEXT | Email address (unique) |
| name | TEXT | Recipient name |
| company | TEXT | Company name |
| isApplied | BOOLEAN | Application status |
| appliedDate | TEXT | Date when application was sent |
| applicationCount | INTEGER | Number of times applied |
| hrReplied | BOOLEAN | Whether HR has replied |
| hrReplyNotes | TEXT | Notes about HR reply |
| createdAt | TEXT | Record creation timestamp |
| updatedAt | TEXT | Last update timestamp |

## 🔍 How Name & Company Extraction Works

### Name Extraction
The system extracts names from email addresses using the following logic:

- **Single word emails**: `niketan@optimite.net` → Name: "Niketan"
- **Multi-word emails**: `john.doe@company.com` → Name: "John Doe"
- **HR patterns**: `hr@company.com` → Name: null (uses "Hiring Manager")
- **Company patterns**: `admin@company.com` → Name: null (uses "Hiring Manager")

### Company Extraction
The system extracts company names from email domains:

- `niketan@optimite.net` → Company: "Optimite"
- `john@techcorp.com` → Company: "Techcorp"
- `hr@mail.startup.io` → Company: "Startup" (removes subdomains)

## ⚙️ Configuration

### Email Service Configuration

The email service is configured in `lib/emailService.js`. By default, it uses Gmail. To use a different provider:

1. Update the `service` field in the transporter configuration
2. Update SMTP settings if needed
3. Adjust authentication method if required

### Email Template Customization

Edit `lib/emailTemplate.js` to customize:
- Email subject line
- Email body content
- Your personal information (name, phone, LinkedIn, GitHub)
- Years of experience
- Job title

### CV Path Configuration

Default CV path: `public/Niketan-Wadaskar-Resume.pdf`

To use a different CV:
1. Place your CV in the `public/` directory
2. Update the filename in `lib/emailService.js` (line 55)
3. Or specify a custom path when sending emails

## 🚨 Troubleshooting

### Email Sending Issues

**Problem**: Emails not sending
- ✅ Verify `EMAIL_USER` and `EMAIL_PASS` in `.env.local`
- ✅ For Gmail, ensure you're using an App Password, not your regular password
- ✅ Check that 2-factor authentication is enabled on your Google account
- ✅ Verify your email service connection using the test endpoint

**Problem**: Emails going to spam
- ✅ The system includes random delays (10-100 seconds) between emails
- ✅ Start with 5-10 emails per day and gradually increase
- ✅ Use personalized content (names and companies are automatically included)
- ✅ Consider using a business email instead of personal Gmail

### Database Issues

**Problem**: Database errors
- ✅ The SQLite database is created automatically on first run
- ✅ If you encounter issues, delete `job_applications.db` and restart the app
- ✅ Ensure the app has write permissions in the project directory

### Name/Company Not Extracting

**Problem**: Names or companies not being extracted correctly
- ✅ Check the email format (should be `name@company.domain`)
- ✅ Manually edit names and companies using the Edit button
- ✅ The system extracts from the email when added, but you can always edit later

### CV Attachment Issues

**Problem**: CV not attaching
- ✅ Ensure the CV file exists in the `public/` directory
- ✅ Default filename: `Niketan-Wadaskar-Resume.pdf`
- ✅ Supported formats: PDF (recommended), DOC, DOCX
- ✅ Use absolute paths for custom CV locations

## 📝 Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use App Passwords for Gmail (not your regular password)
- Keep your email credentials secure
- The database file contains sensitive information - keep it secure

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and for personal use.

## 👤 Author

**Niketan Wadaskar**
- LinkedIn: [Your LinkedIn Profile](https://www.linkedin.com/in/niketan-wadaskar-3188321a0/)
- GitHub: [@niketanwadaskar](https://github.com/niketanwadaskar)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Email service powered by [Nodemailer](https://nodemailer.com/)
- Database: [SQLite3](https://www.sqlite.org/)
- Excel export: [XLSX](https://sheetjs.com/)

---

**Note**: This application is designed to help job seekers manage their applications efficiently. Always follow email best practices and respect rate limits to avoid being flagged as spam.
