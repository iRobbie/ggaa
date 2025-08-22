const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/supabase');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Image optimization function
const optimizeImage = async (inputPath, outputPath, options = {}) => {
  const {
    width = 1200,
    height = 1200,
    quality = 80,
    format = 'webp'
  } = options;

  try {
    const image = sharp(inputPath);
    
    // Get image metadata
    const metadata = await image.metadata();
    
    // Resize image while maintaining aspect ratio
    const resizedImage = image.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });

    // Convert to specified format and optimize
    if (format === 'webp') {
      await resizedImage.webp({ quality }).toFile(outputPath);
    } else if (format === 'jpeg') {
      await resizedImage.jpeg({ quality }).toFile(outputPath);
    } else if (format === 'png') {
      await resizedImage.png({ quality }).toFile(outputPath);
    }

    // Get optimized image metadata
    const optimizedMetadata = await sharp(outputPath).metadata();

    return {
      originalSize: metadata.size,
      optimizedSize: optimizedMetadata.size,
      dimensions: {
        width: optimizedMetadata.width,
        height: optimizedMetadata.height
      },
      format: optimizedMetadata.format
    };
  } catch (error) {
    throw new Error(`Image optimization failed: ${error.message}`);
  }
};

// Generate multiple image sizes
const generateImageSizes = async (inputPath, baseOutputPath) => {
  const sizes = [
    { suffix: 'thumb', width: 300, height: 300 },
    { suffix: 'small', width: 600, height: 600 },
    { suffix: 'medium', width: 800, height: 800 },
    { suffix: 'large', width: 1200, height: 1200 }
  ];

  const results = {};

  for (const size of sizes) {
    const outputPath = baseOutputPath.replace(/(\.[^.]+)$/, `-${size.suffix}$1`);
    
    try {
      const result = await optimizeImage(inputPath, outputPath, {
        width: size.width,
        height: size.height,
        quality: 80,
        format: 'webp'
      });
      
      results[size.suffix] = {
        path: outputPath,
        url: outputPath.replace('uploads/', '/uploads/'),
        ...result
      };
    } catch (error) {
      console.error(`Failed to generate ${size.suffix} size:`, error);
    }
  }

  return results;
};

// Upload to Supabase Storage
const uploadToSupabase = async (filePath, fileName, bucket = 'images') => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: urlData.publicUrl,
      size: fileBuffer.length
    };
  } catch (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
};

// Main upload function
const uploadImage = async (file, options = {}) => {
  const {
    generateSizes = true,
    bucket = 'images',
    folder = 'products'
  } = options;

  try {
    // Create output directory
    const outputDir = `uploads/${folder}`;
    await fs.mkdir(outputDir, { recursive: true });

    // Generate base filename
    const baseFileName = `${folder}/${uuidv4()}`;
    const optimizedPath = `${outputDir}/${baseFileName}.webp`;

    // Optimize main image
    const optimizationResult = await optimizeImage(file.path, optimizedPath, {
      width: 1200,
      height: 1200,
      quality: 80,
      format: 'webp'
    });

    // Upload main image to Supabase
    const mainUpload = await uploadToSupabase(optimizedPath, `${baseFileName}.webp`, bucket);

    let sizeVariants = {};
    
    if (generateSizes) {
      // Generate and upload size variants
      sizeVariants = await generateImageSizes(file.path, optimizedPath);
      
      // Upload size variants to Supabase
      for (const [size, variant] of Object.entries(sizeVariants)) {
        const variantFileName = `${baseFileName}-${size}.webp`;
        const variantUpload = await uploadToSupabase(variant.path, variantFileName, bucket);
        sizeVariants[size].supabase = variantUpload;
      }
    }

    // Clean up temporary files
    await fs.unlink(file.path);
    await fs.unlink(optimizedPath);
    
    // Clean up size variants
    for (const variant of Object.values(sizeVariants)) {
      if (variant.path && variant.path !== optimizedPath) {
        try {
          await fs.unlink(variant.path);
        } catch (error) {
          console.error('Failed to clean up variant:', error);
        }
      }
    }

    // Save to media files table
    const mediaFile = {
      filename: `${baseFileName}.webp`,
      original_name: file.originalname,
      file_path: mainUpload.path,
      file_url: mainUpload.url,
      file_size: mainUpload.size,
      mime_type: 'image/webp',
      dimensions: optimizationResult.dimensions,
      alt_text: '',
      caption: '',
      tags: [folder]
    };

    const { data: savedFile, error: saveError } = await supabase
      .from('media_files')
      .insert(mediaFile)
      .select('*')
      .single();

    if (saveError) {
      console.error('Failed to save media file record:', saveError);
    }

    return {
      id: savedFile?.id,
      filename: mediaFile.filename,
      url: mainUpload.url,
      path: mainUpload.path,
      size: mainUpload.size,
      dimensions: optimizationResult.dimensions,
      variants: sizeVariants,
      originalName: file.originalname
    };
  } catch (error) {
    // Clean up on error
    try {
      if (file.path) await fs.unlink(file.path);
    } catch (cleanupError) {
      console.error('Failed to clean up on error:', cleanupError);
    }
    
    throw error;
  }
};

// Delete image from Supabase Storage
const deleteImage = async (fileName, bucket = 'images') => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) throw error;

    return true;
  } catch (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

// Get image info
const getImageInfo = async (fileName, bucket = 'images') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', {
        search: fileName
      });

    if (error) throw error;

    return data;
  } catch (error) {
    throw new Error(`Failed to get image info: ${error.message}`);
  }
};

module.exports = {
  upload,
  uploadImage,
  deleteImage,
  getImageInfo,
  optimizeImage,
  generateImageSizes
};