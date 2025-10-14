# Hướng dẫn Deploy Production

## Mục lục
1. [Deploy Smart Contract lên Testnet](#deploy-smart-contract-lên-testnet)
2. [Deploy Backend](#deploy-backend)
3. [Deploy Frontend](#deploy-frontend)
4. [Setup Database Production](#setup-database-production)

## Deploy Smart Contract lên Testnet

### 1. Chuẩn bị

#### Lấy test ETH
- **Sepolia Testnet**: https://sepoliafaucet.com/
- **Goerli Testnet**: https://goerlifaucet.com/

#### Cài đặt Alchemy/Infura
1. Tạo tài khoản tại [Alchemy](https://www.alchemy.com/) hoặc [Infura](https://infura.io/)
2. Tạo project mới
3. Lấy API Key

### 2. Cấu hình Hardhat

Cập nhật `smart-contract/hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

Tạo file `.env` trong `smart-contract/`:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
GOERLI_RPC_URL=https://eth-goerli.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Deploy

```bash
cd smart-contract

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to Goerli
npx hardhat run scripts/deploy.js --network goerli
```

### 4. Verify Contract

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Deploy Backend

### Option 1: Deploy lên Heroku

#### 1. Cài đặt Heroku CLI
```bash
npm install -g heroku
```

#### 2. Login và tạo app
```bash
heroku login
heroku create warehouse-backend
```

#### 3. Cấu hình Database
```bash
# Thêm MySQL addon
heroku addons:create jawsdb:kitefin

# Lấy thông tin database
heroku config:get JAWSDB_URL
```

#### 4. Set environment variables
```bash
heroku config:set PORT=5000
heroku config:set DB_HOST=your_db_host
heroku config:set DB_USER=your_db_user
heroku config:set DB_PASSWORD=your_db_password
heroku config:set DB_NAME=your_db_name
heroku config:set CONTRACT_ADDRESS=your_contract_address
heroku config:set RPC_URL=your_rpc_url
```

#### 5. Deploy
```bash
# Tạo Procfile
echo "web: cd backend && node server.js" > Procfile

# Push to Heroku
git add .
git commit -m "Deploy backend"
git push heroku main
```

### Option 2: Deploy lên Railway

#### 1. Tạo account tại [Railway](https://railway.app/)

#### 2. Tạo project mới
- Click "New Project"
- Chọn "Deploy from GitHub repo"
- Chọn repository của bạn

#### 3. Cấu hình
- Add MySQL database
- Set environment variables
- Deploy

### Option 3: Deploy lên VPS (Ubuntu)

#### 1. Kết nối VPS
```bash
ssh root@your_server_ip
```

#### 2. Cài đặt Node.js và MySQL
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

#### 3. Setup MySQL
```bash
sudo mysql -u root -p

CREATE DATABASE warehouse_sharing;
CREATE USER 'warehouse_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON warehouse_sharing.* TO 'warehouse_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import database
mysql -u warehouse_user -p warehouse_sharing < database/warehouse_sharing.sql
```

#### 4. Clone và setup project
```bash
cd /var/www
git clone your_repository_url
cd Final/backend
npm install

# Tạo .env
nano .env
# Paste environment variables
```

#### 5. Setup PM2
```bash
npm install -g pm2
pm2 start server.js --name warehouse-backend
pm2 startup
pm2 save
```

#### 6. Setup Nginx
```bash
sudo apt install nginx -y

# Tạo config
sudo nano /etc/nginx/sites-available/warehouse-backend

# Paste config:
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/warehouse-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 7. Setup SSL (Optional)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your_domain.com
```

## Deploy Frontend

### Option 1: Vercel

#### 1. Cài đặt Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy
```bash
cd frontend
vercel

# Hoặc link GitHub repo trên Vercel dashboard
```

#### 3. Cấu hình Environment Variables trên Vercel
- REACT_APP_API_URL
- REACT_APP_CONTRACT_ADDRESS
- REACT_APP_NETWORK_ID

### Option 2: Netlify

#### 1. Build project
```bash
cd frontend
npm run build
```

#### 2. Deploy qua Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### 3. Hoặc deploy qua Netlify Dashboard
- Drag & drop thư mục `build`
- Set environment variables
- Deploy

### Option 3: AWS S3 + CloudFront

#### 1. Build project
```bash
cd frontend
npm run build
```

#### 2. Tạo S3 Bucket
- Đặt tên bucket
- Enable static website hosting
- Set bucket policy public

#### 3. Upload files
```bash
aws s3 sync build/ s3://your-bucket-name
```

#### 4. Setup CloudFront
- Tạo distribution mới
- Origin: S3 bucket
- Enable HTTPS

## Setup Database Production

### MySQL Production (Recommended services)

#### 1. Railway
- Tự động backup
- Easy scaling
- Free tier available

#### 2. PlanetScale
- MySQL compatible
- Serverless
- Automatic branching

#### 3. AWS RDS
- Fully managed
- Automatic backups
- Multi-AZ deployment

### Migration Script
```bash
# Export từ local
mysqldump -u root warehouse_sharing > warehouse_backup.sql

# Import vào production
mysql -h production_host -u user -p production_db < warehouse_backup.sql
```

## Environment Variables Checklist

### Backend (.env)
- [ ] PORT
- [ ] DB_HOST
- [ ] DB_USER
- [ ] DB_PASSWORD
- [ ] DB_NAME
- [ ] DB_PORT
- [ ] CONTRACT_ADDRESS
- [ ] RPC_URL

### Frontend (.env)
- [ ] REACT_APP_API_URL
- [ ] REACT_APP_CONTRACT_ADDRESS
- [ ] REACT_APP_NETWORK_ID

### Smart Contract (.env)
- [ ] PRIVATE_KEY
- [ ] SEPOLIA_RPC_URL / GOERLI_RPC_URL
- [ ] ETHERSCAN_API_KEY

## Post-Deployment Checklist

- [ ] Smart contract deployed và verified
- [ ] Backend API hoạt động
- [ ] Frontend kết nối được backend
- [ ] Database import thành công
- [ ] MetaMask kết nối được contract
- [ ] Test tạo warehouse
- [ ] Test tạo lease
- [ ] SSL certificate đã cài (production)
- [ ] CORS đã cấu hình đúng
- [ ] Environment variables đã set
- [ ] Backup database đã setup

## Monitoring & Maintenance

### Backend Monitoring
```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs warehouse-backend

# Restart
pm2 restart warehouse-backend
```

### Database Backup
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mysqldump -u user -p database > backup_$DATE.sql
```

### Update Deployment
```bash
# Backend
git pull
npm install
pm2 restart warehouse-backend

# Frontend
git pull
npm install
npm run build
# Upload build folder
```

## Troubleshooting

### Contract connection issues
- Kiểm tra contract address đúng chưa
- Kiểm tra network ID
- Verify contract trên Etherscan

### API not responding
- Kiểm tra server status
- Check logs
- Verify database connection

### CORS errors
- Cấu hình CORS trong backend
- Thêm domain vào whitelist

---

**Good luck with deployment! 🚀**


