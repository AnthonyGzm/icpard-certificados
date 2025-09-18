function buscarCertificado() {
    const searchInput = document.getElementById('searchInput');
    const resultado = document.getElementById('resultado');
    const noResultado = document.getElementById('noResultado');
    const datosPrincipales = document.getElementById('datosPrincipales');
    const tablaBody = document.querySelector("#tablaCertificados tbody");

    const busqueda = searchInput.value.trim();
    
    if (!busqueda) {
        alert("Por favor ingrese una cédula o matrícula");
        return;
    }

    // Mostrar indicador de carga
    mostrarCargando(true);

    // Limpiar resultados anteriores
    limpiarResultados();

    fetch("buscar.php", {
        method: "POST",
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache"
        },
        body: "busqueda=" + encodeURIComponent(busqueda)
    })
    .then(response => {
        console.log("Status de respuesta:", response.status);
        console.log("Headers de respuesta:", response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.text();
    })
    .then(text => {
        console.log("Respuesta cruda del servidor:", text || "(vacío)");
        console.log("Longitud de respuesta:", text.length);

        if (!text || text.trim() === "") {
            throw new Error("El servidor devolvió una respuesta vacía");
        }

        let data;
        try {
            data = JSON.parse(text);
            console.log("Datos parseados:", data);
        } catch (e) {
            console.error("Error parseando JSON:", e);
            console.error("Texto que causó el error:", text);
            throw new Error("El servidor devolvió datos inválidos. Revise la consola para más detalles.");
        }

        procesarRespuesta(data);

    })
    .catch(error => {
        console.error("Error en fetch:", error);
        mostrarError("Error de conexión: " + error.message);
    })
    .finally(() => {
        mostrarCargando(false);
    });
}

function procesarRespuesta(data) {
    const resultado = document.getElementById('resultado');
    const noResultado = document.getElementById('noResultado');
    const datosPrincipales = document.getElementById('datosPrincipales');
    const tablaBody = document.querySelector("#tablaCertificados tbody");

    // Verificar si hay error en la respuesta
    if (data.error) {
        console.log("Error desde PHP:", data.error);
        mostrarSinResultados(data.error);
        return;
    }

    // Verificar estructura de respuesta mejorada
    const datos = data.datos || data;
    
    if (!Array.isArray(datos) || datos.length === 0) {
        const mensaje = data.message || "No se encontraron resultados para la búsqueda realizada.";
        mostrarSinResultados(mensaje);
        return;
    }

    console.log("Procesando", datos.length, "registros");

    // Mostrar resultados
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

    // Filtrar y mostrar certificados
    const certificados = datos.filter(item => item.certificado_id != null);
    
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
                        `<a href="${cert.rutapdf}" target="_blank" class="btn-ver">
                             <i class="fas fa-eye"></i> Ver
                        </a>` : 
                        '<span class="no-pdf">PDF no disponible</span>'
                    }
                </td>
            `;
            tablaBody.appendChild(fila);
        });
    }
}

function mostrarSinResultados(mensaje) {
    const resultado = document.getElementById('resultado');
    const noResultado = document.getElementById('noResultado');
    
    resultado.classList.add("hidden");
    noResultado.classList.remove("hidden");
    noResultado.innerHTML = `<p>${mensaje}</p>`;
}

function mostrarError(mensaje) {
    alert(mensaje);
}

function limpiarResultados() {
    const tablaBody = document.querySelector("#tablaCertificados tbody");
    const datosPrincipales = document.getElementById('datosPrincipales');
    
    tablaBody.innerHTML = "";
    datosPrincipales.innerHTML = "";
    
    // Ocultar todos los contenedores
    document.getElementById('resultado').classList.add('hidden');
    document.getElementById('noResultado').classList.add('hidden');
}

function mostrarCargando(mostrar) {
    const button = document.querySelector('.search-box button');
    
    if (mostrar) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    } else {
        button.disabled = false;
        button.innerHTML = 'Buscar';
    }
}

function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';
    
    try {
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return fecha; // Devolver fecha original si no se puede formatear
    }
}

// Permitir búsqueda con Enter
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarCertificado();
            }
        });
    }
});