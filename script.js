document.addEventListener('DOMContentLoaded', () => {

    // --- Language Switching Logic ---
    const enBtn = document.getElementById('en-btn');
    const zhBtn = document.getElementById('zh-btn');
    const translatableElements = document.querySelectorAll('[data-en]');
  
    const setLanguage = (lang) => {
      translatableElements.forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        // Use textContent to change only the text, not the inner HTML
        // Find the first text node and update it
        const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) {
            textNode.textContent = text + ' '; // Add space for elements with children like <strong>
        } else {
            // Fallback for elements with no direct text node (like the main P tags)
            el.textContent = text;
        }
      });
      // Update active button
      if (lang === 'en') {
        enBtn.classList.add('active');
        zhBtn.classList.remove('active');
      } else {
        zhBtn.classList.add('active');
        enBtn.classList.remove('active');
      }
      localStorage.setItem('language', lang);
    };
  
    enBtn.addEventListener('click', () => setLanguage('en'));
    zhBtn.addEventListener('click', () => setLanguage('zh'));
  
    // Set initial language from storage or default to English
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
  
  
    // --- Hamburger Menu Logic ---
    const hamburger = document.querySelector('.hamburger-menu');
    const header = document.querySelector('header');
  
    hamburger.addEventListener('click', () => {
      header.classList.toggle('nav-active');
    });
  
     // --- Class Card Horizontal Scroll ---
  const classTypes = document.querySelector('.class-types');
  const leftArrow = document.querySelector('.class-scroll-arrow.left');
  const rightArrow = document.querySelector('.class-scroll-arrow.right');
  if (classTypes && leftArrow && rightArrow) {
    leftArrow.addEventListener('click', () => {
      classTypes.scrollBy({ left: -320, behavior: 'smooth' });
    });
    rightArrow.addEventListener('click', () => {
      classTypes.scrollBy({ left: 320, behavior: 'smooth' });
    });
  } 
    // --- Photo Library Horizontal Scroll ---
    const photoGallery = document.querySelector('.photo-gallery');
    const photoLeftArrow = document.querySelector('.photo-scroll-arrow.left');
    const photoRightArrow = document.querySelector('.photo-scroll-arrow.right');
  
    if (photoGallery && photoLeftArrow && photoRightArrow) {
      photoLeftArrow.addEventListener('click', () => {
        photoGallery.scrollBy({ left: -350, behavior: 'smooth' }); // Adjust scroll amount as needed
      });
      photoRightArrow.addEventListener('click', () => {
        photoGallery.scrollBy({ left: 350, behavior: 'smooth' }); // Adjust scroll amount as needed
      });
    }
  });