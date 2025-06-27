// script.js

document.addEventListener('DOMContentLoaded', function() {
    
    // Logika Hamburger Menu, berfungsi di semua halaman
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('nav');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => { navMenu.classList.toggle('nav-active'); });
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', () => { navMenu.classList.remove('nav-active'); });
        });
    }

    // Fungsi utama untuk memuat data berdasarkan halaman yang aktif
    loadPageData();
    
    // Inisialisasi lightbox jika ada elemennya di halaman
    if (document.getElementById('lightbox')) {
        initializeLightbox();
    }
});

// FUNGSI UTAMA YANG DIUBAH
async function loadPageData() {
    // Struktur data default untuk fallback jika API gagal
    const defaultData = {
        home: {
            heroBackgroundImage: '', profilePhoto: '', profileName: 'Nama Belum Diisi', profileBio: 'Profesi belum diisi.', shortBio: 'Bio singkat belum diisi.',
            educations: [], skills: [], experiences: [], activities: [], projects: [], certifications: []
        },
        articles: [],
        contact: {
            title: "Get in Touch", subtitle: "Hubungi saya melalui sosial media di bawah ini atau kirimkan pesan langsung.",
            placeholderName: "Nama Anda", placeholderEmail: "Email Anda", placeholderMessage: "Pesan Anda", buttonText: "Kirim Pesan",
            socialMedia: []
        }
    };

    let portfolioData;
    try {
        // Ambil data dari API yang sudah kita buat
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Server data not available.');
        portfolioData = await response.json();
    } catch (error) {
        console.error("Could not fetch live data, using default data as fallback:", error);
        // Jika gagal mengambil data dari server, gunakan data default agar website tidak kosong
        portfolioData = defaultData;
    }

    const pageId = document.body.id;

    // Menjalankan fungsi render yang sesuai dengan halaman
    if (pageId === 'page-home') { renderHomePage(portfolioData.home || defaultData.home); } 
    else if (pageId === 'page-article') { renderArticlePage(portfolioData.articles || defaultData.articles); }
    else if (pageId === 'page-contact') { renderContactPage(portfolioData.contact || defaultData.contact); }
    else if (pageId === 'page-article-detail') { renderArticleDetailPage(portfolioData.articles || defaultData.articles); }
}

// --- SEMUA FUNGSI DI BAWAH INI SAMA SEPERTI KODE ASLI ANDA, TIDAK PERLU DIUBAH ---

function renderHomePage(data) {
    document.getElementById('hero-background-image-layer').style.backgroundImage = `url('${data.heroBackgroundImage || ''}')`;
    document.getElementById('profile-photo').src = data.profilePhoto || '';
    document.getElementById('profile-name').textContent = data.profileName || 'Nama Anda';
    document.getElementById('profile-short-bio').textContent = data.profileBio || 'Profesi Anda';
    document.getElementById('short-bio-text').textContent = data.shortBio || '';

    renderSection(document.getElementById('education'), () => renderTimeline(document.getElementById('education-timeline'), data.educations, createEducationHTML), data.educations);
    renderSection(document.getElementById('experience'), () => renderTimeline(document.getElementById('experience-timeline'), data.experiences, createExperienceHTML), data.experiences);
    renderSection(document.getElementById('skills'), () => renderSkills(document.getElementById('skills-container'), data.skills), data.skills);
    renderSection(document.getElementById('activity'), () => { renderCards(document.getElementById('activity-container'), data.activities, createActivityHTML); initializeSlider('activity-container'); }, data.activities);
    renderSection(document.getElementById('projects'), () => { renderCards(document.getElementById('projects-container'), data.projects, createProjectHTML); initializeSlider('projects-container'); }, data.projects);
    renderSection(document.getElementById('certifications'), () => { renderCards(document.getElementById('certifications-container'), data.certifications, createCertificationHTML); initializeSlider('certifications-container'); }, data.certifications);
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
    if(!data) return;
    document.getElementById('contact-title').textContent = data.title || 'Get in Touch';
    document.getElementById('contact-subtitle').textContent = data.subtitle || 'Hubungi saya...';
    document.getElementById('form-name').placeholder = data.placeholderName || 'Your Name';
    document.getElementById('form-email').placeholder = data.placeholderEmail || 'Your Email';
    document.getElementById('form-message').placeholder = data.placeholderMessage || 'Your Message';
    document.getElementById('form-submit-btn').textContent = data.buttonText || 'Send Message';
    const container = document.getElementById('contact-social-media');
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

function renderArticleDetailPage(articles) {
    const container = document.querySelector('.article-detail-container');
    if (!container) return;
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');
    if (!articleId || !articles) { container.innerHTML = '<h2>Artikel tidak ditemukan.</h2>'; return; }
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

function renderSection(sectionElement, renderCallback, dataArray) { if (!sectionElement) return; sectionElement.style.display = (dataArray && dataArray.length > 0) ? 'block' : 'none'; if (sectionElement.style.display === 'block') renderCallback(); }
function renderTimeline(c, d, h) { if (!c) return; c.innerHTML = ''; d.forEach(i => { const e = document.createElement('div'); e.className = 'timeline-item'; e.innerHTML = h(i); c.appendChild(e); }); }
function renderCards(c, d, h) { if (!c) return; c.innerHTML = ''; d.forEach(i => { const e = document.createElement('div'); e.className = 'card'; e.innerHTML = h(i); c.appendChild(e); }); }
function renderSkills(c, d) { if (!c) return; c.innerHTML = ''; d.forEach(i => { const e = document.createElement('div'); e.className = 'skill-item'; e.innerHTML = `<div class="skill-icon-wrapper"><img src="${i.image}" alt="${i.name}"></div><p class="skill-name">${i.name}</p>`; c.appendChild(e); }); }
const createEducationHTML = edu => `<div class="timeline-content"><span class="year">${edu.year || ''}</span><h3>${edu.institution || ''}</h3><span class="timeline-subtitle">${edu.field || ''}</span></div>`;
const createExperienceHTML = exp => `<div class="timeline-content"><span class="date">${exp.date || ''}</span><h3>${exp.profession || ''}</h3><span class="timeline-subtitle">${exp.institution || ''}</span><p>${exp.description || ''}</p></div>`;
const createActivityHTML = act => `<img src="${act.image}" alt="${act.title}"><h3>${act.title}</h3><div class="activity-details"><span class="role">${act.role}</span><span class="date">${act.date}</span></div>`;
const createCertificationHTML = cert => `<img src="${cert.image}" alt="${cert.title}"><h3>${cert.title}</h3><div class="certification-details"><span class="issuer"><h9 style="font-weight: bold;">Publisher:</h9><br>${cert.issuer || ''}</span><span class="role"><h9 style="font-weight: bold;">Role: </h9><br>${cert.role || ''}</span><span class="date">Date: ${cert.date || ''}</span></div>`;
const createProjectHTML = proj => { const content = `<img src="${proj.image}" alt="${proj.title}"><h3>${proj.title}</h3><p>${proj.description}</p>`; return proj.link ? `<a href="${proj.link}" target="_blank" style="text-decoration:none; color:inherit;">${content}</a>` : content; };

function initializeSlider(containerId) {
    const sliderContainer = document.getElementById(containerId);
    if (!sliderContainer) return;

    const wrapper = sliderContainer.parentElement;
    const nextBtn = wrapper.querySelector('.slider-btn.next');
    const prevBtn = wrapper.querySelector('.slider-btn.prev');
    if (!nextBtn || !prevBtn) return;
    
    let items = Array.from(sliderContainer.children);
    if (items.length <= 3) {
        nextBtn.style.display = 'none';
        prevBtn.style.display = 'none';
        return;
    } else {
        nextBtn.style.display = 'flex';
        prevBtn.style.display = 'flex';
    }

    let isMoving = false;
    const itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(sliderContainer).gap);
    
    const cloneCount = 5;
    items.slice(0, cloneCount).forEach(item => {
        sliderContainer.appendChild(item.cloneNode(true));
    });
    items.slice(-cloneCount).reverse().forEach(item => {
        sliderContainer.prepend(item.cloneNode(true));
    });
    
    sliderContainer.scrollLeft = cloneCount * itemWidth;

    function moveSlider(direction) {
        if (isMoving) return;
        isMoving = true;
        sliderContainer.style.scrollBehavior = 'smooth';
        sliderContainer.scrollLeft += direction * itemWidth;
    }

    nextBtn.addEventListener('click', () => moveSlider(1));
    prevBtn.addEventListener('click', () => moveSlider(-1));
    
    let scrollEndTimer;
    sliderContainer.addEventListener('scroll', () => {
        clearTimeout(scrollEndTimer);
        scrollEndTimer = setTimeout(() => {
            isMoving = false;
            const totalItems = items.length;
            if (sliderContainer.scrollLeft >= (totalItems + cloneCount - 1) * itemWidth) {
                sliderContainer.style.scrollBehavior = 'auto';
                sliderContainer.scrollLeft = (cloneCount -1) * itemWidth;
            }
            if (sliderContainer.scrollLeft <= itemWidth) {
                sliderContainer.style.scrollBehavior = 'auto';
                sliderContainer.scrollLeft = totalItems * itemWidth;
            }
        }, 150); 
    });
}

function initializeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    
    document.body.addEventListener('click', function(e) {
        const card = e.target.closest('#certifications .card, #projects .card'); // Target specific sections
        if (card) {
            const cardImage = card.querySelector('img');
            if (cardImage && cardImage.src && !card.querySelector('a')) { // Don't trigger on linked project cards
                e.preventDefault();
                lightbox.classList.remove('hidden');
                lightboxImg.src = cardImage.src;
            }
        }
    });

    function closeLightbox() { lightbox.classList.add('hidden'); }
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e) { if (e.target === lightbox) { closeLightbox(); } });
}