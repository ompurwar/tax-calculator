#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Tax Calculator - Setup Verification${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Check if .env.local exists
echo -e "${YELLOW}1. Checking environment configuration...${NC}"
if [ -f .env.local ]; then
    echo -e "${GREEN}✓ .env.local file exists${NC}"
    if grep -q "MONGODB_URI" .env.local; then
        echo -e "${GREEN}✓ MONGODB_URI is configured${NC}"
    else
        echo -e "${RED}✗ MONGODB_URI not found in .env.local${NC}"
        echo -e "${YELLOW}  Please add: MONGODB_URI=mongodb://localhost:27017/tax-calculator${NC}"
    fi
else
    echo -e "${RED}✗ .env.local file not found${NC}"
    echo -e "${YELLOW}  Run: cp .env.example .env.local${NC}"
fi

# Check if node_modules exists
echo -e "\n${YELLOW}2. Checking dependencies...${NC}"
if [ -d node_modules ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Dependencies not installed${NC}"
    echo -e "${YELLOW}  Run: npm install${NC}"
fi

# Check if MongoDB is accessible (if using local MongoDB)
echo -e "\n${YELLOW}3. Checking MongoDB connection...${NC}"
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Local MongoDB is running${NC}"
    else
        echo -e "${YELLOW}⚠ Cannot connect to local MongoDB${NC}"
        echo -e "${YELLOW}  If using MongoDB Atlas, this is normal${NC}"
    fi
else
    echo -e "${YELLOW}⚠ mongosh not found (MongoDB CLI)${NC}"
    echo -e "${YELLOW}  If using MongoDB Atlas, this is normal${NC}"
fi

# Final instructions
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "1. ${YELLOW}Configure .env.local${NC} with your MongoDB URI"
echo -e "2. ${YELLOW}npm run seed${NC} - Seed the database"
echo -e "3. ${YELLOW}npm run dev${NC} - Start the development server"
echo -e "4. Visit ${YELLOW}http://localhost:3000${NC}\n"
