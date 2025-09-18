<?php
// Configurar headers al inicio
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Función para logging
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

// Verificar método
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    enviarError("Método no permitido. Se requiere GET o POST.", 405);
}

// Obtener parámetro de búsqueda
$busqueda = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $busqueda = isset($_GET['search']) ? trim($_GET['search']) : '';
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $busqueda = isset($_POST['busqueda']) ? trim($_POST['busqueda']) : '';
}

if (!$busqueda) {
    enviarError("No se recibió ningún dato para la búsqueda");
}

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
    $conn = new mysqli(
        $config['host'], 
        $config['username'], 
        $config['password'], 
        $config['database']
    );

    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }

    if (!$conn->set_charset($config['charset'])) {
        throw new Exception("Error configurando charset: " . $conn->error);
    }

    logError("Conexión a BD exitosa");

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

    $stmt->bind_param("ss", $busqueda, $busqueda);
    if (!$stmt->execute()) {
        throw new Exception("Error ejecutando consulta: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $numRows = $result->num_rows;
    logError("Consulta ejecutada. Filas encontradas: " . $numRows);

    if ($numRows === 0) {
        enviarRespuesta([
            "message" => "No se encontraron resultados",
            "busqueda" => $busqueda,
            "datos" => []
        ]);
    }

    $datos = [];
    while ($row = $result->fetch_assoc()) {
        foreach ($row as $key => $value) {
            $row[$key] = $value !== null ? htmlspecialchars($value, ENT_QUOTES, 'UTF-8') : null;
        }
        $datos[] = $row;
    }

    $stmt->close();
    $conn->close();

    enviarRespuesta([
        "success" => true,
        "message" => "Datos encontrados correctamente",
        "total" => count($datos),
        "datos" => $datos
    ]);

} catch (Exception $e) {
    logError("Excepción capturada: " . $e->getMessage());
    if (isset($stmt) && $stmt) $stmt->close();
    if (isset($conn) && $conn) $conn->close();
    enviarError("Error interno del servidor: " . $e->getMessage(), 500);
}
?>
