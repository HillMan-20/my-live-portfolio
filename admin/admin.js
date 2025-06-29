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
        contact: { title: "Get in Touch", subtitle: "Hubungi saya melalui sosial media di bawah ini atau kirimkan pesan langsung.", placeholderName: "Nama Anda", placeholderEmail: "Email Anda", placeholderMessage: "Pesan Anda", buttonText: "Kirim Pesan", socialMedia: [], backgroundImage: '' }  
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
            const contactBgFile = activePageElement.querySelector('#admin-contactBgFile').files[0];
            const currentContactBg = currentData.contact.backgroundImage;
        
            if (contactBgFile) {
                // Jika ada file baru, unggah dan perbarui URL
                fileUploadPromises.push(uploadImageToCloudinary(contactBgFile).then(url => {
                    contactData.backgroundImage = url;
                }).catch(e => {
                    console.error("Gagal unggah latar belakang kontak:", e);
                    contactData.backgroundImage = currentContactBg; // Jika gagal, pertahankan yg lama
                }));
            } else {
                // Jika tidak ada file baru, pertahankan URL yg lama
                contactData.backgroundImage = currentContactBg;
            }
            document.getElementById('contactBgPreview').src = contact.backgroundImage || '';
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
        // Buat salinan dalam dari currentData untuk bekerja, agar tidak memodifikasi yang asli
        const newData = JSON.parse(JSON.stringify(currentData)); 
    
        const fileUploadPromises = []; // Array untuk menampung semua promise upload gambar
    
        if (pageId === 'admin-page-home') {
            const homeData = newData.home;
    
            // --- Penanganan Hero Background Image ---
            const heroBgFile = activePageElement.querySelector('#admin-heroBgFile').files[0];
            const heroBgUrlInput = activePageElement.querySelector('#admin-heroBgUrl').value;
            const currentHeroBg = currentData.home.heroBackgroundImage; // Ambil URL yang sudah ada
    
            if (heroBgFile) {
                // Jika ada file baru diunggah, tambahkan promise upload
                fileUploadPromises.push(uploadImageToCloudinary(heroBgFile).then(url => {
                    homeData.heroBackgroundImage = url;
                }).catch(e => {
                    console.error("Failed to upload hero background image:", e);
                    homeData.heroBackgroundImage = currentHeroBg; // Fallback ke URL lama jika gagal
                }));
            } else if (heroBgUrlInput && heroBgUrlInput !== currentHeroBg) {
                // Jika URL diinput berubah (dan bukan upload file), gunakan yang baru
                homeData.heroBackgroundImage = heroBgUrlInput;
            } else {
                // Jika tidak ada file baru atau URL input tidak berubah, pertahankan yang lama
                homeData.heroBackgroundImage = currentHeroBg;
            }
    
            // --- Penanganan Profile Photo ---
            const profilePhotoInput = activePageElement.querySelector('#admin-profilePhotoInput');
            const profilePhotoFile = profilePhotoInput.files[0];
            const currentProfilePhoto = currentData.home.profilePhoto; // Ambil URL yang sudah ada
    
            if (profilePhotoFile) {
                // Jika ada file baru diunggah, tambahkan promise upload
                fileUploadPromises.push(uploadImageToCloudinary(profilePhotoFile).then(url => {
                    homeData.profilePhoto = url;
                }).catch(e => {
                    console.error("Failed to upload profile photo:", e);
                    homeData.profilePhoto = currentProfilePhoto; // Fallback ke URL lama jika gagal
                }));
            } else {
                // Jika tidak ada file baru, pertahankan yang lama
                homeData.profilePhoto = currentProfilePhoto;
            }
    
            homeData.profileName = activePageElement.querySelector('#admin-profileName').value;
            homeData.profileBio = activePageElement.querySelector('#admin-profileBio').value;
            homeData.shortBio = activePageElement.querySelector('#admin-shortBio').value;
        } 
    
        else if (pageId === 'admin-page-contact') {
            const contactData = newData.contact;
    contactData.title = activePageElement.querySelector('#contact-title-input').value;
    contactData.subtitle = activePageElement.querySelector('#contact-subtitle-input').value;
    // --- AWAL DARI LOGIKA BARU YANG DITAMBAHKAN ---
    const contactBgFile = activePageElement.querySelector('#admin-contactBgFile').files[0];
    const currentContactBg = currentData.contact.backgroundImage; // Ambil URL gambar yang sekarang

    if (contactBgFile) {
        // Jika ada file BARU yang dipilih, maka unggah.
        fileUploadPromises.push(uploadImageToCloudinary(contactBgFile).then(url => {
            contactData.backgroundImage = url; // Ganti URL dengan hasil upload
        }).catch(e => {
            console.error("Gagal unggah latar belakang kontak:", e);
            contactData.backgroundImage = currentContactBg; // Jika gagal, pertahankan yg lama
        }));
    } else {
        // Jika TIDAK ada file baru yang dipilih, maka tetap gunakan URL yang lama.
        contactData.backgroundImage = currentContactBg;
    }

        }
    
        // --- BAGIAN UNTUK DYNAMIC SECTIONS (Educations, Skills, Articles, dll.) ---
        const dynamicSectionsToProcess = ['educations', 'experiences', 'skills', 'activities', 'projects', 'certifications', 'articles', 'socialMedia']; // Tambahkan semua kunci section dinamis Anda

for (const sectionKey of dynamicSectionsToProcess) {
    const container = document.getElementById(`${sectionKey}-admin-container`);
    if (!container) continue;

    const parentKey = getParentKey(sectionKey);
    // Inisialisasi array kosong untuk menampung data yang baru digabungkan dari form
    let newItemsForSection = []; 

    const itemDivs = container.querySelectorAll('.dynamic-item');
    for (let i = 0; i < itemDivs.length; i++) {
        const itemDiv = itemDivs[i];
        const originalItem = parentKey ? currentData[parentKey][sectionKey][i] : currentData[sectionKey][i];
        // Buat salinan item atau objek baru berdasarkan template jika ini item baru
        let itemData = originalItem ? JSON.parse(JSON.stringify(originalItem)) : JSON.parse(JSON.stringify(itemTemplates[sectionKey]));

        // Handle text/textarea inputs
        itemDiv.querySelectorAll('.admin-input-text').forEach(input => {
            const key = input.dataset.key;
            itemData[key] = input.value;
        });

        // Handle file inputs (upload to Cloudinary)
        const fileInputs = itemDiv.querySelectorAll('.admin-input-file');
        for (const input of fileInputs) {
            const key = input.dataset.key;
            const file = input.files[0];
            const currentImageUrl = itemData[key]; // URL gambar yang sudah ada
        
            if (file) {
                // Jika ada file BARU yang dipilih, unggah dan perbarui URL.
                fileUploadPromises.push(uploadImageToCloudinary(file).then(url => {
                    if (url) {
                        itemData[key] = url; // Gunakan URL baru dari Cloudinary
                    } else {
                        itemData[key] = currentImageUrl; // Jika upload gagal, pertahankan URL lama
                    }
                }).catch(e => {
                    console.error(`Failed to upload image for ${sectionKey} item ${i} key ${key}:`, e);
                    itemData[key] = currentImageUrl; // Jika error, pertahankan URL lama
                }));
            } else {
                // Jika TIDAK ada file baru yang dipilih, JANGAN UBAH URL yang sudah ada.
                itemData[key] = currentImageUrl;
            }
        }
        newItemsForSection.push(itemData); // Tambahkan item yang sudah diproses ke array baru
    }
    // Perbarui newData dengan array item yang baru digabungkan
    if (parentKey) {
        if (!newData[parentKey]) newData[parentKey] = {};
        newData[parentKey][sectionKey] = newItemsForSection;
    } else {
        newData[sectionKey] = newItemsForSection;
    }
}
    
        // Tunggu hingga semua operasi upload gambar selesai
        await Promise.all(fileUploadPromises);
        currentData = newData; // Perbarui currentData dengan newData yang sudah diisi URL
    }
    

async function uploadImageToCloudinary(file) {
    if (!file) {
        console.warn("No file provided for uploadImageToCloudinary.");
        return null; // Mengembalikan null jika tidak ada file
    }

    const statusMessage = document.getElementById('status-message'); // Ambil elemen status message
    const originalStatusText = statusMessage ? statusMessage.textContent : '';

    try {
        // Tampilkan pesan loading sementara
        if (statusMessage) {
            statusMessage.textContent = 'Mengunggah gambar...';
            statusMessage.style.color = 'blue';
        }

        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                const imageBase64 = e.target.result; // Ini adalah Base64 string dari file lokal

                try {
                    const token = localStorage.getItem('adminToken');
                    if (!token) throw new Error("Sesi tidak valid untuk upload gambar. Silakan login ulang.");

                    const response = await fetch('/api/upload-image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ imageBase64 })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Gagal mengunggah gambar ke Cloudinary.');
                    }

                    const data = await response.json();
                    if (statusMessage) { // Sembunyikan pesan loading
                        statusMessage.textContent = originalStatusText; // Kembalikan ke teks semula atau kosongkan
                        statusMessage.style.color = '';
                    }
                    resolve(data.url); // Mengembalikan URL publik gambar dari Cloudinary
                } catch (error) {
                    console.error('Error during image upload fetch:', error);
                    if (statusMessage) { // Tampilkan error
                        statusMessage.textContent = `Upload gambar gagal: ${error.message}`;
                        statusMessage.style.color = 'red';
                        setTimeout(() => { statusMessage.textContent = originalStatusText; statusMessage.style.color = ''; }, 5000);
                    }
                    reject(error);
                }
            };
            reader.onerror = error => {
                console.error('FileReader error:', error);
                if (statusMessage) {
                    statusMessage.textContent = `Pembacaan file gagal: ${error.message}`;
                    statusMessage.style.color = 'red';
                    setTimeout(() => { statusMessage.textContent = originalStatusText; statusMessage.style.color = ''; }, 5000);
                }
                reject(error);
            };
            reader.readAsDataURL(file); // Memulai pembacaan file sebagai Base64
        });
    } catch (initialError) {
        console.error('Initial error in uploadImageToCloudinary:', initialError);
        if (statusMessage) {
            statusMessage.textContent = `Upload gambar gagal total: ${initialError.message}`;
            statusMessage.style.color = 'red';
            setTimeout(() => { statusMessage.textContent = originalStatusText; statusMessage.style.color = ''; }, 5000);
        }
        return null; // Pastikan mengembalikan null atau me-reject jika ada error awal
    }
}

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