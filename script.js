// Language switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const enBtn = document.getElementById('en-btn');
    const zhBtn = document.getElementById('zh-btn');
    
    // Get stored language preference or default to English
    const currentLang = localStorage.getItem('language') || 'en';
    setLanguage(currentLang);

    // Add click event listeners to language buttons
    enBtn.addEventListener('click', () => setLanguage('en'));
    zhBtn.addEventListener('click', () => setLanguage('zh'));

    function setLanguage(lang) {
        // Store language preference
        localStorage.setItem('language', lang);

        // Update button states
        if (lang === 'en') {
            enBtn.classList.add('active');
            zhBtn.classList.remove('active');
        } else {
            zhBtn.classList.add('active');
            enBtn.classList.remove('active');
        }

        // Update all elements with data-en and data-zh attributes
        const elements = document.querySelectorAll('[data-en][data-zh]');
        elements.forEach(element => {
            element.textContent = element.getAttribute(`data-${lang}`);
        });
    }
});
