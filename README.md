# AI Chat Hub

A production-ready ChatGPT-like application built with Next.js 15, TypeScript, and Tailwind CSS. Experience the power of AI with multiple models, real-time credit tracking, and a sleek user interface.

## ✨ Features

### 🤖 AI Chat Functionality
- **ChatGPT-like Interface**: Clean, intuitive chat interface with real-time messaging
- **Multiple AI Models**: Support for GPT-3.5, GPT-4, Claude 3, Gemini Pro, and more
- **Real-time Credit Usage**: Monitor your credit consumption as you chat
- **Chat History**: Persistent chat history with load/delete functionality
- **Markdown Support**: Rich text rendering with syntax highlighting for code
- **Export Capabilities**: Export conversations as TXT or HTML files

### 💳 Payment & Credits System
- **Local Payment Processing**: Integrated payment system (no Stripe dependency)
- **Credit-based Model**: Pay-per-use with different models costing different amounts
- **Subscription Plans**: Unlimited access with Pro subscription
- **Real-time Balance**: Live credit balance updates during conversations
- **Flexible Pricing**: Multiple credit pack options to suit different needs

### 🔐 Authentication & Security
- **NextAuth.js Integration**: Secure authentication with multiple providers
- **Google OAuth**: One-click signin with Google
- **Session Management**: Secure session handling with automatic updates
- **Protected Routes**: Authorization-based access control

### 🎨 Modern UI/UX
- **Tailwind CSS**: Beautiful, responsive design
- **shadcn/ui Components**: High-quality, accessible component library
- **Dark Mode Support**: Automatic theme switching
- **Mobile Optimized**: Fully responsive across all devices
- **Loading States**: Smooth loading indicators and transitions

### 🏗️ Production Ready
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **TypeScript**: Full type safety throughout the application
- **Testing Suite**: Comprehensive test coverage with Jest
- **Database**: SQLite with Prisma ORM for easy setup
- **API Design**: RESTful API with proper error handling

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **AI Integration**: Z-AI Web Dev SDK
- **Deployment**: Docker ready

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-chat-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=file:/app/db/custom.db
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── chat/          # AI chat endpoints
│   │   ├── chats/         # Chat history management
│   │   └── billing/       # Payment processing
│   ├── auth/              # Authentication pages
│   ├── chat/              # Chat interface
│   ├── billing/           # Billing pages
│   ├── dashboard/         # User dashboard
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── providers/        # Context providers
│   └── navbar.tsx        # Navigation component
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Database client
│   └── utils.ts          # Helper functions
└── prisma/               # Database schema
    └── schema.prisma     # Database models
```

## Database Schema

The application uses the following main models:

- **User**: User accounts with credits and subscription status
- **Account/Session**: NextAuth.js authentication models
- **Post**: Blog posts with draft/published states
- **AIChat**: Chat conversations with message history
- **Payment**: Payment transactions and credit purchases

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in users
- `POST /api/auth/signup` - Register new users
- `GET /api/auth/session` - Get current session

### AI Chat
- `POST /api/chat` - Send message and get AI response
- `GET /api/chats` - Get user's chat history
- `GET /api/chats/:id` - Get specific chat
- `DELETE /api/chats/:id` - Delete chat

### Billing
- `POST /api/billing/purchase` - Purchase credits
- `POST /api/billing/subscribe` - Subscribe to plan

## Deployment

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t ai-chat-hub .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **With reverse proxy**
   ```bash
   docker-compose --profile with-proxy up -d
   ```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=file:/app/db/custom.db
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Production Considerations

- **Database**: For production, consider using PostgreSQL instead of SQLite
- **Payment Integration**: The app uses local payment processing - integrate with real providers as needed
- **File Storage**: Use cloud storage for uploaded files and exports
- **Email**: Add email service for notifications
- **Monitoring**: Add logging and monitoring
- **Security**: Configure proper CORS, CSRF protection, and rate limiting
- **AI Models**: Currently configured for ChatGPT - add API keys for other providers (Gemini, Claude, etc.)

## Security Features

- **Authentication**: Secure session management with NextAuth.js
- **Authorization**: Route protection and role-based access
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Nginx configuration for API endpoints
- **Security Headers**: Comprehensive security headers configuration
- **Environment Variables**: Sensitive data stored in environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.