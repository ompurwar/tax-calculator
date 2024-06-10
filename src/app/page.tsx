"use client";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [annualIncome, setAnnualIncome] = useState<number>(1500000);
  const [salaries, setSalaries] = useState<number[]>([
    1700000, 1900000, 2100000, 2300000, 2400000, 2500000, 2600000,
  ]);
  const [previousSalary, setPreviousSalary] = useState<number>(1500000);
  const [incomeDetails, setIncomeDetails] = useState({
    totalMonthlyIncome: 0.0,
    monthlyTaxDeduction: 0.0,
    inHandMonthlySalary: 0.0,
  });
  const hike = (newSalary: number, previousSalary: number): number => {
    return previousSalary > 0
      ? ((newSalary - previousSalary) / previousSalary) * 100
      : 0;
  };

  const calculateIncomeDetails = (annualIncome: number) => {
    const standardDeduction = 50000;
    const cessRate = 0.04;

    // Deduct the standard deduction from the annual income
    const taxableIncome = annualIncome - standardDeduction;

    // Define tax slabs and rates according to the new tax regime
    const taxSlabs = [
      { upTo: 250000, rate: 0 }, // Income up to 2.5 lakh: 0%
      { upTo: 500000, rate: 0.05 }, // Income from 2.5 lakh to 5 lakh: 5%
      { upTo: 750000, rate: 0.1 }, // Income from 5 lakh to 7.5 lakh: 10%
      { upTo: 1000000, rate: 0.15 }, // Income from 7.5 lakh to 10 lakh: 15%
      { upTo: 1250000, rate: 0.2 }, // Income from 10 lakh to 12.5 lakh: 20%
      { upTo: 1500000, rate: 0.25 }, // Income from 12.5 lakh to 15 lakh: 25%
      { upTo: Infinity, rate: 0.3 }, // Income above 15 lakh: 30%
    ];

    // Function to compute total tax based on slabs
    const computeTax = (income: number) => {
      let tax = 0;
      let remainingIncome = income;
      let previousLimit = 0;

      for (let i = 0; i < taxSlabs.length; i++) {
        const slab = taxSlabs[i];
        if (remainingIncome > slab.upTo - previousLimit) {
          tax += (slab.upTo - previousLimit) * slab.rate;
          remainingIncome -= slab.upTo - previousLimit;
          previousLimit = slab.upTo;
        } else {
          tax += remainingIncome * slab.rate;
          break;
        }
      }

      return tax;
    };

    // Compute the total tax
    const totalTax = computeTax(taxableIncome);

    // Compute the cess
    const cess = totalTax * cessRate;

    // Total tax including cess
    const totalTaxWithCess = totalTax + cess;

    // Compute monthly details
    const totalMonthlyIncome = annualIncome / 12;
    const monthlyTaxDeduction = totalTaxWithCess / 12;
    const inHandMonthlySalary = totalMonthlyIncome - monthlyTaxDeduction;

    return {
      totalMonthlyIncome: totalMonthlyIncome,
      monthlyTaxDeduction: monthlyTaxDeduction,
      inHandMonthlySalary: inHandMonthlySalary,
    };
  };

  const handleIncomeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number = 0
  ) => {
    const newSalary = parseFloat(e.target.value);
    setSalaries((prevSalaries) => {
      const updatedSalaries = [...prevSalaries];
      updatedSalaries[idx] = newSalary;
      return updatedSalaries;
    });
    setAnnualIncome(newSalary);
    setIncomeDetails(calculateIncomeDetails(newSalary));
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between md:p-24 py-24">
      <div className=" flex flex-col gap-2 text-left">
        <h2 className="text-2xl font-bold mb-4">Income Tax Calculator</h2>
        <label htmlFor="previousSalary">Previous Salary</label>
        <input
          id="previousSalary"
          type="number"
          value={previousSalary}
          onChange={(e) => setPreviousSalary(parseFloat(e.target.value))}
          className="border border-gray-300 p-2 mb-4 w-full text-gray-600 rounded-md"
          placeholder="Enter your annual income"
        />
        <div className="mb-32 grid  lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left gap-4">
          {salaries?.map((salary, index) => {
            const incomeDetails = calculateIncomeDetails(salary);
            return (
              <div
                key={index}
                className="p-4 text-gray-500 shadow-sm border-2 border-dotted rounded-lg flex flex-col gap-3"
              >
                <label htmlFor="newSalary">
                  New Salary{" "}
                  <strong className="text-gray-200">
                    {" "}
                    {hike(salary, previousSalary).toFixed(2)}% Hike
                  </strong>
                </label>
                <input
                  id="newSalary"
                  type="number"
                  value={salary}
                  onChange={(e) => handleIncomeChange(e, index)}
                  className="border border-gray-300 p-2 mb-4 w-full text-gray-600 rounded-md"
                  placeholder="Enter your annual income"
                />
                <div className="text-left flex flex-col gap-2">
                  <p className="">
                    Total Monthly Income :{"   "}
                    <span className="text-gray-200">
                      {formatMoney(incomeDetails.totalMonthlyIncome)}
                    </span>
                  </p>
                  <p className="">
                    Monthly Tax Deduction :{"   "}
                    <span className="text-gray-200">
                      {formatMoney(incomeDetails.monthlyTaxDeduction)}
                    </span>
                  </p>
                  <p className="">
                    In-Hand Monthly Salary :{"   "}
                    <span className="text-gray-200">
                      {formatMoney(incomeDetails.inHandMonthlySalary)}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

/**
 * Function to format money using the Internationalization API
 * @param {number} amount - The amount of money to format
 * @param {string} locale - The locale to use for formatting (e.g., 'en-IN' for India)
 * @param {string} currency - The currency code (e.g., 'INR' for Indian Rupee)
 * @returns {string} - The formatted currency string
 */
function formatMoney(amount: number = 0, locale = "en-IN", currency = "INR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}
