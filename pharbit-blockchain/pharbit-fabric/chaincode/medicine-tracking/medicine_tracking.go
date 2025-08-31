package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Medicine represents a medicine batch in the supply chain
type Medicine struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	BatchNumber     string    `json:"batchNumber"`
	Manufacturer    string    `json:"manufacturer"`
	ManufactureDate time.Time `json:"manufactureDate"`
	ExpiryDate      time.Time `json:"expiryDate"`
	Temperature     float64   `json:"temperature"`
	Location        string    `json:"location"`
	Status          string    `json:"status"`
	Owner           string    `json:"owner"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// MedicineTrackingContract provides functions for managing medicine tracking
type MedicineTrackingContract struct {
	contractapi.Contract
}

// CreateMedicineBatch creates a new medicine batch (creates a block)
func (c *MedicineTrackingContract) CreateMedicineBatch(ctx contractapi.TransactionContextInterface, 
	id string, name string, batchNumber string, manufacturer string, 
	manufactureDate string, expiryDate string, temperature float64, location string) error {
	
	// Check if medicine already exists
	exists, err := c.MedicineExists(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check if medicine exists: %v", err)
	}
	if exists {
		return fmt.Errorf("medicine with ID %s already exists", id)
	}

	// Parse dates
	manufactureDateParsed, err := time.Parse("2006-01-02", manufactureDate)
	if err != nil {
		return fmt.Errorf("invalid manufacture date format: %v", err)
	}

	expiryDateParsed, err := time.Parse("2006-01-02", expiryDate)
	if err != nil {
		return fmt.Errorf("invalid expiry date format: %v", err)
	}

	// Get client identity
	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client identity: %v", err)
	}

	// Create new medicine
	medicine := Medicine{
		ID:              id,
		Name:            name,
		BatchNumber:     batchNumber,
		Manufacturer:    manufacturer,
		ManufactureDate: manufactureDateParsed,
		ExpiryDate:      expiryDateParsed,
		Temperature:     temperature,
		Location:        location,
		Status:          "Manufactured",
		Owner:           clientID,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	// Convert to JSON
	medicineJSON, err := json.Marshal(medicine)
	if err != nil {
		return fmt.Errorf("failed to marshal medicine: %v", err)
	}

	// Store in world state (this creates a block)
	err = ctx.GetStub().PutState(id, medicineJSON)
	if err != nil {
		return fmt.Errorf("failed to put medicine in world state: %v", err)
	}

	// Emit event
	err = ctx.GetStub().SetEvent("MedicineCreated", medicineJSON)
	if err != nil {
		return fmt.Errorf("failed to emit event: %v", err)
	}

	return nil
}

// GetMedicine retrieves a medicine by ID
func (c *MedicineTrackingContract) GetMedicine(ctx contractapi.TransactionContextInterface, id string) (*Medicine, error) {
	medicineJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read medicine from world state: %v", err)
	}
	if medicineJSON == nil {
		return nil, fmt.Errorf("medicine with ID %s does not exist", id)
	}

	var medicine Medicine
	err = json.Unmarshal(medicineJSON, &medicine)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal medicine: %v", err)
	}

	return &medicine, nil
}

// UpdateMedicineLocation updates the location and temperature of a medicine (creates a block)
func (c *MedicineTrackingContract) UpdateMedicineLocation(ctx contractapi.TransactionContextInterface, 
	id string, newLocation string, newTemperature float64) error {
	
	medicine, err := c.GetMedicine(ctx, id)
	if err != nil {
		return err
	}

	// Update medicine details
	medicine.Location = newLocation
	medicine.Temperature = newTemperature
	medicine.UpdatedAt = time.Now()

	// Convert to JSON
	medicineJSON, err := json.Marshal(medicine)
	if err != nil {
		return fmt.Errorf("failed to marshal medicine: %v", err)
	}

	// Store updated medicine (this creates a block)
	err = ctx.GetStub().PutState(id, medicineJSON)
	if err != nil {
		return fmt.Errorf("failed to update medicine in world state: %v", err)
	}

	// Emit event
	err = ctx.GetStub().SetEvent("MedicineUpdated", medicineJSON)
	if err != nil {
		return fmt.Errorf("failed to emit event: %v", err)
	}

	return nil
}

// TransferMedicine transfers ownership of medicine (creates a block)
func (c *MedicineTrackingContract) TransferMedicine(ctx contractapi.TransactionContextInterface, 
	id string, newOwner string, newStatus string) error {
	
	medicine, err := c.GetMedicine(ctx, id)
	if err != nil {
		return err
	}

	// Update medicine details
	medicine.Owner = newOwner
	medicine.Status = newStatus
	medicine.UpdatedAt = time.Now()

	// Convert to JSON
	medicineJSON, err := json.Marshal(medicine)
	if err != nil {
		return fmt.Errorf("failed to marshal medicine: %v", err)
	}

	// Store updated medicine (this creates a block)
	err = ctx.GetStub().PutState(id, medicineJSON)
	if err != nil {
		return fmt.Errorf("failed to update medicine in world state: %v", err)
	}

	// Emit event
	err = ctx.GetStub().SetEvent("MedicineTransferred", medicineJSON)
	if err != nil {
		return fmt.Errorf("failed to emit event: %v", err)
	}

	return nil
}

// GetAllMedicines retrieves all medicines from world state
func (c *MedicineTrackingContract) GetAllMedicines(ctx contractapi.TransactionContextInterface) ([]*Medicine, error) {
	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return nil, fmt.Errorf("failed to get state by range: %v", err)
	}
	defer resultsIterator.Close()

	var medicines []*Medicine
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate over results: %v", err)
		}

		var medicine Medicine
		err = json.Unmarshal(queryResult.Value, &medicine)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal medicine: %v", err)
		}
		medicines = append(medicines, &medicine)
	}

	return medicines, nil
}

// MedicineExists checks if a medicine exists in world state
func (c *MedicineTrackingContract) MedicineExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	medicineJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read medicine from world state: %v", err)
	}
	return medicineJSON != nil, nil
}

// GetMedicineHistory retrieves the history of a medicine
func (c *MedicineTrackingContract) GetMedicineHistory(ctx contractapi.TransactionContextInterface, id string) ([]*Medicine, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get history for key: %v", err)
	}
	defer resultsIterator.Close()

	var medicines []*Medicine
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate over history: %v", err)
		}

		var medicine Medicine
		err = json.Unmarshal(queryResult.Value, &medicine)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal medicine: %v", err)
		}
		medicines = append(medicines, &medicine)
	}

	return medicines, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&MedicineTrackingContract{})
	if err != nil {
		fmt.Printf("Error creating medicine tracking chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting medicine tracking chaincode: %s", err.Error())
	}
}