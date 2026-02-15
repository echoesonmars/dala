# DALA

Direct crowdfunding platform for CIS creators. No algorithms, no gatekeepers, just transparent funding from people who believe in your work.

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **shadcn/ui** - UI components
- **NextAuth v5** - Authentication
- **Prisma** - Database ORM
- **MongoDB** - Database
- **Zustand** - State management

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
Create `.env.local`:
```env
DATABASE_URL="mongodb://localhost:27017/dala"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
```

Generate secure secret:
```bash
openssl rand -base64 32
```

### 3. Setup MongoDB
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### 4. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Features

- Multi-step project creation wizard
- User authentication and authorization
- Protected dashboards
- Swiss design system
- Fully responsive
- CIS market localization (KZ, RU, UA, BY)
- Session persistence

## Project Structure

```
app/
├── (auth)/
│   ├── login/              # Login/signup page
│   └── dashboard/          # Protected user dashboard
├── wizard/                 # Project creation flow
├── browse/                 # Browse all projects
├── components/             # Landing page components
└── api/                    # API routes

components/
├── ui/                     # shadcn components
└── wizard/                 # Wizard-specific components

lib/
├── auth.ts                 # NextAuth config
├── prisma.ts               # Prisma client
└── store/                  # Zustand stores

prisma/
└── schema.prisma           # Database schema
```

## Development

### Database GUI
```bash
npx prisma studio
```

### Type Check
```bash
npm run type-check
```

### Build
```bash
npm run build
```

## Environment Variables

Required:
- `DATABASE_URL` - MongoDB connection string
- `NEXTAUTH_SECRET` - Auth secret key