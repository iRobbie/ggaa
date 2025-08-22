-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table for furniture showcase
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category VARCHAR(100),
    specifications JSONB,
    primary_image_url TEXT,
    hover_image_url TEXT,
    gallery_images JSONB DEFAULT '[]',
    price DECIMAL(10,2),
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    is_on_sale BOOLEAN DEFAULT false,
    sale_price DECIMAL(10,2),
    tab_assignments JSONB DEFAULT '[]',
    showcase_link TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT[],
    seo_slug VARCHAR(255),
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hero slider table
CREATE TABLE IF NOT EXISTS hero_sliders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT,
    background_image_url TEXT NOT NULL,
    category_text VARCHAR(100),
    button_text VARCHAR(100),
    button_link TEXT,
    alt_text VARCHAR(255),
    meta_description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Featured product banners table (3-position system)
CREATE TABLE IF NOT EXISTS featured_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position VARCHAR(20) NOT NULL CHECK (position IN ('left', 'center', 'right')),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    custom_title VARCHAR(255),
    custom_description TEXT,
    custom_image_url TEXT,
    custom_link TEXT,
    animation_delay DECIMAL(3,2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(position)
);

-- Promotional banners table (2-banner marketing system)
CREATE TABLE IF NOT EXISTS promotional_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position VARCHAR(20) NOT NULL CHECK (position IN ('left', 'right')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    campaign_name VARCHAR(100),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(position)
);

-- General content management table
CREATE TABLE IF NOT EXISTS general_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_key VARCHAR(100) UNIQUE NOT NULL,
    section_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'json')),
    content_value TEXT,
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO settings table
CREATE TABLE IF NOT EXISTS seo_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_key VARCHAR(100) UNIQUE NOT NULL,
    page_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT[],
    open_graph_title VARCHAR(255),
    open_graph_description TEXT,
    open_graph_image TEXT,
    structured_data JSONB,
    canonical_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media files table
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    dimensions JSONB,
    alt_text VARCHAR(255),
    caption TEXT,
    tags TEXT[],
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content versions table for backup system
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    content_data JSONB NOT NULL,
    version_number INTEGER NOT NULL,
    change_description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_sale ON products(is_on_sale);
CREATE INDEX IF NOT EXISTS idx_hero_sliders_active ON hero_sliders(is_active);
CREATE INDEX IF NOT EXISTS idx_hero_sliders_order ON hero_sliders(sort_order);
CREATE INDEX IF NOT EXISTS idx_featured_banners_position ON featured_banners(position);
CREATE INDEX IF NOT EXISTS idx_promotional_banners_position ON promotional_banners(position);
CREATE INDEX IF NOT EXISTS idx_general_content_key ON general_content(section_key);
CREATE INDEX IF NOT EXISTS idx_seo_settings_page ON seo_settings(page_key);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(mime_type);
CREATE INDEX IF NOT EXISTS idx_content_versions_type_id ON content_versions(content_type, content_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hero_sliders_updated_at BEFORE UPDATE ON hero_sliders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_featured_banners_updated_at BEFORE UPDATE ON featured_banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotional_banners_updated_at BEFORE UPDATE ON promotional_banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_general_content_updated_at BEFORE UPDATE ON general_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seo_settings_updated_at BEFORE UPDATE ON seo_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON media_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default content
INSERT INTO general_content (section_key, section_name, content_value) VALUES
('hero_title', 'Hero Section Title', 'Discover Premium Furniture'),
('hero_subtitle', 'Hero Section Subtitle', 'Transform your space with our curated collection'),
('featured_title', 'Featured Products Title', 'Featured Collections'),
('featured_subtitle', 'Featured Products Subtitle', 'Handpicked pieces for your home'),
('new_arrivals_title', 'New Arrivals Title', 'New Arrivals'),
('best_sellers_title', 'Best Sellers Title', 'Best Sellers'),
('sale_items_title', 'Sale Items Title', 'Sale Items'),
('on_sales_title', 'On Sales Title', 'On Sales'),
('footer_description', 'Footer Description', 'Premium furniture showcase for discerning homeowners'),
('contact_info', 'Contact Information', 'Get in touch for custom furniture inquiries')
ON CONFLICT (section_key) DO NOTHING;

-- Insert default SEO settings
INSERT INTO seo_settings (page_key, page_title, meta_description) VALUES
('home', 'Premium Furniture Showcase - Transform Your Space', 'Discover our curated collection of premium furniture pieces. Transform your home with sophisticated design and exceptional craftsmanship.'),
('products', 'Furniture Collections - Premium Showcase', 'Explore our diverse furniture collections featuring modern designs, classic styles, and premium materials for every room in your home.'),
('about', 'About Our Furniture Showcase - Craftsmanship & Design', 'Learn about our passion for furniture design and commitment to showcasing the finest pieces from renowned craftsmen and designers.')
ON CONFLICT (page_key) DO NOTHING;