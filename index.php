<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consultor de Certificados</title>
  <link rel="stylesheet" href="styles.css">
  <script src="script.js"></script>
  <link rel="icon" type="image/png" href="img/favicon.png">
  
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>
  <div class="container">

    <!-- Encabezado con logo -->
    <header class="header">
      <a href="https://www.icpard.org" target="_blank">
        <img src="img/logo.png" alt="Logo ICPARD" class="logo">
      </a>
      <h1>Consultor de Certificados ICPARD</h1>
    </header>

    <p>Ingrese la <strong>cédula</strong> o <strong>matrícula</strong> del certificado para consultarlo.</p>
    
    <!-- Caja de búsqueda -->
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="Cédula o Matrícula">
      <button onclick="buscarCertificado()">Buscar</button>
    </div>

    <!-- Contenedor de resultados -->
    <div id="resultado" class="hidden">

      <!-- Datos principales del titular -->
      <div id="datosPrincipales" class="datos-principales">
      </div>

      <!-- Tabla de certificados -->
      <table id="tablaCertificados">
        <thead>
          <tr>
            <th>Nombre Del Documento</th>
            <th>Filial</th>
            <th>Fecha</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>

    </div>

    <!-- Mensaje si no hay resultados -->
    <p id="noResultado" class="no-result hidden"> No se encontró ningún certificado con esos datos.</p>

  </div>
</body>
</html>