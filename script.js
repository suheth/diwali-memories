// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Initialize Lenis smooth scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Connect Lenis to ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);


  // Initialize spotlight animations
  initSpotlightAnimations();

  // Re-initialize on resize
  window.addEventListener('resize', initSpotlightAnimations);
});

 // 🎯 CONFIGURATION - EDIT THESE VALUES
  const IMAGE_CONFIG = {
    folder: './storage/images/',           // Path to your images folder
    prefix: '',                    // Prefix before number (e.g., 'img-')
    startNumber: 1,                // First image number
    endNumber: 9,                 // Last image number
    extension: '.jpg',             // Image extension (.jpg, .png, etc.)
    padding: 0,                    // Number padding (0 for none, 3 for 001)
    coverImageNumber: 1            // Which image to use as cover
  };

  // 🎯 FUNCTION TO GENERATE IMAGE PATHS
  function generateImagePaths() {
    const paths = [];
    
    for (let i = IMAGE_CONFIG.startNumber; i <= IMAGE_CONFIG.endNumber; i++) {
      // Add padding if specified
      let numberStr = i.toString();
      if (IMAGE_CONFIG.padding > 0) {
        numberStr = numberStr.padStart(IMAGE_CONFIG.padding, '0');
      }
      
      // Construct full path
      const imagePath = `${IMAGE_CONFIG.folder}${IMAGE_CONFIG.prefix}${numberStr}${IMAGE_CONFIG.extension}`;
      paths.push(imagePath);
    }
    
    return paths;
  }



// 🎯 FUNCTION TO LOAD IMAGES INTO DOM
function loadImages() {
  const imagePaths = generateImagePaths();
  const container = document.querySelector('.spotlight-images');
  const coverImg = document.querySelector('.spotlight-cover-image img');
  
  console.log(`📸 Loading ${imagePaths.length} images...`);
  
  // Set cover image
  const coverPath = `${IMAGE_CONFIG.folder}${IMAGE_CONFIG.prefix}${IMAGE_CONFIG.coverImageNumber}${IMAGE_CONFIG.extension}`;
  coverImg.src = coverPath;
  
  let loadedCount = 0;
  let errorCount = 0;
  
  // Create image elements
  imagePaths.forEach((path, index) => {
    const div = document.createElement('div');
    div.className = 'image';
    
    const img = document.createElement('img');
    img.src = path;
    img.alt = `Image ${index + 1}`;
    // img.loading = 'lazy';
    
    // Track successful loads
    img.onload = () => {
      loadedCount++;
      if (loadedCount === 1) {
        console.log(`✅ First image loaded, starting animation...`);
        // Initialize animations after first image loads
        setTimeout(() => initSpotlightAnimations(), 300);
      }
    };
    
    // Handle missing images gracefully
    img.onerror = () => {
      errorCount++;
      console.warn(`⚠️ Failed to load: ${path}`);
      div.remove(); // Remove failed image from DOM
    };
    
    div.appendChild(img);
    container.appendChild(div);
  });
  
  // Log final stats after a delay
  setTimeout(() => {
    console.log(`📊 Loaded: ${loadedCount} | Failed: ${errorCount} | Total: ${imagePaths.length}`);
  }, 5000);
}

function initSpotlightAnimations() {
  const images = document.querySelectorAll('.spotlight-images .image');
  const coverImage = document.querySelector('.spotlight-cover-image img');
  const introHeader = document.querySelector('.intro-header h1');
  const outroHeader = document.querySelector('.outro-header h1');

  const imageCount = images.length;

  // Dynamic scroll speed
  const scrollPerImage = 125;
  const minScrollPerImage = 30;
  const maxScrollPerImage = 150;
  
  const adjustedScrollPerImage = Math.max(
    minScrollPerImage,
    Math.min(maxScrollPerImage, scrollPerImage * (12 / imageCount))
  );
  
  const scrollLength = imageCount * adjustedScrollPerImage;

  console.log(`📊 ${imageCount} images | ${adjustedScrollPerImage}% per image | Total: ${scrollLength}%`);

  // Split text
  let introSplit = new SplitText(introHeader, { type: 'words' });
  gsap.set(introSplit.words, { opacity: 1 });

  let outroSplit = new SplitText(outroHeader, { type: 'words' });
  gsap.set(outroSplit.words, { opacity: 0 });
  gsap.set(outroHeader, { opacity: 1 });

  // Generate directions dynamically
  const directions = generateDirections(imageCount);

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const isMobile = screenWidth < 1000;
  
  // 🎯 INCREASED SCATTER: More images = MORE scatter (not less)
  const baseScatterMultiplier = isMobile ? 2.5 : 1.5;
  
  // Scale up scatter as image count increases
  const scatterBoost = 1 + (imageCount / 50); // +0.02 multiplier per image
  const maxScatterBoost = 3; // Cap at 3x boost
  
  const scatterMultiplier = baseScatterMultiplier * Math.min(maxScatterBoost, scatterBoost);

  console.log(`💥 Scatter multiplier: ${scatterMultiplier.toFixed(2)}x`);

  const startPositions = {
    x: 0,
    y: 0,
    z: -2000,
    scale: 0,
  };

  // 🎯 INCREASED Z-DEPTH: Images fly further forward/backward
  const zDepthMultiplier = 1 + (imageCount / 100); // Scale Z-axis with image count
  const maxZDepth = Math.min(1000, 500 * zDepthMultiplier);

  const endPositions = [...images].map((_, index) => {
    const direction = directions[index];
    
    // 🎯 LAYERED DEPTH: Some images closer, some farther
    const depthVariation = (index % 3) * 200; // Creates 3 depth layers
    
    return {
      x: direction.x * screenWidth * scatterMultiplier,
      y: direction.y * screenHeight * scatterMultiplier,
      z: maxZDepth + depthVariation, // Variable Z position for depth
      scale: 1,
    };
  });

  console.log(`🌌 Max Z-depth: ${maxZDepth}px`);

  // Set initial positions
  images.forEach((image) => {
    gsap.set(image, {
      x: startPositions.x,
      y: startPositions.y,
      z: startPositions.z,
      scale: startPositions.scale,
    });
  });

  gsap.set(coverImage, {
    x: 0,
    y: 0,
    z: -2000,
    scale: 0,
  });

  // Dynamic stagger
  const baseStagger = 0.05;
  const staggerAmount = Math.max(0.01, baseStagger * (12 / imageCount));

  // Dynamic scrub
  const scrubValue = Math.min(2, 1 + (imageCount / 100));

  ScrollTrigger.create({
    trigger: '.spotlight',
    start: 'top top',
    end: `+=${scrollLength}%`,
    pin: true,
    pinSpacing: true,
    scrub: scrubValue,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const progress = self.progress;

    // 🎯 IMPROVED IMAGE SIZING
    // Base sizes that work well for visibility
    const baseImageWidth = isMobile ? 250 : 400;
    const baseImageHeight = isMobile ? 350 : 550;
    
    // More aggressive size scaling with image count
    const sizeMultiplier = 1 + (imageCount / 40); // Faster growth
    const maxSizeMultiplier = 10; // Allow up to 3x size
    const finalSizeMultiplier = Math.min(maxSizeMultiplier, sizeMultiplier);
    
    const imageWidth = baseImageWidth * finalSizeMultiplier;
    const imageHeight = baseImageHeight * finalSizeMultiplier;

      // Animate gallery images
      images.forEach((image, index) => {
        image.style.width = `${imageWidth}px`;
        image.style.height = `${imageHeight}px`;
        const staggerDelay = index * staggerAmount;
        const scaleMultiplier = isMobile ? 1.5 : 1.2;

        let imageProgress = (progress - staggerDelay) * scaleMultiplier;
        imageProgress = Math.max(0, Math.min(1, imageProgress));

        const start = startPositions;
        const end = endPositions[index];

        const x = start.x + (end.x - start.x) * imageProgress;
        const y = start.y + (end.y - start.y) * imageProgress;
        const z = start.z + (end.z - start.z) * imageProgress;
        const scale = start.scale + (end.scale - start.scale) * imageProgress;

        gsap.set(image, { x, y, z, scale });
      });

      // Cover image animation
      if (progress > 0.7) {
        const coverProgress = (progress - 0.7) / 0.3;
        const coverZ = -2000 + 2000 * coverProgress;
        const coverScale = coverProgress;

        gsap.set(coverImage, {
          z: coverZ,
          scale: coverScale,
        });
      }

      // Text animations (intro fade out 60-75%)
      if (introSplit && introSplit.words) {
        if (progress >= 0.6 && progress <= 0.75) {
          const fadeProgress = (progress - 0.6) / 0.15;
          const wordCount = introSplit.words.length;

          introSplit.words.forEach((word, i) => {
            const wordProgress = i / wordCount;
            if (fadeProgress > wordProgress) {
              const fadeAmount = (fadeProgress - wordProgress) * wordCount;
              const opacity = Math.max(0, 1 - fadeAmount);
              gsap.set(word, { opacity });
            } else {
              gsap.set(word, { opacity: 1 });
            }
          });

          // 🎯 FADE OUT INDICATOR WITH THE TEXT
          const indicator = document.querySelector('.indicator');
          if (indicator) {
            gsap.set(indicator, { opacity: Math.max(0, 1 - fadeProgress) });
          }
        } else if (progress < 0.6) {
          gsap.set(introSplit.words, { opacity: 1 });
        } else {
          gsap.set(introSplit.words, { opacity: 0 });
        }
      }

      // Text animations (outro fade in 80-95%)
      if (outroSplit && outroSplit.words) {
        if (progress >= 0.8 && progress <= 0.95) {
          const fadeProgress = (progress - 0.8) / 0.15;
          const wordCount = outroSplit.words.length;

          outroSplit.words.forEach((word, i) => {
            const wordProgress = i / wordCount;
            if (fadeProgress > wordProgress) {
              const fadeAmount = (fadeProgress - wordProgress) * wordCount;
              const opacity = Math.min(1, fadeAmount);
              gsap.set(word, { opacity });
            } else {
              gsap.set(word, { opacity: 0 });
            }
          });
        } else if (progress < 0.8) {
          gsap.set(outroSplit.words, { opacity: 0 });
        } else {
          gsap.set(outroSplit.words, { opacity: 1 });
        }
      }
    },
  });
}

// 🎯 UNIFIED STAR PATTERN GENERATOR
function generateDirections(count, pattern = 'sunburst') {
  const directions = [];
  
  switch(pattern) {
    case 'star': // Alternating points (asterisk)
      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count;
        const radius = (i % 2 === 0) ? 1.0 : 0.4;
        const randomness = 0.9 + (Math.random() * 0.2);
        
        directions.push({
          x: Math.cos(angle) * radius * randomness,
          y: Math.sin(angle) * radius * randomness
        });
      }
      break;
      
    case 'sunburst': // Radiating rays
      const rayCount = 8;
      for (let i = 0; i < count; i++) {
        const rayGroup = i % rayCount;
        const angle = (rayGroup * Math.PI * 2) / rayCount;
        const depth = Math.floor(i / rayCount);
        const distance = 0.5 + (depth * 0.2);
        const spread = (Math.random() - 0.5) * 0.4;
        
        directions.push({
          x: Math.cos(angle + spread) * distance,
          y: Math.sin(angle + spread) * distance
        });
      }
      break;
      
    case 'galaxy': // Spiral with star modulation
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const angle = i * goldenAngle;
        const normalizedIndex = i / count;
        const distance = Math.sqrt(normalizedIndex);
        const starEffect = 0.6 + 0.4 * Math.cos(angle * 5);
        
        directions.push({
          x: Math.cos(angle) * distance * starEffect,
          y: Math.sin(angle) * distance * starEffect
        });
      }
      break;
      
    default: // Circle (original)
      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count;
        directions.push({
          x: Math.cos(angle),
          y: Math.sin(angle)
        });
      }
  }
  
  return directions;
}

// Usage in initSpotlightAnimations():
const directions = generateDirections(imageCount, 'galaxy'); // or 'sunburst', 'galaxy'
