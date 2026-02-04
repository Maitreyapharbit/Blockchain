// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DrugPricingLedger
 * @dev Tracks drug pricing through the supply chain with transparency features
 */
contract DrugPricingLedger {
    
    struct PriceCheckpoint {
        string participantType; // 'manufacturer', 'wholesaler', 'pharmacy', 'pbm', 'insurance'
        address participant;
        uint256 price;
        uint256 markup;
        uint256 timestamp;
        string notes;
    }
    
    struct DrugPrice {
        bytes32 batchId;
        string drugName;
        address manufacturer;
        uint256 manufacturerPrice;
        PriceCheckpoint[] chain;
        uint256 totalChainMarkup;
        uint256 transparencyScore; // 0-100
        bool isPublic;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    mapping(bytes32 => DrugPrice) public drugPrices;
    mapping(address => bytes32[]) public manufacturerDrugs;
    
    event PriceRecorded(bytes32 indexed batchId, string drugName, uint256 manufacturerPrice);
    event PriceCheckpointAdded(bytes32 indexed batchId, string participantType, address participant, uint256 price);
    event PriceTransparencyScoreUpdated(bytes32 indexed batchId, uint256 score);
    event HiddenMarkupsIdentified(bytes32 indexed batchId, uint256 totalHiddenMarkup);
    
    modifier validParticipantType(string memory participantType) {
        bytes32 typeHash = keccak256(abi.encodePacked(participantType));
        require(
            typeHash == keccak256(abi.encodePacked("manufacturer")) ||
            typeHash == keccak256(abi.encodePacked("wholesaler")) ||
            typeHash == keccak256(abi.encodePacked("pharmacy")) ||
            typeHash == keccak256(abi.encodePacked("pbm")) ||
            typeHash == keccak256(abi.encodePacked("insurance")),
            "Invalid participant type"
        );
        _;
    }
    
    /**
     * @dev Record initial drug price by manufacturer
     */
    function recordManufacturerPrice(
        bytes32 batchId,
        string memory drugName,
        uint256 price,
        bool isPublic
    ) public {
        require(price > 0, "Price must be greater than 0");
        
        DrugPrice storage drug = drugPrices[batchId];
        drug.batchId = batchId;
        drug.drugName = drugName;
        drug.manufacturer = msg.sender;
        drug.manufacturerPrice = price;
        drug.isPublic = isPublic;
        drug.createdAt = block.timestamp;
        drug.updatedAt = block.timestamp;
        
        manufacturerDrugs[msg.sender].push(batchId);
        
        emit PriceRecorded(batchId, drugName, price);
    }
    
    /**
     * @dev Add a price checkpoint in the supply chain
     */
    function addPriceCheckpoint(
        bytes32 batchId,
        string memory participantType,
        uint256 price,
        string memory notes
    ) public validParticipantType(participantType) {
        require(drugPrices[batchId].createdAt > 0, "Drug price not found");
        require(price > 0, "Price must be greater than 0");
        
        DrugPrice storage drug = drugPrices[batchId];
        
        uint256 previousPrice = drug.chain.length > 0 
            ? drug.chain[drug.chain.length - 1].price 
            : drug.manufacturerPrice;
        
        uint256 markup = price > previousPrice ? price - previousPrice : 0;
        
        PriceCheckpoint memory checkpoint = PriceCheckpoint({
            participantType: participantType,
            participant: msg.sender,
            price: price,
            markup: markup,
            timestamp: block.timestamp,
            notes: notes
        });
        
        drug.chain.push(checkpoint);
        drug.totalChainMarkup += markup;
        drug.updatedAt = block.timestamp;
        
        // Update transparency score
        uint256 newScore = calculateTransparencyScore(batchId);
        drug.transparencyScore = newScore;
        
        emit PriceCheckpointAdded(batchId, participantType, msg.sender, price);
        emit PriceTransparencyScoreUpdated(batchId, newScore);
    }
    
    /**
     * @dev Identify and flag hidden markups (PBM spreads)
     */
    function identifyHiddenMarkups(bytes32 batchId) public view returns (uint256) {
        DrugPrice storage drug = drugPrices[batchId];
        uint256 hiddenMarkup = 0;
        
        for (uint256 i = 0; i < drug.chain.length; i++) {
            // Suspicious if markup > 200% from previous price
            if (drug.chain[i].markup > 0) {
                uint256 prevPrice = i == 0 ? drug.manufacturerPrice : drug.chain[i-1].price;
                uint256 markupPercent = (drug.chain[i].markup * 100) / prevPrice;
                
                if (markupPercent > 200) {
                    hiddenMarkup += drug.chain[i].markup;
                }
            }
        }
        
        return hiddenMarkup;
    }
    
    /**
     * @dev Calculate transparency score (0-100)
     * Based on how much data is disclosed vs hidden
     */
    function calculateTransparencyScore(bytes32 batchId) public view returns (uint256) {
        DrugPrice storage drug = drugPrices[batchId];
        
        if (drug.chain.length == 0) return 20;
        
        uint256 baseScore = 20; // Starting score for recording
        uint256 checkpointBonus = (drug.chain.length * 10);
        uint256 publicityBonus = drug.isPublic ? 20 : 0;
        
        uint256 score = baseScore + checkpointBonus + publicityBonus;
        return score > 100 ? 100 : score;
    }
    
    /**
     * @dev Get full pricing chain for a drug
     */
    function getPricingChain(bytes32 batchId) 
        public 
        view 
        returns (DrugPrice memory) 
    {
        return drugPrices[batchId];
    }
    
    /**
     * @dev Calculate final patient impact
     */
    function getPatientImpact(bytes32 batchId) 
        public 
        view 
        returns (uint256 finalPrice, uint256 markup, uint256 markupPercent) 
    {
        DrugPrice storage drug = drugPrices[batchId];
        require(drug.createdAt > 0, "Drug price not found");
        
        finalPrice = drug.chain.length > 0 
            ? drug.chain[drug.chain.length - 1].price 
            : drug.manufacturerPrice;
        
        markup = drug.totalChainMarkup;
        markupPercent = (markup * 100) / drug.manufacturerPrice;
    }
    
    /**
     * @dev Toggle public visibility
     */
    function setPublicVisibility(bytes32 batchId, bool isPublic) public {
        require(drugPrices[batchId].manufacturer == msg.sender, "Only manufacturer can change visibility");
        drugPrices[batchId].isPublic = isPublic;
        drugPrices[batchId].updatedAt = block.timestamp;
    }
}

/**
 * @title EquipmentCalibrationLedger
 * @dev Tracks equipment calibration with permanent audit trail
 */
contract EquipmentCalibrationLedger {
    
    struct Equipment {
        bytes32 equipmentId;
        string equipmentName;
        string equipmentType;
        address manufacturer;
        uint256 calibrationFrequencyDays;
        uint256 createdAt;
    }
    
    struct CalibrationRecord {
        bytes32 equipmentId;
        uint256 calibrationDate;
        address technician;
        string actualReading;
        string expectedReading;
        uint256 deviation;
        bool withinTolerance;
        string certificateHash;
        bool passed;
        string correctionAction;
        bytes32 ipfsHash;
        uint256 recordedAt;
    }
    
    mapping(bytes32 => Equipment) public equipments;
    mapping(bytes32 => CalibrationRecord[]) public calibrationHistory;
    mapping(bytes32 => uint256) public lastCalibrationDate;
    mapping(bytes32 => uint256) public nextCalibrationDue;
    
    mapping(address => bytes32[]) public manufacturerEquipment;
    
    event EquipmentRegistered(bytes32 indexed equipmentId, string name, address indexed manufacturer);
    event CalibrationRecorded(
        bytes32 indexed equipmentId,
        uint256 calibrationDate,
        bool passed,
        address indexed technician
    );
    event CalibrationOverdue(bytes32 indexed equipmentId, uint256 daysOverdue);
    event CalibrationFailure(bytes32 indexed equipmentId, uint256 deviation);
    
    /**
     * @dev Register new manufacturing equipment
     */
    function registerEquipment(
        bytes32 equipmentId,
        string memory equipmentName,
        string memory equipmentType,
        uint256 calibrationFrequencyDays
    ) public {
        require(calibrationFrequencyDays > 0, "Calibration frequency must be > 0");
        
        Equipment storage equipment = equipments[equipmentId];
        equipment.equipmentId = equipmentId;
        equipment.equipmentName = equipmentName;
        equipment.equipmentType = equipmentType;
        equipment.manufacturer = msg.sender;
        equipment.calibrationFrequencyDays = calibrationFrequencyDays;
        equipment.createdAt = block.timestamp;
        
        manufacturerEquipment[msg.sender].push(equipmentId);
        
        // Set initial next calibration due
        nextCalibrationDue[equipmentId] = block.timestamp + (calibrationFrequencyDays * 1 days);
        
        emit EquipmentRegistered(equipmentId, equipmentName, msg.sender);
    }
    
    /**
     * @dev Record equipment calibration
     */
    function recordCalibration(
        bytes32 equipmentId,
        string memory actualReading,
        string memory expectedReading,
        uint256 deviationBasisPoints, // e.g., 50 = 0.5%
        string memory certificateHash,
        bool passed,
        bytes32 ipfsHash
    ) public {
        require(equipments[equipmentId].createdAt > 0, "Equipment not found");
        
        Equipment storage equipment = equipments[equipmentId];
        
        CalibrationRecord memory record = CalibrationRecord({
            equipmentId: equipmentId,
            calibrationDate: block.timestamp,
            technician: msg.sender,
            actualReading: actualReading,
            expectedReading: expectedReading,
            deviation: deviationBasisPoints,
            withinTolerance: deviationBasisPoints <= 100, // 1% tolerance by default
            certificateHash: certificateHash,
            passed: passed,
            correctionAction: "",
            ipfsHash: ipfsHash,
            recordedAt: block.timestamp
        });
        
        calibrationHistory[equipmentId].push(record);
        lastCalibrationDate[equipmentId] = block.timestamp;
        nextCalibrationDue[equipmentId] = block.timestamp + (equipment.calibrationFrequencyDays * 1 days);
        
        if (!passed) {
            emit CalibrationFailure(equipmentId, deviationBasisPoints);
        }
        
        emit CalibrationRecorded(equipmentId, block.timestamp, passed, msg.sender);
    }
    
    /**
     * @dev Check if equipment calibration is overdue
     */
    function isCalibrationOverdue(bytes32 equipmentId) public view returns (bool, uint256) {
        uint256 dueDate = nextCalibrationDue[equipmentId];
        
        if (block.timestamp > dueDate) {
            uint256 daysOverdue = (block.timestamp - dueDate) / 1 days;
            return (true, daysOverdue);
        }
        
        return (false, 0);
    }
    
    /**
     * @dev Get days until next calibration due
     */
    function daysUntilNextCalibration(bytes32 equipmentId) public view returns (int256) {
        uint256 dueDate = nextCalibrationDue[equipmentId];
        
        if (block.timestamp >= dueDate) {
            return -int256((block.timestamp - dueDate) / 1 days);
        }
        
        return int256((dueDate - block.timestamp) / 1 days);
    }
    
    /**
     * @dev Get full calibration history
     */
    function getCalibrationHistory(bytes32 equipmentId) 
        public 
        view 
        returns (CalibrationRecord[] memory) 
    {
        return calibrationHistory[equipmentId];
    }
    
    /**
     * @dev Calculate equipment failure risk (predictive maintenance)
     */
    function calculateFailureRisk(bytes32 equipmentId) public view returns (uint256) {
        CalibrationRecord[] storage records = calibrationHistory[equipmentId];
        
        if (records.length < 3) return 0; // Not enough data
        
        uint256 failureCount = 0;
        uint256 totalDeviation = 0;
        
        // Look at last 5 calibrations
        uint256 checkCount = records.length > 5 ? 5 : records.length;
        
        for (uint256 i = records.length - checkCount; i < records.length; i++) {
            if (!records[i].passed) {
                failureCount++;
            }
            totalDeviation += records[i].deviation;
        }
        
        uint256 failureRate = (failureCount * 100) / checkCount;
        uint256 avgDeviation = totalDeviation / checkCount;
        
        // Risk = (failure_rate + deviation_increase) * 50
        uint256 risk = failureRate + (avgDeviation / 10);
        
        return risk > 100 ? 100 : risk;
    }
    
    /**
     * @dev Get equipment details
     */
    function getEquipment(bytes32 equipmentId) 
        public 
        view 
        returns (Equipment memory) 
    {
        return equipments[equipmentId];
    }
}
