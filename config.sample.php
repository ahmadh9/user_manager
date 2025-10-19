<?php
// Copy this file to "config.php" and fill your local DB credentials.
// THIS FILE IS SAFE TO COMMIT TO GIT (no real credentials here).

$DB_HOST = 'localhost';
$DB_USER = '';     // <-- fill locally, e.g. 'root'
$DB_PASS = '';     // <-- fill locally, e.g. 'mypassword'
$DB_NAME = 'user_manager';

$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

if ($mysqli->connect_error) {
    // Do not echo errors in production; for local dev you may want to handle this.
    error_log('DB connection error: ' . $mysqli->connect_error);
    // Optionally throw or handle gracefully:
    // die('Database connection failed');
}
