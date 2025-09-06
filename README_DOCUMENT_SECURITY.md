# Document Security Portal

A comprehensive ReactJS application for internal document management with sensitive information detection, built with Next.js 13, Redux Toolkit, and Shadcn/UI.

## 🚀 Features

### Authentication & Security
- **2FA Authentication**: Two-factor authentication with OTP verification
- **JWT + Refresh Token**: Secure token-based authentication with automatic refresh
- **MD5 Password Hashing**: Passwords are hashed before transmission
- **Role-Based Access Control**: Admin and User roles with appropriate permissions
- **Protected Routes**: Route-level security with role-based authorization

### Document Management
- **Drag & Drop Upload**: Easy document upload with react-dropzone
- **File Type Support**: PDF, DOC, DOCX, and TXT files
- **Real-time Processing**: Live upload progress and processing status
- **Document Viewer**: Integrated PDF viewer with sensitive data highlighting
- **Download & Share**: Secure document download and sharing capabilities

### Sensitive Information Detection
- **AI-Powered Scanning**: Automatic detection of sensitive information
- **Multiple Data Types**: PII, Financial, Medical, and Confidential data detection
- **Visual Highlighting**: Interactive highlighting of sensitive content in documents
- **Confidence Scoring**: AI confidence levels for detected sensitive data
- **Severity Levels**: Low, Medium, and High risk classifications

### Admin Features
- **Permission Management**: Share documents with specific users and permission levels
- **User Administration**: Manage user access and document permissions
- **Comprehensive Reports**: Analytics dashboard with charts and statistics
- **Activity Logging**: Complete audit trail of user actions
- **Export Capabilities**: PDF and CSV report generation

### User Interface
- **Modern Design**: Clean, modern interface with Shadcn/UI components
- **Fully Responsive**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: System theme support with manual toggle
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Interactive Charts**: Data visualization with Recharts

## 🛠️ Technology Stack

### Frontend
- **Next.js 13**: App Router, Server Components, and TypeScript
- **Redux Toolkit**: State management with RTK Query
- **Shadcn/UI**: Modern UI components with Tailwind CSS
- **React Hook Form**: Form handling with Zod validation
- **React PDF**: PDF document rendering and viewing
- **React Dropzone**: Drag and drop file uploads
- **Recharts**: Data visualization and charting

### Authentication
- **NextAuth.js**: Authentication framework
- **JWT**: JSON Web Tokens for secure authentication
- **Crypto-JS**: MD5 password hashing

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components
- **Lucide React**: Modern icon library
- **CSS Variables**: Theme customization support

## 📁 Project Structure

```
/app
├── (auth)/                 # Authentication routes
│   ├── login/             # Login page with 2FA
│   └── register/          # User registration
├── (dashboard)/           # Protected dashboard routes
│   └── dashboard/
│       ├── page.tsx       # Main dashboard
│       ├── upload/        # Document upload
│       ├── documents/     # Document list & viewer
│       └── admin/         # Admin-only features
│           ├── permissions/  # Permission management
│           └── reports/     # Analytics & reports
└── unauthorized/          # Access denied page

/components
├── ui/                    # Reusable UI components
├── dashboard-layout.tsx   # Main dashboard layout
├── enhanced-auth-form.tsx # 2FA authentication form
└── protected-route.tsx    # Route protection component

/lib
├── store/                 # Redux store configuration
│   └── slices/           # Redux slices for different features
└── auth.ts               # Authentication utilities

/hooks
└── use-auth.ts           # Authentication hook
```

## 🔐 Security Features

### Authentication Security
- **MD5 Password Hashing**: Passwords are hashed client-side before transmission
- **JWT Token Expiration**: Short-lived access tokens with automatic refresh
- **2FA Implementation**: Time-based OTP verification
- **Session Management**: Secure session handling with automatic logout

### Document Security
- **Access Control Lists**: Granular permission management (read, write, admin)
- **Sensitive Data Detection**: AI-powered scanning for:
  - Personal Identifiable Information (PII)
  - Financial data (account numbers, SSNs)
  - Medical information
  - Confidential business data
- **Audit Logging**: Complete activity tracking with IP addresses
- **Secure File Handling**: Virus scanning and file type validation

### Application Security
- **XSS Protection**: Input sanitization and CSP headers
- **CSRF Protection**: Token-based request validation
- **Route Protection**: Role-based access control
- **Data Validation**: Server-side validation with Zod schemas

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Database (PostgreSQL recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AICompetitionWeb
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret
   DATABASE_URL=postgresql://username:password@localhost:5432/database
   
   # Email configuration
   SMTP_FROM=noreply@yourdomain.com
   POSTMARK_API_TOKEN=your-postmark-token
   POSTMARK_SIGN_IN_TEMPLATE=your-template-id
   POSTMARK_ACTIVATION_TEMPLATE=your-template-id
   
   # OAuth (optional)
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full feature set with multi-column layouts
- **Tablet**: Collapsible sidebar and touch-friendly interfaces  
- **Mobile**: Stack layouts, hamburger navigation, and optimized forms

### Responsive Features
- Collapsible sidebar navigation
- Adaptive grid layouts
- Touch-friendly drag and drop
- Mobile-optimized data tables
- Responsive charts and visualizations

## 🔧 API Integration

The application uses RTK Query for API integration with endpoints for:
- Authentication and user management
- Document upload and processing
- Sensitive data detection results  
- Permission management
- Analytics and reporting

### API Endpoints Structure
```
/api
├── auth/                  # Authentication endpoints
├── documents/            # Document CRUD operations
├── users/               # User management
└── reports/             # Analytics data
```

## 📊 Analytics & Reporting

### Dashboard Metrics
- Total documents uploaded
- Sensitive data detection rate
- User activity statistics
- Upload trends over time

### Admin Reports
- Document status distribution
- Sensitive data by type breakdown
- User activity logs
- Security incident reports
- Exportable PDF/CSV reports

## 🎨 Customization

### Theming
The application supports custom theming through CSS variables:
```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 98%;
  --accent: 210 40% 96%;
  /* ... more variables */
}
```

### Component Customization
All UI components are built with Shadcn/UI and can be easily customized:
- Modify component variants
- Extend with additional props
- Override default styles

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

## 📦 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t document-security .
docker run -p 3000:3000 document-security
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Shadcn/UI](https://ui.shadcn.com/) - UI component library
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management
- [Recharts](https://recharts.org/) - Chart library
- [React PDF](https://react-pdf.org/) - PDF rendering
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

## 🔮 Future Enhancements

- **OCR Integration**: Extract text from scanned documents
- **Advanced AI Models**: Improved sensitive data detection
- **Real-time Collaboration**: Document collaboration features
- **API Integration**: Connect with external security tools
- **Mobile App**: React Native companion app
- **Advanced Permissions**: Fine-grained access control
- **Workflow Automation**: Document approval processes
- **Integration APIs**: Connect with existing document systems

---

**Built with ❤️ for secure document management**
