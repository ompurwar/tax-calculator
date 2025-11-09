# Tax Calculator

A dynamic income tax calculator supporting multiple assessment years with the New Tax Regime. Built with Next.js, TypeScript, MongoDB, and Tailwind CSS.

## Features

- ✅ **New Tax Regime Support** - Currently supports calculations for New Tax Regime only
- 📅 **Multiple Assessment Years** - Dynamic tax slabs for different assessment years (AY 2023-24, 2024-25, 2025-26)
- 💰 **Salary Comparison** - Compare multiple salary scenarios side-by-side
- 📊 **Real-time Calculations** - Instant tax calculations with monthly breakdowns
- 🔄 **Hike Percentage** - Calculate percentage increase from previous salary
- 🗄️ **MongoDB Integration** - Flexible database storage for tax slabs

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Runtime**: Node.js

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB installed locally OR a MongoDB Atlas account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd tax-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and update the MongoDB connection string:

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/tax-calculator
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tax-calculator?retryWrites=true&w=majority
```

### Database Setup

Seed the database with initial tax slab data:

```bash
npm run seed
```

This will populate the database with tax slabs for:
- Assessment Year 2023-24 (New Regime)
- Assessment Year 2024-25 (New Regime)
- Assessment Year 2025-26 (New Regime)

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select Assessment Year**: Choose the assessment year from the dropdown menu
2. **Enter Previous Salary**: Input your current annual salary
3. **Compare Salaries**: The calculator shows 7 different salary scenarios by default
4. **View Results**: See monthly income, tax deduction, and in-hand salary for each scenario
5. **Modify Salaries**: Click on any salary field to customize the amount

## API Endpoints

### Get Assessment Years
```
GET /api/assessment-years
```

Returns a list of available assessment years for the new regime.

**Response:**
```json
[
  { "year": "2025-26", "label": "AY 2025-26" },
  { "year": "2024-25", "label": "AY 2024-25" },
  { "year": "2023-24", "label": "AY 2023-24" }
]
```

### Get Tax Slabs
```
GET /api/tax-slabs?assessmentYear=2024-25&regime=new
```

Returns tax slab data for a specific assessment year and regime.

**Response:**
```json
{
  "assessmentYear": "2024-25",
  "regime": "new",
  "standardDeduction": 50000,
  "cessRate": 0.04,
  "slabs": [
    { "upTo": 300000, "rate": 0 },
    { "upTo": 700000, "rate": 0.05 },
    { "upTo": 1000000, "rate": 0.1 },
    { "upTo": 1200000, "rate": 0.15 },
    { "upTo": 1500000, "rate": 0.2 },
    { "upTo": null, "rate": 0.3 }
  ]
}
```

## Tax Slab Information

### Assessment Year 2023-24 (New Regime)
**Financial Year 2022-23**
- Standard Deduction: ₹0 (Not available in AY 2023-24)
- Cess: 4%
- Tax Slabs:
  - Up to ₹2.5L: 0%
  - ₹2.5L - ₹5L: 5%
  - ₹5L - ₹7.5L: 10%
  - ₹7.5L - ₹10L: 15%
  - ₹10L - ₹12.5L: 20%
  - ₹12.5L - ₹15L: 25%
  - Above ₹15L: 30%

### Assessment Year 2024-25 (New Regime)
**Financial Year 2023-24**
- Standard Deduction: ₹50,000
- Cess: 4%
- Tax Slabs:
  - Up to ₹3L: 0%
  - ₹3L - ₹6L: 5%
  - ₹6L - ₹9L: 10%
  - ₹9L - ₹12L: 15%
  - ₹12L - ₹15L: 20%
  - Above ₹15L: 30%

### Assessment Year 2025-26 (New Regime)
**Financial Year 2024-25**
- Standard Deduction: ₹75,000
- Cess: 4%
- Tax Slabs:
  - Up to ₹4L: 0%
  - ₹4L - ₹8L: 5%
  - ₹8L - ₹12L: 10%
  - ₹12L - ₹16L: 15%
  - ₹16L - ₹20L: 20%
  - ₹20L - ₹24L: 25%
  - Above ₹24L: 30%

## Project Structure

```
tax-calculator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assessment-years/
│   │   │   │   └── route.ts
│   │   │   └── tax-slabs/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── mongodb.ts
│   └── types/
│       └── tax.ts
├── scripts/
│   └── seed.ts
├── .env.local
├── .env.example
└── package.json
```

## Adding New Tax Slabs

To add tax slabs for a new assessment year:

1. Edit `scripts/seed.ts`
2. Add a new entry to the `taxSlabsData` array
3. Run `npm run seed` to update the database

Example:
```typescript
{
  assessmentYear: '2026-27',
  regime: 'new',
  standardDeduction: 75000,
  cessRate: 0.04,
  slabs: [
    { upTo: 300000, rate: 0 },
    { upTo: 700000, rate: 0.05 },
    // ... more slabs
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with tax slabs
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

# tax-calculator
