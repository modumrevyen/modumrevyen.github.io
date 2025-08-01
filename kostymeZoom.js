// kostymeZoom.js - Standalone zoom functionality for costume image modals
// This file provides zoom and pan functionality for image modals without dependencies

// Image zoom and pan functionality
let imageZoom = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0
};

function resetImageZoom() {
  imageZoom = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  };
  updateImageTransform();
}

function updateImageTransform() {
  const modalImage = document.getElementById('modalImage');
  if (modalImage) {
    // Add constraints to prevent panning too far - based on actual image dimensions
    if (imageZoom.scale > 1) {
      const rect = modalImage.getBoundingClientRect();
      const imageWidth = rect.width;
      const imageHeight = rect.height;
      
      // Calculate how much extra space is available when zoomed
      const scaledWidth = imageWidth * imageZoom.scale;
      const scaledHeight = imageHeight * imageZoom.scale;
      
      // Allow panning to see the edges, but not beyond a reasonable amount
      const maxTranslateX = (scaledWidth - imageWidth) / 2 + 50;
      const maxTranslateY = (scaledHeight - imageHeight) / 2 + 50;
      
      imageZoom.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, imageZoom.translateX));
      imageZoom.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, imageZoom.translateY));
    }
    
    modalImage.style.transform = `translate(${imageZoom.translateX}px, ${imageZoom.translateY}px) scale(${imageZoom.scale})`;
    
    if (imageZoom.scale > 1) {
      modalImage.classList.add('zoomed');
    } else {
      modalImage.classList.remove('zoomed');
    }
  }
}

function updateImageTransformWithoutTransition() {
  const modalImage = document.getElementById('modalImage');
  if (modalImage) {
    // Temporarily disable transition for smooth dragging
    modalImage.style.transition = 'none';
    updateImageTransform();
    // Re-enable transition after a brief moment
    setTimeout(() => {
      modalImage.style.transition = 'transform 0.1s ease';
    }, 16); // One frame at 60fps
  }
}

function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Initialize zoom functionality when page loads
document.addEventListener('DOMContentLoaded', function() {
  const imageModal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');

  if (imageModal && modalImage) {
    // Reset zoom when modal is hidden
    imageModal.addEventListener('hidden.bs.modal', function() {
      resetImageZoom();
    });

    // Mouse wheel zoom
    modalImage.addEventListener('wheel', function(e) {
      e.preventDefault();
      
      const rect = modalImage.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      
      const zoomSpeed = 0.15;
      const zoomFactor = e.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
      
      // Limit zoom range
      const newScale = Math.max(0.5, Math.min(5, imageZoom.scale * zoomFactor));
      
      if (newScale !== imageZoom.scale) {
        // Calculate new translation to zoom towards mouse position
        const scaleChange = newScale / imageZoom.scale;
        
        // Adjust translation to zoom towards cursor position
        imageZoom.translateX = imageZoom.translateX * scaleChange + mouseX * (1 - scaleChange);
        imageZoom.translateY = imageZoom.translateY * scaleChange + mouseY * (1 - scaleChange);
        imageZoom.scale = newScale;
        
        updateImageTransform();
      }
    });

    // Mouse drag to pan
    modalImage.addEventListener('mousedown', function(e) {
      if (imageZoom.scale > 1) {
        e.preventDefault();
        imageZoom.isDragging = true;
        imageZoom.lastMouseX = e.clientX;
        imageZoom.lastMouseY = e.clientY;
      }
    });

    document.addEventListener('mousemove', function(e) {
      if (imageZoom.isDragging && imageZoom.scale > 1) {
        e.preventDefault();
        
        const deltaX = e.clientX - imageZoom.lastMouseX;
        const deltaY = e.clientY - imageZoom.lastMouseY;
        
        imageZoom.translateX += deltaX;
        imageZoom.translateY += deltaY;
        
        imageZoom.lastMouseX = e.clientX;
        imageZoom.lastMouseY = e.clientY;
        
        updateImageTransformWithoutTransition();
      }
    });

    document.addEventListener('mouseup', function() {
      imageZoom.isDragging = false;
    });

    // Touch support for mobile
    let initialDistance = 0;
    let initialScale = 1;

    modalImage.addEventListener('touchstart', function(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialScale = imageZoom.scale;
      } else if (e.touches.length === 1 && imageZoom.scale > 1) {
        imageZoom.isDragging = true;
        imageZoom.lastMouseX = e.touches[0].clientX;
        imageZoom.lastMouseY = e.touches[0].clientY;
      }
    });

    modalImage.addEventListener('touchmove', function(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scaleChange = currentDistance / initialDistance;
        const newScale = Math.max(0.5, Math.min(5, initialScale * scaleChange));
        
        imageZoom.scale = newScale;
        updateImageTransform();
      } else if (e.touches.length === 1 && imageZoom.isDragging && imageZoom.scale > 1) {
        e.preventDefault();
        
        const deltaX = e.touches[0].clientX - imageZoom.lastMouseX;
        const deltaY = e.touches[0].clientY - imageZoom.lastMouseY;
        
        imageZoom.translateX += deltaX;
        imageZoom.translateY += deltaY;
        
        imageZoom.lastMouseX = e.touches[0].clientX;
        imageZoom.lastMouseY = e.touches[0].clientY;
        
        updateImageTransformWithoutTransition();
      }
    });

    modalImage.addEventListener('touchend', function() {
      imageZoom.isDragging = false;
    });

    // Double-click to zoom
    modalImage.addEventListener('dblclick', function(e) {
      e.preventDefault();
      
      if (imageZoom.scale === 1) {
        // Zoom in to 2x at click point relative to center
        const rect = modalImage.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;
        
        imageZoom.scale = 2;
        imageZoom.translateX = -mouseX;
        imageZoom.translateY = -mouseY;
      } else {
        // Reset zoom
        resetImageZoom();
      }
      
      updateImageTransform();
    });
  }
});
