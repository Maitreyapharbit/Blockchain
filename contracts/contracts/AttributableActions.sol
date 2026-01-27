// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title AttributableActions
 * @dev ALCOA+ compliance contract for tracking individual employee actions
 * @notice Links all blockchain actions to specific employee IDs, not generic roles
 */
contract AttributableActions is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // Actor registration - ALCOA+ Attributability
    struct ActorRegistry {
        string employeeId;        // "LAB-TECH-00123"
        string department;        // "Quality Control"
        string companyName;       // "Pfizer Inc"
        address walletAddress;
        uint256 registeredAt;
        bool isActive;
    }

    // Action log - immutable audit trail
    struct ActionLog {
        bytes32 actionId;
        address actor;
        string employeeId;
        string actionType;        // "BATCH_CREATED", "QUALITY_CHECK", etc
        string description;
        bytes32 dataHash;
        uint256 hardwareTimestamp;  // IoT sensor time
        uint256 recordedAt;         // Blockchain time
        bytes signature;
        bool isVerified;
    }

    // Storage mappings
    mapping(address => ActorRegistry) public registeredActors;
    mapping(bytes32 => ActionLog) public actionLogs;
    
    bytes32[] private actionLogIds;
    mapping(address => bytes32[]) public actorActionHistory;

    // Events
    event ActorRegistered(
        address indexed walletAddress,
        string employeeId,
        string department,
        string companyName,
        uint256 timestamp
    );

    event ActorDeactivated(
        address indexed walletAddress,
        string employeeId,
        uint256 timestamp
    );

    event AttributableActionLogged(
        bytes32 indexed actionId,
        address indexed actor,
        string employeeId,
        string actionType,
        bytes32 dataHash,
        uint256 hardwareTimestamp,
        uint256 recordedAt
    );

    event ActionVerified(
        bytes32 indexed actionId,
        bool isValid,
        uint256 timestamp
    );

    /**
     * @dev Register an employee with the system
     * @param walletAddress Employee's wallet address
     * @param employeeId Unique employee identifier
     * @param department Department name
     * @param companyName Company name
     */
    function registerActor(
        address walletAddress,
        string memory employeeId,
        string memory department,
        string memory companyName
    ) external onlyOwner {
        require(walletAddress != address(0), "Invalid address");
        require(bytes(employeeId).length > 0, "Invalid employee ID");
        require(bytes(department).length > 0, "Invalid department");

        registeredActors[walletAddress] = ActorRegistry({
            employeeId: employeeId,
            department: department,
            companyName: companyName,
            walletAddress: walletAddress,
            registeredAt: block.timestamp,
            isActive: true
        });

        emit ActorRegistered(
            walletAddress,
            employeeId,
            department,
            companyName,
            block.timestamp
        );
    }

    /**
     * @dev Deactivate an employee
     * @param walletAddress Employee's wallet address
     */
    function deactivateActor(address walletAddress) external onlyOwner {
        ActorRegistry storage actor = registeredActors[walletAddress];
        require(actor.isActive, "Actor already inactive");

        actor.isActive = false;

        emit ActorDeactivated(walletAddress, actor.employeeId, block.timestamp);
    }

    /**
     * @dev Log an action performed by a registered employee
     * @param actionType Type of action (BATCH_CREATED, QUALITY_CHECK, etc)
     * @param description Human-readable description
     * @param dataHash Hash of the data affected
     * @param hardwareTimestamp Time from IoT device or system clock
     * @param signature Employee's signature verifying this action
     * @return actionId The unique action identifier
     */
    function logAttributableAction(
        string memory actionType,
        string memory description,
        bytes32 dataHash,
        uint256 hardwareTimestamp,
        bytes calldata signature
    ) external nonReentrant returns (bytes32) {
        ActorRegistry storage actor = registeredActors[msg.sender];
        require(actor.isActive, "Actor not registered or inactive");
        require(bytes(actionType).length > 0, "Action type required");
        require(hardwareTimestamp <= block.timestamp, "Future timestamp not allowed");

        // Verify signature - employee confirms this action with private key
        bytes32 messageHash = keccak256(abi.encodePacked(
            actionType,
            description,
            dataHash,
            hardwareTimestamp,
            msg.sender,
            block.timestamp
        ));

        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        require(signer == msg.sender, "Invalid signature - action not confirmed by employee");

        // Create immutable action record
        bytes32 actionId = keccak256(abi.encodePacked(
            msg.sender,
            actionType,
            dataHash,
            block.timestamp
        ));

        ActionLog memory log = ActionLog({
            actionId: actionId,
            actor: msg.sender,
            employeeId: actor.employeeId,
            actionType: actionType,
            description: description,
            dataHash: dataHash,
            hardwareTimestamp: hardwareTimestamp,
            recordedAt: block.timestamp,
            signature: signature,
            isVerified: true
        });

        actionLogs[actionId] = log;
        actionLogIds.push(actionId);
        actorActionHistory[msg.sender].push(actionId);

        emit AttributableActionLogged(
            actionId,
            msg.sender,
            actor.employeeId,
            actionType,
            dataHash,
            hardwareTimestamp,
            block.timestamp
        );

        return actionId;
    }

    /**
     * @dev Get actor information
     */
    function getActor(address walletAddress)
        external
        view
        returns (ActorRegistry memory)
    {
        return registeredActors[walletAddress];
    }

    /**
     * @dev Get action log
     */
    function getActionLog(bytes32 actionId)
        external
        view
        returns (ActionLog memory)
    {
        return actionLogs[actionId];
    }

    /**
     * @dev Get all actions performed by an actor
     */
    function getActorHistory(address actor)
        external
        view
        returns (bytes32[] memory)
    {
        return actorActionHistory[actor];
    }

    /**
     * @dev Get total number of actions logged
     */
    function getActionCount() external view returns (uint256) {
        return actionLogIds.length;
    }

    /**
     * @dev Verify an action was performed by a specific employee
     * @param actionId The action ID to verify
     * @param expectedEmployeeId The expected employee ID
     * @return true if action was performed by the expected employee and is verified
     */
    function verifyActionByEmployee(
        bytes32 actionId,
        string memory expectedEmployeeId
    ) external view returns (bool) {
        ActionLog memory log = actionLogs[actionId];

        return log.isVerified &&
            keccak256(abi.encodePacked(log.employeeId)) ==
            keccak256(abi.encodePacked(expectedEmployeeId));
    }

    /**
     * @dev Verify an action was performed at a specific time range
     * @param actionId The action ID
     * @param minTime Minimum timestamp
     * @param maxTime Maximum timestamp
     * @return true if action was performed within the time range
     */
    function verifyActionTiming(
        bytes32 actionId,
        uint256 minTime,
        uint256 maxTime
    ) external view returns (bool) {
        ActionLog memory log = actionLogs[actionId];

        return log.recordedAt >= minTime && log.recordedAt <= maxTime;
    }

    /**
     * @dev Verify contemporaneity - check if hardware timestamp and record time are close
     * @param actionId The action ID
     * @param maxDelta Maximum allowed difference in seconds
     * @return isContemporaneous true if recorded within maxDelta of measurement
     */
    function verifyContemporaneous(bytes32 actionId, uint256 maxDelta)
        external
        view
        returns (bool isContemporaneous)
    {
        ActionLog memory log = actionLogs[actionId];
        uint256 timeDelta = log.recordedAt - log.hardwareTimestamp;

        return timeDelta <= maxDelta;
    }

    /**
     * @dev Get all actions of a specific type
     */
    function getActionsByType(string memory actionType)
        external
        view
        returns (bytes32[] memory)
    {
        bytes32[] memory results = new bytes32[](actionLogIds.length);
        uint256 count = 0;

        for (uint256 i = 0; i < actionLogIds.length; i++) {
            ActionLog memory log = actionLogs[actionLogIds[i]];
            if (keccak256(abi.encodePacked(log.actionType)) ==
                keccak256(abi.encodePacked(actionType))) {
                results[count] = actionLogIds[i];
                count++;
            }
        }

        // Trim array
        bytes32[] memory trimmedResults = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            trimmedResults[i] = results[i];
        }

        return trimmedResults;
    }
}
