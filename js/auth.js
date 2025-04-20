// auth.js - Versión corregida
document.addEventListener('DOMContentLoaded', function() {
    // Comprobar si ya hay sesión
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    
    if (token && userId) {
        // Verificar si la sesión es válida
        fetch(`https://xblazcx.pythonanywhere.com/api/user-info?id=${userId}&token=${token}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Sesión válida, redirigir al panel
                    window.location.href = 'dashboard.html';
                }
            })
            .catch(error => {
                console.error("Error verificando sesión:", error);
                // Limpiar sesión inválida
                localStorage.removeItem('token');
                localStorage.removeItem('user_id');
            });
    }
    
    // Referencias a elementos del DOM
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const telegramIdInput = document.getElementById('telegramId');
    const verificationCodeInput = document.getElementById('verificationCode');
    const requestCodeBtn = document.getElementById('requestCodeBtn');
    const verifyCodeBtn = document.getElementById('verifyCodeBtn');
    const backToStep1 = document.getElementById('backToStep1');
    const idError = document.getElementById('idError');
    const codeError = document.getElementById('codeError');
    
    // Verificar que los elementos existen
    if (!step1 || !step2) console.error('Contenedores de pasos no encontrados');
    if (!telegramIdInput) console.error('Input de Telegram ID no encontrado');
    if (!verificationCodeInput) console.error('Input de código de verificación no encontrado');
    if (!requestCodeBtn) console.error('Botón de solicitar código no encontrado');
    if (!verifyCodeBtn) console.error('Botón de verificación no encontrado');
    if (!backToStep1) console.error('Botón de volver atrás no encontrado');
    if (!idError) console.error('Elemento de error de ID no encontrado');
    if (!codeError) console.error('Elemento de error de código no encontrado');
    
    // EVENTO PARA SOLICITAR CÓDIGO
    requestCodeBtn.addEventListener('click', function() {
        const telegramId = telegramIdInput.value.trim();
        
        // Validación básica
        if (!telegramId || isNaN(telegramId)) {
            idError.textContent = 'Por favor, ingresa un ID de Telegram válido.';
            idError.classList.remove('d-none');
            return;
        }
        
        idError.classList.add('d-none');
        requestCodeBtn.disabled = true;
        requestCodeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
        
        // Solicitar código al backend
        fetch('https://xblazcx.pythonanywhere.com/api/request-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                telegram_id: telegramId
            }),
        })
        .then(response => response.json())
        .then(data => {
            requestCodeBtn.disabled = false;
            requestCodeBtn.textContent = 'Solicitar código';
            
            if (data.success) {
                // Mostrar paso 2
                step1.classList.add('d-none');
                step2.classList.remove('d-none');
                // Guardar ID para el siguiente paso
                localStorage.setItem('temp_user_id', telegramId);
                
                // Para pruebas - mostrar alerta con el código
                if (data.note && data.note.includes('123456')) {
                    alert("Para pruebas, usa el código: 123456");
                }
            } else {
                idError.textContent = data.error || 'Error al enviar el código. Inténtalo de nuevo.';
                idError.classList.remove('d-none');
            }
        })
        .catch(error => {
            requestCodeBtn.disabled = false;
            requestCodeBtn.textContent = 'Solicitar código';
            idError.textContent = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.';
            idError.classList.remove('d-none');
            console.error('Error:', error);
        });
    });
    
    // EVENTO PARA VERIFICAR CÓDIGO
    verifyCodeBtn.addEventListener('click', function() {
        const verificationCode = verificationCodeInput.value.trim();
        const telegramId = localStorage.getItem('temp_user_id');
        
        if (!verificationCode) {
            codeError.textContent = 'Por favor, ingresa el código de verificación.';
            codeError.classList.remove('d-none');
            return;
        }
        
        if (!telegramId) {
            codeError.textContent = 'Sesión inválida. Por favor, vuelve a empezar.';
            codeError.classList.remove('d-none');
            return;
        }
        
        codeError.classList.add('d-none');
        verifyCodeBtn.disabled = true;
        verifyCodeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verificando...';
        
        // Verificar código con el backend
        fetch('https://xblazcx.pythonanywhere.com/api/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                telegram_id: telegramId,
                code: verificationCode
            }),
        })
        .then(response => response.json())
        .then(data => {
            verifyCodeBtn.disabled = false;
            verifyCodeBtn.textContent = 'Verificar código';
            
            if (data.success) {
                // Guardar sesión
                localStorage.setItem('token', data.token);
                localStorage.setItem('user_id', telegramId);
                // Limpiar dato temporal
                localStorage.removeItem('temp_user_id');
                // Redirigir al panel
                window.location.href = 'dashboard.html';
            } else {
                codeError.textContent = data.error || 'Código inválido. Inténtalo de nuevo.';
                codeError.classList.remove('d-none');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            verifyCodeBtn.disabled = false;
            verifyCodeBtn.textContent = 'Verificar código';
            codeError.textContent = 'Error de conexión. Verifica tu internet e inténtalo de nuevo.';
            codeError.classList.remove('d-none');
        });
    });
    
    // Volver al paso 1
    backToStep1.addEventListener('click', function(e) {
        e.preventDefault();
        step2.classList.add('d-none');
        step1.classList.remove('d-none');
    });
});