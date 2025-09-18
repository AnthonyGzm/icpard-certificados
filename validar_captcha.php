<?php
require 'config.php';
header('Content-Type: application/json; charset=utf-8');


if (!isset($_POST['captcha']) || empty($_POST['captcha'])) {
    echo json_encode(['success' => false, 'message' => 'Captcha no recibido']);
    exit;
}

$captcha = $_POST['captcha'];

$verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
$data = http_build_query([
    'secret' => $secretKey,
    'response' => $captcha,
    'remoteip' => $_SERVER['REMOTE_ADDR']
]);

$options = [
    'http' => [
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => $data,
    ],
];

$context  = stream_context_create($options);
$response = file_get_contents($verifyUrl, false, $context);

if ($response === false) {
    echo json_encode(['success' => false, 'message' => 'Error validando captcha']);
    exit;
}

$result = json_decode($response, true);

if ($result['success'] ?? false) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Captcha inválido']);
}
?>
