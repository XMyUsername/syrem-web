document.addEventListener('DOMContentLoaded', function() {
    console.log("Dashboard iniciado - Verificando sesión...");
    
    // Comprobar si hay sesión
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    console.log("Token:", token ? "Presente" : "Ausente");
    console.log("UserId:", userId ? userId : "Ausente");
    
    if (!token || !userId) {
        console.log("No hay sesión activa, redirigiendo a login");
        window.location.href = 'login.html';
        return;
    }
    
    // Si estamos en la página de dashboard o cualquier página que necesite autenticación
    const isDashboard = window.location.href.includes('dashboard');
    console.log("¿Estamos en el dashboard?", isDashboard);
    
    if (isDashboard) {
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
            console.log("Cerrando sesión...");
            localStorage.removeItem('token');
            localStorage.removeItem('user_id');
            window.location.href = 'login.html';
        });
    }
});

// Cargar información del usuario
function loadUserInfo() {
    console.log("Cargando información del usuario...");
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    if (!token || !userId) {
        console.error("Sin token o userId para cargar información");
        return;
    }
    
    // Mostrar indicador de carga
    const userInfoArea = document.querySelector('.user-info-area');
    if (userInfoArea) {
        userInfoArea.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>';
    }
    
    fetch(`https://xblazcx.pythonanywhere.com/api/user-info?id=${userId}&token=${token}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Respuesta de info usuario:", data);
            
            if (data.success) {
                // Actualizar información en la interfaz
                updateUserInfoDisplay(data);
            } else {
                // Sesión inválida
                console.error("Sesión inválida según respuesta del servidor");
                showErrorMessage("Sesión expirada o inválida");
                
                // Redirigir después de un breve retraso para que el usuario vea el mensaje
                setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user_id');
                    window.location.href = 'login.html';
                }, 2000);
            }
        })
        .catch(error => {
            console.error('Error al cargar información del usuario:', error);
            // No redirigir en caso de error de red, solo mostrar el error
            showErrorMessage('Error al cargar información del usuario. Inténtalo de nuevo más tarde.');
        });
}

// Actualizar la información del usuario en la interfaz
function updateUserInfoDisplay(data) {
    // Actualizar elementos individuales si existen
    const idElement = document.getElementById('telegramIdDisplay');
    if (idElement) idElement.textContent = data.telegram_id;
    
    const planElement = document.getElementById('planDisplay');
    if (planElement) planElement.textContent = data.plan;
    
    const usesElement = document.getElementById('usesDisplay');
    if (usesElement) usesElement.textContent = data.uses_remaining;
    
    const createdElement = document.getElementById('createdAtDisplay');
    if (createdElement && data.created_at) {
        createdElement.textContent = new Date(data.created_at).toLocaleDateString();
    }
    
    // Actualizar badge del plan en la navbar
    const userPlan = document.getElementById('userPlan');
    if (userPlan) {
        userPlan.innerHTML = `Plan: <span class="badge bg-light text-primary">${data.plan}</span>`;
    }
}

// Mostrar mensaje de error en la interfaz
function showErrorMessage(message) {
    // Intentar mostrar en un elemento específico para errores
    const errorElement = document.getElementById('dashboardError');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
        return;
    }
    
    // Alternativa: crear un elemento de alerta en la parte superior
    const alertElement = document.createElement('div');
    alertElement.className = 'alert alert-danger alert-dismissible fade show';
    alertElement.setAttribute('role', 'alert');
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar al inicio del contenido principal
    const mainContent = document.querySelector('main') || document.body;
    mainContent.insertBefore(alertElement, mainContent.firstChild);
}

// Cargar archivos del usuario
function loadUserFiles() {
    console.log("Cargando archivos del usuario...");
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    if (!token || !userId) {
        console.error("Sin token o userId para cargar archivos");
        return;
    }
    
    const filesList = document.getElementById('filesList');
    const noFilesMessage = document.getElementById('noFilesMessage');
    const filesContainer = document.querySelector('.files-container');
    
    // Mostrar indicador de carga
    if (filesContainer) {
        filesContainer.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando archivos...</span></div></div>';
    }
    
    fetch(`https://xblazcx.pythonanywhere.com/api/files?id=${userId}&token=${token}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Respuesta de archivos:", data);
            
            // Restaurar el contenedor de archivos a su estado original
            if (filesContainer) {
                filesContainer.innerHTML = `
                    <div id="noFilesMessage" class="alert alert-info">No tienes archivos guardados.</div>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tamaño</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="filesList">
                        </tbody>
                    </table>
                `;
            }
            
            // Recuperar nuevas referencias a los elementos
            const freshFilesList = document.getElementById('filesList');
            const freshNoFilesMessage = document.getElementById('noFilesMessage');
            
            if (data.success) {
                if (data.files && data.files.length > 0 && freshFilesList) {
                    // Mostrar archivos
                    freshFilesList.innerHTML = '';
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
                        freshFilesList.appendChild(row);
                    });
                    
                    // Ocultar mensaje de "no hay archivos"
                    if (freshNoFilesMessage) {
                        freshNoFilesMessage.classList.add('d-none');
                    }
                    
                    // Configurar eventos para los botones
                    setupFileActions();
                } else {
                    // Mostrar mensaje de "no hay archivos"
                    if (freshFilesList) freshFilesList.innerHTML = '';
                    if (freshNoFilesMessage) freshNoFilesMessage.classList.remove('d-none');
                }
            } else {
                showErrorMessage(data.error || 'Error al cargar la lista de archivos');
            }
        })
        .catch(error => {
            console.error('Error al cargar archivos:', error);
            showErrorMessage('Error al cargar archivos. Verifica tu conexión a internet.');
        });
}

// Configurar eventos del dashboard
function setupDashboardEvents() {
    console.log("Configurando eventos del dashboard...");
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
    const dropArea = document.getElementById('dropArea');
    if (dropArea) dropArea.classList.add('dragover');
}

// Quitar resaltado
function unhighlight() {
    const dropArea = document.getElementById('dropArea');
    if (dropArea) dropArea.classList.remove('dragover');
}

// Manejar subida de archivo
function handleFileUpload(file) {
    console.log("Iniciando subida de archivo:", file.name);
    const uploadError = document.getElementById('uploadError');
    const uploadSuccess = document.getElementById('uploadSuccess');
    const progressBar = document.getElementById('uploadProgressBar');
    const progressContainer = document.querySelector('.upload-progress');
    
    if (!uploadError || !uploadSuccess || !progressBar || !progressContainer) {
        console.error("Elementos de UI para upload no encontrados");
        return;
    }
    
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
            try {
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
            } catch (e) {
                console.error("Error al parsear respuesta:", e);
                uploadError.textContent = 'Error en la respuesta del servidor.';
                uploadError.classList.remove('d-none');
            }
        } else {
            uploadError.textContent = `Error del servidor: ${xhr.status}`;
            uploadError.classList.remove('d-none');
        }
    };
    
    xhr.onerror = function() {
        console.error("Error de red en la subida");
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
                    if (icon) {
                        icon.classList.remove('bi-clipboard');
                        icon.classList.add('bi-clipboard-check');
                        setTimeout(() => {
                            icon.classList.remove('bi-clipboard-check');
                            icon.classList.add('bi-clipboard');
                        }, 1500);
                    }
                })
                .catch(err => {
                    console.error('Error al copiar:', err);
                    showErrorMessage('Error al copiar al portapapeles');
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
    console.log("Eliminando archivo:", fileId);
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
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            loadUserFiles();
        } else {
            showErrorMessage(data.error || 'Error al eliminar el archivo');
        }
    })
    .catch(error => {
        console.error('Error al eliminar archivo:', error);
        showErrorMessage('Error de conexión al eliminar el archivo');
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