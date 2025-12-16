#include <WiFi.h>
#include <HTTPClient.h>

// --- CONFIGURATION ---
const char* ssid = "Aowies";
const char* password = "87654321";

// REPLACE THIS with your computer's IP address
const char* serverUrl = "https://smart-parking-cyan.vercel.app/api/sensor/update"; 

// --- SPOT CONFIGURATION ---
const String spot1Name = "A1";
const String spot2Name = "A2"; // Change to "B1" or whatever your 2nd spot is in DB

// --- PIN DEFINITIONS ---
// Sensor 1
const int trigPin1 = 5;
const int echoPin1 = 18;
// Sensor 2
const int trigPin2 = 19;
const int echoPin2 = 21;

// --- STATE TRACKING ---
// To track changes separately for each spot
bool lastState1 = false; 
bool lastState2 = false;

// Tuning
const int DISTANCE_THRESHOLD = 50; // cm

void setup() {
  Serial.begin(115200);
  
  // Setup Sensor 1
  pinMode(trigPin1, OUTPUT);
  pinMode(echoPin1, INPUT);
  
  // Setup Sensor 2
  pinMode(trigPin2, OUTPUT);
  pinMode(echoPin2, INPUT);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
}

void loop() {
  // --- CHECK SPOT 1 ---
  checkSensor(trigPin1, echoPin1, spot1Name, lastState1);
  
  // Small delay between sensors to prevent interference
  delay(100); 

  // --- CHECK SPOT 2 ---
  checkSensor(trigPin2, echoPin2, spot2Name, lastState2);

  delay(1000); // Wait 1 second before next full cycle
}

// Helper function to read distance and handle logic for ONE spot
void checkSensor(int trigPin, int echoPin, String spotName, bool &lastState) {
  long duration;
  int distance;

  // 1. Measure Distance
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;

  // 2. Determine if car is present
  // Valid reading is > 0 and < Threshold
  bool isCarPresent = (distance > 0 && distance < DISTANCE_THRESHOLD);

  // 3. Send update ONLY if state changed for this specific spot
  if (isCarPresent != lastState) {
    Serial.print("Update for ");
    Serial.print(spotName);
    Serial.print(": ");
    Serial.println(isCarPresent ? "Occupied" : "Empty");
    
    sendUpdate(spotName, isCarPresent);
    lastState = isCarPresent; // Update the tracking variable
  }
}

// Function to send data to server
void sendUpdate(String spot, bool status) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // JSON payload: {"spotNumber": "A1", "isCarPresent": true}
    String jsonPayload = "{\"spotNumber\": \"" + spot + "\", \"isCarPresent\": " + (status ? "true" : "false") + "}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      // Success
    } else {
      Serial.print("Error sending POST for ");
      Serial.print(spot);
      Serial.print(": ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }
}