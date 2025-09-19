// Variable global para almacenar el PDF seleccionado
let certificadoSeleccionado = "";

// Función principal para buscar certificados
function buscarCertificado() {
    const searchInput = document.getElementById('searchInput');
    const busqueda = searchInput.value.trim();

    if (!busqueda) {
        alert("Por favor ingrese una cédula o matrícula");
        return;
    }

    // Actualizar la URL sin recargar la página
    const nuevaUrl = `${window.location.pathname}?search=${encodeURIComponent(busqueda)}`;
    window.history.pushState({ path: nuevaUrl }, '', nuevaUrl);

    mostrarCargando(true);
    limpiarResultados();

    fetch(`buscar.php?search=${encodeURIComponent(busqueda)}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            return response.json();
        })
        .then(data => procesarRespuesta(data))
        .catch(error => mostrarError("Error de conexión: " + error.message))
        .finally(() => mostrarCargando(false));
}

// Procesar la respuesta y mostrar resultados
function procesarRespuesta(data) {
    const resultado = document.getElementById('resultado');
    const noResultado = document.getElementById('noResultado');
    const datosPrincipales = document.getElementById('datosPrincipales');
    const tablaBody = document.querySelector("#tablaCertificados tbody");

    if (data.error) {
        mostrarSinResultados(data.error);
        return;
    }

    const datos = data.datos || data;

    if (!Array.isArray(datos) || datos.length === 0) {
        mostrarSinResultados(data.message || "No se encontraron resultados.");
        return;
    }

    resultado.classList.remove("hidden");
    noResultado.classList.add("hidden");

    // Datos del titular (primer registro)
    const titular = datos[0];
    datosPrincipales.innerHTML = `
        <h2>Datos del Titular</h2>
        <div class="titular-info">
            <p><strong>Nombre:</strong> ${titular.nombre || 'No disponible'}</p>
            <p><strong>Cédula:</strong> ${titular.cedula || 'No disponible'}</p>
            <p><strong>Matrícula:</strong> ${titular.matricula || 'No disponible'}</p>
        </div>
    `;

    // Filtrar certificados
    const certificados = datos.filter(item => item.certificado_id != null);

    tablaBody.innerHTML = "";
    if (certificados.length === 0) {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; font-style: italic;">
                    El titular no tiene certificados registrados.
                </td>
            </tr>
        `;
    } else {
        certificados.forEach(cert => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${cert.nombre_documento || 'Sin nombre'}</td>
                <td>${cert.filial || 'No especificada'}</td>
                <td>${formatearFecha(cert.fecha)}</td>
                <td>
                    ${cert.rutapdf ? 
                        `<button class="btn-ver" onclick="verCertificado('${cert.rutapdf}')">
                             <i class="fas fa-eye"></i> Ver
                        </button>` : 
                        '<span class="no-pdf">PDF no disponible</span>'
                    }
                </td>
            `;
            tablaBody.appendChild(fila);
        });
    }
}

// Mostrar mensaje de sin resultados
function mostrarSinResultados(mensaje) {
    document.getElementById('resultado').classList.add("hidden");
    const noResultado = document.getElementById('noResultado');
    noResultado.classList.remove("hidden");
    noResultado.innerHTML = `<p>${mensaje}</p>`;
}

// Mostrar alert de error
function mostrarError(mensaje) {
    alert(mensaje);
}

// Limpiar resultados anteriores
function limpiarResultados() {
    document.querySelector("#tablaCertificados tbody").innerHTML = "";
    document.getElementById('datosPrincipales').innerHTML = "";
    document.getElementById('resultado').classList.add('hidden');
    document.getElementById('noResultado').classList.add('hidden');
}

// Indicador de carga en botón de búsqueda
function mostrarCargando(mostrar) {
    const button = document.querySelector('.search-box button');
    if (!button) return;
    if (mostrar) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    } else {
        button.disabled = false;
        button.innerHTML = 'Buscar';
    }
}

// Formatear fecha a dd/mm/yyyy
function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';
    try {
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
        return fecha;
    }
}

// ================================================
// Funciones para reCAPTCHA al abrir PDF - CORREGIDAS
// ================================================

function verCertificado(urlPdf) {
    certificadoSeleccionado = urlPdf;

    // Ocultar solo los datos del titular y la tabla
    const datosPrincipales = document.getElementById('datosPrincipales');
    const tablaContainer = document.getElementById('tablaContainer');
    const captchaContainer = document.getElementById('captcha-container');
    
    console.log('Elementos encontrados:', {
        datosPrincipales: !!datosPrincipales,
        tablaContainer: !!tablaContainer, 
        captchaContainer: !!captchaContainer
    });
    
    if (datosPrincipales) datosPrincipales.style.display = 'none';
    if (tablaContainer) tablaContainer.style.display = 'none';
    if (captchaContainer) {
        captchaContainer.classList.remove('hidden');
        captchaContainer.style.display = 'flex';
    }
}

function enviarCaptcha() {
    const response = grecaptcha.getResponse();
    if (!response) {
        alert("Por favor, completa el reCAPTCHA.");
        return;
    }
    
    // Validar con PHP
    fetch('validar_captcha.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `captcha=${response}`
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Abrir PDF en nueva pestaña
            window.open(certificadoSeleccionado, '_blank');
            
            // Mostrar de nuevo los datos del titular y tabla
            document.getElementById('datosPrincipales').style.display = 'block';
            document.getElementById('tablaContainer').style.display = 'block';
            
            // Ocultar CAPTCHA
            const captchaContainer = document.getElementById('captcha-container');
            captchaContainer.style.display = 'none';
            captchaContainer.classList.add('hidden');
            
        } else {
            alert("No se pudo validar el reCAPTCHA. Intente de nuevo.");
        }

        // Resetear CAPTCHA
        grecaptcha.reset();
    })
    .catch(err => {
        alert("Error al validar reCAPTCHA.");
        console.error(err);
        grecaptcha.reset();
    });
}

// Ejecutar búsqueda si la URL ya tiene ?search=
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    const searchInput = document.getElementById('searchInput');
    if (search && searchInput) {
        searchInput.value = search;
        buscarCertificado();
    }

    // Permitir búsqueda con Enter
    if (searchInput) {
        searchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') buscarCertificado();
        });
    }
});