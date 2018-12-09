#include <SoftwareSerial.h>

SoftwareSerial ble(13, 12);

const int NUM_OUTPUTS = 4;
const int MOTOR_PINS[] = {3, 5, 6, 9};
const int MOTORS[2][2] = {
  {
    MOTOR_PINS[0], MOTOR_PINS[1]
  },
  {
    MOTOR_PINS[2], MOTOR_PINS[3]
  }
};
const byte ZERO[] = {0, 0, 0, 0};

void setup() {
  Serial.begin(9600);
  Serial.println("Begin");
  ble.begin(9600);

  for (int i = 0; i < NUM_OUTPUTS; i++) {
    pinMode(MOTOR_PINS[i], OUTPUT);
    digitalWrite(MOTOR_PINS[i], LOW);
  }
  ble.write(ZERO, 4);
}

bool motorStates[2] = {false, false};
union BleData {
  struct {
    unsigned long seq;
    byte currentMotor;
    float magnitude;
  } data;
  byte bytes[9];
};
union BleData bleData;

void loop() {
  if (ble.available() > 0) {
    ble.readBytes(bleData.bytes, 9);
    bool start = true;
    for (int i = 0; i < 9; i++) {
      if (bleData.bytes[i] != 0xFF) {
        start = false;
      }
    }
    if (start) {
      Serial.println("Start!");
      ble.write(ZERO, 4);
      digitalWrite(MOTORS[0][0], LOW);
      digitalWrite(MOTORS[0][1], LOW);
      digitalWrite(MOTORS[1][0], LOW);
      digitalWrite(MOTORS[1][1], LOW);
      return;
    }
    bool end = true;
    for (int i = 0; i < 9; i++) {
      if (bleData.bytes[i] != 0xEE) {
        end = false;
      }
    }
    if (end) {
      Serial.println("End!");
      ble.write(ZERO, 4);
      digitalWrite(MOTORS[0][0], LOW);
      digitalWrite(MOTORS[0][1], LOW);
      digitalWrite(MOTORS[1][0], LOW);
      digitalWrite(MOTORS[1][1], LOW);
      return;
    }
    ble.write(bleData.bytes, 4);
    for (int i = 0; i < 9; i++) {
      Serial.print(bleData.bytes[i], HEX);
      Serial.print(" ");
    }
    Serial.println();
    Serial.print("Seq: ");
    Serial.println(bleData.data.seq);
    Serial.print("Motor: ");
    Serial.println(bleData.data.currentMotor);
    Serial.print("Mag: ");
    Serial.println(bleData.data.magnitude);
    if (bleData.data.currentMotor != 0 && bleData.data.currentMotor != 1) {
      Serial.println("Invalid motor selection!");
      return;
    }
    if (bleData.data.magnitude > 1.0 || bleData.data.magnitude < -1.0) {
      Serial.println("Invalid magnitude!");
      return;
    }

    if (bleData.data.magnitude > 0.0) {
      if (!motorStates[bleData.data.currentMotor]) {
        digitalWrite(MOTORS[bleData.data.currentMotor][1], LOW);
        motorStates[bleData.data.currentMotor] = true;
      }
      analogWrite(MOTORS[bleData.data.currentMotor][0], bleData.data.magnitude * 255);
    } else {
      if (motorStates[bleData.data.currentMotor]) {
        digitalWrite(MOTORS[bleData.data.currentMotor][0], LOW);
        motorStates[bleData.data.currentMotor] = false;
      }
      analogWrite(MOTORS[bleData.data.currentMotor][1], bleData.data.magnitude * -255);
    }
  }
}
