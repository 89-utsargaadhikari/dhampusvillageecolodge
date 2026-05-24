# Inventory Management System

## Overview
The Inventory Management System is designed for hotel and kitchen operations at Dhampus Eco Lodge. It provides a simple, color-coded interface for tracking stock levels with automatic alerts.

## Features

### 1. Item Management
- **Add/Edit Items**: Create inventory items with customizable properties
- **Categories**: Organize items by category (Fresh Produce, Dry Goods, Beverages, etc.)
- **Flexible Units**: Support for multiple units (kg, liters, pieces, bottles, etc.)
- **Storage Locations**: Track where items are stored

### 2. Three-Tier Stock Alert System
Each item has three configurable threshold levels:

- **🟢 Green Zone (Good Stock)**: Stock is above the good stock level
- **🟠 Orange Zone (Low Stock)**: Stock is between low and good levels → Warning notification
- **🔴 Red Zone (Critical)**: Stock is at or below critical level → Urgent notification

### 3. In-App Notifications
Automatic notifications are generated for:
- **Critical Stock**: Items at or below critical level
- **Low Stock**: Items needing reorder soon
- **Expiring Soon**: Items approaching expiry date
- **Expired Items**: Items past expiry date

### 4. Expiry Date Tracking (Optional)
- Enable per item as needed
- Set custom alert days before expiry (default: 7 days)
- Visual indicators for items expiring soon
- Automatic notifications for expiring items

### 5. Quick Stock Updates
- Fast +/- buttons for common adjustments
- Custom amount entry
- Transaction type tracking (Purchase, Usage, Wastage, Adjustment)
- Optional notes for audit trail

### 6. Dashboard Overview
- Summary statistics (Total Items, Critical Stock, Low Stock, Expiring Soon)
- Color-coded item list
- Filter by category
- Stock level progress bars
- Total inventory value calculation

## Database Schema

```prisma
model InventoryItem {
  id                  Int       @id @default(autoincrement())
  name                String    @unique
  category            String
  unit                String
  
  // Stock Levels
  currentStock        Float     @default(0)
  goodStockLevel      Float     @default(50)
  lowStockLevel       Float     @default(20)
  criticalStockLevel  Float     @default(5)
  
  unitPrice           Float     @default(0)
  storageLocation     String?
  
  // Expiry Tracking
  trackExpiry         Boolean   @default(false)
  expiryDate          DateTime?
  expiryAlertDays     Int?      @default(7)
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  transactions        InventoryTransaction[]
}

model InventoryTransaction {
  id              Int       @id @default(autoincrement())
  inventoryItemId Int
  type            String    // "purchase" | "usage" | "waste" | "adjustment"
  quantity        Float
  unitPrice       Float?
  totalCost       Float?
  notes           String?
  performedBy     String?
  createdAt       DateTime  @default(now())
  
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### Inventory Items
- `GET /api/inventory` - Fetch all items
- `POST /api/inventory` - Create new item
- `GET /api/inventory/[id]` - Fetch single item with transactions
- `PUT /api/inventory/[id]` - Update item details
- `DELETE /api/inventory/[id]` - Delete item
- `POST /api/inventory/[id]/update-stock` - Update stock level with transaction tracking

### Alerts
- `GET /api/inventory/check-alerts` - Check for low stock and expiring items

## Usage

### Adding a New Item
1. Click "Add Item" button
2. Fill in required fields:
   - Item name
   - Category
   - Unit of measurement
3. Set stock thresholds:
   - Good Stock Level (Green zone minimum)
   - Low Stock Level (Orange zone starts here)
   - Critical Stock Level (Red zone)
4. Optionally enable expiry tracking
5. Save

### Updating Stock
1. Find the item in the list
2. Click "Update Stock" button
3. Use quick +/- buttons or enter custom amount
4. Select reason (Purchase, Usage, Wastage, Adjustment)
5. Add optional notes
6. Save

### Viewing Notifications
- Check the bell icon in the header
- Red badge shows unread count
- Click to view all notifications
- Click notification to dismiss or take action

## Categories

Predefined categories:
- Fresh Produce
- Dry Goods
- Beverages
- Dairy
- Meat/Protein
- Condiments & Spices
- Cleaning Supplies
- Paper Products
- Other

## Units of Measurement

Available units:
- kg (kilograms)
- grams
- liters
- ml (milliliters)
- pieces
- bottles
- boxes
- packets
- cans
- bags
- dozen

## Notification System

The system automatically checks for alerts and generates notifications:

### Check Frequency
- Dashboard loads: Immediate check
- Auto-refresh: Every 30 seconds
- Manual trigger: Via notification checker

### Alert Priorities
- **High (Red)**: Critical stock or expired items
- **Medium (Orange)**: Low stock or items expiring soon
- **Low (Blue)**: General information

### Notification Behavior
- Notifications appear once per alert condition
- New notifications show at the top
- Can be marked as read or deleted
- Auto-cleanup keeps last 50 notifications

## Best Practices

### Stock Levels
- Set good stock level 2-3x higher than low stock level
- Set low stock level 3-5x higher than critical level
- Example: Good=50, Low=20, Critical=5

### Expiry Tracking
- Enable for all perishable items
- Set alert days based on item shelf life:
  - Fresh produce: 1-2 days
  - Dairy: 3-5 days
  - Dry goods: 7-14 days

### Regular Maintenance
- Update stock immediately after receiving deliveries
- Record wastage promptly for accurate tracking
- Review low stock alerts weekly
- Check expiry dates daily

### Categories
- Use consistent naming
- Group similar items together
- Consider storage location when categorizing

## Future Enhancements (Optional)

### Phase 2 Features
- Purchase order system
- Supplier management
- Recipe/Bill of Materials (link menu items to ingredients)
- Auto-deduct stock on restaurant orders
- Variance tracking (physical count vs. system)

### Phase 3 Features
- Cost calculation methods (FIFO/Weighted Average)
- Usage reports and analytics
- Predictive reordering
- Mobile app for stock updates
- Barcode/QR scanning

## Access Control

Currently, all admin users have full access to:
- View inventory
- Add/edit items
- Update stock levels
- View transaction history
- Delete items

Future: Role-based permissions (Manager, Kitchen Staff, Front Desk)

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Contact the development team

## Change Log

### v1.0.0 (Current)
- Initial release
- Basic inventory management
- Three-tier alert system
- In-app notifications
- Optional expiry tracking
- Quick stock updates
- Category organization
- Transaction history
