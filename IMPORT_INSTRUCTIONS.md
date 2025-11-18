# 📊 Transaction Import Instructions

## How to Import Existing Transactions from Excel

### Step 1: Access Import Page
1. Go to Admin Dashboard
2. Click on **Accounts (AMS)**
3. Click **"Import from Excel"** button (top right)

### Step 2: Download Template
1. Click **"Download CSV Template"**
2. This downloads a sample file with the correct format

### Step 3: Prepare Your Data in Excel

#### **Required Columns:**

| Column | Format | Example | Required? |
|--------|--------|---------|-----------|
| Date | YYYY-MM-DD | 2024-01-15 | ✅ Yes |
| Type | income / expense | income | ✅ Yes |
| Category | See below | room_booking | ✅ Yes |
| Description | Text | Room 101 - John Doe | ✅ Yes |
| Amount | Number only | 15000 | ✅ Yes |
| Currency | NPR/USD/EUR | NPR | ⚪ Optional |
| Payment Method | cash/card/etc | cash | ⚪ Optional |
| Notes | Text | Any additional info | ⚪ Optional |

#### **Valid Categories:**

**For Income (Type = income):**
- `room_booking` - Room revenue
- `restaurant` - Restaurant sales
- `bar` - Bar sales
- `other` - Other income

**For Expenses (Type = expense):**
- `salary` - Staff salaries
- `utilities` - Electricity, water, internet
- `supplies` - Kitchen supplies, cleaning, etc.
- `maintenance` - Repairs and maintenance
- `marketing` - Advertising costs
- `other` - Other expenses

#### **Valid Payment Methods:**
- `cash`
- `card`
- `bank_transfer`
- `qr` (QR code payment)
- `credit`

### Step 4: Save as CSV
1. In Excel: **File → Save As**
2. Choose **"CSV UTF-8 (Comma delimited)"** format
3. Save the file

### Step 5: Upload & Import
1. Click **"Choose File"** and select your CSV
2. Click **"Import Transactions"**
3. Review the results

## ✅ Example Data Format

```csv
Date,Type,Category,Description,Amount,Currency,Payment Method,Notes
2024-01-15,income,room_booking,Room 101 - John Doe (3 nights),15000,NPR,cash,
2024-01-15,income,restaurant,Restaurant order - Room 101,2500,NPR,card,
2024-01-16,expense,salary,Staff salary - January,45000,NPR,bank_transfer,
2024-01-16,expense,utilities,Electricity bill - January,8500,NPR,cash,
2024-01-17,income,other,Tourism guide service,5000,NPR,cash,Extra service
2024-01-18,expense,supplies,Kitchen supplies,12000,NPR,cash,Fresh vegetables and meat
```

## 🚨 Common Errors

### ❌ Wrong Date Format
**Bad:** `15/01/2024` or `01-15-2024`  
**Good:** `2024-01-15`

### ❌ Invalid Type
**Bad:** `Income` or `INCOME` or `revenue`  
**Good:** `income` (lowercase)

### ❌ Invalid Category
**Bad:** `rooms` or `food` or `bills`  
**Good:** `room_booking`, `restaurant`, `utilities`

### ❌ Amount with Currency Symbol
**Bad:** `NPR 15000` or `$150`  
**Good:** `15000` (number only)

### ❌ Empty Required Fields
All of Date, Type, Category, Description, and Amount **must** have values

## 💡 Tips

1. **Start Small**: Import 5-10 transactions first to test
2. **Check Results**: Review the success/error report after import
3. **Fix Errors**: If some fail, the error report tells you which line and why
4. **Backup First**: Download your template, keep the original Excel file
5. **Double Check Dates**: Make sure dates are in YYYY-MM-DD format
6. **Use Template**: Always start with the downloaded template

## 📱 Need Help?

If you see errors during import:
1. Check the error message - it tells you exactly what's wrong
2. Fix that row in your Excel file
3. Save as CSV again
4. Re-import

The system validates each row and shows you exactly which line failed and why!

