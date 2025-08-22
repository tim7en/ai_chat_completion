# AI Chat Hub

A sleek, production-ready AI chat application with paywall functionality, user authentication, and blog system built with Next.js, TypeScript, and Prisma.

## Features

### 🤖 AI Chat Functionality
- Real-time AI chat completions using Z-AI SDK
- Credit-based paywall system
- Subscription plans for unlimited access
- Chat history and management
- Multiple AI models support

### 🔐 Authentication
- NextAuth.js integration
- Google OAuth support
- Credentials-based authentication
- Session management
- Protected routes

### 💳 Billing & Payments
- Credit pack purchases
- Monthly subscriptions
- Simulated payment processing (ready for Stripe integration)
- User credit management
- Upgrade prompts and paywalls

### 📝 Blog System
- Create and manage blog posts
- Public blog display on homepage
- Draft and published states
- Author attribution
- Rich text editing capabilities

### 🎨 UI/UX Features
- Responsive design with Tailwind CSS
- shadcn/ui component library
- Dark mode support
- Loading states and error handling
- Intuitive navigation
- Mobile-optimized interface

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
│   │   ├── blog/          # Blog functionality
│   │   ├── chat/          # AI chat endpoints
│   │   └── billing/       # Payment processing
│   ├── auth/              # Authentication pages
│   ├── blog/              # Blog pages
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
- `DELETE /api/chats/:id` - Delete chat

### Blog
- `GET /api/blog/public` - Get published blog posts
- `GET /api/blog/posts` - Get user's blog posts
- `POST /api/blog/posts` - Create new blog post
- `PATCH /api/blog/posts/:id` - Update blog post
- `DELETE /api/blog/posts/:id` - Delete blog post

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
- **Payments**: Integrate with Stripe for real payment processing
- **File Storage**: Use cloud storage for uploaded files
- **Email**: Add email service for notifications
- **Monitoring**: Add logging and monitoring
- **Security**: Configure proper CORS, CSRF protection, and rate limiting

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