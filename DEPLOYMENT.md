# AI Chat Hub - Production Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Domain name (optional, for HTTPS)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd ai-chat-hub
```

### 2. Configure Environment
Copy the production environment template:
```bash
cp .env.production .env
```

Edit `.env` with your actual values:
- `NEXTAUTH_SECRET`: Generate a random secret (use `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Get from Google Cloud Console
- `NEXTAUTH_URL`: Set to your domain (e.g., `https://your-domain.com`)

### 3. Build and Run
```bash
# Build and start the application
docker-compose up -d --build

# Check logs
docker-compose logs -f app

# Check health
curl http://localhost:3000/api/health
```

### 4. Access the Application
The application will be available at `http://localhost:3000`

## Production Deployment Options

### Option 1: Docker on VPS
1. **Server Requirements**: Any VPS with Docker (Ubuntu 20.04+ recommended)
2. **Domain Setup**: Point your domain to the server IP
3. **SSL Certificate**: Use Let's Encrypt with Nginx/Caddy

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Cloud Deployment

#### Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically deploy on push

#### Render
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables
4. Render will build and deploy automatically

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

## Environment Variables

### Required
- `DATABASE_URL`: SQLite database path
- `NEXTAUTH_URL`: Your application URL
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Optional
- `ZAI_API_KEY`: Z.ai API key (if using paid Z.ai services)
- `STRIPE_SECRET_KEY`: For real payment processing
- `STRIPE_PUBLISHABLE_KEY`: For real payment processing

## Database Management

### Backup
```bash
# Create backup
docker exec ai-chat-hub_app_1 sqlite3 data/custom.db ".backup backup-$(date +%Y%m%d).db"

# Copy backup to host
docker cp ai-chat-hub_app_1:/app/data/backup-$(date +%Y%m%d).db .
```

### Restore
```bash
# Copy backup to container
docker cp backup-20240115.db ai-chat-hub_app_1:/app/data/

# Restore (stop container first)
docker-compose stop app
docker exec ai-chat-hub_app_1 sqlite3 data/custom.db ".restore backup-20240115.db"
docker-compose start app
```

## Monitoring

### Health Check
The application includes a health check endpoint at `/api/health`

### Logs
```bash
# View logs
docker-compose logs -f app

# View specific service logs
docker-compose logs app
```

### Performance Monitoring
Consider adding monitoring tools like:
- Prometheus + Grafana
- Datadog
- New Relic

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **Database**: Regular backups of the SQLite database
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **CORS**: Configure appropriate CORS policies
6. **Authentication**: Use strong session secrets

## Scaling

### Horizontal Scaling
For higher traffic, consider:
1. **Load Balancer**: Use Nginx or cloud load balancer
2. **Multiple Instances**: Run multiple app containers
3. **External Database**: Migrate from SQLite to PostgreSQL for better performance

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database file permissions
   - Verify DATABASE_URL environment variable

2. **Authentication Issues**
   - Verify NEXTAUTH_SECRET and NEXTAUTH_URL
   - Check Google OAuth configuration

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are properly installed

### Debug Mode
To run in debug mode:
```bash
docker-compose run --rm app sh
```

## Support

For issues and questions:
1. Check the logs: `docker-compose logs app`
2. Review environment variables
3. Check network connectivity
4. Verify database file exists and is accessible