# MiniScout Setup Guide

MiniScout is a mini app that allows users to register their mini apps and collect feedback and ratings from users.

## Features

- **Super Sexy Dark UI**: Stunning black theme with purple/blue gradients, floating particles, and glassmorphism
- **Mobile-First Design**: Optimized for mobile with beautiful touch interactions and animations
- **Animated Backgrounds**: Dynamic gradients, floating particles, and glow effects
- **Apps Discovery**: Main page shows all apps with stunning cards and search functionality
- **Floating Action Button**: Beautiful gradient + button with hover animations
- **Domain Validation**: Prevents duplicate apps by checking domain availability in real-time
- **Ownership Verification**: Ensures only app owners can register their apps
- **Duplicate Prevention**: Prevents registration of the same mini app URL multiple times
- **My Apps Management**: Users can view and manage their registered apps
- **App Registration**: Upload manifest files or manually enter app details
- **User Authentication**: Integrated with Farcaster user system
- **Feedback Collection**: Rate and review apps with beautiful interface
- **Rating System**: 5-star rating system with comments and user profiles
- **Feedback Editing**: Users can edit their own feedback
- **Notification System**: Automatic notifications to app owners when they receive feedback
- **Real-time Statistics**: Live stats showing total apps, reviews, and average ratings
- **MongoDB Storage**: All data is stored in MongoDB collections
- **Responsive Design**: Optimized for all screen sizes with modern aesthetics

## Prerequisites

- Node.js 18+
- MongoDB database
- Next.js 15+

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/miniscout
# or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/miniscout

# App Configuration
NEXT_PUBLIC_URL=http://localhost:3000
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up MongoDB:

   - Create a MongoDB database named `miniscout`
   - The app will automatically create the required collections (`apps` and `feedback`)

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Registering a Mini App

1. **From Main Page**: Click the floating + button in the bottom right
2. **Upload Manifest**: Drag & drop your metadata JSON file or click to browse
3. **Auto-fill**: The form will automatically populate with data from your manifest
4. **Domain Check**: The system validates that no app with the same domain exists
5. **Fill Details**: Complete any missing required fields:
   - App Name
   - Description
   - Home URL
   - Mini App URL (required for ownership verification)
   - Icon URL (optional)
   - Splash Image URL (optional)
6. **Duplicate Check**: The system prevents registration of the same mini app URL
7. **Ownership Verification**: The system verifies that you own the mini app
8. **Register**: Click "Register App" to add your app to MiniScout

### Discovering and Reviewing Apps

1. **Main Page**: Browse all registered apps on the beautiful main page
2. **Search**: Use the search bar to find specific apps by name
3. **App Cards**: Click on any app card to view details and provide feedback
4. **Open Mini App**: Click the external link button to open the actual mini app
5. **Rating System**: Rate apps with 1-5 stars and add comments
6. **User Profiles**: Your Farcaster profile info is automatically included
7. **Edit Feedback**: You can edit your own feedback anytime
8. **One Review Per User**: Each user can only provide one review per app

### Managing Your Apps

1. **My Apps Page**: Click "My Apps" button on the main page to view your registered apps
2. **App Management**: View all your apps with ratings, reviews, and statistics
3. **Copy Feedback Links**: Copy unique feedback URLs to share with users
4. **Open Mini Apps**: Direct access to your mini apps

### Notification System

1. **Automatic Notifications**: App owners receive notifications when someone provides feedback
2. **Notification Types**:
   - New feedback notifications with reviewer name, rating, and comment status
   - Feedback update notifications when existing reviews are modified
3. **Notification Content**: Includes app name, reviewer name, rating, and whether a comment was provided
4. **Implementation**: Uses the same pattern as ActionsTab with `/api/send-custom-notification` endpoint
5. **Farcaster Integration**: Notifications are sent through Farcaster's notification system
6. **Error Handling**: Notification failures don't affect the feedback submission process
7. **Storage**: Notification details are stored in KV store (Redis or in-memory fallback)

### Managing Your Apps (continued)

6. **View Reviews**: See all feedback for your apps
7. **Add New Apps**: Quick access to register additional apps

### App Statistics

The main page displays beautiful real-time statistics:

- **Total Apps**: Number of registered mini apps
- **Total Reviews**: Combined reviews across all apps
- **Average Rating**: Overall rating across all apps

These stats update automatically as new apps and reviews are added.

### Ownership Verification

To ensure only app owners can register their apps, MiniScout implements ownership verification:

1. **Mini App URL**: Users must provide the URL of their mini app
2. **Verification Process**: The system checks if the URL is accessible and looks for verification tokens
3. **Verification Methods**:
   - HTML meta tags: `<meta name="miniscout-owner" content="YOUR_FID">`
   - Data attributes: `data-miniscout-owner="YOUR_FID"`
   - Text content: `miniscout-owner-YOUR_FID`
4. **Demo Mode**: For testing, the system allows registration if the URL is accessible
5. **Production**: In production, strict verification tokens would be required

### Feedback System

- **One feedback per user per app**: Each Farcaster user can only provide one feedback per mini app
- **Authentication required**: Users must connect their Farcaster account to provide feedback
- **Edit your own feedback**: Users can edit their existing feedback (only visible to the feedback author)
- **User information captured**: Feedback includes FID, username, display name, and profile picture
- **Real-time statistics**: App ratings and review counts are updated automatically

### UI Design Features

- **Dark Theme**: Stunning black background with purple/blue gradient overlays
- **Floating Particles**: Animated particles that create a dynamic, living interface
- **Glassmorphism Cards**: Semi-transparent cards with backdrop blur and glow effects
- **Animated Gradients**: Dynamic gradient backgrounds that shift and pulse
- **Hover Animations**: Scale transforms, glow effects, and smooth transitions
- **Mobile-First**: Optimized for mobile with touch-friendly interactions
- **Beautiful Typography**: Bold fonts with gradient text effects
- **Compact Buttons**: Smaller, more elegant button designs with proper sizing
- **High Contrast Text**: White text on dark backgrounds for maximum readability
- **Dual Floating Action Buttons**: Add New (right) and My Apps (left) for easy navigation
- **Interactive Elements**: Hover effects, scale transforms, and smooth transitions
- **Real-time Validation**: Live domain checking with visual feedback
- **Beautiful Icons**: Lucide icons with consistent styling and animations
- **Responsive Grid**: Adaptive layouts for all screen sizes
- **Loading States**: Elegant spinner animations with pulsing effects
- **Color Scheme**: Purple, blue, and pink gradient palette on black
- **Glow Effects**: Subtle glows and shadows that create depth
- **Particle System**: Floating animated particles for visual interest
- **Form Styling**: Dark-themed form inputs with purple accents

### Metadata File Format

The app accepts JSON metadata files with the following structure:

```json
{
  "frame": {
    "name": "Your App Name",
    "version": "1",
    "iconUrl": "https://your-app.com/icon.png",
    "homeUrl": "https://your-app.com",
    "buttonTitle": "Open Your App",
    "splashImageUrl": "https://your-app.com/splash.png",
    "splashBackgroundColor": "#f7f7f7",
    "subtitle": "Your app subtitle",
    "description": "Your app description",
    "primaryCategory": "utility",
    "tags": ["tag1", "tag2"],
    "tagline": "Your app tagline",
    "ogDescription": "Your app OG description"
  },
  "accountAssociation": {
    "header": "your-header-here",
    "payload": "your-payload-here",
    "signature": "your-signature-here"
  }
}
```

## API Endpoints

### Apps

- `POST /api/apps` - Register a new app
- `GET /api/apps` - Get apps (with optional filters)
- `POST /api/apps/verify-ownership` - Verify app ownership before registration

### Feedback

- `POST /api/feedback` - Submit feedback for an app (sends notifications to app owner)
- `GET /api/feedback?appId=<id>` - Get feedback for an app
- `GET /api/feedback` - Get all feedback from all apps

### Notifications

- `POST /api/send-notification` - Send test notifications
- `POST /api/send-custom-notification` - Send custom notifications with specific title and body
- `POST /api/webhook` - Handle Farcaster webhook events

## Database Schema

### Apps Collection

```javascript
{
  _id: ObjectId,
  appId: String, // Unique identifier
  name: String,
  description: String,
  iconUrl: String,
  splashUrl: String,
  homeUrl: String,
  miniappUrl: String, // URL for ownership verification and app access
  metadata: Object, // Original metadata file
  ownerFid: Number,
  createdAt: Date,
  updatedAt: Date,
  totalRatings: Number,
  averageRating: Number,
  totalFeedback: Number
}
```

### Feedback Collection

```javascript
{
  _id: ObjectId,
  appId: String,
  rating: Number, // 1-5
  comment: String,
  userFid: Number, // Farcaster user ID
  userName: String, // Farcaster username
  userDisplayName: String, // User's display name
  userPfpUrl: String, // User's profile picture URL
  createdAt: Date,
  updatedAt: Date // When feedback was last edited
}
```

## Deployment

1. Set up environment variables in your deployment platform
2. Ensure MongoDB is accessible from your deployment
3. Deploy using your preferred platform (Vercel, Netlify, etc.)

## Testing

Use the provided `sample-metadata.json` file to test the app registration feature.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
