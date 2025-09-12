function buscarCertificado() {
    const searchInput = document.getElementById('searchInput');
    const resultado = document.getElementById('resultado');
    const noResultado = document.getElementById('noResultado');
    
    const busqueda = searchInput.value.trim();
    
    // Validar entrada
    if (busqueda === '') {
        alert('Por favor ingrese una cédula o matrícula');
        return;
    }
    
    // Ocultar resultados y mensaje anteriores
    resultado.classList.add('hidden');
    noResultado.classList.add('hidden');
    
    // Crear formulario para envío
    const formData = new FormData();
    formData.append('busqueda', busqueda);
    
    // Realizar petición
    fetch('buscar.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.certificados && data.certificados.length > 0) {
            mostrarResultados(data.certificados);
        } else {
            mostrarSinResultados();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarSinResultados();
    });
}

function mostrarResultados(certificados) {
    const resultado = document.getElementById('resultado');
    const noResultado = document.getElementById('noResultado');
    const datosPrincipales = document.getElementById('datosPrincipales');
    const tablaCertificados = document.getElementById('tablaCertificados').getElementsByTagName('tbody')[0];
    
    // Ocultar mensaje de "no encontrado" si estaba visible
    noResultado.classList.add('hidden');
    
    // Obtener datos del primer certificado para mostrar datos principales
    const primerCertificado = certificados[0];
    
    // Mostrar datos principales del titular
    datosPrincipales.innerHTML = `
        <h3>Datos del Titular</h3>
        <p><strong>Nombre:</strong> ${primerCertificado.nombre}</p>
        <p><strong>Cédula:</strong> ${primerCertificado.cedula}</p>
        <p><strong>Matrícula:</strong> ${primerCertificado.matricula || 'No disponible'}</p>
    `;
    
    // Limpiar tabla anterior
    tablaCertificados.innerHTML = '';
    
    // Llenar tabla con certificados
    certificados.forEach(cert => {
        const row = tablaCertificados.insertRow();
        row.innerHTML = `
            <td>${cert.nombre_documento || 'Certificado ICPARD'}</td>
            <td>${cert.filial || 'ICPARD'}</td>
            <td>${formatearFecha(cert.fecha)}</td>
            <td>
                <a href="${cert.rutapdf}" 
                   target="_blank" 
                   class="btn-ver">
                    <i class="fas fa-eye"></i> Ver
                </a>
            </td>
        `;
    });
    
    // Mostrar resultados
    resultado.classList.remove('hidden');
}

function mostrarSinResultados() {
    const resultado = document.getElementById('resultado');
    const noResultado = document.getElementById('noResultado');
    
    // Aseguramos que el contenedor de resultados esté oculto
    resultado.classList.add('hidden');
    
    // Mostramos mensaje de "no encontrado"
    noResultado.classList.remove('hidden');
}

function formatearFecha(fecha) {
    if (!fecha) return 'No disponible';
    
    try {
        const fechaObj = new Date(fecha);
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const año = fechaObj.getFullYear();
        
        return `${dia}/${mes}/${año}`;
    } catch (e) {
        return fecha;
    }
}

// Permitir buscar con Enter
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarCertificado();
        }
    });
    
    // Focus automático en el campo de búsqueda
    searchInput.focus();
});
