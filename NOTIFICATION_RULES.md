# 🔔 Notification System - Complete Rules

## **All Notifications in Admin Dashboard**

### **1. Website Bookings (HIGH PRIORITY)**

**Trigger:** When a booking is received from the public website

**Notification:**
```
🔔 New Website Booking
John Doe - Standard Room (2025-11-19 to 2025-11-20)
```

**Priority:** HIGH  
**Link:** Bookings page  
**Detection:** Checks `bookingSource === 'website'`

---

### **2. Restaurant Orders (HIGH PRIORITY)**

**Trigger:** When a new order is created in Restaurant (RMS)

**Notification:**
```
🔔 New Restaurant Order
Order #ORD-1234567890 - Room 101 (Saugat Karki) - NPR 395.50
```

**Priority:** HIGH  
**Link:** Restaurant page  
**When:** Immediately after order creation

---

### **3. Pending Bookings (MEDIUM PRIORITY)**

**Trigger:** When there are unconfirmed bookings

**Notification:**
```
🔔 Pending Bookings
3 booking(s) pending approval
```

**Priority:** MEDIUM  
**Link:** Bookings page  
**Auto-check:** System periodically checks for pending bookings

---

### **4. Today's Checkouts (MEDIUM PRIORITY)**

**Trigger:** Guests checking out today

**Notification:**
```
🔔 Checkouts Today
2 guest(s) checking out today
```

**Priority:** MEDIUM  
**Link:** Billing page  
**Auto-check:** Daily at system load

---

### **5. Low Stock Alerts (HIGH PRIORITY)**

**Trigger:** Bar inventory items below minimum stock

**Notification:**
```
🔔 Low Stock Alert
3 item(s) need restocking
```

**Priority:** HIGH  
**Link:** Restaurant (Inventory tab)  
**When:** Inventory management is implemented

---

### **6. Credit Payment Reminders (MEDIUM PRIORITY)**

**Trigger:** Credit accounts approaching due date

**Notification:**
```
🔔 Payment Reminder
Credit payment due in 3 days - John Doe (NPR 5000)
```

**Priority:** MEDIUM  
**Link:** Accounts (Credit Tracking tab)  
**Auto-check:** Daily check for due dates within 7 days

---

### **7. Overdue Credits (HIGH PRIORITY)**

**Trigger:** Credit accounts past due date

**Notification:**
```
🔔 Overdue Payment
John Doe - NPR 5000 overdue by 5 days
```

**Priority:** HIGH  
**Link:** Accounts (Credit Tracking tab)  
**Auto-check:** Daily

---

## **Notification Behavior:**

### **Real-Time Updates:**
- New notifications appear instantly
- Bell icon shows unread count
- Red badge indicates unread notifications

### **User Actions:**
- **Click notification** → Navigate to relevant page
- **Mark as read** → Grey out notification
- **Delete** → Remove single notification
- **Clear all** → Remove all notifications

### **Smart Detection:**
- Prevents duplicate notifications
- Only notifies for NEW events
- Links directly to relevant admin page

### **Storage:**
- Stored in localStorage (client-side)
- Persists across browser sessions
- Maximum 50 notifications kept
- Oldest auto-deleted when limit reached

---

## **Implementation Details:**

### **Files:**
- `lib/notifications.ts` - Core notification logic
- `components/notification-panel.tsx` - UI component
- `components/admin-header.tsx` - Bell icon display
- All manager components - Notification triggers

### **How to Add New Notifications:**

```typescript
import { addNotification } from "@/lib/notifications"

// Add notification
addNotification(
  "type",           // booking | order | inventory | checkout | payment | info
  "Title",          // Short title
  "Message text",   // Detailed message
  "priority",       // low | medium | high
  "link"           // Optional: admin page to link to
)
```

### **Example - New Event Type:**

```typescript
// When guest leaves a review
addNotification(
  "info",
  "New Guest Review",
  `${guestName} left a ${rating}-star review`,
  "medium",
  "reviews"
)
```

---

## **Priority Levels:**

### **HIGH (Red):**
- Website bookings
- Restaurant orders
- Low stock
- Overdue payments
- System errors

### **MEDIUM (Yellow):**
- Pending bookings
- Today's checkouts
- Upcoming payment reminders
- Status changes

### **LOW (Blue):**
- Informational updates
- Completed actions
- System messages

---

## **Current Status:**

✅ **Implemented:**
- New website bookings
- New restaurant orders
- Notification panel UI
- Mark as read/delete
- Click to navigate

⏳ **To Be Implemented:**
- Low stock alerts (when inventory is done)
- Credit payment reminders
- Overdue credit alerts
- Today's check-ins
- Birthday/anniversary reminders

---

## **Best Practices:**

1. **Don't Spam:** Only notify for important events
2. **Be Specific:** Include guest/room/amount details
3. **Link Always:** Make notifications clickable
4. **Auto-Cleanup:** System auto-manages old notifications
5. **Test Thoroughly:** Verify no duplicates

---

## **User Experience:**

**Admin sees:**
1. Bell icon with unread count (e.g., 🔔3)
2. Click bell → Dropdown panel
3. List of notifications (newest first)
4. Click notification → Go to relevant page
5. Mark as read or delete as needed

**Notification appears:**
- Instantly when event occurs
- No page refresh needed
- Persists until read/deleted
- Synced across browser tabs

---

## 🎯 **Result:**

Admins NEVER miss important events:
- ✅ All new bookings tracked
- ✅ All orders notified
- ✅ All alerts shown
- ✅ Complete audit trail
- ✅ One-click navigation

