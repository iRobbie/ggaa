# 🪑 Showcase Furniture Website CMS

A comprehensive, SEO-friendly showcase furniture website with a dynamic admin panel system. This is NOT an e-commerce site - it's purely a showcase website where furniture products are displayed for presentation purposes.

## ✨ Features

### 🌟 Website Features
- **Hero Slider Section**: Unlimited slider management with dynamic content
- **Featured Product Banners**: 3-position system for product showcase
- **Promotional Banners**: 2-banner marketing system
- **Product Tabs**: 4-tab system (New Arrivals, Best Sellers, Sale Items, On Sales)
- **Product Management**: Complete showcase-focused product system
- **SEO Optimization**: Meta tags, Open Graph, structured data, sitemap generation
- **Responsive Design**: Mobile-first approach with modern UI/UX

### 🎛️ Admin Panel Features
- **Authentication System**: Supabase Auth with role-based access
- **Dashboard Overview**: Content statistics and recent activity
- **Content Management**: Intuitive interfaces for all website sections
- **Media Management**: Image upload with optimization and organization
- **Real-time Updates**: Live content changes via Supabase subscriptions
- **Preview & Generation**: Static HTML generation for SEO optimization

### 🛠️ Technical Features
- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Template Engine**: Handlebars.js for dynamic content
- **Image Processing**: Sharp.js for optimization and multiple sizes
- **Security**: JWT authentication, RLS policies, input validation
- **Performance**: Optimized images, lazy loading, progressive enhancement

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### 1. Clone the Repository
```bash
git clone <repository-url>
cd showcase-furniture-cms
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

### 4. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql`
3. Set up storage buckets for images
4. Configure RLS policies

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at:
- **Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

## 📁 Project Structure

```
showcase-furniture-cms/
├── assets/                 # Static assets (CSS, JS, images)
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── images/            # Image assets
├── config/                 # Configuration files
│   └── supabase.js        # Supabase client setup
├── database/               # Database schema and migrations
│   └── schema.sql         # Complete database schema
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication middleware
│   └── errorHandler.js    # Error handling middleware
├── routes/                 # Route definitions
│   ├── admin.js           # Admin panel routes
│   ├── api.js             # Public API routes
│   ├── auth.js            # Authentication routes
│   └── website.js         # Website frontend routes
├── services/               # Business logic services
│   └── uploadService.js   # File upload service
├── uploads/                # Uploaded files directory
├── views/                  # Handlebars templates
│   ├── layouts/           # Layout templates
│   └── partials/          # Reusable template parts
├── .env.example           # Environment variables template
├── package.json           # Project dependencies
├── README.md              # This file
└── server.js              # Main application entry point
```

## 🗄️ Database Schema

### Core Tables
- **users**: User authentication and roles
- **products**: Furniture showcase items
- **hero_sliders**: Hero section slider content
- **featured_banners**: 3-position product banners
- **promotional_banners**: Marketing campaign banners
- **general_content**: Website text content
- **seo_settings**: SEO and meta tag management
- **media_files**: Image and file management
- **content_versions**: Content change tracking

### Key Features
- UUID primary keys for security
- Automatic timestamp management
- Row Level Security (RLS) policies
- Optimized indexes for performance
- JSONB fields for flexible data storage

## 🎨 Design System

### Color Palette
- **Primary**: #2c3e50 (Professional Blue)
- **Secondary**: #34495e (Dark Blue)
- **Accent**: #3498db (Bright Blue)
- **Success**: #27ae60 (Green)
- **Warning**: #f39c12 (Orange)
- **Danger**: #e74c3c (Red)

### Typography
- **Headings**: Playfair Display (Serif)
- **Body**: Inter (Sans-serif)
- **Icons**: Font Awesome (Filled style)

### Design Principles
- Clean, modern aesthetic
- Professional furniture industry standards
- Subtle animations and micro-interactions
- Mobile-first responsive design
- Consistent branding throughout

## 🔧 Configuration

### Supabase Setup
1. Create storage buckets:
   - `images`: Product and banner images
   - `uploads`: General file uploads

2. Configure RLS policies:
   - Public read access for website content
   - Authenticated write access for admin users
   - Role-based access control

3. Set up authentication:
   - Enable email/password auth
   - Configure social providers (optional)
   - Set up email templates

### Environment Variables
```env
# Required
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_secret_key

# Optional
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
```

## 📱 Usage

### Admin Panel Access
1. Navigate to `/admin`
2. Login with admin credentials
3. Access different management sections:
   - **Dashboard**: Overview and statistics
   - **Products**: Manage furniture items
   - **Sliders**: Hero section content
   - **Banners**: Featured and promotional banners
   - **Content**: General website text
   - **SEO**: Meta tags and optimization
   - **Media**: File management
   - **Users**: User administration

### Content Management
- **Products**: Add/edit furniture items with images
- **Sliders**: Create hero section slides
- **Banners**: Configure featured product and promotional banners
- **Content**: Update website text and descriptions
- **SEO**: Manage meta tags and structured data

### Image Management
- Drag & drop image uploads
- Automatic image optimization
- Multiple size generation (thumb, small, medium, large)
- WebP format conversion
- CDN integration via Supabase Storage

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production Supabase project
3. Set up domain and SSL certificates
4. Configure environment variables
5. Set up monitoring and logging

### Static Generation
```bash
npm run build
```
This generates static HTML files for optimal SEO performance.

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Security Features

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **File Upload Security**: Type and size validation
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Cross-origin request handling
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

## 📊 Performance Optimization

- **Image Optimization**: WebP format, multiple sizes
- **Lazy Loading**: Progressive image loading
- **Caching**: Browser and CDN caching strategies
- **Compression**: Gzip compression for responses
- **Minification**: CSS and JavaScript optimization
- **Database Indexing**: Optimized query performance
- **CDN Integration**: Global content delivery

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### E2E Testing
```bash
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages
- Update documentation as needed
- Test all changes thoroughly

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Admin Panel Guide](docs/admin.md)
- [Deployment Guide](docs/deployment.md)

### Issues
- Report bugs via GitHub Issues
- Request features via GitHub Discussions
- Check existing issues before creating new ones

### Community
- Join our Discord server
- Follow us on Twitter
- Subscribe to our newsletter

## 🔮 Roadmap

### Upcoming Features
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] API rate limiting
- [ ] Webhook integrations
- [ ] Advanced search filters
- [ ] Product comparison tools
- [ ] Social media integration
- [ ] Email marketing tools

### Long-term Goals
- [ ] Mobile app development
- [ ] AI-powered content suggestions
- [ ] Advanced SEO automation
- [ ] Performance monitoring
- [ ] A/B testing framework
- [ ] Multi-tenant architecture

---

**Built with ❤️ for the furniture industry**

For questions and support, please contact us at support@furnitureshowcase.com