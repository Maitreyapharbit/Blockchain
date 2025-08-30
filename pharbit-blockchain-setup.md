# Pharbit Blockchain Setup

This guide details the setup of a Hyperledger Fabric network for Pharbit pharmaceutical supply chain tracking, including organizations, channels, chaincode, IoT integration, and configuration files.

---

## Network Overview

- **Organizations**: PharmaCorp, MediDistributor, CityPharmacy, HealthRegulator
- **Channels**: pharma-supply-chain, cold-chain-monitoring, regulatory-compliance
- **Chaincode Functions**: 
    - `createMedicineBatch`
    - `trackTemperature`
    - `transferCustody`
    - `verifyAuthenticity`
    - `recordSensorData`
- **IoT Integration**: Temperature, humidity, GPS tracking, real-time alerts
- **Smart Contracts**: Anti-counterfeiting, cold chain compliance, regulatory reporting

---

## 1. `crypto-config.yaml`

```yaml
OrdererOrgs:
    - Name: OrdererOrg
        Domain: orderer.pharbit.com
        Specs:
            - Hostname: orderer

PeerOrgs:
    - Name: PharmaCorp
        Domain: pharmacorp.pharbit.com
        EnableNodeOUs: true
        Template:
            Count: 2
        Users:
            Count: 1

    - Name: MediDistributor
        Domain: medidistributor.pharbit.com
        EnableNodeOUs: true
        Template:
            Count: 2
        Users:
            Count: 1

    - Name: CityPharmacy
        Domain: citypharmacy.pharbit.com
        EnableNodeOUs: true
        Template:
            Count: 2
        Users:
            Count: 1

    - Name: HealthRegulator
        Domain: healthregulator.pharbit.com
        EnableNodeOUs: true
        Template:
            Count: 2
        Users:
            Count: 1
```

---

## 2. `configtx.yaml`

```yaml
Organizations:
    - &PharmaCorp
        Name: PharmaCorpMSP
        ID: PharmaCorpMSP
        MSPDir: crypto-config/peerOrganizations/pharmacorp.pharbit.com/msp

    - &MediDistributor
        Name: MediDistributorMSP
        ID: MediDistributorMSP
        MSPDir: crypto-config/peerOrganizations/medidistributor.pharbit.com/msp

    - &CityPharmacy
        Name: CityPharmacyMSP
        ID: CityPharmacyMSP
        MSPDir: crypto-config/peerOrganizations/citypharmacy.pharbit.com/msp

    - &HealthRegulator
        Name: HealthRegulatorMSP
        ID: HealthRegulatorMSP
        MSPDir: crypto-config/peerOrganizations/healthregulator.pharbit.com/msp

Orderer:
    OrdererType: etcdraft
    Addresses:
        - orderer.orderer.pharbit.com:7050
    Organizations:
        - *OrdererOrg

Channel: &ChannelDefaults
    Consortium: PharbitConsortium

Profiles:
    PharmaSupplyChainChannel:
        Consortium: PharbitConsortium
        Application:
            Organizations:
                - *PharmaCorp
                - *MediDistributor
                - *CityPharmacy
                - *HealthRegulator
            Policies:
                Readers:
                    Type: Signature
                    Rule: "OR('PharmaCorpMSP.member', 'MediDistributorMSP.member', 'CityPharmacyMSP.member', 'HealthRegulatorMSP.member')"
                Writers:
                    Type: Signature
                    Rule: "OR('PharmaCorpMSP.member', 'MediDistributorMSP.member')"
                Admins:
                    Type: Signature
                    Rule: "OR('PharmaCorpMSP.admin', 'MediDistributorMSP.admin', 'CityPharmacyMSP.admin', 'HealthRegulatorMSP.admin')"

    ColdChainMonitoringChannel:
        Consortium: PharbitConsortium
        Application:
            Organizations:
                - *PharmaCorp
                - *MediDistributor
                - *CityPharmacy
            Policies:
                Readers:
                    Type: Signature
                    Rule: "OR('PharmaCorpMSP.member', 'MediDistributorMSP.member', 'CityPharmacyMSP.member')"
                Writers:
                    Type: Signature
                    Rule: "OR('PharmaCorpMSP.member', 'MediDistributorMSP.member')"
                Admins:
                    Type: Signature
                    Rule: "OR('PharmaCorpMSP.admin', 'MediDistributorMSP.admin', 'CityPharmacyMSP.admin')"

    RegulatoryComplianceChannel:
        Consortium: PharbitConsortium
        Application:
            Organizations:
                - *HealthRegulator
                - *PharmaCorp
            Policies:
                Readers:
                    Type: Signature
                    Rule: "OR('HealthRegulatorMSP.member', 'PharmaCorpMSP.member')"
                Writers:
                    Type: Signature
                    Rule: "OR('HealthRegulatorMSP.member')"
                Admins:
                    Type: Signature
                    Rule: "OR('HealthRegulatorMSP.admin', 'PharmaCorpMSP.admin')"
```

---

## 3. `docker-compose.yaml`

```yaml
version: '3.7'

services:
    orderer.pharbit.com:
        image: hyperledger/fabric-orderer:latest
        environment:
            - ORDERER_GENERAL_LOGLEVEL=info
            - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
            - ORDERER_GENERAL_GENESISPROFILE=PharmaSupplyChainChannel
        ports:
            - 7050:7050
        volumes:
            - ./crypto-config/ordererOrganizations/orderer.pharbit.com/orderers/orderer.pharbit.com:/var/hyperledger/orderer
            - ./configtx.yaml:/etc/hyperledger/fabric/configtx.yaml

    # PharmaCorp Peers
    peer0.pharmacorp.pharbit.com:
        image: hyperledger/fabric-peer:latest
        environment:
            - CORE_PEER_ID=peer0.pharmacorp.pharbit.com
            - CORE_PEER_ADDRESS=peer0.pharmacorp.pharbit.com:7051
            - CORE_PEER_LOCALMSPID=PharmaCorpMSP
        ports:
            - 7051:7051
        volumes:
            - ./crypto-config/peerOrganizations/pharmacorp.pharbit.com/peers/peer0.pharmacorp.pharbit.com:/var/hyperledger/peer

    peer1.pharmacorp.pharbit.com:
        image: hyperledger/fabric-peer:latest
        environment:
            - CORE_PEER_ID=peer1.pharmacorp.pharbit.com
            - CORE_PEER_ADDRESS=peer1.pharmacorp.pharbit.com:8051
            - CORE_PEER_LOCALMSPID=PharmaCorpMSP
        ports:
            - 8051:8051
        volumes:
            - ./crypto-config/peerOrganizations/pharmacorp.pharbit.com/peers/peer1.pharmacorp.pharbit.com:/var/hyperledger/peer

    # MediDistributor Peers
    peer0.medidistributor.pharbit.com:
        image: hyperledger/fabric-peer:latest
        environment:
            - CORE_PEER_ID=peer0.medidistributor.pharbit.com
            - CORE_PEER_ADDRESS=peer0.medidistributor.pharbit.com:9051
            - CORE_PEER_LOCALMSPID=MediDistributorMSP
        ports:
            - 9051:9051
        volumes:
            - ./crypto-config/peerOrganizations/medidistributor.pharbit.com/peers/peer0.medidistributor.pharbit.com:/var/hyperledger/peer

    peer1.medidistributor.pharbit.com:
        image: hyperledger/fabric-peer:latest
        environment:
            - CORE_PEER_ID=peer1.medidistributor.pharbit.com
            - CORE_PEER_ADDRESS=peer1.medidistributor.pharbit.com:10051
            - CORE_PEER_LOCALMSPID=MediDistributorMSP
        ports:
            - 10051:10051
        volumes:
            - ./crypto-config/peerOrganizations/medidistributor.pharbit.com/peers/peer1.medidistributor.pharbit.com:/var/hyperledger/peer

    # CityPharmacy Peers
    peer0.citypharmacy.pharbit.com:
        image: hyperledger/fabric-peer:latest
        environment:
            - CORE_PEER_ID=peer0.citypharmacy.pharbit.com
            - CORE_PEER_ADDRESS=peer0.citypharmacy.pharbit.com:11051
            - CORE_PEER_LOCALMSPID=CityPharmacyMSP
        ports:
            - 11051:11051
        volumes:
            - ./crypto-config/peerOrganizations/citypharmacy.pharbit.com/peers/peer0.citypharmacy.pharbit.com:/var/hyperledger/peer

    peer1.citypharmacy.pharbit.com:
        image: hyperledger/fabric-peer:latest
        environment:
            - CORE_PEER_ID=peer1.citypharmacy.pharbit.com
            - CORE_PEER_ADDRESS=peer1.citypharmacy.pharbit.com:12051
            - CORE_PEER_LOCALMSPID=CityPharmacyMSP
        ports:
            - 12051:12051
        volumes:
            - ./crypto-config/peerOrganizations/citypharmacy.pharbit.com/peers/peer1.citypharmacy.pharbit.com:/var/hyperledger/peer

    # HealthRegulator Peers
    peer0.healthregulator.pharbit.com:
        image: hyperledger/fabric-peer:latest
        environment:
            - CORE_PEER_ID=peer0.healthregulator.pharbit.com
            - CORE_PEER_ADDRESS=peer0.healthregulator.pharbit.com:13051
            - CORE_PEER_LOCALMSPID=HealthRegulatorMSP
        ports:
            - 13051:13051
        volumes:
            - ./crypto-config/peerOrganizations/healthregulator.pharbit.com/peers/peer0.healthregulator.pharbit.com:/var/hyperledger/peer

    peer1.healthregulator.pharbit.com:
        image: hyperledger/fabric-peer:latest
        environment:
            - CORE_PEER_ID=peer1.healthregulator.pharbit.com
            - CORE_PEER_ADDRESS=peer1.healthregulator.pharbit.com:14051
            - CORE_PEER_LOCALMSPID=HealthRegulatorMSP
        ports:
            - 14051:14051
        volumes:
            - ./crypto-config/peerOrganizations/healthregulator.pharbit.com/peers/peer1.healthregulator.pharbit.com:/var/hyperledger/peer

    # Certificate Authorities
    ca.pharmacorp.pharbit.com:
        image: hyperledger/fabric-ca:latest
        environment:
            - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
            - FABRIC_CA_SERVER_CA_NAME=ca-pharmacorp
        ports:
            - 7054:7054
        volumes:
            - ./crypto-config/peerOrganizations/pharmacorp.pharbit.com/ca:/etc/hyperledger/fabric-ca-server

    ca.medidistributor.pharbit.com:
        image: hyperledger/fabric-ca:latest
        environment:
            - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
            - FABRIC_CA_SERVER_CA_NAME=ca-medidistributor
        ports:
            - 8054:8054
        volumes:
            - ./crypto-config/peerOrganizations/medidistributor.pharbit.com/ca:/etc/hyperledger/fabric-ca-server

    ca.citypharmacy.pharbit.com:
        image: hyperledger/fabric-ca:latest
        environment:
            - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
            - FABRIC_CA_SERVER_CA_NAME=ca-citypharmacy
        ports:
            - 9054:9054
        volumes:
            - ./crypto-config/peerOrganizations/citypharmacy.pharbit.com/ca:/etc/hyperledger/fabric-ca-server

    ca.healthregulator.pharbit.com:
        image: hyperledger/fabric-ca:latest
        environment:
            - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
            - FABRIC_CA_SERVER_CA_NAME=ca-healthregulator
        ports:
            - 10054:10054
        volumes:
            - ./crypto-config/peerOrganizations/healthregulator.pharbit.com/ca:/etc/hyperledger/fabric-ca-server
```

---

## 4. Chaincode (`pharbit_chaincode.go`)

```go
package main

import (
        "encoding/json"
        "fmt"
        "time"
        "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type MedicineBatch struct {
        BatchID         string    `json:"batchID"`
        Manufacturer    string    `json:"manufacturer"`
        ProductName     string    `json:"productName"`
        ExpiryDate      string    `json:"expiryDate"`
        Custody         string    `json:"custody"`
        Authentic       bool      `json:"authentic"`
        TemperatureLogs []TempLog `json:"temperatureLogs"`
        SensorData      []SensorData `json:"sensorData"`
}

type TempLog struct {
        Timestamp   string  `json:"timestamp"`
        Temperature float64 `json:"temperature"`
}

type SensorData struct {
        Timestamp string  `json:"timestamp"`
        Humidity  float64 `json:"humidity"`
        GPS       string  `json:"gps"`
}

type PharbitChaincode struct {
        contractapi.Contract
}

// createMedicineBatch
func (c *PharbitChaincode) CreateMedicineBatch(ctx contractapi.TransactionContextInterface, batchID, manufacturer, productName, expiryDate string) error {
        batch := MedicineBatch{
                BatchID:      batchID,
                Manufacturer: manufacturer,
                ProductName:  productName,
                ExpiryDate:   expiryDate,
                Custody:      manufacturer,
                Authentic:    true,
        }
        batchBytes, _ := json.Marshal(batch)
        return ctx.GetStub().PutState(batchID, batchBytes)
}

// trackTemperature
func (c *PharbitChaincode) TrackTemperature(ctx contractapi.TransactionContextInterface, batchID string, temperature float64) error {
        batchBytes, err := ctx.GetStub().GetState(batchID)
        if err != nil || batchBytes == nil {
                return fmt.Errorf("batch not found")
        }
        var batch MedicineBatch
        json.Unmarshal(batchBytes, &batch)
        batch.TemperatureLogs = append(batch.TemperatureLogs, TempLog{
                Timestamp:   time.Now().Format(time.RFC3339),
                Temperature: temperature,
        })
        batchBytes, _ = json.Marshal(batch)
        return ctx.GetStub().PutState(batchID, batchBytes)
}

// transferCustody
func (c *PharbitChaincode) TransferCustody(ctx contractapi.TransactionContextInterface, batchID, newCustody string) error {
        batchBytes, err := ctx.GetStub().GetState(batchID)
        if err != nil || batchBytes == nil {
                return fmt.Errorf("batch not found")
        }
        var batch MedicineBatch
        json.Unmarshal(batchBytes, &batch)
        batch.Custody = newCustody
        batchBytes, _ = json.Marshal(batch)
        return ctx.GetStub().PutState(batchID, batchBytes)
}

// verifyAuthenticity
func (c *PharbitChaincode) VerifyAuthenticity(ctx contractapi.TransactionContextInterface, batchID string) (bool, error) {
        batchBytes, err := ctx.GetStub().GetState(batchID)
        if err != nil || batchBytes == nil {
                return false, fmt.Errorf("batch not found")
        }
        var batch MedicineBatch
        json.Unmarshal(batchBytes, &batch)
        return batch.Authentic, nil
}

// recordSensorData
func (c *PharbitChaincode) RecordSensorData(ctx contractapi.TransactionContextInterface, batchID string, humidity float64, gps string) error {
        batchBytes, err := ctx.GetStub().GetState(batchID)
        if err != nil || batchBytes == nil {
                return fmt.Errorf("batch not found")
        }
        var batch MedicineBatch
        json.Unmarshal(batchBytes, &batch)
        batch.SensorData = append(batch.SensorData, SensorData{
                Timestamp: time.Now().Format(time.RFC3339),
                Humidity:  humidity,
                GPS:       gps,
        })
        batchBytes, _ = json.Marshal(batch)
        return ctx.GetStub().PutState(batchID, batchBytes)
}

func main() {
        chaincode, _ := contractapi.NewChaincode(new(PharbitChaincode))
        if err := chaincode.Start(); err != nil {
                fmt.Printf("Error starting PharbitChaincode: %s", err)
        }
}
```

---

## 5. IoT Integration & Alerts

- Use MQTT or REST API to send sensor data to peers.
- Implement chaincode event listeners for real-time alerts (e.g., temperature out of range).
- Integrate external IoT gateways to invoke `TrackTemperature` and `RecordSensorData`.

---

## 6. Smart Contract Policies

- **Anti-counterfeiting**: Only manufacturer can set `Authentic=true`.
- **Cold chain compliance**: Alert if temperature/humidity out of range.
- **Regulatory reporting**: HealthRegulator can query all batches and sensor logs.

---

## 7. Next Steps

1. Generate crypto material:  
     ```sh
     cryptogen generate --config=crypto-config.yaml
     ```
2. Generate genesis block and channel artifacts:  
     ```sh
     configtxgen -profile PharmaSupplyChainChannel -outputBlock ./channel-artifacts/pharma-supply-chain.block
     ```
3. Start the network:  
     ```sh
     docker-compose up -d
     ```
4. Deploy chaincode to peers.

---

> For more details, see [Hyperledger Fabric Docs](https://hyperledger-fabric.readthedocs.io/en/latest/).
