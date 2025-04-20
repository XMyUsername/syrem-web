document.addEventListener('DOMContentLoaded', function() {
    // Comprobar si hay sesión
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    if (!token || !userId) {
        // No hay sesión, redirigir a login
        window.location.href = 'login.html';
        return;
    }
    
    // Si estamos en la página de dashboard
    if (window.location.pathname.includes('dashboard')) {
        // Cargar información del usuario
        loadUserInfo();
        
        // Cargar lista de archivos
        loadUserFiles();
        
        // Configurar eventos de la interfaz
        setupDashboardEvents();
    }
    
    // Configurar logout en cualquier página
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user_id');
            window.location.href = 'login.html';
        });
    }
});

// Cargar información del usuario
function loadUserInfo() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    fetch(`https://xblazcx.pythonanywhere.com/api/user-info?id=${userId}&token=${token}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Actualizar información en la interfaz
                document.getElementById('telegramIdDisplay').textContent = data.telegram_id;
                document.getElementById('planDisplay').textContent = data.plan;
                document.getElementById('usesDisplay').textContent = data.uses_remaining;
                document.getElementById('createdAtDisplay').textContent = new Date(data.created_at).toLocaleDateString();
                
                // Actualizar badge del plan en la navbar
                const userPlan = document.getElementById('userPlan');
                if (userPlan) {
                    userPlan.innerHTML = `Plan: <span class="badge bg-light text-primary">${data.plan}</span>`;
                }
            } else {
                // Sesión inválida
                localStorage.removeItem('token');
                localStorage.removeItem('user_id');
                window.location.href = 'login.html';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar información del usuario. Inténtalo de nuevo más tarde.');
        });
}

// Cargar archivos del usuario
function loadUserFiles() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const filesList = document.getElementById('filesList');
    const noFilesMessage = document.getElementById('noFilesMessage');
    
    fetch(`https://xblazcx.pythonanywhere.com/api/files?id=${userId}&token=${token}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (data.files && data.files.length > 0) {
                    // Mostrar archivos
                    filesList.innerHTML = '';
                    data.files.forEach(file => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${file.name}</td>
                            <td>${formatFileSize(file.size)}</td>
                            <td>${new Date(file.date).toLocaleString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary copy-btn" data-name="${file.name}">
                                    <i class="bi bi-clipboard"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${file.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        `;
                        filesList.appendChild(row);
                    });
                    
                    // Ocultar mensaje de "no hay archivos"
                    if (noFilesMessage) {
                        noFilesMessage.classList.add('d-none');
                    }
                    
                    // Configurar eventos para los botones
                    setupFileActions();
                } else {
                    // Mostrar mensaje de "no hay archivos"
                    filesList.innerHTML = '';
                    if (noFilesMessage) {
                        noFilesMessage.classList.remove('d-none');
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar archivos. Inténtalo de nuevo más tarde.');
        });
}

// Configurar eventos del dashboard
function setupDashboardEvents() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const refreshFilesBtn = document.getElementById('refreshFilesBtn');
    
    // Botón de seleccionar archivo
    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', function() {
            fileInput.click();
        });
    }
    
    // Evento de selección de archivo
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (fileInput.files.length > 0) {
                handleFileUpload(fileInput.files[0]);
            }
        });
    }
    
    // Eventos de drag & drop
    if (dropArea) {
        // Prevenir comportamiento por defecto
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        // Resaltar área al arrastrar
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        // Quitar resaltado
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        // Manejar archivo soltado
        dropArea.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            handleFileUpload(file);
        });
    }
    
    // Botón de actualizar lista de archivos
    if (refreshFilesBtn) {
        refreshFilesBtn.addEventListener('click', loadUserFiles);
    }
}

// Prevenir comportamiento por defecto
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Resaltar área de drop
function highlight() {
    document.getElementById('dropArea').classList.add('dragover');
}

// Quitar resaltado
function unhighlight() {
    document.getElementById('dropArea').classList.remove('dragover');
}

// Manejar subida de archivo
function handleFileUpload(file) {
    const uploadError = document.getElementById('uploadError');
    const uploadSuccess = document.getElementById('uploadSuccess');
    const progressBar = document.getElementById('uploadProgressBar');
    const progressContainer = document.querySelector('.upload-progress');
    
    // Validar tipo de archivo
    if (!file.name.toLowerCase().endsWith('.txt')) {
        uploadError.textContent = 'Solo se permiten archivos TXT.';
        uploadError.classList.remove('d-none');
        uploadSuccess.classList.add('d-none');
        return;
    }
    
    // Ocultar mensajes de error/éxito
    uploadError.classList.add('d-none');
    uploadSuccess.classList.add('d-none');
    
    // Mostrar barra de progreso
    progressContainer.classList.remove('d-none');
    progressBar.style.width = '0%';
    
    // Subir archivo
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    formData.append('token', token);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://xblazcx.pythonanywhere.com/api/upload', true);
    
    // Actualizar barra de progreso
    xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = percent + '%';
            progressBar.setAttribute('aria-valuenow', percent);
        }
    };
    
    xhr.onload = function() {
        progressContainer.classList.add('d-none');
        
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
                uploadSuccess.textContent = 'Archivo subido correctamente.';
                uploadSuccess.classList.remove('d-none');
                // Recargar lista de archivos
                loadUserFiles();
            } else {
                uploadError.textContent = response.error || 'Error al subir archivo.';
                uploadError.classList.remove('d-none');
            }
        } else {
            uploadError.textContent = 'Error de conexión. Inténtalo de nuevo más tarde.';
            uploadError.classList.remove('d-none');
        }
    };
    
    xhr.onerror = function() {
        progressContainer.classList.add('d-none');
        uploadError.textContent = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.';
        uploadError.classList.remove('d-none');
    };
    
    xhr.send(formData);
}

// Configurar acciones para archivos (copiar/eliminar)
function setupFileActions() {
    // Botones de copiar
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const fileName = this.getAttribute('data-name');
            // Copiar al portapapeles
            navigator.clipboard.writeText(fileName)
                .then(() => {
                    // Cambiar icono temporalmente
                    const icon = this.querySelector('i');
                    icon.classList.remove('bi-clipboard');
                    icon.classList.add('bi-clipboard-check');
                    setTimeout(() => {
                        icon.classList.remove('bi-clipboard-check');
                        icon.classList.add('bi-clipboard');
                    }, 1500);
                })
                .catch(err => {
                    console.error('Error al copiar:', err);
                    alert('Error al copiar al portapapeles');
                });
        });
    });
    
    // Botones de eliminar
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const fileId = this.getAttribute('data-id');
            if (confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
                deleteFile(fileId);
            }
        });
    });
}

// Eliminar archivo
function deleteFile(fileId) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    fetch('https://xblazcx.pythonanywhere.com/api/delete-file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            token: token,
            file_id: fileId
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadUserFiles();
        } else {
            alert(data.error || 'Error al eliminar el archivo');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al eliminar el archivo');
    });
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}