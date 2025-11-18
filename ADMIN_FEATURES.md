# Admin Dashboard Features

## Overview
Your Dhampus Eco Lodge website now has a fully functional admin dashboard with comprehensive content management capabilities. All data is stored in the browser's localStorage for easy management without needing a backend server.

## 🎯 Implemented Features

### 1. **Room Management** ✅
Located at: `/admin` → Rooms tab

**Features:**
- ✅ Add new rooms with complete details
- ✅ Edit existing rooms (prices, descriptions, capacity, etc.)
- ✅ Upload room images (stored as base64)
- ✅ Delete rooms
- ✅ Set room status (Available/Booked)
- ✅ Add custom features and amenities
- ✅ Set room ratings

**How to use:**
1. Navigate to Admin Dashboard → Rooms
2. Click "Add Room" to create a new room
3. Click the edit icon (pencil) on any room card to modify it
4. Click the delete icon (trash) to remove a room
5. Upload images using the "Upload Image" button
6. All changes are saved automatically

### 2. **Bookings Management** ✅
Located at: `/admin` → Bookings tab

**Features:**
- ✅ View all bookings in a table format
- ✅ Add new bookings manually
- ✅ Edit booking details (guest info, dates, prices)
- ✅ Change booking status (Pending/Confirmed/Cancelled)
- ✅ Delete bookings
- ✅ Quick status updates from the table

**How to use:**
1. Navigate to Admin Dashboard → Bookings
2. Click "Add Booking" to create a new reservation
3. Click the edit icon to modify booking details
4. Use the status dropdown to quickly change booking status
5. Click the delete icon to remove a booking

### 3. **Gallery Management** ✅
Located at: `/admin` → Gallery tab

**Features:**
- ✅ Upload new images to the gallery
- ✅ Categorize images (Building, Rooms, Dining, Amenities, Views, etc.)
- ✅ Delete images from the gallery
- ✅ Preview images before uploading
- ✅ Images displayed on the main website automatically

**How to use:**
1. Navigate to Admin Dashboard → Gallery
2. Click "Add Image" or the dashed box
3. Upload an image, add a title and category
4. Click "Add Image" to save
5. Hover over any image and click the trash icon to delete

### 4. **Hero Section Settings** ✅
Located at: `/admin` → Hero Settings tab

**Features:**
- ✅ Upload custom background image for hero section
- ✅ Upload intro video (optional - video will play instead of static image)
- ✅ Edit hero title
- ✅ Edit hero subtitle/description
- ✅ Live preview of changes
- ✅ Changes reflect immediately on the main website

**How to use:**
1. Navigate to Admin Dashboard → Hero Settings
2. Upload a background image or video
3. Edit the title and subtitle text
4. Preview your changes in the preview section
5. Click "Save Changes" to apply

### 5. **Booking Integration** ✅
**All booking buttons throughout the website now link directly to the admin dashboard:**
- Header "Book Now" button → `/admin`
- Room "Book Room" buttons → `/admin`
- CTA "Book Your Stay Now" button → `/admin`

## 🗄️ Data Storage

All data is stored in browser localStorage under the following keys:
- `lodge_rooms` - Room data
- `lodge_bookings` - Booking data
- `lodge_gallery` - Gallery images
- `lodge_hero_settings` - Hero section settings

**Note:** Data is stored per browser. If you clear browser cache/data, the custom content will be reset to defaults.

## 🎨 Image Upload

Images are converted to base64 format and stored in localStorage. This means:
- ✅ No server storage needed
- ✅ Images persist across page reloads
- ⚠️ Large images may slow down the browser
- ⚠️ Recommended to optimize images before upload (max 1-2MB per image)

## 📱 Responsive Design

All admin components are fully responsive and work on:
- Desktop computers
- Tablets
- Mobile devices

## 🔐 Admin Access

The admin dashboard is accessible at `/admin`. In production, you should add authentication to protect this page.

## 🚀 Getting Started

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000` to see your website
3. Click "Admin" in the header or visit `/admin` directly
4. Start managing your content!

## 📋 Default Data

The system comes with default data for:
- 3 sample rooms (Deluxe Room, Premium Suite, Mountain Cottage)
- 4 sample bookings
- 6 gallery images
- Default hero settings

You can edit or delete any of these and add your own content.

## 🔄 Data Synchronization

Changes made in the admin dashboard are reflected on the main website in real-time. The website components automatically:
- Load room data from localStorage
- Load gallery images from localStorage
- Load hero settings from localStorage
- Update when returning to the page

## 💡 Tips

1. **Optimize Images:** Use compressed images (JPEG with 70-80% quality) for better performance
2. **Video Files:** Keep video files small (under 10MB) or use external hosting
3. **Regular Backups:** Export your localStorage data periodically using browser dev tools
4. **Test Changes:** Always preview your changes before saving
5. **Mobile Preview:** Test how your content looks on mobile devices

## 🛠️ Technical Stack

- **Framework:** Next.js 16
- **UI Components:** Radix UI + shadcn/ui
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **Storage:** Browser localStorage
- **Image Processing:** FileReader API (base64 conversion)

## 📞 Support

If you encounter any issues or need help:
1. Check browser console for errors
2. Ensure JavaScript is enabled
3. Try clearing localStorage and refreshing
4. Check that you're using a modern browser (Chrome, Firefox, Safari, Edge)

---

**Enjoy managing your Dhampus Eco Lodge website!** 🏔️



