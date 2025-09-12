<?php
header('Content-Type: application/json; charset=utf-8');

// Config BD
$servername = "localhost";
$username   = "root"; 
$password   = "";      
$dbname     = "icpard_certificados";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión"]);
    exit;
}

$busqueda = trim($_POST['busqueda'] ?? '');

if ($busqueda !== '') {
    $sql = "SELECT * FROM certificados WHERE cedula = ? OR matricula = ? ORDER BY fecha DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $busqueda, $busqueda);
    $stmt->execute();
    $resultado = $stmt->get_result();
    
    if ($resultado->num_rows > 0) {
        $certificados = [];
        
        // Obtener TODOS los registros que coincidan
        while ($row = $resultado->fetch_assoc()) {
            $certificados[] = [
                "cedula"           => $row['cedula'],
                "matricula"        => $row['matricula'],
                "nombre"           => $row['nombre'],
                "rutapdf"          => $row['rutapdf'],
                "fecha"            => $row['fecha'],
                "nombre_documento" => $row['nombre_documento'],
                "filial"           => $row['filial']
            ];
        }
        
        echo json_encode([
            "success" => true,
            "certificados" => $certificados,
            "total" => count($certificados)
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "No encontrado"]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Ingrese un dato"]);
}

$conn->close();
?>