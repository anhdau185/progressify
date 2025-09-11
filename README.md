# Progressify

Transform your goals into beautiful visual progress rings that make achieving them irresistibly satisfying.

## Features

- 🎯 **Visual Progress Tracking** - Interactive circular progress rings
- 📊 **Goal Management** - Create, edit, and organize multiple goals
- 🎨 **Customizable** - Choose colors and set custom step counts
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🔐 **Secure Authentication** - Email-based user accounts
- ↕️ **Drag & Drop** - Reorder goals on your dashboard

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/progressify.git
cd progressify
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Account

- Email: `demo@example.com`
- Password: `password`

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Authentication:** JWT with bcryptjs
- **Drag & Drop:** @dnd-kit
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
progressify/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── lib/                # Utility functions and auth logic
└── public/             # Static assets
```

## API Routes

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Sign in existing user
- `POST /api/auth/reset-password` - Reset user password

### Goals
- `GET /api/goals` - Get all goals for authenticated user
- `POST /api/goals` - Create new goal
- `GET /api/goals/[id]` - Get specific goal
- `PUT /api/goals/[id]` - Update goal (including progress)
- `DELETE /api/goals/[id]` - Delete goal

## Usage

1. **Create Account** - Register with your email address
2. **Add Goals** - Click "New Goal" to create your first progress tracker
3. **Set Parameters** - Choose title, description, total steps (1-365), and color
4. **Track Progress** - Click the circles around the ring to mark completion
5. **Organize** - Drag and drop goal cards to reorder them
6. **Celebrate** - Watch the satisfying animations as you complete goals!

## Key Components

### CircularProgress
Interactive SVG-based circular progress tracker with clickable cells around the perimeter. Each cell represents one step toward your goal.

### GoalCard
Dashboard cards displaying goal overview with progress bars, completion percentages, and drag handles for reordering.

### AuthForm
Unified authentication component supporting login, registration, and password reset modes.

### NewGoalModal
Modal interface for creating new goals with form validation and color selection.

## Data Storage

Currently uses in-memory storage for prototyping. For production deployment:

1. **Database Integration** - Add PostgreSQL/MongoDB
2. **Environment Variables** - Configure production secrets
3. **Data Persistence** - Implement proper data models
4. **User Sessions** - Add session management
5. **Data Validation** - Server-side input validation

## Future Enhancements

- 📱 **Mobi