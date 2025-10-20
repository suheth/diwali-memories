// Funny Diwali quotes for loading screen
const diwaliquotes = [
  "This Diwali, may your sweets be sweeter than your Instagram likes!",
  "Loading... Just like your relatives loading up on mithai!",
  "May your crackers be louder than your neighbor's music!",
  "Diwali prep: 10% cleaning, 90% hiding the mess behind curtains!",
  "May your diyas burn longer than your phone battery!",
  "Loading memories faster than aunties loading their plates!",
  "This Diwali, may your rangoli be straighter than your life!"
];

// Rotate quotes during loading
let quoteIndex = 0;
const quoteInterval = setInterval(() => {
  console.log('loading');
  const quoteElement = document.getElementById('loading-quote');
  quoteIndex = (quoteIndex + 1) % diwaliquotes.length;
  if (quoteElement) {
    console.log('loading setting text');
    quoteElement.textContent = '"'+diwaliquotes[quoteIndex]+'"';
  }
}, 5000);

// Wait for page to fully load
window.addEventListener('load', () => {
  // Clear quote rotation
  clearInterval(quoteInterval);
  
  // Hide loading screen after everything is loaded
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    gsap.to(loadingScreen, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        loadingScreen.style.display = 'none';
      }
    });
  }
  // Initialize animations
  setTimeout(initSpotlightAnimations, 100);
});

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP plugins
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Initialize Lenis smooth scroll
  const isMobile = window.innerWidth < 1000;
  
  const lenis = new Lenis({
    duration: isMobile ? 0.8 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: !isMobile, // Disable smooth scroll on mobile to prevent white screen
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Connect Lenis to ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  // Remove duplicate raf call that causes mobile issues
  gsap.ticker.lagSmoothing(0);

  // Re-initialize on resize with debounce
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
      initSpotlightAnimations();
    }, 250);
  });
});

function initSpotlightAnimations() {
  // Clear any existing ScrollTriggers to prevent conflicts
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  
  const images = document.querySelectorAll('.spotlight-images .image');
  const coverImage = document.querySelector('.spotlight-cover-image img');
  const introHeader = document.querySelector('.intro-header h1');
  const outroHeader = document.querySelector('.outro-header h1');

  // Safety checks
  if (!images.length || !coverImage || !introHeader || !outroHeader) {
    console.warn('Missing required elements for animation');
    return;
  }

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

  // Split text with error handling
  let introSplit, outroSplit;
  
  try {
    // Reset text content first to prevent SplitText breaking
    introHeader.innerHTML = introHeader.textContent;
    outroHeader.innerHTML = outroHeader.textContent;
    
    introSplit = new SplitText(introHeader, { type: 'words' });
    gsap.set(introSplit.words, { opacity: 1 });

    outroSplit = new SplitText(outroHeader, { type: 'words' });
    gsap.set(outroSplit.words, { opacity: 0 });
    gsap.set(outroHeader, { opacity: 1 });
  } catch (error) {
    console.warn('SplitText failed, using fallback:', error);
    // Fallback: use the elements directly
    gsap.set(introHeader, { opacity: 1 });
    gsap.set(outroHeader, { opacity: 0 });
  }

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
    z: isMobile ? -500 : -2000, // Reduce Z-depth on mobile
    scale: 0,
  };

  // 🎯 REDUCED Z-DEPTH for mobile performance
  const zDepthMultiplier = 1 + (imageCount / 100);
  const maxZDepth = isMobile ? 
    Math.min(300, 150 * zDepthMultiplier) : // Much smaller Z values on mobile
    Math.min(1000, 500 * zDepthMultiplier);

  const endPositions = [...images].map((_, index) => {
    const direction = directions[index];
    
    // 🎯 LAYERED DEPTH: Some images closer, some farther
    const depthVariation = isMobile ? 
      (index % 3) * 50 : // Smaller depth variation on mobile
      (index % 3) * 200;
    
    return {
      x: direction.x * screenWidth * scatterMultiplier,
      y: direction.y * screenHeight * scatterMultiplier,
      z: maxZDepth + depthVariation,
      scale: 1,
    };
  });

  console.log(`🌌 Max Z-depth: ${maxZDepth}px`);

  // Set initial positions with mobile optimization
  images.forEach((image) => {
    gsap.set(image, {
      x: startPositions.x,
      y: startPositions.y,
      z: startPositions.z,
      scale: startPositions.scale,
      force3D: true, // Force hardware acceleration
    });
  });

  gsap.set(coverImage, {
    x: 0,
    y: 0,
    z: isMobile ? -500 : -2000,
    scale: 0,
    force3D: true,
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

        gsap.set(image, { 
          x, y, z, scale,
          force3D: true,
          transformOrigin: "center center"
        });
      });

      // Cover image animation
      if (progress > 0.7) {
        const coverProgress = (progress - 0.7) / 0.3;
        const coverZ = (isMobile ? -500 : -2000) + (isMobile ? 500 : 2000) * coverProgress;
        const coverScale = coverProgress;

        gsap.set(coverImage, {
          z: coverZ,
          scale: coverScale,
          force3D: true,
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
            const indicatorOpacity = Math.max(0, 1 - fadeProgress);
            gsap.set(indicator, { 
              opacity: indicatorOpacity,
              display: indicatorOpacity === 0 ? 'none' : 'flex'
            });
          }
        } else if (progress < 0.6) {
          gsap.set(introSplit.words, { opacity: 1 });
        } else {
          gsap.set(introSplit.words, { opacity: 0 });
        }
      } else {
        // Fallback: animate entire intro header
        if (progress >= 0.6 && progress <= 0.75) {
          const fadeProgress = (progress - 0.6) / 0.15;
          gsap.set(introHeader, { opacity: Math.max(0, 1 - fadeProgress) });
          
          const indicator = document.querySelector('.indicator');
          if (indicator) {
            const indicatorOpacity = Math.max(0, 1 - fadeProgress);
            gsap.set(indicator, { 
              opacity: indicatorOpacity,
              display: indicatorOpacity === 0 ? 'none' : 'flex'
            });
          }
        } else if (progress < 0.6) {
          gsap.set(introHeader, { opacity: 1 });
        } else {
          gsap.set(introHeader, { opacity: 0 });
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
      } else {
        // Fallback: animate entire outro header
        if (progress >= 0.8 && progress <= 0.95) {
          const fadeProgress = (progress - 0.8) / 0.15;
          gsap.set(outroHeader, { opacity: Math.min(1, fadeProgress) });
        } else if (progress < 0.8) {
          gsap.set(outroHeader, { opacity: 0 });
        } else {
          gsap.set(outroHeader, { opacity: 1 });
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
