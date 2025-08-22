const express = require('express');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Home page
router.get('/', async (req, res) => {
  try {
    // Fetch all required data for the home page
    const [
      { data: sliders },
      { data: featuredBanners },
      { data: promotionalBanners },
      { data: newArrivals },
      { data: bestSellers },
      { data: saleItems },
      { data: onSales },
      { data: generalContent },
      { data: seoSettings }
    ] = await Promise.all([
      supabase
        .from('hero_sliders')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('featured_banners')
        .select(`
          *,
          products (
            id,
            name,
            short_description,
            primary_image_url,
            hover_image_url,
            showcase_link
          )
        `)
        .eq('is_active', true)
        .order('position'),
      supabase
        .from('promotional_banners')
        .select('*')
        .eq('is_active', true)
        .order('position'),
      supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .eq('is_new', true)
        .limit(8)
        .order('created_at', { ascending: false }),
      supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .limit(8)
        .order('created_at', { ascending: false }),
      supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .eq('is_on_sale', true)
        .limit(8)
        .order('created_at', { ascending: false }),
      supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .eq('is_on_sale', true)
        .limit(8)
        .order('created_at', { ascending: false }),
      supabase
        .from('general_content')
        .select('*')
        .eq('is_active', true),
      supabase
        .from('seo_settings')
        .select('*')
        .eq('page_key', 'home')
        .single()
    ]);

    // Convert general content to key-value pairs
    const contentMap = {};
    if (generalContent) {
      generalContent.forEach(item => {
        contentMap[item.section_key] = item.content_value;
      });
    }

    // Prepare SEO data
    const seo = seoSettings || {
      page_title: 'Premium Furniture Showcase - Transform Your Space',
      meta_description: 'Discover our curated collection of premium furniture pieces. Transform your home with sophisticated design and exceptional craftsmanship.',
      meta_keywords: ['furniture', 'showcase', 'premium', 'design', 'home decor'],
      open_graph_title: 'Premium Furniture Showcase',
      open_graph_description: 'Transform your space with our curated collection',
      open_graph_image: '',
      structured_data: {},
      canonical_url: '/'
    };

    res.render('home', {
      title: seo.page_title,
      seo,
      content: contentMap,
      sliders: sliders || [],
      featuredBanners: featuredBanners || [],
      promotionalBanners: promotionalBanners || [],
      newArrivals: newArrivals || [],
      bestSellers: bestSellers || [],
      saleItems: saleItems || [],
      onSales: onSales || [],
      layout: 'main'
    });
  } catch (error) {
    console.error('Error rendering home page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load home page',
      layout: 'main'
    });
  }
});

// Products page
router.get('/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: products, error, count } = await query.order('created_at', { ascending: false });

    // Get categories for filter
    const { data: categories } = await supabase
      .from('products')
      .select('category')
      .eq('status', 'published')
      .not('category', 'is', null);

    const uniqueCategories = [...new Set(categories?.map(item => item.category) || [])];

    // Get SEO settings
    const { data: seoSettings } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('page_key', 'products')
      .single();

    const seo = seoSettings || {
      page_title: 'Furniture Collections - Premium Showcase',
      meta_description: 'Explore our diverse furniture collections featuring modern designs, classic styles, and premium materials for every room in your home.',
      meta_keywords: ['furniture', 'collections', 'modern', 'classic', 'premium'],
      open_graph_title: 'Furniture Collections',
      open_graph_description: 'Explore our diverse furniture collections',
      open_graph_image: '',
      structured_data: {},
      canonical_url: '/products'
    };

    res.render('products', {
      title: seo.page_title,
      seo,
      products: products || [],
      categories: uniqueCategories,
      currentCategory: category,
      searchQuery: search,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit))
      },
      layout: 'main'
    });
  } catch (error) {
    console.error('Error rendering products page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load products page',
      layout: 'main'
    });
  }
});

// Single product page
router.get('/product/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get product details
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !product) {
      return res.status(404).render('404', {
        title: 'Product Not Found',
        layout: 'main'
      });
    }

    // Get related products
    const { data: relatedProducts } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .eq('category', product.category)
      .neq('id', product.id)
      .limit(4)
      .order('created_at', { ascending: false });

    // Prepare SEO data
    const seo = {
      page_title: product.meta_title || `${product.name} - Furniture Showcase`,
      meta_description: product.meta_description || product.short_description || `Discover ${product.name} - Premium furniture piece for your home.`,
      meta_keywords: product.meta_keywords || ['furniture', product.category, 'premium'],
      open_graph_title: product.meta_title || product.name,
      open_graph_description: product.meta_description || product.short_description,
      open_graph_image: product.primary_image_url,
      structured_data: {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": product.primary_image_url,
        "category": product.category,
        "brand": {
          "@type": "Brand",
          "name": "Furniture Showcase"
        }
      },
      canonical_url: `/product/${product.slug}`
    };

    res.render('product', {
      title: seo.page_title,
      seo,
      product,
      relatedProducts: relatedProducts || [],
      layout: 'main'
    });
  } catch (error) {
    console.error('Error rendering product page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load product page',
      layout: 'main'
    });
  }
});

// About page
router.get('/about', async (req, res) => {
  try {
    // Get SEO settings
    const { data: seoSettings } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('page_key', 'about')
      .single();

    const seo = seoSettings || {
      page_title: 'About Our Furniture Showcase - Craftsmanship & Design',
      meta_description: 'Learn about our passion for furniture design and commitment to showcasing the finest pieces from renowned craftsmen and designers.',
      meta_keywords: ['about', 'furniture', 'showcase', 'craftsmanship', 'design'],
      open_graph_title: 'About Our Furniture Showcase',
      open_graph_description: 'Learn about our passion for furniture design',
      open_graph_image: '',
      structured_data: {},
      canonical_url: '/about'
    };

    res.render('about', {
      title: seo.page_title,
      seo,
      layout: 'main'
    });
  } catch (error) {
    console.error('Error rendering about page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load about page',
      layout: 'main'
    });
  }
});

// Contact page
router.get('/contact', async (req, res) => {
  try {
    // Get general content for contact page
    const { data: generalContent } = await supabase
      .from('general_content')
      .select('*')
      .eq('is_active', true);

    const contentMap = {};
    if (generalContent) {
      generalContent.forEach(item => {
        contentMap[item.section_key] = item.content_value;
      });
    }

    const seo = {
      page_title: 'Contact Us - Furniture Showcase',
      meta_description: 'Get in touch with us for custom furniture inquiries and showcase information.',
      meta_keywords: ['contact', 'furniture', 'showcase', 'inquiry'],
      open_graph_title: 'Contact Us',
      open_graph_description: 'Get in touch for custom furniture inquiries',
      open_graph_image: '',
      structured_data: {},
      canonical_url: '/contact'
    };

    res.render('contact', {
      title: seo.page_title,
      seo,
      content: contentMap,
      layout: 'main'
    });
  } catch (error) {
    console.error('Error rendering contact page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load contact page',
      layout: 'main'
    });
  }
});

// Search results page
router.get('/search', async (req, res) => {
  try {
    const { q, category, price_min, price_max, sort = 'newest', page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.redirect('/products');
    }

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (price_min) {
      query = query.gte('price', parseFloat(price_min));
    }
    if (price_max) {
      query = query.lte('price', parseFloat(price_max));
    }

    // Apply sorting
    switch (sort) {
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: products, error, count } = await query;

    // Get categories for filter
    const { data: categories } = await supabase
      .from('products')
      .select('category')
      .eq('status', 'published')
      .not('category', 'is', null);

    const uniqueCategories = [...new Set(categories?.map(item => item.category) || [])];

    const seo = {
      page_title: `Search Results for "${q}" - Furniture Showcase`,
      meta_description: `Search results for "${q}" in our furniture collection. Find the perfect pieces for your home.`,
      meta_keywords: ['search', 'furniture', q, 'results'],
      open_graph_title: `Search Results for "${q}"`,
      open_graph_description: `Find furniture matching "${q}"`,
      open_graph_image: '',
      structured_data: {},
      canonical_url: `/search?q=${encodeURIComponent(q)}`
    };

    res.render('search', {
      title: seo.page_title,
      seo,
      query: q,
      products: products || [],
      categories: uniqueCategories,
      currentCategory: category,
      priceMin: price_min,
      priceMax: price_max,
      currentSort: sort,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit))
      },
      layout: 'main'
    });
  } catch (error) {
    console.error('Error rendering search page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load search results',
      layout: 'main'
    });
  }
});

// Generate sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    // Get all published products
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('status', 'published');

    // Get all active sliders
    const { data: sliders } = await supabase
      .from('hero_sliders')
      .select('id, updated_at')
      .eq('is_active', true);

    const baseUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/products</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;

    // Add product URLs
    if (products) {
      products.forEach(product => {
        sitemap += `
  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${new Date(product.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });
    }

    sitemap += `
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Generate robots.txt
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.CORS_ORIGIN || 'http://localhost:3000';
  
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin panel
Disallow: /admin/
Disallow: /auth/

# Allow API access
Allow: /api/`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

module.exports = router;