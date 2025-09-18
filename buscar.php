<?php
// Configurar headers al inicio
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Cambiado a 0 para producción
ini_set('log_errors', 1);

// Función para logging de errores
function logError($message) {
    error_log("[CERTIFICADOS] " . $message);
}

// Función para enviar respuesta JSON
function enviarRespuesta($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Función para enviar error
function enviarError($mensaje, $httpCode = 400) {
    logError("Error: " . $mensaje);
    enviarRespuesta(["error" => $mensaje], $httpCode);
}

// Verificar método de la petición
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviarError("Método no permitido. Se requiere POST.", 405);
}

// Verificar si se recibió el parámetro
if (!isset($_POST['busqueda']) || empty(trim($_POST['busqueda']))) {
    enviarError("No se recibió ningún dato para la búsqueda");
}

$busqueda = trim($_POST['busqueda']);
logError("Búsqueda recibida: " . $busqueda);

// Configuración de la base de datos
$config = [
    'host' => 'localhost',
    'username' => 'root',
    'password' => '',
    'database' => 'icpard_certificados',
    'charset' => 'utf8mb4'
];

try {
    // Crear conexión con manejo de errores mejorado
    $conn = new mysqli(
        $config['host'], 
        $config['username'], 
        $config['password'], 
        $config['database']
    );

    // Verificar conexión
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }

    // Configurar charset
    if (!$conn->set_charset($config['charset'])) {
        throw new Exception("Error configurando charset: " . $conn->error);
    }

    logError("Conexión a BD exitosa");

    // Preparar la consulta SQL con mejor estructura
    $sql = "SELECT 
                t.id as titular_id,
                t.cedula, 
                t.matricula, 
                t.nombre,
                c.id AS certificado_id, 
                c.nombre_documento, 
                c.filial, 
                c.fecha, 
                c.rutapdf
            FROM titulares t
            LEFT JOIN certificados c ON t.id = c.titular_id
            WHERE t.cedula = ? OR t.matricula = ?
            ORDER BY t.id, c.fecha DESC";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $conn->error);
    }

    // Ejecutar la consulta
    $stmt->bind_param("ss", $busqueda, $busqueda);

    if (!$stmt->execute()) {
        throw new Exception("Error ejecutando consulta: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $numRows = $result->num_rows;
    
    logError("Consulta ejecutada. Filas encontradas: " . $numRows);

    // Verificar si hay resultados
    if ($numRows === 0) {
        logError("No se encontraron resultados para: " . $busqueda);
        enviarRespuesta([
            "message" => "No se encontraron resultados",
            "busqueda" => $busqueda,
            "datos" => []
        ]);
    }

    // Recopilar datos
    $datos = [];
    while ($row = $result->fetch_assoc()) {
        // Sanitizar datos
        foreach ($row as $key => $value) {
            $row[$key] = $value !== null ? htmlspecialchars($value, ENT_QUOTES, 'UTF-8') : null;
        }
        $datos[] = $row;
    }

    // Cerrar conexiones
    $stmt->close();
    $conn->close();

    logError("Enviando " . count($datos) . " registros");

    // Enviar respuesta exitosa
    enviarRespuesta([
        "success" => true,
        "message" => "Datos encontrados correctamente",
        "total" => count($datos),
        "datos" => $datos
    ]);

} catch (Exception $e) {
    // Manejo de excepciones
    logError("Excepción capturada: " . $e->getMessage());
    
    // Cerrar conexiones si existen
    if (isset($stmt) && $stmt) {
        $stmt->close();
    }
    if (isset($conn) && $conn) {
        $conn->close();
    }
    
    enviarError("Error interno del servidor: " . $e->getMessage(), 500);
}
?>