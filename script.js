// script.js (FIXED VERSION)

let portfolioDataCache = null;

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    handleInitialPageLoad();
    initializeStaticListeners();
});

// Fungsi baru untuk menangani klik tombol expand/collapse
function handleExpandCollapse(e) {
    const isExpandBtn = e.target.classList.contains('expand-btn');
    const isCollapseBtn = e.target.classList.contains('collapse-btn');

    if (!isExpandBtn && !isCollapseBtn) return;

    e.preventDefault();
    const targetId = e.target.dataset.target;
    const container = document.getElementById(targetId);
    if (!container) return;

    const expandBtn = container.previousElementSibling;
    const collapseBtn = container.nextElementSibling;

    if (isExpandBtn) {
        container.style.display = 'flex';
        if (expandBtn) expandBtn.style.display = 'none';
        if (collapseBtn) collapseBtn.style.display = 'block';
    } else { // isCollapseBtn
        container.style.display = 'none';
        if (expandBtn) expandBtn.style.display = 'block';
        if (collapseBtn) collapseBtn.style.display = 'none';
        
        const section = container.closest('.content-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// Inisialisasi event listener statis
function initializeStaticListeners() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('nav');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('nav-active');
        });
    }

    if (document.getElementById('lightbox')) {
        initializeLightbox();
    }
    
    // Menggunakan event delegation untuk tombol expand/collapse
    document.body.addEventListener('click', handleExpandCollapse);

    attachNavLinks();
    window.addEventListener('popstate', handlePopState);
}

async function handleInitialPageLoad() {
    const preloader = document.getElementById('preloader');

    // Atur preloader agar hilang setelah 2 detik
    setTimeout(() => {
        if (preloader) {
            preloader.classList.add('hidden');
        }
    }, 2000);

    // Coba ambil dari cache lokal terlebih dahulu
    const cachedData = localStorage.getItem('portfolioData');
    if (cachedData) {
        portfolioDataCache = JSON.parse(cachedData);
        renderContentForPage(document.body.id, portfolioDataCache);
        console.log("Rendered from local cache.");
    } else {
         // Render critical data from inline script if no local cache
         const criticalDataElement = document.getElementById('critical-data');
         if (criticalDataElement) {
             const criticalData = JSON.parse(criticalDataElement.textContent);
             renderHomePage(criticalData.home || {}, true); // Render only critical data initially
         }
    }

    // Selalu ambil data terbaru dari server di latar belakang
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Server data not available.');
        const liveData = await response.json();

        // Jika ada perubahan atau ini pertama kali, update cache dan render ulang
        if (JSON.stringify(liveData) !== JSON.stringify(portfolioDataCache)) {
            portfolioDataCache = liveData;
            localStorage.setItem('portfolioData', JSON.stringify(liveData));
            renderContentForPage(document.body.id, portfolioDataCache);
            console.log("Rendered from live data, cache updated.");
        } else {
             console.log("Live data is same as cached data.");
        }
    } catch (error) {
        console.error("Could not fetch live data:", error);
        // Fallback to cached data if fetch fails and cached data exists
        if (!portfolioDataCache && cachedData) {
             portfolioDataCache = JSON.parse(cachedData);
             renderContentForPage(document.body.id, portfolioDataCache);
        }
    }
    updateActiveNavLink();
}
// Render konten halaman berdasarkan ID
function renderContentForPage(pageId, data) {
    if (!data) return;
    try {
        switch (pageId) {
            case 'page-home':
                renderHomePage(data.home || {});
                break;
            case 'page-article':
                renderArticlePage(data.articles || []);
                break;
            case 'page-contact':
                renderContactPage(data.contact || {});
                break;
            case 'page-article-detail':
                renderArticleDetailPage(data.articles || []);
                break;
        }
    } catch (renderError) {
        console.error("Error during page rendering:", renderError);
    }
}

// Klik link internal
function handleNavClick(event) {
    const target = event.target.closest('a');
    if (!target || target.href.includes('#') || !target.href.startsWith(window.location.origin)) return;
    event.preventDefault();
    navigate(target.href);
}

// Navigasi ke URL baru
async function navigate(url) {
    try {
        const response = await fetch(url);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        document.querySelector('main').innerHTML = doc.querySelector('main').innerHTML;
        document.body.id = doc.body.id;
        document.title = doc.title;
        history.pushState({}, '', url);

        renderContentForPage(doc.body.id, portfolioDataCache);
        attachNavLinks();
        updateActiveNavLink();
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('Failed to navigate:', error);
        window.location.href = url;
    }
}

// --- FUNGSI UNTUK NAVIGASI AKTIF ---
function updateActiveNavLink() {
    const currentPageFilename = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('header nav a');

    navLinks.forEach(link => {
        const linkFilename = link.getAttribute('href');
        link.classList.remove('active');

        if (currentPageFilename === 'article-detail.html' && linkFilename === 'article.html') {
            link.classList.add('active');
        } else if ((currentPageFilename === '' || currentPageFilename === 'index.html') && linkFilename === 'index.html') {
            link.classList.add('active');
        } else if (currentPageFilename === linkFilename) {
            link.classList.add('active');
        }
    });
}

// Tombol back/forward browser
function handlePopState() {
    navigate(window.location.href);
}

// Pasang event listener ke link navigasi internal
function attachNavLinks() {
    document.querySelectorAll('header nav a, .logo a').forEach(link => {
        link.removeEventListener('click', handleNavClick);
        link.addEventListener('click', handleNavClick);
    });
}

// --- FUNGSI RENDER AND SWAP YANG DIPERBAIKI ---
function renderAndSwap(contentId, skeletonId, data, renderFn, displayType = 'flex') {
    const contentElement = document.getElementById(contentId);
    const skeletonElement = document.getElementById(skeletonId);
    const hasData = data && (!Array.isArray(data) || data.length > 0);
    const mainSection = contentElement ? contentElement.closest('.content-section') : null;

    // Daftar section yang menggunakan tombol dropdown
    const expandableSections = ['activity-container', 'projects-container', 'certifications-container'];

    if (contentElement && skeletonElement) {
        if (hasData) {
            renderFn(contentElement, data); 
            skeletonElement.style.display = 'none';

            // Logika untuk menampilkan konten
            if (!expandableSections.includes(contentId)) {
                // JIKA BUKAN SECTION DROPDOWN: langsung tampilkan kontennya. INI BAGIAN YANG DIPERBAIKI.
                contentElement.style.visibility = 'visible';
                contentElement.style.display = displayType;
            }
            // Jika section dropdown, kontennya sengaja dibiarkan display:none sampai tombol ditekan.
        } else {
            skeletonElement.style.display = 'none';
            contentElement.style.display = 'none';
        }
    }

    // Mengatur visibilitas untuk seluruh section (.content-section)
    if (mainSection) {
        if (hasData) {
            mainSection.style.display = 'block';
            // Jika ini adalah section dropdown, tampilkan tombol "show all" (v)
            if (expandableSections.includes(contentId)) {
                const expandBtn = mainSection.querySelector(`.expand-btn[data-target="${contentId}"]`);
                if (expandBtn) expandBtn.style.display = 'block';
            }
        } else {
            mainSection.style.display = 'none';
        }
    }
}


// script.js

function renderHomePage(data, isCriticalOnly = false) {
    // Render bagian yang ada di data kritis
    if (data.heroBackgroundImage) {
        document.getElementById('hero-background-image-layer').style.backgroundImage = `url('${data.heroBackgroundImage}')`;
    }
    renderAndSwap('profile-photo', 'profile-photo-skeleton', data.profilePhoto, (el, val) => { el.src = val; el.style.visibility = 'visible' }, 'inline-block');
    renderAndSwap('profile-name', 'profile-name-skeleton', data.profileName, (el, val) => { el.textContent = val; }, 'block');
    renderAndSwap('profile-short-bio', 'profile-short-bio-skeleton', data.profileBio, (el, val) => { el.textContent = val; }, 'block');
    
    const shortBioText = document.getElementById('short-bio-text');
    if (shortBioText && data.shortBio) {
        shortBioText.textContent = data.shortBio;
        shortBioText.closest('.content-section').style.display = 'block';
    }

    // Jika ini bukan pemuatan data kritis saja, render sisanya
    if (!isCriticalOnly) {
        renderAndSwap('education-timeline', 'education-skeleton', data.educations, (c, d) => renderTimeline(c, d, createEducationHTML), 'block');
        renderAndSwap('experience-timeline', 'experience-skeleton', data.experiences, (c, d) => renderTimeline(c, d, createExperienceHTML), 'block');
        renderAndSwap('skills-container', 'skills-skeleton', data.skills, (c, d) => renderSkills(c, d), 'flex');
        renderAndSwap('activity-container', 'activity-skeleton', data.activities, (c, d) => renderCards(c, d, createActivityHTML), 'flex');
        renderAndSwap('projects-container', 'projects-skeleton', data.projects, (c, d) => renderCards(c, d, createProjectHTML), 'flex');
        renderAndSwap('certifications-container', 'certifications-skeleton', data.certifications, (c, d) => renderCards(c, d, createCertificationHTML), 'flex');
    }
}

function renderArticlePage(articles) {
    const container = document.getElementById('articles-container');
    if (!container) return;
    container.innerHTML = '';
    if (articles && articles.length > 0) {
        articles.forEach(article => {
            const cardLink = document.createElement('a');
            cardLink.href = `article-detail.html?id=${article.id}`;
            cardLink.className = 'card';
            cardLink.innerHTML = `<img src="${article.image || ''}" alt="${article.title}"><h3>${article.title}</h3><p class="article-date">${article.date || ''}</p><p>${(article.content || '').substring(0, 150)}...</p>`;
            container.appendChild(cardLink);
        });
    } else {
        container.innerHTML = '<p style="text-align: center; width: 100%;">Belum ada artikel yang dipublikasikan.</p>';
    }
}

function renderContactPage(data) {
    if (!data) return;
    document.getElementById('contact-title').textContent = data.title || 'Get in Touch';
    document.getElementById('contact-subtitle').textContent = data.subtitle || 'Hubungi saya...';
    const container = document.getElementById('contact-social-media');
    if (container) {
        container.innerHTML = '';
        if (data.socialMedia && data.socialMedia.length > 0) {
            data.socialMedia.forEach(sm => {
                const socialLink = document.createElement('a');
                socialLink.href = sm.url;
                socialLink.target = "_blank";
                socialLink.setAttribute('aria-label', sm.platform);
                socialLink.innerHTML = `<img src="${sm.logoImage || ''}" alt="${sm.platform}">`;
                container.appendChild(socialLink);
            });
        }
    }
}

function renderArticleDetailPage(articles) {
    const container = document.querySelector('.article-detail-container');
    if (!container) return;
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');
    if (!articleId || !articles) {
        container.innerHTML = '<h2>Artikel tidak ditemukan.</h2>';
        return;
    }
    const article = articles.find(a => a.id === articleId);
    if (article) {
        document.title = article.title || "Article";
        document.getElementById('article-detail-title').textContent = article.title;
        document.getElementById('article-detail-date').textContent = article.date;
        const imgElement = document.getElementById('article-detail-image');
        imgElement.src = article.image;
        imgElement.alt = article.title;
        const contentHTML = (article.content || '').split('\n').map(p => `<p>${p}</p>`).join('');
        document.getElementById('article-detail-content').innerHTML = contentHTML;
    } else {
        container.innerHTML = '<h2>Artikel tidak ditemukan.</h2>';
    }
}

function renderTimeline(container, data, htmlFn) {
    if (!container) return;
    container.innerHTML = '';
    data.forEach(item => {
        const el = document.createElement('div');
        el.className = 'timeline-item';
        el.innerHTML = htmlFn(item);
        container.appendChild(el);
    });
}

// script.js

function renderCards(container, data, htmlFn) {
    if (!container) return;
    container.innerHTML = ''; // Hapus konten lama

    const fragment = document.createDocumentFragment(); // Buat wadah sementara

    data.forEach(item => {
        const el = document.createElement('a');
        el.className = 'card';
        el.innerHTML = htmlFn(item);
        if (htmlFn === createProjectHTML && item.link) {
            el.href = item.link;
            el.target = '_blank';
            el.style.textDecoration = 'none';
            el.style.color = 'inherit';
        } else {
            el.href = '#';
            el.onclick = e => e.preventDefault();
        }
        fragment.appendChild(el); // Tambahkan ke wadah, bukan langsung ke DOM
    });

    container.appendChild(fragment); // Tambahkan semua kartu ke DOM dalam satu operasi
}

function renderSkills(container, data) {
    if (!container) return;
    container.innerHTML = '';
    data.forEach(skill => {
        const el = document.createElement('div');
        el.className = 'skill-item';
        el.innerHTML = `<div class="skill-icon-wrapper"><img src="${skill.image}" alt="${skill.name}"></div><p class="skill-name">${skill.name}</p>`;
        container.appendChild(el);
    });
}

const createEducationHTML = edu => `<div class="timeline-content"><span class="year">${edu.year || ''}</span><h3>${edu.institution || ''}</h3><span class="timeline-subtitle">${edu.field || ''}</span></div>`;
const createExperienceHTML = exp => `<div class="timeline-content"><span class="date">${exp.date || ''}</span><h3>${exp.profession || ''}</h3><span class="timeline-subtitle">${exp.institution || ''}</span><p>${exp.description || ''}</p></div>`;

const createActivityHTML = act => `<img src="${act.image}" alt="${act.title}" loading="lazy"><h3>${act.title}</h3><div class="activity-details"><span class="role">${act.role}</span><span class="date">${act.date}</span></div>`;
const createCertificationHTML = cert => `<img src="${cert.image}" alt="${cert.title}" loading="lazy"><h3>${cert.title}</h3><div class="certification-details"><span class="issuer"><strong>Publisher:</strong><br>${cert.issuer || ''}</span><span class="role"><strong>Role:</strong><br>${cert.role || ''}</span><span class="date">Date: ${cert.date || ''}</span></div>`;
const createProjectHTML = proj => `<img src="${proj.image}" alt="${proj.title}" loading="lazy"><h3>${proj.title}</h3><p>${proj.description}</p>`;

function initializeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    document.body.addEventListener('click', e => {
        const card = e.target.closest('#certifications .card, #projects .card');
        if (card) {
            const cardLink = card.closest('a');
            if (cardLink && cardLink.href && !cardLink.href.endsWith('#')) return;
            e.preventDefault();
            const cardImage = card.querySelector('img');
            if (cardImage && cardImage.src) {
                lightbox.classList.remove('hidden');
                lightboxImg.src = cardImage.src;
            }
        }
    });

    function closeLightbox() {
        if (lightbox) lightbox.classList.add('hidden');
    }
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => {
        if (e.target === lightbox) closeLightbox();
    });
}