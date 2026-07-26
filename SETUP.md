# Job Application Manager - Setup Guide

## Features

✅ **Email Management**
- Add multiple email addresses at once
- Automatic Gmail filtering (removes Gmail addresses)
- Duplicate detection and removal
- Email validation
- Manual name assignment for personalized greetings

✅ **Application Tracking**
- Track application status (Applied/Pending)
- View application statistics
- Export to Excel
- Application history and analytics

✅ **Email Sending**
- Bulk email sending with personalized templates
- CV attachment support
- Email preview functionality
- Automatic status updates after sending

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Email Configuration

Create a `.env.local` file in your project root:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**For Gmail users:**
1. Enable 2-factor authentication on your Google account
2. Go to Google Account settings → Security → App passwords
3. Generate an App Password for "Mail"
4. Use this App Password (not your regular password) in EMAIL_PASS

**For other email providers:**
- Use your regular email credentials
- Update the SMTP settings in `lib/emailService.js` if needed

### 3. CV File Setup

Place your CV file in the project directory and update the path in the Email Sender tab when sending emails.

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to use the application.

## Usage Guide

### Adding Email Addresses
1. Go to "Email Management" tab
2. Paste email addresses (separated by commas, semicolons, or new lines)
3. Gmail addresses will be automatically filtered out
4. Duplicates will be removed
5. Click "Add Emails"

### Setting Names for Personalized Greetings
1. In the Email Management tab, click "Edit" next to any email
2. Enter the person's name (e.g., "John Doe" or "Hiring Manager")
3. This will personalize the email greeting: "Dear John Doe," or "Dear Hiring Manager,"

### Sending Emails
1. Go to "Send Emails" tab
2. Select emails you want to send to
3. Optionally specify CV file path
4. Preview emails before sending
5. Click "Send to X emails"

### Tracking Applications
1. Go to "Application Tracker" tab
2. View statistics and application history
3. Filter by status (All/Applied/Pending)
4. Export data to Excel

## Email Template

The system uses this email template:

**Subject:** Application for Frontend Developer Position

**Body:**
```
Dear [Name/Hiring Manager],

I am excited to apply for the Frontend Developer role. With 2 years of experience, 
I have worked with React.js, Next.js, Tailwind CSS, Material UI, Redux, JavaScript (ES6+), HTML5, 
and CSS3, along with proficiency in RESTful APIs, Git, and Node.js.

I am passionate about building scalable, user-friendly web applications 
with expertise in responsive UI, API integrations, and performance optimization.

I have collaborated with backend and design teams to deliver pixel-perfect, data-driven solutions. 
As an immediate joiner, I look forward to discussing how my skills can contribute to your team's success.

Looking forward to your response.

Best regards,
Prashant Singh
📱 +91 9504334245
LinkedIn: https://linkedin.com/in/prashant-singh
Portfolio: https://your-portfolio.com
GitHub: https://github.com/prashant-singh
```

## Database

The application uses SQLite database (`job_applications.db`) to store:
- Email addresses
- Names
- Application status
- Applied dates
- Creation timestamps

## File Structure

```
app/
├── components/
│   ├── EmailManager.js      # Email management interface
│   ├── ApplicationTracker.js # Application tracking and analytics
│   └── EmailSender.js       # Email sending interface
├── api/
│   ├── emails/
│   │   ├── route.js         # Email CRUD operations
│   │   ├── send/route.js    # Email sending endpoint
│   │   └── [email]/route.js # Individual email operations
│   └── excel/
│       └── export/route.js  # Excel export functionality
lib/
├── database.js              # Database operations
├── emailService.js          # Email sending service
├── emailFilter.js           # Email filtering and validation
└── excelService.js          # Excel import/export
```

## Troubleshooting

### Email Sending Issues
- Verify EMAIL_USER and EMAIL_PASS in .env.local
- For Gmail, ensure you're using an App Password, not your regular password
- Check that 2-factor authentication is enabled

### Database Issues
- The SQLite database is created automatically
- If you encounter issues, delete `job_applications.db` and restart the app

### CV Attachment Issues
- Ensure the CV file path is correct and the file exists
- Supported formats: PDF, DOC, DOCX
- Use absolute paths for best results

