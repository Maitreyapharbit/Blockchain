package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Transaction represents a blockchain transaction
type Transaction struct {
	ID        string    `json:"id"`
	Sender    string    `json:"sender"`
	Receiver  string    `json:"receiver"`
	Quantity  float64   `json:"quantity"`
	Timestamp time.Time `json:"timestamp"`
	Status    string    `json:"status"`
	BlockHash string    `json:"blockHash"`
	TxHash    string    `json:"txHash"`
}

// Account represents a user account with balance
type Account struct {
	Address string  `json:"address"`
	Balance float64 `json:"balance"`
	Created time.Time `json:"created"`
	Updated time.Time `json:"updated"`
}

// TransactionContract provides functions for managing transactions
type TransactionContract struct {
	contractapi.Contract
}

// CreateTransaction creates a new transaction (creates a block)
func (c *TransactionContract) CreateTransaction(ctx contractapi.TransactionContextInterface, 
	sender string, receiver string, quantity float64) error {
	
	// Validate inputs
	if sender == "" || receiver == "" {
		return fmt.Errorf("sender and receiver addresses cannot be empty")
	}
	if quantity <= 0 {
		return fmt.Errorf("quantity must be greater than 0")
	}
	if sender == receiver {
		return fmt.Errorf("sender and receiver cannot be the same")
	}

	// Check if sender has sufficient balance
	senderAccount, err := c.GetAccount(ctx, sender)
	if err != nil {
		// Create account if it doesn't exist
		senderAccount = &Account{
			Address: sender,
			Balance: 0,
			Created: time.Now(),
			Updated: time.Now(),
		}
	}

	if senderAccount.Balance < quantity {
		return fmt.Errorf("insufficient balance. Sender has %.2f, trying to send %.2f", senderAccount.Balance, quantity)
	}

	// Generate transaction ID
	txID := fmt.Sprintf("TX_%d", time.Now().UnixNano())
	
	// Create transaction
	transaction := Transaction{
		ID:        txID,
		Sender:    sender,
		Receiver:  receiver,
		Quantity:  quantity,
		Timestamp: time.Now(),
		Status:    "Pending",
		BlockHash: "",
		TxHash:    fmt.Sprintf("0x%x", time.Now().UnixNano()),
	}

	// Convert to JSON
	transactionJSON, err := json.Marshal(transaction)
	if err != nil {
		return fmt.Errorf("failed to marshal transaction: %v", err)
	}

	// Store transaction in world state (this creates a block)
	err = ctx.GetStub().PutState(txID, transactionJSON)
	if err != nil {
		return fmt.Errorf("failed to put transaction in world state: %v", err)
	}

	// Update sender balance
	senderAccount.Balance -= quantity
	senderAccount.Updated = time.Now()
	senderAccountJSON, err := json.Marshal(senderAccount)
	if err != nil {
		return fmt.Errorf("failed to marshal sender account: %v", err)
	}
	err = ctx.GetStub().PutState(sender, senderAccountJSON)
	if err != nil {
		return fmt.Errorf("failed to update sender account: %v", err)
	}

	// Update or create receiver account
	receiverAccount, err := c.GetAccount(ctx, receiver)
	if err != nil {
		receiverAccount = &Account{
			Address: receiver,
			Balance: 0,
			Created: time.Now(),
			Updated: time.Now(),
		}
	}
	receiverAccount.Balance += quantity
	receiverAccount.Updated = time.Now()
	receiverAccountJSON, err := json.Marshal(receiverAccount)
	if err != nil {
		return fmt.Errorf("failed to marshal receiver account: %v", err)
	}
	err = ctx.GetStub().PutState(receiver, receiverAccountJSON)
	if err != nil {
		return fmt.Errorf("failed to update receiver account: %v", err)
	}

	// Update transaction status to completed
	transaction.Status = "Completed"
	transactionJSON, err = json.Marshal(transaction)
	if err != nil {
		return fmt.Errorf("failed to marshal updated transaction: %v", err)
	}
	err = ctx.GetStub().PutState(txID, transactionJSON)
	if err != nil {
		return fmt.Errorf("failed to update transaction status: %v", err)
	}

	// Emit event
	err = ctx.GetStub().SetEvent("TransactionCreated", transactionJSON)
	if err != nil {
		return fmt.Errorf("failed to emit event: %v", err)
	}

	return nil
}

// GetTransaction retrieves a transaction by ID
func (c *TransactionContract) GetTransaction(ctx contractapi.TransactionContextInterface, txID string) (*Transaction, error) {
	transactionJSON, err := ctx.GetStub().GetState(txID)
	if err != nil {
		return nil, fmt.Errorf("failed to read transaction from world state: %v", err)
	}
	if transactionJSON == nil {
		return nil, fmt.Errorf("transaction with ID %s does not exist", txID)
	}

	var transaction Transaction
	err = json.Unmarshal(transactionJSON, &transaction)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal transaction: %v", err)
	}

	return &transaction, nil
}

// GetAccount retrieves an account by address
func (c *TransactionContract) GetAccount(ctx contractapi.TransactionContextInterface, address string) (*Account, error) {
	accountJSON, err := ctx.GetStub().GetState(address)
	if err != nil {
		return nil, fmt.Errorf("failed to read account from world state: %v", err)
	}
	if accountJSON == nil {
		return nil, fmt.Errorf("account with address %s does not exist", address)
	}

	var account Account
	err = json.Unmarshal(accountJSON, &account)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal account: %v", err)
	}

	return &account, nil
}

// CreateAccount creates a new account with initial balance
func (c *TransactionContract) CreateAccount(ctx contractapi.TransactionContextInterface, 
	address string, initialBalance float64) error {
	
	// Check if account already exists
	exists, err := c.AccountExists(ctx, address)
	if err != nil {
		return fmt.Errorf("failed to check if account exists: %v", err)
	}
	if exists {
		return fmt.Errorf("account with address %s already exists", address)
	}

	// Create new account
	account := Account{
		Address: address,
		Balance: initialBalance,
		Created: time.Now(),
		Updated: time.Now(),
	}

	// Convert to JSON
	accountJSON, err := json.Marshal(account)
	if err != nil {
		return fmt.Errorf("failed to marshal account: %v", err)
	}

	// Store in world state (this creates a block)
	err = ctx.GetStub().PutState(address, accountJSON)
	if err != nil {
		return fmt.Errorf("failed to put account in world state: %v", err)
	}

	// Emit event
	err = ctx.GetStub().SetEvent("AccountCreated", accountJSON)
	if err != nil {
		return fmt.Errorf("failed to emit event: %v", err)
	}

	return nil
}

// GetAllTransactions retrieves all transactions from world state
func (c *TransactionContract) GetAllTransactions(ctx contractapi.TransactionContextInterface) ([]*Transaction, error) {
	startKey := "TX_"
	endKey := "TX_" + string(rune(255))

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return nil, fmt.Errorf("failed to get state by range: %v", err)
	}
	defer resultsIterator.Close()

	var transactions []*Transaction
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate over results: %v", err)
		}

		var transaction Transaction
		err = json.Unmarshal(queryResult.Value, &transaction)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal transaction: %v", err)
		}
		transactions = append(transactions, &transaction)
	}

	return transactions, nil
}

// GetAllAccounts retrieves all accounts from world state
func (c *TransactionContract) GetAllAccounts(ctx contractapi.TransactionContextInterface) ([]*Account, error) {
	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return nil, fmt.Errorf("failed to get state by range: %v", err)
	}
	defer resultsIterator.Close()

	var accounts []*Account
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate over results: %v", err)
		}

		// Skip transaction records
		if len(queryResult.Key) >= 3 && queryResult.Key[:3] == "TX_" {
			continue
		}

		var account Account
		err = json.Unmarshal(queryResult.Value, &account)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal account: %v", err)
		}
		accounts = append(accounts, &account)
	}

	return accounts, nil
}

// AccountExists checks if an account exists in world state
func (c *TransactionContract) AccountExists(ctx contractapi.TransactionContextInterface, address string) (bool, error) {
	accountJSON, err := ctx.GetStub().GetState(address)
	if err != nil {
		return false, fmt.Errorf("failed to read account from world state: %v", err)
	}
	return accountJSON != nil, nil
}

// GetTransactionHistory retrieves the history of a transaction
func (c *TransactionContract) GetTransactionHistory(ctx contractapi.TransactionContextInterface, txID string) ([]*Transaction, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(txID)
	if err != nil {
		return nil, fmt.Errorf("failed to get history for key: %v", err)
	}
	defer resultsIterator.Close()

	var transactions []*Transaction
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to iterate over history: %v", err)
		}

		var transaction Transaction
		err = json.Unmarshal(queryResult.Value, &transaction)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal transaction: %v", err)
		}
		transactions = append(transactions, &transaction)
	}

	return transactions, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&TransactionContract{})
	if err != nil {
		fmt.Printf("Error creating transaction tracking chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting transaction tracking chaincode: %s", err.Error())
	}
}