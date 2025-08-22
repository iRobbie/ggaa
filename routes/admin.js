const express = require('express');
const { requireAdmin, requireEditor } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

// Dashboard overview
router.get('/dashboard', requireEditor, async (req, res, next) => {
  try {
    // Get content statistics
    const [
      { count: productsCount },
      { count: slidersCount },
      { count: bannersCount },
      { count: contentCount }
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('hero_sliders').select('*', { count: 'exact', head: true }),
      supabase.from('featured_banners').select('*', { count: 'exact', head: true }),
      supabase.from('general_content').select('*', { count: 'exact', head: true })
    ]);

    // Get recent activity
    const { data: recentProducts } = await supabase
      .from('products')
      .select('id, name, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);

    const { data: recentSliders } = await supabase
      .from('hero_sliders')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);

    res.json({
      statistics: {
        products: productsCount,
        sliders: slidersCount,
        banners: bannersCount,
        content: contentCount
      },
      recentActivity: {
        products: recentProducts,
        sliders: recentSliders
      }
    });
  } catch (error) {
    next(error);
  }
});

// ===== PRODUCT MANAGEMENT =====

// Get all products
router.get('/products', requireEditor, async (req, res, next) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// Get single product
router.get('/products/:id', requireEditor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      throw new NotFoundError('Product not found');
    }

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// Create product
router.post('/products', requireEditor, async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      short_description,
      category,
      specifications,
      primary_image_url,
      hover_image_url,
      gallery_images,
      price,
      is_featured,
      is_new,
      is_on_sale,
      sale_price,
      tab_assignments,
      showcase_link,
      meta_title,
      meta_description,
      meta_keywords,
      seo_slug,
      status
    } = req.body;

    if (!name || !slug) {
      throw new ValidationError('Name and slug are required');
    }

    // Check if slug already exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingProduct) {
      throw new ValidationError('Product with this slug already exists');
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description,
        short_description,
        category,
        specifications: specifications || {},
        primary_image_url,
        hover_image_url,
        gallery_images: gallery_images || [],
        price: price ? parseFloat(price) : null,
        is_featured: is_featured || false,
        is_new: is_new || false,
        is_on_sale: is_on_sale || false,
        sale_price: sale_price ? parseFloat(sale_price) : null,
        tab_assignments: tab_assignments || [],
        showcase_link,
        meta_title,
        meta_description,
        meta_keywords: meta_keywords || [],
        seo_slug,
        status: status || 'draft'
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
});

// Update product
router.put('/products/:id', requireEditor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date().toISOString() };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_at;

    // Check if slug is being updated and if it's unique
    if (updateData.slug) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('slug', updateData.slug)
        .neq('id', id)
        .single();

      if (existingProduct) {
        throw new ValidationError('Product with this slug already exists');
      }
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !product) {
      throw new NotFoundError('Product not found');
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
});

// Delete product
router.delete('/products/:id', requireEditor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ===== HERO SLIDER MANAGEMENT =====

// Get all sliders
router.get('/sliders', requireEditor, async (req, res, next) => {
  try {
    const { data: sliders, error } = await supabase
      .from('hero_sliders')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json({ sliders });
  } catch (error) {
    next(error);
  }
});

// Create slider
router.post('/sliders', requireEditor, async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      description,
      background_image_url,
      category_text,
      button_text,
      button_link,
      alt_text,
      meta_description,
      is_active,
      sort_order
    } = req.body;

    if (!title || !background_image_url) {
      throw new ValidationError('Title and background image are required');
    }

    const { data: slider, error } = await supabase
      .from('hero_sliders')
      .insert({
        title,
        subtitle,
        description,
        background_image_url,
        category_text,
        button_text,
        button_link,
        alt_text,
        meta_description,
        is_active: is_active !== undefined ? is_active : true,
        sort_order: sort_order || 0
      })
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Slider created successfully',
      slider
    });
  } catch (error) {
    next(error);
  }
});

// Update slider
router.put('/sliders/:id', requireEditor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date().toISOString() };

    delete updateData.id;
    delete updateData.created_at;

    const { data: slider, error } = await supabase
      .from('hero_sliders')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !slider) {
      throw new NotFoundError('Slider not found');
    }

    res.json({
      message: 'Slider updated successfully',
      slider
    });
  } catch (error) {
    next(error);
  }
});

// Delete slider
router.delete('/sliders/:id', requireEditor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('hero_sliders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      message: 'Slider deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Reorder sliders
router.put('/sliders/reorder', requireEditor, async (req, res, next) => {
  try {
    const { sliderOrders } = req.body; // Array of {id, sort_order}

    if (!Array.isArray(sliderOrders)) {
      throw new ValidationError('Slider orders array is required');
    }

    const updates = sliderOrders.map(({ id, sort_order }) => ({
      id,
      sort_order,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('hero_sliders')
      .upsert(updates);

    if (error) throw error;

    res.json({
      message: 'Sliders reordered successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ===== FEATURED BANNERS MANAGEMENT =====

// Get all featured banners
router.get('/featured-banners', requireEditor, async (req, res, next) => {
  try {
    const { data: banners, error } = await supabase
      .from('featured_banners')
      .select(`
        *,
        products (
          id,
          name,
          primary_image_url,
          hover_image_url
        )
      `)
      .order('position');

    if (error) throw error;

    res.json({ banners });
  } catch (error) {
    next(error);
  }
});

// Update featured banner
router.put('/featured-banners/:position', requireEditor, async (req, res, next) => {
  try {
    const { position } = req.params;
    const {
      product_id,
      custom_title,
      custom_description,
      custom_image_url,
      custom_link,
      animation_delay,
      is_active
    } = req.body;

    const { data: banner, error } = await supabase
      .from('featured_banners')
      .upsert({
        position,
        product_id,
        custom_title,
        custom_description,
        custom_image_url,
        custom_link,
        animation_delay: animation_delay ? parseFloat(animation_delay) : 0,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        products (
          id,
          name,
          primary_image_url,
          hover_image_url
        )
      `)
      .single();

    if (error) throw error;

    res.json({
      message: 'Featured banner updated successfully',
      banner
    });
  } catch (error) {
    next(error);
  }
});

// ===== PROMOTIONAL BANNERS MANAGEMENT =====

// Get all promotional banners
router.get('/promotional-banners', requireEditor, async (req, res, next) => {
  try {
    const { data: banners, error } = await supabase
      .from('promotional_banners')
      .select('*')
      .order('position');

    if (error) throw error;

    res.json({ banners });
  } catch (error) {
    next(error);
  }
});

// Update promotional banner
router.put('/promotional-banners/:position', requireEditor, async (req, res, next) => {
  try {
    const { position } = req.params;
    const {
      title,
      description,
      image_url,
      link_url,
      campaign_name,
      start_date,
      end_date,
      is_active
    } = req.body;

    if (!title || !image_url) {
      throw new ValidationError('Title and image are required');
    }

    const { data: banner, error } = await supabase
      .from('promotional_banners')
      .upsert({
        position,
        title,
        description,
        image_url,
        link_url,
        campaign_name,
        start_date,
        end_date,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      message: 'Promotional banner updated successfully',
      banner
    });
  } catch (error) {
    next(error);
  }
});

// ===== GENERAL CONTENT MANAGEMENT =====

// Get all general content
router.get('/content', requireEditor, async (req, res, next) => {
  try {
    const { data: content, error } = await supabase
      .from('general_content')
      .select('*')
      .order('section_key');

    if (error) throw error;

    res.json({ content });
  } catch (error) {
    next(error);
  }
});

// Update general content
router.put('/content/:key', requireEditor, async (req, res, next) => {
  try {
    const { key } = req.params;
    const { content_value, content_type, language } = req.body;

    if (!content_value) {
      throw new ValidationError('Content value is required');
    }

    const { data: content, error } = await supabase
      .from('general_content')
      .update({
        content_value,
        content_type: content_type || 'text',
        language: language || 'en',
        updated_at: new Date().toISOString()
      })
      .eq('section_key', key)
      .select('*')
      .single();

    if (error || !content) {
      throw new NotFoundError('Content section not found');
    }

    res.json({
      message: 'Content updated successfully',
      content
    });
  } catch (error) {
    next(error);
  }
});

// ===== SEO SETTINGS MANAGEMENT =====

// Get all SEO settings
router.get('/seo', requireEditor, async (req, res, next) => {
  try {
    const { data: seoSettings, error } = await supabase
      .from('seo_settings')
      .select('*')
      .order('page_key');

    if (error) throw error;

    res.json({ seoSettings });
  } catch (error) {
    next(error);
  }
});

// Update SEO settings
router.put('/seo/:page', requireEditor, async (req, res, next) => {
  try {
    const { page } = req.params;
    const {
      page_title,
      meta_description,
      meta_keywords,
      open_graph_title,
      open_graph_description,
      open_graph_image,
      structured_data,
      canonical_url
    } = req.body;

    const { data: seoSetting, error } = await supabase
      .from('seo_settings')
      .upsert({
        page_key: page,
        page_title,
        meta_description,
        meta_keywords: meta_keywords || [],
        open_graph_title,
        open_graph_description,
        open_graph_image,
        structured_data: structured_data || {},
        canonical_url,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      message: 'SEO settings updated successfully',
      seoSetting
    });
  } catch (error) {
    next(error);
  }
});

// ===== STATIC HTML GENERATION =====

// Generate static HTML for website
router.post('/generate-html', requireAdmin, async (req, res, next) => {
  try {
    // This would trigger the static HTML generation process
    // Implementation would be in a separate service
    
    res.json({
      message: 'Static HTML generation started',
      status: 'processing'
    });
  } catch (error) {
    next(error);
  }
});

// Get generation status
router.get('/generate-status', requireEditor, async (req, res, next) => {
  try {
    // This would return the current status of HTML generation
    
    res.json({
      status: 'idle',
      lastGenerated: new Date().toISOString(),
      message: 'No generation in progress'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;