# Inventory Management - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Access Inventory
```
Admin Dashboard → Sidebar → Click "Inventory" (📦 icon)
```

### Step 2: Add Items
Click **"Add Item"** and fill in:

**Example: Rice**
```
Name: Rice
Category: Dry Goods
Unit: kg
Current Stock: 45
Good Stock Level: 50 (Green if above this)
Low Stock Level: 20 (Orange if below this)
Critical Stock Level: 5 (Red if below this)
Unit Price: 150 (NPR per kg)
Storage Location: Main Pantry
Track Expiry: OFF (for dry goods)
```

**Example: Fresh Milk**
```
Name: Fresh Milk
Category: Dairy
Unit: liters
Current Stock: 8
Good Stock Level: 15
Low Stock Level: 6
Critical Stock Level: 2
Unit Price: 120 (NPR per liter)
Storage Location: Cold Storage
Track Expiry: ON ✅
Expiry Date: (select date)
Alert Days Before: 2
```

### Step 3: Update Stock Daily
When you receive or use items:

1. Find item in list
2. Click **"Update Stock"**
3. Choose action:
   - **Quick buttons**: +10, +5, +1 or -1, -5, -10
   - **Custom amount**: Type any number (+ to add, - to reduce)
4. Select reason:
   - 📦 Purchase (Stock In)
   - 🍳 Usage (Stock Out)
   - 🗑️ Waste/Spoilage
   - ⚙️ Adjustment
5. Click **"Update"**

## 📊 Dashboard View

### Statistics Cards
```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ 📦 Total Items │ │ 🔴 Critical    │ │ 🟠 Low Stock   │ │ ⏰ Expiring    │
│     48         │ │      2         │ │      5         │ │      3         │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

### Item List (Color-Coded)
```
Filter by Category: [All Categories ▼]                    [+ Add Item]

┌─────────────────────────────────────────────────────────────────────┐
│ 🟢 Rice                        45.5 kg                  [Update]    │
│    Dry Goods | Main Pantry                                          │
│    Good: ≥50  Low: ≤20  Critical: ≤5                                │
│    ████████████░░ 91% stocked                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 🟠 Cooking Oil                  8.2 L                   [Update]    │
│    Beverages | Kitchen                                              │
│    Good: ≥20  Low: ≤10  Critical: ≤3                                │
│    ████░░░░░░░ 41% stocked ⚠️ Low Stock - Reorder Soon!           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 🔴 Salt                         0.5 kg                  [Update]    │
│    Condiments & Spices | Pantry                                     │
│    Good: ≥10  Low: ≤5  Critical: ≤2                                 │
│    █░░░░░░░░░░ 5% stocked 🚨 Critical - Order Now!                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 🟢 Fresh Milk                   8.0 L                   [Update]    │
│    Dairy | Cold Storage                                             │
│    Good: ≥15  Low: ≤6  Critical: ≤2                                 │
│    █████░░░░░░ 53% stocked                                          │
│    ⏰ Expires in 2 days                                             │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔔 Notifications

Click the bell icon (🔔) in the header to see alerts:

### Examples:
```
🔴 Critical Inventory Alert                                    [New]
2 item(s) critically low or expired: Salt, Sugar
Just now

🟠 Low Stock Alert                                            [New]
5 item(s) running low: Cooking Oil, Flour, Tea...
5 minutes ago

⏰ Items Expiring Soon
2 item(s) expiring soon: Fresh Milk (2 days), Butter (3 days)
1 hour ago
```

## 📝 Quick Reference

### Stock Status Colors
| Color | Status | Action |
|-------|--------|--------|
| 🟢 Green | Good Stock | No action needed |
| 🟠 Orange | Low Stock | Reorder soon |
| 🔴 Red | Critical | Order immediately! |

### Transaction Types
| Type | When to Use | Example |
|------|-------------|---------|
| 📦 Purchase | Receiving new stock | "+50 kg rice delivered" |
| 🍳 Usage | Used in kitchen/restaurant | "-5 kg rice used today" |
| 🗑️ Waste | Spoiled/damaged items | "-2 kg rice damaged by water" |
| ⚙️ Adjustment | Fixing errors, physical count | "+3 kg (found extra in storage)" |

### Recommended Stock Levels

**Dry Goods (Rice, Flour, Sugar):**
- Good: 30-60 days supply
- Low: 7-14 days supply
- Critical: 2-3 days supply

**Fresh Produce:**
- Good: 5-7 days supply
- Low: 2-3 days supply
- Critical: 1 day supply

**Dairy Products:**
- Good: 3-5 days supply
- Low: 1-2 days supply
- Critical: Same day need

**Cleaning Supplies:**
- Good: 60-90 days supply
- Low: 30 days supply
- Critical: 7 days supply

## ⚙️ Settings & Configuration

### Category Organization
Organize similar items together:
- **Fresh Produce**: Vegetables, fruits
- **Dry Goods**: Rice, flour, lentils, pasta
- **Beverages**: Tea, coffee, juice, soft drinks
- **Dairy**: Milk, butter, cheese, yogurt
- **Meat/Protein**: Chicken, fish, eggs
- **Condiments & Spices**: Salt, pepper, sauces
- **Cleaning Supplies**: Detergent, soap, disinfectant
- **Paper Products**: Tissues, napkins, toilet paper

### Expiry Tracking Best Practices
Enable for:
- ✅ All dairy products
- ✅ Fresh produce
- ✅ Meat and protein
- ✅ Some beverages (juice, milk)
- ❌ Dry goods (unless have expiry dates)
- ❌ Cleaning supplies
- ❌ Paper products

Set alert days based on shelf life:
- **1-2 days**: Fresh vegetables, fresh meat
- **2-3 days**: Dairy products
- **5-7 days**: Packaged foods
- **14+ days**: Long shelf-life items

## 🎯 Daily Routine

### Morning Checklist (5 minutes)
1. ☑️ Check notifications for critical/low stock
2. ☑️ Review items expiring today or tomorrow
3. ☑️ Update stock for items used/received yesterday

### Weekly Review (15 minutes)
1. ☑️ Physical count of high-value items
2. ☑️ Review all orange/red alerts
3. ☑️ Place orders for low stock items
4. ☑️ Check for expiring items in the next week

### Monthly Tasks (30 minutes)
1. ☑️ Full inventory count
2. ☑️ Review stock levels (adjust thresholds if needed)
3. ☑️ Clean up old transaction notes
4. ☑️ Review wastage patterns

## 🆘 Troubleshooting

**Q: Notification not showing?**
- Wait 30 seconds (auto-refresh interval)
- Refresh the page manually
- Check if item is actually below threshold

**Q: Can't delete an item?**
- Check if item is linked to menu items
- Contact admin if permission denied

**Q: Stock went negative?**
- Fix: Go to item → Update Stock → Enter positive amount
- Add note: "Correction - physical count"

**Q: Forgot to enable expiry tracking?**
- Go to item → Edit Details → Enable "Track Expiry"
- Set expiry date and save

## 📱 Mobile Tips

The interface is mobile-friendly:
- Use landscape mode for better view
- Quick buttons work well on touch screens
- Swipe to scroll through long lists
- Pinch to zoom on small screens

## 🎓 Training Tips for Staff

1. **Start Simple**: Add 5-10 most-used items first
2. **Practice Updates**: Do a few test updates to understand +/- buttons
3. **Check Daily**: Make it part of the morning routine
4. **Use Notes**: Add context when updating stock (helps track patterns)
5. **Ask Questions**: If unsure, better to ask than guess

## 📞 Need Help?

- **Documentation**: See `INVENTORY_SYSTEM.md`
- **Technical Issues**: Check `INVENTORY_IMPLEMENTATION_COMPLETE.md`
- **System Design**: Review database schema in `prisma/schema.prisma`

---

**You're all set!** 🎉 Start by adding your first 10 most critical items and go from there.
