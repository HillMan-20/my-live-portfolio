document.addEventListener('DOMContentLoaded', () => {
    // --- BAGIAN BARU: Manajemen Elemen & Variabel Login ---
    const loginContainer = document.getElementById('login-container');
    const mainContent = document.getElementById('main-content');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    let currentData;

    // --- BAGIAN BARU: Logika Login & Tampilan ---
    
    function showMainContentAndLoadData() {
        if (loginContainer) loginContainer.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        loadDataForEditing();
    }

    const token = localStorage.getItem('adminToken');
    if (token) {
        showMainContentAndLoadData();
    } else {
        if (loginContainer) loginContainer.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(loginError) loginError.textContent = '';
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Username atau password salah.');
                }
                
                const data = await response.json();
                localStorage.setItem('adminToken', data.token);
                showMainContentAndLoadData();

            } catch (err) {
                if(loginError) loginError.textContent = err.message;
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Anda yakin ingin logout?')) {
                localStorage.removeItem('adminToken');
                location.reload();
            }
        });
    }

    // --- KODE LAMA ANDA UNTUK MENGELOLA KONTEN (DENGAN MODIFIKASI) ---

    const defaultData = {
        home: { heroBackgroundImage: '', profilePhoto: '', profileName: '', profileBio: '', shortBio: '', educations: [], experiences: [], skills: [], activities: [], projects: [], certifications: [] },
        articles: [],
        contact: { title: "Get in Touch", subtitle: "Hubungi saya melalui sosial media di bawah ini atau kirimkan pesan langsung.", placeholderName: "Nama Anda", placeholderEmail: "Email Anda", placeholderMessage: "Pesan Anda", buttonText: "Kirim Pesan", socialMedia: [] }
    };

    async function loadDataForEditing() {
        const statusMessage = document.getElementById('status-message');
        if (!statusMessage) return;
        statusMessage.textContent = 'Memuat data dari server...';
        statusMessage.style.color = 'orange';

        try {
            const response = await fetch('/api/data');
            if (!response.ok) throw new Error(`Gagal mengambil data. Status: ${response.status}`);
            
            const dataFromServer = await response.json();
            currentData = (dataFromServer && Object.keys(dataFromServer).length > 0) ? dataFromServer : JSON.parse(JSON.stringify(defaultData));
            
            statusMessage.textContent = 'Data berhasil dimuat.';
            statusMessage.style.color = 'green';
        } catch (error) {
            console.error('Gagal memuat data:', error);
            statusMessage.textContent = `Gagal memuat data! Error: ${error.message}`;
            statusMessage.style.color = 'red';
            currentData = JSON.parse(JSON.stringify(defaultData));
        }
        
        renderPageContent();
        setTimeout(() => { statusMessage.textContent = ''; }, 2000);
    }
    
    async function saveData() {
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = 'Menyimpan data ke server...';
        statusMessage.style.color = 'orange';

        try {
            await gatherDataFromForm();
            const token = localStorage.getItem('adminToken');
            if (!token) throw new Error("Sesi tidak valid. Silakan login ulang.");

            const response = await fetch('/api/data', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newData: currentData })
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || 'Gagal menyimpan data ke server.');
            }

            statusMessage.textContent = 'Data berhasil disimpan!';
            statusMessage.style.color = 'green';
        } catch (error) {
            console.error('Gagal menyimpan data:', error);
            statusMessage.textContent = `Terjadi kesalahan saat menyimpan: ${error.message}`;
            statusMessage.style.color = 'red';
        }
        setTimeout(() => { statusMessage.textContent = ''; }, 3000);
    }
    
    function renderPageContent() {
        const pageId = document.body.id;
        if (!currentData) return;

        if (pageId === 'admin-page-home') {
            const home = currentData.home || defaultData.home;
            document.getElementById('admin-heroBgUrl').value = home.heroBackgroundImage && !home.heroBackgroundImage.startsWith('data:') ? home.heroBackgroundImage : '';
            document.getElementById('admin-profileName').value = home.profileName || '';
            document.getElementById('admin-profileBio').value = home.profileBio || '';
            document.getElementById('admin-shortBio').value = home.shortBio || '';
            document.getElementById('profilePhotoPreview').src = home.profilePhoto || '';
            Object.keys(defaultData.home).filter(key => Array.isArray(defaultData.home[key])).forEach(key => renderDynamicSection(key, home[key]));
        } else if (pageId === 'admin-page-articles') {
            renderDynamicSection('articles', currentData.articles || []);
        } else if (pageId === 'admin-page-contact') {
            const contact = currentData.contact || defaultData.contact;
            document.getElementById('contact-title-input').value = contact.title || '';
            document.getElementById('contact-subtitle-input').value = contact.subtitle || '';
            document.getElementById('contact-placeholder-name').value = contact.placeholderName || '';
            document.getElementById('contact-placeholder-email').value = contact.placeholderEmail || '';
            document.getElementById('contact-placeholder-message').value = contact.placeholderMessage || '';
            document.getElementById('contact-button-text').value = contact.buttonText || '';
            renderDynamicSection('socialMedia', contact.socialMedia || []);
        }
    }

    async function gatherDataFromForm() {
        const pageId = document.body.id;
        const activePageElement = document.getElementById(pageId);
        const newData = JSON.parse(JSON.stringify(currentData));

        if (pageId === 'admin-page-home') {
            const homeData = newData.home;
            const heroBgFile = activePageElement.querySelector('#admin-heroBgFile').files[0];
            const heroBgUrl = activePageElement.querySelector('#admin-heroBgUrl').value;
            if (heroBgFile) homeData.heroBackgroundImage = await toBase64(heroBgFile);
            else if (heroBgUrl || heroBgUrl === '') homeData.heroBackgroundImage = heroBgUrl;
            
            const profilePhotoFile = activePageElement.querySelector('#admin-profilePhotoInput').files[0];
            if (profilePhotoFile) homeData.profilePhoto = await toBase64(profilePhotoFile);
            
            homeData.profileName = activePageElement.querySelector('#admin-profileName').value;
            homeData.profileBio = activePageElement.querySelector('#admin-profileBio').value;
            homeData.shortBio = activePageElement.querySelector('#admin-shortBio').value;
        } else if (pageId === 'admin-page-contact') {
            const contactData = newData.contact;
            contactData.title = activePageElement.querySelector('#contact-title-input').value;
            contactData.subtitle = activePageElement.querySelector('#contact-subtitle-input').value;
            contactData.placeholderName = activePageElement.querySelector('#contact-placeholder-name').value;
            contactData.placeholderEmail = activePageElement.querySelector('#contact-placeholder-email').value;
            contactData.placeholderMessage = activePageElement.querySelector('#contact-placeholder-message').value;
            contactData.buttonText = activePageElement.querySelector('#contact-button-text').value;
        }
        
        activePageElement.querySelectorAll('.admin-input-text, textarea.admin-input-text').forEach(input => {
            const { section, index, key } = input.dataset;
            const parentKey = getParentKey(section);
            const targetArray = parentKey ? newData[parentKey][section] : newData[section];
            if (targetArray && targetArray[index] !== undefined) targetArray[index][key] = input.value;
        });

        const filePromises = Array.from(activePageElement.querySelectorAll('.admin-input-file')).map(input => {
            const { section, index, key } = input.dataset;
            const parentKey = getParentKey(section);
            const targetArray = parentKey ? newData[parentKey][section] : newData[section];
            const file = input.files[0];
            if (file && targetArray && targetArray[index] !== undefined) {
                return toBase64(file).then(base64 => { if (base64) targetArray[index][key] = base64; });
            }
            return Promise.resolve();
        });
        await Promise.all(filePromises);
        currentData = newData;
    }
    
    const toBase64 = file => new Promise((resolve, reject) => {
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    function getSingularName(key) {
        const map = { 'educations': 'Education', 'experiences': 'Experience', 'skills': 'Skill', 'activities': 'Activity', 'projects': 'Project', 'articles': 'Article', 'socialMedia': 'Social Media', 'certifications': 'Certification' };
        return map[key] || key;
    }

    function renderDynamicSection(sectionKey, dataArray) {
        const container = document.getElementById(`${sectionKey}-admin-container`);
        if (!container) return;
        container.innerHTML = '';
        (dataArray || []).forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'dynamic-item';
            const title = item.institution || item.profession || item.name || item.title || 'Item Baru';
            let fieldsHTML = '';
            for (const key in item) {
                if (key === 'id') continue;
                const label = `<label style="text-transform: capitalize;">${key.replace(/_/g, ' ')}:</label>`;
                if (key.toLowerCase().includes('image') || key.toLowerCase().includes('logo')) {
                    fieldsHTML += `${label}<input type="file" class="admin-input-file" data-section="${sectionKey}" data-index="${index}" data-key="${key}" accept="image/*"><img src="${item[key] || ''}" alt="preview" width="50" style="margin-top:5px; border: 1px solid #ddd;">`;
                } else if (key === 'description' || key === 'content') {
                    fieldsHTML += `${label}<textarea class="admin-input-text" data-section="${sectionKey}" data-index="${index}" data-key="${key}">${item[key] || ''}</textarea>`;
                } else {
                    fieldsHTML += `${label}<input type="text" class="admin-input-text" data-section="${sectionKey}" data-index="${index}" data-key="${key}" value="${item[key] || ''}">`;
                }
            }
            itemDiv.innerHTML = `<div class="item-view"><h4>${title}</h4><div class="item-controls"><button type="button" class="edit-item-btn">Edit</button><button type="button" class="remove-btn" data-section="${sectionKey}" data-index="${index}">Hapus</button></div></div><div class="item-form">${fieldsHTML}<button type="button" class="close-edit-btn">Tutup</button></div>`;
            container.appendChild(itemDiv);
        });
    }

    function getParentKey(sectionKey) {
        if (defaultData.home.hasOwnProperty(sectionKey)) return 'home';
        if (defaultData.contact.hasOwnProperty(sectionKey)) return 'contact';
        return null;
    }

    const itemTemplates = {
        educations: { institution: '', field: '', year: '' },
        experiences: { profession: '', institution: '', description: '', date: '' },
        skills: { name: '', image: '' },
        activities: { image: '', title: '', role: '', date: '' },
        projects: { title: '', image: '', description: '', link: '' },
        certifications: { title: '', issuer: '', role: '', date: '', image: '' },
        articles: { id: '', title: '', date: '', image: '', content: '' },
        socialMedia: { platform: '', url: '', logoImage: '' }
    };

    document.querySelectorAll('.save-section-btn').forEach(button => button.addEventListener('click', saveData));
    
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('add-btn')) {
            const sectionKey = e.target.dataset.section;
            const parentKey = getParentKey(sectionKey);
            let targetArray;
            if (parentKey) {
                if (!currentData[parentKey]) currentData[parentKey] = {};
                if (!currentData[parentKey][sectionKey]) currentData[parentKey][sectionKey] = [];
                targetArray = currentData[parentKey][sectionKey];
            } else {
                if (!currentData[sectionKey]) currentData[sectionKey] = [];
                targetArray = currentData[sectionKey];
            }
            let newObject = JSON.parse(JSON.stringify(itemTemplates[sectionKey]));
            if (sectionKey === 'articles') newObject.id = 'article_' + Date.now();
            targetArray.unshift(newObject);
            renderDynamicSection(sectionKey, targetArray);
        }
        else if (target.classList.contains('remove-btn')) {
            const { section, index } = target.dataset;
            if (confirm('Anda yakin ingin menghapus item ini?')) {
                const parentKey = getParentKey(section);
                const targetArray = parentKey ? currentData[parentKey][section] : currentData[section];
                targetArray.splice(parseInt(index, 10), 1);
                renderDynamicSection(section, targetArray);
            }
        }
        else if (target.classList.contains('edit-item-btn')) { target.closest('.dynamic-item').classList.add('editing'); }
        else if (target.classList.contains('close-edit-btn')) { target.closest('.dynamic-item').classList.remove('editing'); }
        else if (target.classList.contains('delete-section-btn')) {
            const sectionKey = e.target.dataset.section;
            if (confirm(`Anda yakin ingin menghapus seluruh section ${getSingularName(sectionKey)}?`)) {
                const parentKey = getParentKey(sectionKey);
                if (parentKey && currentData[parentKey]) {
                    currentData[parentKey][sectionKey] = [];
                } else if (currentData[sectionKey]) {
                    currentData[sectionKey] = [];
                }
                saveData().then(() => alert(`Section ${getSingularName(sectionKey)} telah dihapus.`));
            }
        }
    });
});