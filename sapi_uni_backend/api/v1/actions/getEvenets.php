<?php
require_once dirname(__FILE__) . '/../db/db.php'; // Adjust the path as necessary
require_once dirname(__FILE__) . '/../utils/general.php'; // For utility functions if any
session_start();

// Check for a valid session, ensure user is logged in, or handle the request accordingly
checkUserSession(); // Assuming this function validates user session

// Get user ID from the query string
$userId = ($_SESSION['user_id']);

// Prepare and execute the query
if ($userId > 0) {
    $sql = "SELECT name, date_time FROM events WHERE user_id = ?";
    if ($stmt = $db->prepare($sql)) {
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $events = [];

        while ($row = $result->fetch_assoc()) {
            $events[] = [
                'event_name' => $row['name'],
                'event_date' => $row['date_time']
            ];
        }

        $stmt->close();
        
        // Send the events back as JSON
        header('Content-Type: application/json');
        echo json_encode($events);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to prepare the SQL statement']);
    }
} else {
    http_response_code(400); // Bad request if user ID is not provided
    echo json_encode(['error' => 'User ID is required']);
}

?>
