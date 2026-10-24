#include <Wire.h>
#include <math.h>
#include <DHT.h>
#include <TinyGPSPlus.h>
#include <esp_system.h>

// =====================================================
// MPU6050
// =====================================================

#define MPU6050_ADDR 0x68

#define PWR_MGMT_1    0x6B
#define ACCEL_XOUT_H  0x3B
#define GYRO_XOUT_H   0x43
#define TEMP_OUT_H    0x41

#define BUZZER_PIN 25

// =====================================================
// BMP280
// =====================================================

#define BMP_SDA 19
#define BMP_SCL 18

uint8_t BMP280_ADDR = 0x76;

#define BMP280_PRESSURE  0xF7
#define BMP280_CTRL_MEAS 0xF4
#define BMP280_CONFIG     0xF5

// BMP280 calibration coefficients
uint16_t dig_T1;
int16_t  dig_T2;
int16_t  dig_T3;

uint16_t dig_P1;
int16_t  dig_P2;
int16_t  dig_P3;
int16_t  dig_P4;
int16_t  dig_P5;
int16_t  dig_P6;
int16_t  dig_P7;
int16_t  dig_P8;
int16_t  dig_P9;

int32_t t_fine;


// =====================================================
// DHT22
// =====================================================

#define DHT_PIN 4
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);

// DHT22 is read at most once every 2 seconds.
float dhtHumidity = NAN;
float dhtTemperature = NAN;
unsigned long lastDhtRead = 0;

// Set false when using Arduino Serial Plotter (diagnostic lines are not JSON).
const bool DEBUG_DIAGNOSTICS = false;

void debugStage(const char* stage) {
  if (DEBUG_DIAGNOSTICS) {
    Serial.printf("[%lu ms] %s\n", millis(), stage);
  }
}


// =====================================================
// ALTITUDE
// =====================================================

float referencePressure = 0.0;


// =====================================================
// MPU6050 FUNCTIONS
// =====================================================

void writeRegister(byte reg, byte value) {

  Wire.beginTransmission(MPU6050_ADDR);

  Wire.write(reg);
  Wire.write(value);

  Wire.endTransmission();
}


int16_t read16(byte reg) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(reg);

  uint8_t error = Wire.endTransmission(false);
  if (error != 0) {
    Serial.printf("[I2C] MPU register 0x%02X transaction error=%u\n", reg, error);
    return 0;
  }

  size_t received = Wire.requestFrom(
    (uint8_t)MPU6050_ADDR, (size_t)2, (bool)true
  );

  if (received != 2) {
    Serial.printf("[I2C] MPU register 0x%02X returned %u bytes\n",
                  reg, (unsigned)received);
    while (Wire.available()) Wire.read();
    return 0;
  }

  uint8_t high = Wire.read();
  uint8_t low = Wire.read();
  return (int16_t)(((uint16_t)high << 8) | low);
}


// =====================================================
// BMP280 FUNCTIONS
// =====================================================

uint16_t bmpRead16_LE(uint8_t reg) {
  Wire1.beginTransmission(BMP280_ADDR);
  Wire1.write(reg);

  uint8_t error = Wire1.endTransmission(false);
  if (error != 0) {
    Serial.printf("[I2C] BMP register 0x%02X transaction error=%u\n", reg, error);
    return 0;
  }

  size_t received = Wire1.requestFrom(
    (uint8_t)BMP280_ADDR, (size_t)2, (bool)true
  );

  if (received != 2) {
    Serial.printf("[I2C] BMP register 0x%02X returned %u bytes\n",
                  reg, (unsigned)received);
    while (Wire1.available()) Wire1.read();
    return 0;
  }

  uint8_t low = Wire1.read();
  uint8_t high = Wire1.read();
  return ((uint16_t)high << 8) | low;
}


int16_t bmpReadS16_LE(uint8_t reg) {

  return (int16_t)bmpRead16_LE(reg);
}

// =====================================================
// NEO GPS
// =====================================================

#define GPS_RX_PIN 16  // ESP32 RX2 <- GPS TX
#define GPS_TX_PIN 17  // ESP32 TX2 -> GPS RX

HardwareSerial gpsSerial(2);
TinyGPSPlus gps;


// =====================================================
// READ BMP280 CALIBRATION
// =====================================================

void readBMP280Calibration() {

  dig_T1 = bmpRead16_LE(0x88);
  dig_T2 = bmpReadS16_LE(0x8A);
  dig_T3 = bmpReadS16_LE(0x8C);

  dig_P1 = bmpRead16_LE(0x8E);
  dig_P2 = bmpReadS16_LE(0x90);
  dig_P3 = bmpReadS16_LE(0x92);
  dig_P4 = bmpReadS16_LE(0x94);
  dig_P5 = bmpReadS16_LE(0x96);
  dig_P6 = bmpReadS16_LE(0x98);
  dig_P7 = bmpReadS16_LE(0x9A);
  dig_P8 = bmpReadS16_LE(0x9C);
  dig_P9 = bmpReadS16_LE(0x9E);
}


// =====================================================
// READ BMP280 RAW DATA
// =====================================================

bool readBMP280Raw(int32_t &pressureRaw, int32_t &temperatureRaw) {
  Wire1.beginTransmission(BMP280_ADDR);
  Wire1.write(BMP280_PRESSURE);

  uint8_t error = Wire1.endTransmission(false);
  if (error != 0) {
    Serial.printf("[I2C] BMP data pointer error=%u\n", error);
    return false;
  }

  size_t received = Wire1.requestFrom(
    (uint8_t)BMP280_ADDR, (size_t)6, (bool)true
  );

  if (received != 6) {
    Serial.printf("[I2C] BMP returned %u bytes, expected 6\n",
                  (unsigned)received);
    while (Wire1.available()) Wire1.read();
    return false;
  }

  uint8_t p_msb  = Wire1.read();
  uint8_t p_lsb  = Wire1.read();
  uint8_t p_xlsb = Wire1.read();
  uint8_t t_msb  = Wire1.read();
  uint8_t t_lsb  = Wire1.read();
  uint8_t t_xlsb = Wire1.read();

  pressureRaw =
    ((int32_t)p_msb << 12) |
    ((int32_t)p_lsb << 4) |
    ((int32_t)p_xlsb >> 4);

  temperatureRaw =
    ((int32_t)t_msb << 12) |
    ((int32_t)t_lsb << 4) |
    ((int32_t)t_xlsb >> 4);

  return true;
}


// =====================================================
// BMP280 TEMPERATURE COMPENSATION
// =====================================================

float compensateTemperature(int32_t adc_T) {

  int32_t var1;
  int32_t var2;
  int32_t T;

  var1 =
      ((((adc_T >> 3) - ((int32_t)dig_T1 << 1))) *
      ((int32_t)dig_T2)) >> 11;

  var2 =
      (((((adc_T >> 4) - ((int32_t)dig_T1)) *
      ((adc_T >> 4) - ((int32_t)dig_T1))) >> 12) *
      ((int32_t)dig_T3)) >> 14;

  t_fine = var1 + var2;

  T = (t_fine * 5 + 128) >> 8;

  return T / 100.0;
}


// =====================================================
// BMP280 PRESSURE COMPENSATION
// =====================================================

float compensatePressure(int32_t adc_P) {

  int64_t var1;
  int64_t var2;
  int64_t p;

  var1 = ((int64_t)t_fine) - 128000;

  var2 = var1 * var1 * (int64_t)dig_P6;

  var2 =
      var2 +
      ((var1 * (int64_t)dig_P5) << 17);

  var2 =
      var2 +
      (((int64_t)dig_P4) << 35);

  var1 =
      ((var1 * var1 * (int64_t)dig_P3) >> 8) +
      ((var1 * (int64_t)dig_P2) << 12);

  var1 =
      (((((int64_t)1) << 47) + var1) *
      ((int64_t)dig_P1)) >> 33;

  if (var1 == 0) {
    return 0;
  }

  p = 1048576 - adc_P;

  p =
      (((p << 31) - var2) * 3125) / var1;

  var1 =
      ((int64_t)dig_P9 *
      (p >> 13) *
      (p >> 13)) >> 25;

  var2 =
      ((int64_t)dig_P8 * p) >> 19;

  p =
      ((p + var1 + var2) >> 8) +
      ((int64_t)dig_P7 << 4);

  return p / 256.0;
}


// =====================================================
// READ BMP280 PRESSURE
// =====================================================

float readPressureHpa() {
  int32_t pressureRaw, temperatureRaw;

  if (!readBMP280Raw(pressureRaw, temperatureRaw)) {
    return NAN;
  }

  compensateTemperature(temperatureRaw);
  float pressure = compensatePressure(pressureRaw);
  return pressure / 100.0f;
}


// =====================================================
// CALCULATE ALTITUDE IN FEET
// =====================================================

float calculateAltitude(float pressureHpa) {
  if (!isfinite(pressureHpa) || !isfinite(referencePressure) ||
      pressureHpa <= 0.0f || referencePressure <= 0.0f) {
    return NAN;
  }

  float ratio = pressureHpa / referencePressure;
  if (ratio <= 0.0f || !isfinite(ratio)) {
    return NAN;
  }

  float altitudeMeters = 44330.0f * (1.0f - powf(ratio, 0.1903f));
  return altitudeMeters * 3.28084f;
}


// =====================================================
// SETUP
// =====================================================



void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.printf("ESP32 reset reason: %d\n", (int)esp_reset_reason());

  // MPU6050 I2C bus
  Wire.begin(21, 22);
  Wire.setTimeOut(50);

  pinMode(BUZZER_PIN, OUTPUT);
  delay(50);

  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(PWR_MGMT_1);
  Wire.write(0x00);
  uint8_t mpuError = Wire.endTransmission();
  if (mpuError != 0) {
    Serial.printf("[INIT] MPU6050 not responding; I2C error=%u\n", mpuError);
  } else {
    Serial.println("[INIT] MPU6050 detected");
  }

  // BMP280 uses a separate I2C controller/pin pair
  Wire1.begin(BMP_SDA, BMP_SCL);
  Wire1.setTimeOut(50);
  delay(100);

  Wire1.beginTransmission(0x76);
  if (Wire1.endTransmission() == 0) {
    BMP280_ADDR = 0x76;
  } else {
    Wire1.beginTransmission(0x77);
    if (Wire1.endTransmission() == 0) {
      BMP280_ADDR = 0x77;
    } else {
      Serial.println("[INIT] ERROR: BMP280 not found at 0x76 or 0x77");
      while (true) {
        delay(1000);
        Serial.println("[INIT] Check BMP280 power, SDA=19, SCL=18, and GND");
      }
    }
  }

  Serial.printf("[INIT] BMP280 detected at 0x%02X\n", BMP280_ADDR);
  readBMP280Calibration();

  // Configure BMP280: temperature/pressure oversampling x1, normal mode
  Wire1.beginTransmission(BMP280_ADDR);
  Wire1.write(BMP280_CTRL_MEAS);
  Wire1.write(0x27);
  uint8_t ctrlError = Wire1.endTransmission();
  if (ctrlError != 0) {
    Serial.printf("[INIT] BMP280 CTRL_MEAS write error=%u\n", ctrlError);
  }

  Wire1.beginTransmission(BMP280_ADDR);
  Wire1.write(BMP280_CONFIG);
  Wire1.write(0x00);
  uint8_t configError = Wire1.endTransmission();
  if (configError != 0) {
    Serial.printf("[INIT] BMP280 CONFIG write error=%u\n", configError);
  }

  // DHT22
  dht.begin();
  delay(2000);

  // NEO GPS
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("[INIT] NEO GPS initialized");

  // Establish reference pressure from valid samples only.
  Serial.println("[INIT] Calibrating reference pressure...");
  double pressureSum = 0.0;
  int validPressureSamples = 0;

  for (int i = 0; i < 50; i++) {
    float p = readPressureHpa();
    if (isfinite(p) && p > 0.0f) {
      pressureSum += p;
      validPressureSamples++;
    }
    delay(20);
  }

  if (validPressureSamples > 0) {
    referencePressure = pressureSum / validPressureSamples;
    Serial.printf("[INIT] Reference pressure: %.2f hPa (%d samples)\n",
                  referencePressure, validPressureSamples);
  } else {
    referencePressure = NAN;
    Serial.println("[INIT] WARNING: no valid BMP280 pressure samples; altitude will be NAN");
  }

  Serial.println("[INIT] Setup complete");
}

// =====================================================
// LOOP
// =====================================================

void loop() {
  debugStage("LOOP START");
  digitalWrite(BUZZER_PIN, HIGH);

  // MPU6050: log each individual I2C read to pinpoint a possible hang.
  debugStage("MPU: accel X");
  int16_t accelX = read16(ACCEL_XOUT_H);

  debugStage("MPU: accel Y");
  int16_t accelY = read16(ACCEL_XOUT_H + 2);

  debugStage("MPU: accel Z");
  int16_t accelZ = read16(ACCEL_XOUT_H + 4);

  debugStage("MPU: temperature");
  int16_t tempRaw = read16(TEMP_OUT_H);

  debugStage("MPU: gyro X");
  int16_t gyroX = read16(GYRO_XOUT_H);

  debugStage("MPU: gyro Y");
  int16_t gyroY = read16(GYRO_XOUT_H + 2);

  debugStage("MPU: gyro Z");
  int16_t gyroZ = read16(GYRO_XOUT_H + 4);

  debugStage("AFTER MPU");

  float ax = accelX / 16384.0f;
  float ay = accelY / 16384.0f;
  float az = accelZ / 16384.0f;

  float gx = gyroX / 131.0f;
  float gy = gyroY / 131.0f;
  float gz = gyroZ / 131.0f;

  float mpuTemperature = (tempRaw / 340.0f) + 36.53f;
  (void)ax; (void)ay; (void)az; (void)mpuTemperature;

  // BMP280
  debugStage("BEFORE BMP");
  int32_t pressureRaw = 0;
  int32_t temperatureRaw = 0;

  if (!readBMP280Raw(pressureRaw, temperatureRaw)) {
    debugStage("BMP READ FAILED");
    delay(100);
    return;
  }

  float bmpTemperature = compensateTemperature(temperatureRaw);
  float pressure = compensatePressure(pressureRaw);
  float pressure_hPa = pressure / 100.0f;
  debugStage("AFTER BMP");

  if (!isfinite(pressure_hPa) || pressure_hPa <= 0.0f) {
    Serial.println("[BMP] Invalid pressure result");
    delay(100);
    return;
  }

  // GPS: parse whatever bytes are currently available; never wait for a fix.
  debugStage("BEFORE GPS");
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  double latitude = 0.0;
  double longitude = 0.0;
  double gpsAltitude = 0.0;
  double gpsSpeed = 0.0;
  int satellites = 0;
  bool gpsValid = gps.location.isValid();

  if (gpsValid) {
    latitude = gps.location.lat();
    longitude = gps.location.lng();
  }
  if (gps.altitude.isValid()) gpsAltitude = gps.altitude.meters();
  if (gps.speed.isValid()) gpsSpeed = gps.speed.kmph();
  if (gps.satellites.isValid()) satellites = gps.satellites.value();
  debugStage("AFTER GPS");

  // Altitude based on BMP280 pressure.
  float altitude = calculateAltitude(pressure_hPa);

  // DHT22: update no more often than every 2 seconds.
  debugStage("BEFORE DHT");
  if (lastDhtRead == 0 || millis() - lastDhtRead >= 2000UL) {
    lastDhtRead = millis();
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (!isnan(h) && !isnan(t)) {
      dhtHumidity = h;
      dhtTemperature = t;
    } else {
      Serial.println("[DHT] Read failed; keeping last valid reading");
    }
  }
  debugStage("AFTER DHT");

  // JSON output. Diagnostic messages are also enabled; disable diagnostics
  // by setting DEBUG_DIAGNOSTICS=false when using Serial Plotter.
  debugStage("BEFORE OUTPUT");
    
  Serial.printf(
    "{\"ax\":%.3f,"
    "\"ay\":%.3f,"
    "\"az\":%.3f,"
    "\"gx\":%.2f,"
    "\"gy\":%.2f,"
    "\"gz\":%.2f,"
    "\"bmpTemperature\":%.2f,"
    "\"pressure_hPa\":%.2f,"
    "\"altitude\":%.2f,"
    "\"dhtTemperature\":%.2f,"
    "\"dhtHumidity\":%.2f,"
    "\"latitude\":%.6f,"
    "\"longitude\":%.6f,"
    "\"gpsAltitude\":%.2f,"
    "\"gpsSpeed\":%.2f,"
    "\"satellites\":%d,"
    "\"gpsValid\":%s}\n",
    ax, ay, az,
    gx, gy, gz,
    bmpTemperature, pressure_hPa, altitude,
    dhtTemperature, dhtHumidity,
    latitude, longitude, gpsAltitude, gpsSpeed,
    satellites, gpsValid ? "true" : "false"
  );

    digitalWrite(BUZZER_PIN, LOW);
  debugStage("LOOP END");

  delay(20);


}
