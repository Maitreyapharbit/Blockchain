// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Deprecated - IoTComplianceTracker
/// @notice IoT compliance tracking is now part of `Tracking.sol`. This file is deprecated and kept as a stub.
contract DeprecatedIoTComplianceTracker {
}


    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");

    // Sensor reading - measurement time vs record time
    struct SensorReading {
        bytes32 batchId;
        uint256 measurementTime;         // When sensor measured (hardware time)
        uint256 recordTime;              // When recorded on blockchain
        string readingType;              // "TEMPERATURE", "HUMIDITY", "VIBRATION"
        int256 readingValue;             // Value with appropriate decimals
        string unit;                     // "CELSIUS", "PERCENTAGE", "G"
        address iotDeviceAddress;        // Which sensor recorded this
        bytes iotSignature;              // Device's cryptographic signature
        bool isHistorical;               // Flag if > 1 hour delay
    }

    // Compliance threshold
    struct ComplianceThreshold {
        string readingType;
        int256 minValue;
        int256 maxValue;
        string description;
    }

    // Storage
    mapping(bytes32 => SensorReading[]) public complianceReadings;
    mapping(address => bool) public authorizedIoTDevices;
    mapping(string => ComplianceThreshold) public thresholds;

    SensorReading[] private allReadings;

    // Constants
    uint256 public constant HISTORICAL_THRESHOLD = 3600; // 1 hour in seconds
    uint256 public constant MAX_BATCH_SIZE = 1000;

    // Events
    event IoTDeviceAuthorized(
        address indexed device,
        uint256 timestamp
    );

    event IoTDeviceRevoked(
        address indexed device,
        uint256 timestamp
    );

    event TemperatureReadingRecorded(
        bytes32 indexed batchId,
        int256 temperature,
        uint256 measurementTime,
        uint256 recordTime,
        bool isHistorical,
        address indexed iotDevice
    );

    event HumidityReadingRecorded(
        bytes32 indexed batchId,
        int256 humidity,
        uint256 measurementTime,
        uint256 recordTime,
        bool isHistorical,
        address indexed iotDevice
    );

    event VibrationReadingRecorded(
        bytes32 indexed batchId,
        int256 vibration,
        uint256 measurementTime,
        uint256 recordTime,
        bool isHistorical,
        address indexed iotDevice
    );

    event ComplianceViolation(
        bytes32 indexed batchId,
        string readingType,
        int256 value,
        int256 minThreshold,
        int256 maxThreshold,
        uint256 timestamp
    );

    event ThresholdSet(
        string readingType,
        int256 minValue,
        int256 maxValue,
        string description
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Initialize default thresholds (can be updated)
        // Temperature: 2°C to 8°C for refrigerated goods (pharmacy grade)
        setComplianceThreshold("TEMPERATURE", 20, 80, "Safe pharmaceutical storage: 20-80 C");

        // Humidity: 30% to 70% for most pharmaceuticals
        setComplianceThreshold("HUMIDITY", 30, 70, "Safe humidity range: 30-70%");

        // Vibration: < 0.5g shock for fragile products
        setComplianceThreshold("VIBRATION", 0, 50, "Maximum vibration: 0.5g");
    }

    /**
     * @dev Authorize an IoT device to record sensor data
     * @param deviceAddress The device's wallet address
     */
    function authorizeIoTDevice(address deviceAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(deviceAddress != address(0), "Invalid device address");
        authorizedIoTDevices[deviceAddress] = true;

        emit IoTDeviceAuthorized(deviceAddress, block.timestamp);
    }

    /**
     * @dev Revoke authorization for an IoT device
     */
    function revokeIoTDevice(address deviceAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        authorizedIoTDevices[deviceAddress] = false;

        emit IoTDeviceRevoked(deviceAddress, block.timestamp);
    }

    /**
     * @dev Set compliance threshold for a reading type
     */
    function setComplianceThreshold(
        string memory readingType,
        int256 minValue,
        int256 maxValue,
        string memory description
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(minValue < maxValue, "Min must be less than max");

        thresholds[readingType] = ComplianceThreshold({
            readingType: readingType,
            minValue: minValue,
            maxValue: maxValue,
            description: description
        });

        emit ThresholdSet(readingType, minValue, maxValue, description);
    }

    /**
     * @dev Record temperature reading from IoT sensor
     * @param batchId Pharmaceutical batch ID
     * @param measurementTime When temperature was measured (hardware time)
     * @param temperatureValue Temperature in Celsius * 10 (e.g., 22.5°C = 225)
     * @param iotDeviceAddress Address of the measuring device
     * @param iotSignature Device's signature verifying the measurement
     */
    function recordTemperatureReading(
        bytes32 batchId,
        uint256 measurementTime,
        int256 temperatureValue,
        address iotDeviceAddress,
        bytes calldata iotSignature
    ) external nonReentrant {
        require(authorizedIoTDevices[iotDeviceAddress], "Unauthorized IoT device");
        require(measurementTime <= block.timestamp, "Future timestamp rejected");

        // Verify IoT device signature
        _verifyIoTSignature(
            batchId,
            measurementTime,
            temperatureValue,
            "TEMPERATURE",
            iotDeviceAddress,
            iotSignature
        );

        // Calculate time delta
        uint256 timeDelta = block.timestamp - measurementTime;
        bool isHistorical = timeDelta > HISTORICAL_THRESHOLD;

        // Create sensor reading record
        SensorReading memory reading = SensorReading({
            batchId: batchId,
            measurementTime: measurementTime,
            recordTime: block.timestamp,
            readingType: "TEMPERATURE",
            readingValue: temperatureValue,
            unit: "CELSIUS",
            iotDeviceAddress: iotDeviceAddress,
            iotSignature: iotSignature,
            isHistorical: isHistorical
        });

        complianceReadings[batchId].push(reading);
        allReadings.push(reading);

        // Check compliance threshold
        _checkCompliance(batchId, temperatureValue, "TEMPERATURE");

        emit TemperatureReadingRecorded(
            batchId,
            temperatureValue,
            measurementTime,
            block.timestamp,
            isHistorical,
            iotDeviceAddress
        );
    }

    /**
     * @dev Record humidity reading from IoT sensor
     */
    function recordHumidityReading(
        bytes32 batchId,
        uint256 measurementTime,
        int256 humidityValue,
        address iotDeviceAddress,
        bytes calldata iotSignature
    ) external nonReentrant {
        require(authorizedIoTDevices[iotDeviceAddress], "Unauthorized IoT device");
        require(measurementTime <= block.timestamp, "Future timestamp rejected");

        _verifyIoTSignature(
            batchId,
            measurementTime,
            humidityValue,
            "HUMIDITY",
            iotDeviceAddress,
            iotSignature
        );

        uint256 timeDelta = block.timestamp - measurementTime;
        bool isHistorical = timeDelta > HISTORICAL_THRESHOLD;

        SensorReading memory reading = SensorReading({
            batchId: batchId,
            measurementTime: measurementTime,
            recordTime: block.timestamp,
            readingType: "HUMIDITY",
            readingValue: humidityValue,
            unit: "PERCENTAGE",
            iotDeviceAddress: iotDeviceAddress,
            iotSignature: iotSignature,
            isHistorical: isHistorical
        });

        complianceReadings[batchId].push(reading);
        allReadings.push(reading);

        _checkCompliance(batchId, humidityValue, "HUMIDITY");

        emit HumidityReadingRecorded(
            batchId,
            humidityValue,
            measurementTime,
            block.timestamp,
            isHistorical,
            iotDeviceAddress
        );
    }

    /**
     * @dev Record vibration reading from IoT sensor
     */
    function recordVibrationReading(
        bytes32 batchId,
        uint256 measurementTime,
        int256 vibrationValue,
        address iotDeviceAddress,
        bytes calldata iotSignature
    ) external nonReentrant {
        require(authorizedIoTDevices[iotDeviceAddress], "Unauthorized IoT device");
        require(measurementTime <= block.timestamp, "Future timestamp rejected");

        _verifyIoTSignature(
            batchId,
            measurementTime,
            vibrationValue,
            "VIBRATION",
            iotDeviceAddress,
            iotSignature
        );

        uint256 timeDelta = block.timestamp - measurementTime;
        bool isHistorical = timeDelta > HISTORICAL_THRESHOLD;

        SensorReading memory reading = SensorReading({
            batchId: batchId,
            measurementTime: measurementTime,
            recordTime: block.timestamp,
            readingType: "VIBRATION",
            readingValue: vibrationValue,
            unit: "G",
            iotDeviceAddress: iotDeviceAddress,
            iotSignature: iotSignature,
            isHistorical: isHistorical
        });

        complianceReadings[batchId].push(reading);
        allReadings.push(reading);

        _checkCompliance(batchId, vibrationValue, "VIBRATION");

        emit VibrationReadingRecorded(
            batchId,
            vibrationValue,
            measurementTime,
            block.timestamp,
            isHistorical,
            iotDeviceAddress
        );
    }

    /**
     * @dev Get all compliance readings for a batch
     */
    function getComplianceReadings(bytes32 batchId)
        external
        view
        returns (SensorReading[] memory)
    {
        return complianceReadings[batchId];
    }

    /**
     * @dev Verify a reading was contemporaneous
     */
    function isReadingContemporaneous(bytes32 batchId, uint256 readingIndex)
        external
        view
        returns (bool)
    {
        require(readingIndex < complianceReadings[batchId].length, "Invalid reading index");
        return !complianceReadings[batchId][readingIndex].isHistorical;
    }

    /**
     * @dev Get all readings of a specific type for a batch
     */
    function getReadingsByType(bytes32 batchId, string memory readingType)
        external
        view
        returns (SensorReading[] memory)
    {
        SensorReading[] memory readings = complianceReadings[batchId];
        uint256 count = 0;

        // Count matching readings
        for (uint256 i = 0; i < readings.length; i++) {
            if (keccak256(abi.encodePacked(readings[i].readingType)) ==
                keccak256(abi.encodePacked(readingType))) {
                count++;
            }
        }

        // Build result array
        SensorReading[] memory result = new SensorReading[](count);
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < readings.length; i++) {
            if (keccak256(abi.encodePacked(readings[i].readingType)) ==
                keccak256(abi.encodePacked(readingType))) {
                result[resultIndex] = readings[i];
                resultIndex++;
            }
        }

        return result;
    }

    /**
     * @dev Verify IoT device signature
     */
    function _verifyIoTSignature(
        bytes32 batchId,
        uint256 measurementTime,
        int256 readingValue,
        string memory readingType,
        address iotDeviceAddress,
        bytes calldata signature
    ) internal view {
        bytes32 readingHash = keccak256(abi.encodePacked(
            batchId,
            measurementTime,
            readingValue,
            readingType
        ));

        address signer = readingHash.toEthSignedMessageHash().recover(signature);
        require(signer == iotDeviceAddress, "Invalid IoT device signature");
    }

    /**
     * @dev Check if reading complies with thresholds
     */
    function _checkCompliance(
        bytes32 batchId,
        int256 readingValue,
        string memory readingType
    ) internal {
        ComplianceThreshold storage threshold = thresholds[readingType];

        if (readingValue < threshold.minValue || readingValue > threshold.maxValue) {
            emit ComplianceViolation(
                batchId,
                readingType,
                readingValue,
                threshold.minValue,
                threshold.maxValue,
                block.timestamp
            );
        }
    }

    /**
     * @dev Get compliance threshold for a reading type
     */
    function getThreshold(string memory readingType)
        external
        view
        returns (ComplianceThreshold memory)
    {
        return thresholds[readingType];
    }
}
