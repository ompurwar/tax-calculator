"use client";
import { useState, useEffect } from "react";
import { TaxSlabDocument, AssessmentYear } from "@/types/tax";

export default function Home() {
  const [salaries, setSalaries] = useState<number[]>([
    1700000, 1900000, 2100000, 2300000, 2400000, 2500000, 2600000,
  ]);
  const [previousSalary, setPreviousSalary] = useState<number>(1500000);
  const [pfType, setPfType] = useState<'percentage' | 'fixed'>('percentage'); // PF type: percentage or fixed
  const [pfPercentage, setPfPercentage] = useState<number>(12); // Default PF is 12%
  const [pfFixedAmount, setPfFixedAmount] = useState<number>(1800); // Default monthly PF
  const [assessmentYears, setAssessmentYears] = useState<AssessmentYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [taxSlabData, setTaxSlabData] = useState<TaxSlabDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Fetch assessment years on component mount
  useEffect(() => {
    fetchAssessmentYears();
  }, []);

  // Fetch tax slabs when year is selected
  useEffect(() => {
    if (selectedYear) {
      fetchTaxSlabs(selectedYear);
    }
  }, [selectedYear]);

  const fetchAssessmentYears = async () => {
    try {
      const response = await fetch('/api/assessment-years');
      if (!response.ok) throw new Error('Failed to fetch assessment years');
      const data = await response.json();
      setAssessmentYears(data);
      if (data.length > 0) {
        setSelectedYear(data[0].year); // Select most recent year by default
      }
    } catch (err) {
      setError('Failed to load assessment years');
      console.error(err);
    }
  };

  const fetchTaxSlabs = async (year: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tax-slabs?assessmentYear=${year}&regime=new`);
      if (!response.ok) throw new Error('Failed to fetch tax slabs');
      const data = await response.json();
      setTaxSlabData(data);
      setError("");
    } catch (err) {
      setError('Failed to load tax slabs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const hike = (newSalary: number, previousSalary: number): number => {
    return previousSalary > 0
      ? ((newSalary - previousSalary) / previousSalary) * 100
      : 0;
  };

  const calculateIncomeDetails = (annualIncome: number, pfType: 'percentage' | 'fixed', pfPercent: number, pfFixed: number) => {
    if (!taxSlabData) {
      return {
        grossMonthlyIncome: 0,
        monthlyTaxDeduction: 0,
        monthlyPfDeduction: 0,
        monthlyEmployerPf: 0,
        inHandMonthlySalary: 0,
      };
    }

    const { standardDeduction, cessRate, slabs } = taxSlabData;

    // Calculate employer PF contribution (not part of in-hand salary)
    let monthlyEmployerPf = 0;
    let monthlyEmployeePf = 0;
    let actualGrossAnnual = annualIncome;
    
    if (pfType === 'percentage') {
      // If input is CTC, employer's PF is part of it
      // Employer PF = (CTC * pfPercent) / 100 / 12
      monthlyEmployerPf = (annualIncome * pfPercent) / 100 / 12;
      
      // Actual gross (what you receive) = CTC - Employer PF
      actualGrossAnnual = annualIncome - (monthlyEmployerPf * 12);
      
      // Employee PF is calculated on actual gross
      monthlyEmployeePf = (actualGrossAnnual * pfPercent) / 100 / 12;
    } else {
      // In fixed mode, assume the fixed amount is employee PF only
      monthlyEmployeePf = pfFixed;
      monthlyEmployerPf = pfFixed; // Matching contribution
      actualGrossAnnual = annualIncome - (monthlyEmployerPf * 12);
    }
    
    // Deduct the standard deduction from the actual gross annual
    const taxableIncome = Math.max(0, actualGrossAnnual - standardDeduction);

    // Function to compute total tax based on slabs
    const computeTax = (income: number) => {
      if (income <= 0) return 0;
      
      let tax = 0;
      let remainingIncome = income;
      let previousLimit = 0;

      for (let i = 0; i < slabs.length; i++) {
        const slab = slabs[i];
        
        // Handle the last slab which goes to Infinity (stored as null in MongoDB)
        if (slab.upTo === null || slab.upTo === Infinity) {
          const taxInSlab = remainingIncome * slab.rate;
          tax += taxInSlab;
          break;
        }
        
        const slabRange = slab.upTo - previousLimit;
        
        if (remainingIncome > slabRange) {
          const taxInSlab = slabRange * slab.rate;
          tax += taxInSlab;
          remainingIncome -= slabRange;
          previousLimit = slab.upTo;
        } else {
          const taxInSlab = remainingIncome * slab.rate;
          tax += taxInSlab;
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
    const totalTaxWithCess = Math.max(0, totalTax + cess);

    // Compute monthly details
    const grossMonthlyIncome = actualGrossAnnual / 12;
    const monthlyTaxDeduction = totalTaxWithCess / 12;
    const inHandMonthlySalary = grossMonthlyIncome - monthlyTaxDeduction - monthlyEmployeePf;

    return {
      grossMonthlyIncome: grossMonthlyIncome,
      monthlyTaxDeduction: monthlyTaxDeduction,
      monthlyPfDeduction: monthlyEmployeePf,
      monthlyEmployerPf: monthlyEmployerPf,
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
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between md:p-24 py-24">
      <div className=" flex flex-col gap-2 text-left">
        <h2 className="text-2xl font-bold mb-4">Income Tax Calculator</h2>
        
        {/* Regime Notice */}
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p className="font-semibold">📌 Currently supporting New Tax Regime only</p>
        </div>

        {/* Assessment Year Selector */}
        <div className="mb-4">
          <label htmlFor="assessmentYear" className="block mb-2 font-medium">
            Assessment Year
          </label>
          <select
            id="assessmentYear"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 p-2 w-full text-gray-600 rounded-md"
            disabled={loading || assessmentYears.length === 0}
          >
            {assessmentYears.map((year) => (
              <option key={year.year} value={year.year}>
                {year.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading tax slabs...</p>
          </div>
        )}

        {/* Tax Calculator Form */}
        {!loading && taxSlabData && (
          <>
            <label htmlFor="previousSalary">Previous CTC (Annual)</label>
            <input
              id="previousSalary"
              type="number"
              value={previousSalary}
              onChange={(e) => setPreviousSalary(parseFloat(e.target.value))}
              className="border border-gray-300 p-2 mb-4 w-full text-gray-600 rounded-md"
              placeholder="Enter your previous annual CTC"
            />
            
            <label htmlFor="pfType" className="block mb-2 font-medium">
              PF Contribution Type
            </label>
            <select
              id="pfType"
              value={pfType}
              onChange={(e) => setPfType(e.target.value as 'percentage' | 'fixed')}
              className="border border-gray-300 p-2 mb-4 w-full text-gray-600 rounded-md"
            >
              <option value="percentage">Percentage of Salary</option>
              <option value="fixed">Fixed Monthly Amount</option>
            </select>

            {pfType === 'percentage' ? (
              <>
                <label htmlFor="pfPercentage">PF Contribution (%)</label>
                <input
                  id="pfPercentage"
                  type="number"
                  value={pfPercentage}
                  onChange={(e) => setPfPercentage(parseFloat(e.target.value))}
                  className="border border-gray-300 p-2 mb-4 w-full text-gray-600 rounded-md"
                  placeholder="Enter PF percentage (e.g., 12)"
                  min="0"
                  max="100"
                  step="0.5"
                />
              </>
            ) : (
              <>
                <label htmlFor="pfFixedAmount">Monthly PF Amount (₹)</label>
                <input
                  id="pfFixedAmount"
                  type="number"
                  value={pfFixedAmount}
                  onChange={(e) => setPfFixedAmount(parseFloat(e.target.value))}
                  className="border border-gray-300 p-2 mb-4 w-full text-gray-600 rounded-md"
                  placeholder="Enter monthly PF amount (e.g., 1800)"
                  min="0"
                  step="100"
                />
              </>
            )}
            
            <div className="mb-32 grid  lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left gap-4">
              {salaries?.map((salary, index) => {
                const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                return (
                  <div
                    key={index}
                    className="p-4 text-gray-500 shadow-sm border-2 border-dotted rounded-lg flex flex-col gap-3"
                  >
                    <label htmlFor={`newSalary-${index}`}>
                      New CTC{" "}
                      <strong className="text-gray-200">
                        {" "}
                        {hike(salary, previousSalary).toFixed(2)}% Hike
                      </strong>
                    </label>
                    <input
                      id={`newSalary-${index}`}
                      type="number"
                      value={salary}
                      onChange={(e) => handleIncomeChange(e, index)}
                      className="border border-gray-300 p-2 mb-4 w-full text-gray-600 rounded-md"
                      placeholder="Enter your annual CTC"
                    />
                    <div className="text-left flex flex-col gap-2">
                      <p className="text-sm text-gray-400">
                        CTC (Annual): {formatMoney(salary)}
                      </p>
                      <p className="text-sm text-gray-400">
                        Employer PF: {formatMoney(incomeDetails.monthlyEmployerPf)}
                      </p>
                      <hr className="my-1" />
                      <p className="">
                        Gross Monthly Income :{"   "}
                        <span className="text-gray-200">
                          {formatMoney(incomeDetails.grossMonthlyIncome)}
                        </span>
                      </p>
                      <p className="">
                        Monthly Tax Deduction :{"   "}
                        <span className="text-gray-200">
                          {formatMoney(incomeDetails.monthlyTaxDeduction)}
                        </span>
                      </p>
                      <p className="">
                        Monthly PF (Employee) :{"   "}
                        <span className="text-gray-200">
                          {formatMoney(incomeDetails.monthlyPfDeduction)}
                        </span>
                      </p>
                      <p className="font-semibold">
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
          </>
        )}
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
