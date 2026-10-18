#include <Wire.h>
#include <math.h>
#include <DHT.h>
#include <TinyGPSPlus.h>

// =====================================================
// MPU6050
// =====================================================

#define MPU6050_ADDR 0x68

#define PWR_MGMT_1    0x6B
#define ACCEL_XOUT_H  0x3B
#define GYRO_XOUT_H   0x43
#define TEMP_OUT_H    0x41


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

  Wire.endTransmission(false);

  Wire.requestFrom(MPU6050_ADDR, 2);

  int16_t value = Wire.read() << 8 | Wire.read();

  return value;
}


// =====================================================
// BMP280 FUNCTIONS
// =====================================================

uint16_t bmpRead16_LE(uint8_t reg) {

  Wire1.beginTransmission(BMP280_ADDR);

  Wire1.write(reg);

  Wire1.endTransmission(false);

  Wire1.requestFrom(BMP280_ADDR, (uint8_t)2);

  uint8_t low = Wire1.read();
  uint8_t high = Wire1.read();

  return (uint16_t)high << 8 | low;
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

void readBMP280Raw(
  int32_t &pressureRaw,
  int32_t &temperatureRaw
) {

  Wire1.beginTransmission(BMP280_ADDR);

  Wire1.write(BMP280_PRESSURE);

  Wire1.endTransmission(false);

  Wire1.requestFrom(BMP280_ADDR, (uint8_t)6);

  uint8_t p_msb = Wire1.read();
  uint8_t p_lsb = Wire1.read();
  uint8_t p_xlsb = Wire1.read();

  uint8_t t_msb = Wire1.read();
  uint8_t t_lsb = Wire1.read();
  uint8_t t_xlsb = Wire1.read();

  pressureRaw =
      ((int32_t)p_msb << 12) |
      ((int32_t)p_lsb << 4) |
      ((int32_t)p_xlsb >> 4);

  temperatureRaw =
      ((int32_t)t_msb << 12) |
      ((int32_t)t_lsb << 4) |
      ((int32_t)t_xlsb >> 4);
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

  int32_t pressureRaw;
  int32_t temperatureRaw;

  readBMP280Raw(
    pressureRaw,
    temperatureRaw
  );

  compensateTemperature(temperatureRaw);

  float pressure =
      compensatePressure(pressureRaw);

  return pressure / 100.0;
}


// =====================================================
// CALCULATE ALTITUDE IN FEET
// =====================================================

float calculateAltitude(float pressureHpa) {

  float altitudeMeters =
      44330.0 *
      (1.0 - pow(
        pressureHpa / referencePressure,
        0.1903
      ));

  float altitudeFeet =
      altitudeMeters * 3.28084;

  return altitudeFeet;
}


// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(1000);


  // ===================================================
  // MPU6050
  // ===================================================

  Wire.begin(21, 22);

  writeRegister(
    PWR_MGMT_1,
    0x00
  );

  delay(100);


  // ===================================================
  // BMP280
  // ===================================================

  Wire1.begin(
    BMP_SDA,
    BMP_SCL
  );

  delay(100);


  // Check BMP280 address

  Wire1.beginTransmission(0x76);

  if (Wire1.endTransmission() == 0) {

    BMP280_ADDR = 0x76;

  } else {

    Wire1.beginTransmission(0x77);

    if (Wire1.endTransmission() == 0) {

      BMP280_ADDR = 0x77;
    }
  }


  // Read calibration

  readBMP280Calibration();


  // Configure BMP280

  Wire1.beginTransmission(BMP280_ADDR);

  Wire1.write(BMP280_CTRL_MEAS);

  Wire1.write(0x27);

  Wire1.endTransmission();


  Wire1.beginTransmission(BMP280_ADDR);

  Wire1.write(BMP280_CONFIG);

  Wire1.write(0x00);

  Wire1.endTransmission();


  delay(100);


  // ===================================================
  // DHT22
  // ===================================================

  dht.begin();

  delay(2000);

  // =====================================================
  // NEO GPS
  // =====================================================

  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  Serial.println("NEO GPS initialized");


  // ===================================================
  // CALCULATE REFERENCE PRESSURE
  // ===================================================

  float pressureSum = 0.0;

  for (int i = 0; i < 50; i++) {

    pressureSum += readPressureHpa();

    delay(20);
  }

  referencePressure =
      pressureSum / 50.0;
}

// =====================================================
// LOOP
// =====================================================

void loop() {

  // ===================================================
  // MPU6050
  // ===================================================

  int16_t accelX =
      read16(ACCEL_XOUT_H);

  int16_t accelY =
      read16(ACCEL_XOUT_H + 2);

  int16_t accelZ =
      read16(ACCEL_XOUT_H + 4);

  int16_t tempRaw =
      read16(TEMP_OUT_H);

  int16_t gyroX =
      read16(GYRO_XOUT_H);

  int16_t gyroY =
      read16(GYRO_XOUT_H + 2);

  int16_t gyroZ =
      read16(GYRO_XOUT_H + 4);


  // Accelerometer

  float ax =
      accelX / 16384.0;

  float ay =
      accelY / 16384.0;

  float az =
      accelZ / 16384.0;


  // Gyroscope

  float gx =
      gyroX / 131.0;

  float gy =
      gyroY / 131.0;

  float gz =
      gyroZ / 131.0;


  // MPU6050 temperature

  float mpuTemperature =
      (tempRaw / 340.0) + 36.53;


  // ===================================================
  // BMP280
  // ===================================================

  int32_t pressureRaw;
  int32_t temperatureRaw;

  readBMP280Raw(
    pressureRaw,
    temperatureRaw
  );


  float bmpTemperature =
      compensateTemperature(
        temperatureRaw
      );


  float pressure =
      compensatePressure(
        pressureRaw
      );


  float pressure_hPa =
      pressure / 100.0;

  
// =====================================================
// NEO GPS
// =====================================================

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

if (gps.altitude.isValid()) {
  gpsAltitude = gps.altitude.meters();
}

if (gps.speed.isValid()) {
  gpsSpeed = gps.speed.kmph();
}

if (gps.satellites.isValid()) {
  satellites = gps.satellites.value();
}



  // ===================================================
  // ALTITUDE
  // ===================================================

  float altitude =
      calculateAltitude(
        pressure_hPa
      );


  // ===================================================
  // DHT22
  // ===================================================

  float dhtHumidity =
      dht.readHumidity();

  float dhtTemperature =
      dht.readTemperature();


  // ===================================================
  // SERIAL PLOTTER
  // ===================================================

  Serial.print(gx);
  Serial.print(",");

  Serial.print(gy);
  Serial.print(",");

  Serial.print(gz);
  Serial.print(",");

  Serial.print(bmpTemperature);
  Serial.print(",");

  Serial.print(pressure_hPa);
  Serial.print(",");

  Serial.print(altitude);
  Serial.print(",");

  Serial.print(dhtTemperature);
  Serial.print(",");

  Serial.println(dhtHumidity);

  Serial.print("GPS :");
  Serial.print(",");
Serial.print(latitude, 6);

Serial.print(",");
Serial.print(longitude, 6);

Serial.print(",");
Serial.print(gpsAltitude, 2);

Serial.print(",");
Serial.print(gpsSpeed, 2);

Serial.print(",");
Serial.print(satellites);

Serial.print(",");
Serial.println(gpsValid ? 1 : 0);

}