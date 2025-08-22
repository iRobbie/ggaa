const express = require('express');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Get all active hero sliders
router.get('/sliders', async (req, res) => {
  try {
    const { data: sliders, error } = await supabase
      .from('hero_sliders')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json({ sliders: sliders || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sliders' });
  }
});

// Get featured product banners
router.get('/featured-banners', async (req, res) => {
  try {
    const { data: banners, error } = await supabase
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
      .order('position');

    if (error) throw error;

    res.json({ banners: banners || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch featured banners' });
  }
});

// Get promotional banners
router.get('/promotional-banners', async (req, res) => {
  try {
    const { data: banners, error } = await supabase
      .from('promotional_banners')
      .select('*')
      .eq('is_active', true)
      .order('position');

    if (error) throw error;

    res.json({ banners: banners || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch promotional banners' });
  }
});

// Get products by tab
router.get('/products/:tab', async (req, res) => {
  try {
    const { tab } = req.params;
    const { limit = 8 } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .limit(parseInt(limit));

    // Filter by tab type
    switch (tab) {
      case 'new-arrivals':
        query = query.eq('is_new', true);
        break;
      case 'best-sellers':
        query = query.eq('is_featured', true);
        break;
      case 'sale-items':
        query = query.eq('is_on_sale', true);
        break;
      case 'on-sales':
        query = query.eq('is_on_sale', true);
        break;
      default:
        // Return all products if tab is not recognized
        break;
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ products: products || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all products for showcase
router.get('/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;

    let query = supabase
      .from('products')
      .select('*')
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

    if (error) throw error;

    res.json({
      products: products || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by slug
router.get('/product/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get product categories
router.get('/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('products')
      .select('category')
      .eq('status', 'published')
      .not('category', 'is', null);

    if (error) throw error;

    // Get unique categories
    const uniqueCategories = [...new Set(categories.map(item => item.category))];

    res.json({ categories: uniqueCategories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get general content
router.get('/content', async (req, res) => {
  try {
    const { data: content, error } = await supabase
      .from('general_content')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Convert to key-value pairs
    const contentMap = {};
    content.forEach(item => {
      contentMap[item.section_key] = item.content_value;
    });

    res.json({ content: contentMap });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Get SEO settings for a page
router.get('/seo/:page', async (req, res) => {
  try {
    const { page } = req.params;

    const { data: seoSetting, error } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('page_key', page)
      .single();

    if (error || !seoSetting) {
      return res.json({
        page_title: 'Furniture Showcase',
        meta_description: 'Premium furniture showcase website',
        meta_keywords: [],
        open_graph_title: '',
        open_graph_description: '',
        open_graph_image: '',
        structured_data: {},
        canonical_url: ''
      });
    }

    res.json({ seo: seoSetting });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SEO settings' });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const { q, category, price_min, price_max, sort = 'newest' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply price filters
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

    const { data: products, error } = await query.limit(50);

    if (error) throw error;

    res.json({ products: products || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Get related products
router.get('/products/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    // Get the current product to find related ones
    const { data: currentProduct, error: productError } = await supabase
      .from('products')
      .select('category')
      .eq('id', id)
      .single();

    if (productError || !currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get related products from the same category
    const { data: relatedProducts, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .eq('category', currentProduct.category)
      .neq('id', id)
      .limit(parseInt(limit))
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ products: relatedProducts || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch related products' });
  }
});

// Get sitemap data
router.get('/sitemap', async (req, res) => {
  try {
    // Get all published products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('status', 'published');

    if (productsError) throw productsError;

    // Get all active sliders
    const { data: sliders, error: slidersError } = await supabase
      .from('hero_sliders')
      .select('id, updated_at')
      .eq('is_active', true);

    if (slidersError) throw slidersError;

    const sitemapData = {
      products: products || [],
      sliders: sliders || [],
      pages: [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/products', priority: '0.8', changefreq: 'weekly' },
        { url: '/about', priority: '0.6', changefreq: 'monthly' },
        { url: '/contact', priority: '0.6', changefreq: 'monthly' }
      ]
    };

    res.json(sitemapData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sitemap data' });
  }
});

module.exports = router;