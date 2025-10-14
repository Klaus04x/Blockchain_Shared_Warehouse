// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract WarehouseLeasing is Ownable, ReentrancyGuard {
    
    struct Warehouse {
        uint256 id;
        address owner;
        string name;
        string location;
        uint256 totalArea; // m²
        uint256 availableArea; // m²
        uint256 pricePerSqmPerDay; // Wei per m² per day
        bool isActive;
        string imageUrl;
        string description;
    }
    
    struct Lease {
        uint256 id;
        uint256 warehouseId;
        address tenant;
        uint256 area; // m² đã thuê
        uint256 startDate;
        uint256 endDate;
        uint256 totalPrice;
        bool isActive;
        bool isCompleted;
    }
    
    uint256 public warehouseCounter;
    uint256 public leaseCounter;
    uint256 public platformFeePercent = 2; // 2% phí nền tảng
    
    mapping(uint256 => Warehouse) public warehouses;
    mapping(uint256 => Lease) public leases;
    mapping(address => uint256[]) public ownerWarehouses;
    mapping(address => uint256[]) public tenantLeases;
    
    event WarehouseRegistered(uint256 indexed warehouseId, address indexed owner, string name);
    event WarehouseUpdated(uint256 indexed warehouseId);
    event LeaseCreated(uint256 indexed leaseId, uint256 indexed warehouseId, address indexed tenant);
    event LeaseCompleted(uint256 indexed leaseId);
    event LeaseCancelled(uint256 indexed leaseId);
    event PaymentReceived(uint256 indexed leaseId, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    // Đăng ký kho bãi mới
    function registerWarehouse(
        string memory _name,
        string memory _location,
        uint256 _totalArea,
        uint256 _pricePerSqmPerDay,
        string memory _imageUrl,
        string memory _description
    ) external returns (uint256) {
        require(_totalArea > 0, "Area must be greater than 0");
        require(_pricePerSqmPerDay > 0, "Price must be greater than 0");
        
        warehouseCounter++;
        
        warehouses[warehouseCounter] = Warehouse({
            id: warehouseCounter,
            owner: msg.sender,
            name: _name,
            location: _location,
            totalArea: _totalArea,
            availableArea: _totalArea,
            pricePerSqmPerDay: _pricePerSqmPerDay,
            isActive: true,
            imageUrl: _imageUrl,
            description: _description
        });
        
        ownerWarehouses[msg.sender].push(warehouseCounter);
        
        emit WarehouseRegistered(warehouseCounter, msg.sender, _name);
        return warehouseCounter;
    }
    
    // Cập nhật thông tin kho bãi
    function updateWarehouse(
        uint256 _warehouseId,
        string memory _name,
        string memory _location,
        uint256 _pricePerSqmPerDay,
        string memory _imageUrl,
        string memory _description,
        bool _isActive
    ) external {
        Warehouse storage warehouse = warehouses[_warehouseId];
        require(warehouse.owner == msg.sender, "Not warehouse owner");
        
        warehouse.name = _name;
        warehouse.location = _location;
        warehouse.pricePerSqmPerDay = _pricePerSqmPerDay;
        warehouse.imageUrl = _imageUrl;
        warehouse.description = _description;
        warehouse.isActive = _isActive;
        
        emit WarehouseUpdated(_warehouseId);
    }
    
    // Tạo hợp đồng thuê
    function createLease(
        uint256 _warehouseId,
        uint256 _area,
        uint256 _durationInDays
    ) external payable nonReentrant returns (uint256) {
        Warehouse storage warehouse = warehouses[_warehouseId];
        require(warehouse.isActive, "Warehouse is not active");
        require(_area > 0 && _area <= warehouse.availableArea, "Invalid area");
        require(_durationInDays > 0, "Duration must be greater than 0");
        
        uint256 totalPrice = _area * warehouse.pricePerSqmPerDay * _durationInDays;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        leaseCounter++;
        
        uint256 startDate = block.timestamp;
        uint256 endDate = startDate + (_durationInDays * 1 days);
        
        leases[leaseCounter] = Lease({
            id: leaseCounter,
            warehouseId: _warehouseId,
            tenant: msg.sender,
            area: _area,
            startDate: startDate,
            endDate: endDate,
            totalPrice: totalPrice,
            isActive: true,
            isCompleted: false
        });
        
        warehouse.availableArea -= _area;
        tenantLeases[msg.sender].push(leaseCounter);
        
        // Chuyển tiền cho chủ kho (trừ phí)
        uint256 platformFee = (totalPrice * platformFeePercent) / 100;
        uint256 ownerPayment = totalPrice - platformFee;
        
        payable(warehouse.owner).transfer(ownerPayment);
        
        // Hoàn lại tiền thừa nếu có
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit LeaseCreated(leaseCounter, _warehouseId, msg.sender);
        emit PaymentReceived(leaseCounter, totalPrice);
        
        return leaseCounter;
    }
    
    // Hoàn thành hợp đồng thuê
    function completeLease(uint256 _leaseId) external {
        Lease storage lease = leases[_leaseId];
        Warehouse storage warehouse = warehouses[lease.warehouseId];
        
        require(
            msg.sender == lease.tenant || msg.sender == warehouse.owner,
            "Not authorized"
        );
        require(lease.isActive, "Lease is not active");
        require(block.timestamp >= lease.endDate, "Lease period not ended");
        
        lease.isActive = false;
        lease.isCompleted = true;
        warehouse.availableArea += lease.area;
        
        emit LeaseCompleted(_leaseId);
    }
    
    // Hủy hợp đồng thuê (chỉ trước khi bắt đầu)
    function cancelLease(uint256 _leaseId) external nonReentrant {
        Lease storage lease = leases[_leaseId];
        Warehouse storage warehouse = warehouses[lease.warehouseId];
        
        require(msg.sender == lease.tenant, "Not tenant");
        require(lease.isActive, "Lease is not active");
        require(block.timestamp < lease.startDate, "Lease already started");
        
        lease.isActive = false;
        warehouse.availableArea += lease.area;
        
        // Hoàn lại 90% tiền (10% phí hủy)
        uint256 refundAmount = (lease.totalPrice * 90) / 100;
        payable(lease.tenant).transfer(refundAmount);
        
        emit LeaseCancelled(_leaseId);
    }
    
    // Lấy danh sách kho của chủ sở hữu
    function getOwnerWarehouses(address _owner) external view returns (uint256[] memory) {
        return ownerWarehouses[_owner];
    }
    
    // Lấy danh sách hợp đồng thuê của người thuê
    function getTenantLeases(address _tenant) external view returns (uint256[] memory) {
        return tenantLeases[_tenant];
    }
    
    // Lấy thông tin kho bãi
    function getWarehouse(uint256 _warehouseId) external view returns (Warehouse memory) {
        return warehouses[_warehouseId];
    }
    
    // Lấy thông tin hợp đồng thuê
    function getLease(uint256 _leaseId) external view returns (Lease memory) {
        return leases[_leaseId];
    }
    
    // Lấy tất cả kho bãi hoạt động
    function getAllActiveWarehouses() external view returns (Warehouse[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= warehouseCounter; i++) {
            if (warehouses[i].isActive) {
                activeCount++;
            }
        }
        
        Warehouse[] memory activeWarehouses = new Warehouse[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= warehouseCounter; i++) {
            if (warehouses[i].isActive) {
                activeWarehouses[index] = warehouses[i];
                index++;
            }
        }
        
        return activeWarehouses;
    }
    
    // Rút tiền phí (chỉ owner)
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Cập nhật phí nền tảng
    function setPlatformFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 10, "Fee too high");
        platformFeePercent = _feePercent;
    }
}

