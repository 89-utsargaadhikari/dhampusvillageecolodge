# 🍽️ Restaurant Management System - Data Sync Rules

## **Rule: ONLY "Checked In" Guests Can Order**

### **Sync Logic:**

1. **Guest Eligibility:**
   - ✅ Status = "Checked In"
   - ✅ Must have assigned Room Number
   - ❌ "Confirmed" bookings → NOT eligible (guest hasn't arrived yet)
   - ❌ "Pending" bookings → NOT eligible
   - ❌ "Checked Out" bookings → NOT eligible
   - ❌ "Cancelled" bookings → NOT eligible

2. **Real-Time Synchronization:**
   - When booking status changes to "Checked In" → Guest appears in restaurant dropdown
   - When booking status changes to "Checked Out" → Guest removed from restaurant dropdown
   - Room number assignment required for orders
   - Guest name auto-populated when room selected

3. **Data Flow:**
   ```
   Bookings Page                    Restaurant (RMS)
   ============                     ===============
   1. Guest arrives
   2. Admin marks as "Checked In"   → Guest appears in dropdown
   3. Assign room number            → Room # shown in order form
   4. Guest orders food             → Order linked to booking
   5. Admin marks as "Checked Out"  → Guest removed from dropdown
   ```

### **Implementation:**

**File:** `components/restaurant-manager.tsx`

```typescript
const loadData = async () => {
  const allBookings = await fetchBookings()
  
  // FILTER: Only "Checked In" guests with room numbers
  const checkedInBookings = allBookings.filter((b: any) => 
    b.status === "Checked In" && b.roomNumber
  )
  
  setBookings(checkedInBookings)
}
```

### **User Experience:**

**✅ When Guests Are Checked In:**
- Room dropdown shows: "Room 101 - John Doe"
- Guest name auto-fills
- Order can be created
- Order linked to booking for billing

**⚠️ When No Guests Are Checked In:**
- Dropdown shows: "No checked-in guests available"
- Alert message: "Please check in a guest from the Bookings page first"
- Create Order button disabled (form validation)

### **Billing Integration:**

When guest checks out:
1. Billing Manager fetches all restaurant orders for that booking
2. Aggregates total restaurant charges
3. Adds to final bill with taxes
4. Guest can pay or add to credit

### **Data Integrity Checks:**

✅ **Synced with Bookings Manager:**
- Status changes in Bookings immediately update Restaurant
- Room assignments sync in real-time
- No manual intervention needed

✅ **Synced with Billing Manager:**
- All orders linked to booking ID
- Charges aggregated automatically
- Tax calculations included

✅ **Synced with AMS (Accounts):**
- Paid orders → Income transactions
- Credit orders → Credit accounts
- All tracked for financial reporting

### **Error Prevention:**

1. **No Room Number?**
   - Order cannot be created
   - System requires room assignment first

2. **Guest Not Checked In?**
   - Won't appear in dropdown
   - Forces proper check-in workflow

3. **Guest Checked Out?**
   - Removed from dropdown immediately
   - No new orders possible
   - Existing orders remain for billing

### **Admin Workflow:**

```
1. Guest Arrives
   ↓
2. Bookings → Change Status to "Checked In"
   ↓
3. Restaurant → Guest appears in dropdown
   ↓
4. Create orders throughout stay
   ↓
5. Bookings → Change Status to "Checked Out"
   ↓
6. Billing → Generate bill (includes all restaurant orders)
   ↓
7. Process payment or create credit account
```

### **Console Logging (for debugging):**

Every time restaurant data loads, console shows:
```
🍽️ Restaurant System - Data Sync:
  Total bookings: 5
  Checked In guests: 2
  Available for orders: ["John Doe - Room 101", "Jane Smith - Room 102"]
```

## ✅ **Result: Complete Data Synchronization**

- Bookings ←→ Restaurant ←→ Billing ←→ Accounts
- All connected through database
- Real-time updates
- No data mismatches
- Enforced business logic

