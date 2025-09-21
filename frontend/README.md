# PharbitChain Web Interface

A comprehensive web interface for pharmaceutical blockchain supply chain management.

## 🚀 Features

### 💊 Batch Creator
- Create new pharmaceutical batches with detailed information
- Real-time form validation
- MetaMask wallet integration
- Automatic block mining on batch creation

### 🔍 Batch Verifier
- Search and verify batches by ID
- Real-time blockchain verification
- Complete batch information display
- Verification status indicators

### ⛏️ Block Miner
- Real-time blockchain statistics
- Single block mining
- Continuous mining mode
- Recent block history
- Network monitoring

## 🛠️ Technology Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Styled Components
- **Blockchain**: Ethers.js
- **Wallet**: MetaMask Integration
- **Notifications**: React Hot Toast
- **State Management**: React Context API

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Open Browser**:
   Navigate to `http://localhost:3001`

## 🔧 Configuration

### MetaMask Setup
To connect to the local blockchain:
- **Network Name**: Hardhat Local
- **RPC URL**: `http://localhost:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`

### Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

## 📱 Usage

### Creating a Batch
1. Connect your MetaMask wallet
2. Fill out the batch creation form
3. Click "Create Batch & Mine Block"
4. Wait for blockchain confirmation

### Verifying a Batch
1. Enter a batch ID in the verification form
2. Click "Verify Batch"
3. View verification results and batch details

### Mining Blocks
1. Monitor blockchain statistics
2. Click "Mine Single Block" for individual mining
3. Use "Start Mining" for continuous mining
4. View recent blocks in the history

## 🎨 UI Components

- **Glassmorphism Design**: Modern translucent cards
- **Responsive Layout**: Works on desktop and mobile
- **Real-time Updates**: Live blockchain data
- **Toast Notifications**: User feedback
- **Loading States**: Visual progress indicators

## 🔗 Integration

- **Backend API**: `http://localhost:3000`
- **Blockchain Node**: `http://localhost:8545`
- **Supabase**: Database integration
- **AWS S3**: File storage
- **EC2**: Cloud infrastructure

## 🐛 Troubleshooting

### Common Issues
1. **MetaMask Not Connected**: Click "Connect Wallet" button
2. **Network Error**: Ensure Hardhat node is running
3. **API Error**: Check backend server status
4. **Styling Issues**: Clear browser cache

### Development
- **Hot Reload**: Changes reflect immediately
- **Error Overlay**: Detailed error information
- **React DevTools**: Enhanced debugging experience

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide
