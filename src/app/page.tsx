"use client";
import { useState, useEffect } from "react";
import { TaxSlabDocument, AssessmentYear } from "@/types/tax";
import { CTCStorage, CTCConfiguration } from "@/lib/storage";

export default function Home() {
  const [salaries, setSalaries] = useState<number[]>([
    1700000, 1900000, 2100000, 2300000, 2400000,
  ]);
  const [previousSalary, setPreviousSalary] = useState<number>(1500000);
  const [pfType, setPfType] = useState<'percentage' | 'fixed'>('percentage');
  const [pfPercentage, setPfPercentage] = useState<number>(12);
  const [pfFixedAmount, setPfFixedAmount] = useState<number>(1800);
  const [assessmentYears, setAssessmentYears] = useState<AssessmentYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [taxSlabData, setTaxSlabData] = useState<TaxSlabDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  
  // Version management
  const [versions, setVersions] = useState<{ version: number; timestamp: number }[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Load configurations from localStorage on mount
  useEffect(() => {
    loadVersions();
    const latest = CTCStorage.getLatest();
    if (latest) {
      loadConfiguration(latest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Load all versions from localStorage
  const loadVersions = () => {
    const versionList = CTCStorage.getVersionList();
    setVersions(versionList);
  };

  // Load a specific configuration
  const loadConfiguration = (config: CTCConfiguration) => {
    setSelectedYear(config.assessmentYear);
    setPfType(config.pfType);
    setPreviousSalary(config.previousSalary);
    
    if (config.pfType === 'percentage') {
      setPfPercentage(config.pfValue);
    } else {
      setPfFixedAmount(config.pfValue);
    }
    
    setSalaries(config.expectedSalaries);
    setCurrentVersion(config.version);
  };

  // Load a specific version
  const loadVersion = (version: number) => {
    const config = CTCStorage.getVersion(version);
    if (config) {
      loadConfiguration(config);
    }
  };

  // Save current configuration
  const saveConfiguration = () => {
    try {
      const pfValue = pfType === 'percentage' ? pfPercentage : pfFixedAmount;
      
      const config = CTCStorage.save({
        assessmentYear: selectedYear,
        pfType,
        previousSalary,
        pfValue,
        expectedSalaries: salaries,
      });
      
      setCurrentVersion(config.version);
      loadVersions(); // Refresh version list
      
      alert(`Configuration saved as Version ${config.version}`);
    } catch (err) {
      console.error('Failed to save configuration:', err);
      alert('Failed to save configuration');
    }
  };

  // Delete a version
  const deleteVersion = (version: number) => {
    if (confirm(`Are you sure you want to delete Version ${version}?`)) {
      try {
        CTCStorage.deleteVersion(version);
        loadVersions();
        
        // If we deleted the current version, load the latest
        if (currentVersion === version) {
          const latest = CTCStorage.getLatest();
          if (latest) {
            loadConfiguration(latest);
          } else {
            setCurrentVersion(null);
          }
        }
      } catch (err) {
        console.error('Failed to delete version:', err);
        alert('Failed to delete version');
      }
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

  const addSalaryVariation = () => {
    if (salaries.length < 5) {
      const lastSalary = salaries[salaries.length - 1];
      setSalaries([...salaries, lastSalary + 100000]);
    }
  };

  const removeSalaryVariation = (idx: number) => {
    if (salaries.length > 1) {
      setSalaries(salaries.filter((_, i) => i !== idx));
    }
  };

  return (
    <main className="flex min-h-screen flex-col lg:flex-row items-start justify-start px-6 py-8 md:p-12 gap-6 bg-black">
      {/* Left Sidebar - Tax Slabs (Desktop Only) */}
      {!loading && taxSlabData && (
        <aside className="hidden lg:block lg:w-80 bg-zinc-900 border border-zinc-800 rounded-lg p-6 sticky top-10">
          <h3 className="text-lg font-bold mb-4 text-white">Tax Slabs ({selectedYear})</h3>
          <div className="space-y-3">
            {taxSlabData.slabs.map((slab, index) => {
              const from = index === 0 ? 0 : taxSlabData.slabs[index - 1].upTo;
              return (
                <div key={index} className="border-l-4 border-blue-500 pl-3 py-2 bg-zinc-800/50 rounded">
                  <p className="text-sm font-semibold text-gray-200">
                    {slab.upTo === null || slab.upTo === Infinity 
                      ? `Above ₹${(from / 100000).toFixed(1)}L`
                      : `₹${(from / 100000).toFixed(1)}L - ₹${(slab.upTo / 100000).toFixed(1)}L`}
                  </p>
                  <p className="text-xs text-gray-400">Rate: {(slab.rate * 100)}%</p>
                </div>
              );
            })}
            <div className="mt-4 pt-4 border-t border-zinc-700 space-y-2">
              <p className="text-xs text-gray-400">
                <span className="font-semibold">Standard Deduction:</span> ₹{(taxSlabData.standardDeduction / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-400">
                <span className="font-semibold">Cess:</span> {(taxSlabData.cessRate * 100)}%
              </p>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex flex-col gap-2 text-left w-full lg:flex-1">
        {/* Header with Info Icon */}
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-white">Income Tax Calculator</h2>
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-blue-500 transition-colors"
              aria-label="Information"
            >
              i
            </button>
            {showTooltip && (
              <div className="absolute left-8 top-0 bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 w-64 shadow-xl z-10">
                <p className="font-semibold mb-1">📌 New Tax Regime Only</p>
                <p className="text-gray-300">Currently supporting the new tax regime for all calculations.</p>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Summary */}
        {!loading && taxSlabData && (
          <div className="mb-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300 flex-1">
                <div>
                  <span className="font-semibold text-gray-400">Assessment Year:</span> {selectedYear}
                </div>
                <div>
                  <span className="font-semibold text-gray-400">Previous CTC:</span> ₹{(previousSalary / 100000).toFixed(2)}L
                </div>
                <div>
                  <span className="font-semibold text-gray-400">PF Type:</span> {pfType === 'percentage' ? 'Percentage' : 'Fixed'}
                </div>
                <div>
                  <span className="font-semibold text-gray-400">PF Value:</span> {pfType === 'percentage' ? `${pfPercentage}%` : `₹${pfFixedAmount}/month`}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-shrink-0 px-3 py-1.5 bg-white text-black text-sm rounded-md hover:bg-gray-200 transition-colors hidden md:flex items-center gap-1 font-medium"
                title="Edit Configuration"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-shrink-0 md:hidden w-8 h-8 bg-white text-black rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                title="Edit Configuration"
              >
                ✏️
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-4">
            <p className="text-gray-400">Loading tax slabs...</p>
          </div>
        )}

        {/* Expected Salary Variations */}
        {!loading && taxSlabData && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-lg font-semibold text-white">Expected Salary Variations (Max 5)</h3>
              <div className="flex items-center gap-3 flex-wrap">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      viewMode === 'card'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    📊 Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    📋 Table
                  </button>
                </div>
                {salaries.length < 5 && (
                  <button
                    onClick={addSalaryVariation}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                  >
                    + Add Variation
                  </button>
                )}
              </div>
            </div>
            
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="mb-32 grid lg:mb-0 lg:w-full lg:grid-cols-3 xl:grid-cols-4 lg:text-left gap-4">
                {salaries?.map((salary, index) => {
                  const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                  return (
                    <div
                      key={index}
                      className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-3 relative hover:border-zinc-700 transition-colors"
                    >
                      {salaries.length > 1 && (
                        <button
                          onClick={() => removeSalaryVariation(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full hover:bg-red-500 flex items-center justify-center text-sm"
                          title="Remove this variation"
                        >
                          ×
                        </button>
                      )}
                      <label htmlFor={`newSalary-${index}`} className="text-gray-400 text-sm">
                        New CTC{" "}
                        <strong className="text-green-400">
                          {" "}
                          +{hike(salary, previousSalary).toFixed(2)}% Hike
                        </strong>
                      </label>
                      <input
                        id={`newSalary-${index}`}
                        type="number"
                        value={salary}
                        onChange={(e) => handleIncomeChange(e, index)}
                        className="border border-zinc-700 bg-zinc-800 p-2 mb-4 w-full text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your annual CTC"
                      />
                      <div className="text-left flex flex-col gap-2">
                        <p className="text-sm text-gray-400">
                          CTC (Annual): <span className="text-gray-300">{formatMoney(salary)}</span>
                        </p>
                        <p className="text-sm text-gray-400">
                          Employer PF: <span className="text-gray-300">{formatMoney(incomeDetails.monthlyEmployerPf)}</span>
                        </p>
                        <hr className="my-1 border-zinc-800" />
                        <p className="text-gray-400">
                          Gross Monthly Income :{"   "}
                          <span className="text-white font-semibold">
                            {formatMoney(incomeDetails.grossMonthlyIncome)}
                          </span>
                        </p>
                        <p className="text-gray-400">
                          Monthly Tax Deduction :{"   "}
                          <span className="text-red-400 font-semibold">
                            -{formatMoney(incomeDetails.monthlyTaxDeduction)}
                          </span>
                        </p>
                        <p className="text-gray-400">
                          Monthly PF (Employee) :{"   "}
                          <span className="text-orange-400 font-semibold">
                            -{formatMoney(incomeDetails.monthlyPfDeduction)}
                          </span>
                        </p>
                        <p className="font-semibold text-gray-400">
                          In-Hand Monthly Salary :{"   "}
                          <span className="text-green-400 text-lg">
                            {formatMoney(incomeDetails.inHandMonthlySalary)}
                          </span>
                        </p>
                        <hr className="my-1 border-zinc-800" />
                        <p className="font-semibold text-gray-400">
                          💸 Extra Cash (vs Previous) :{"   "}
                          <span className="text-cyan-400 text-lg">
                            +{formatMoney(incomeDetails.inHandMonthlySalary - calculateIncomeDetails(previousSalary, pfType, pfPercentage, pfFixedAmount).inHandMonthlySalary)}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="mb-32 lg:mb-0 -mx-6 md:mx-0">
                <div className="overflow-auto border border-zinc-800 rounded-lg px-4 md:px-0">
                  <table className="w-full border-collapse bg-zinc-900">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-white border-r-2 border-zinc-800 bg-zinc-900 sticky left-0 z-30 min-w-[180px]">
                          Metric
                        </th>
                        {salaries.map((salary, index) => (
                          <th key={index} className="pl-6 pr-2 py-3 text-left text-sm font-semibold text-white min-w-[180px]">
                            <div className="flex items-center justify-between">
                              <span>Variation {index + 1}</span>
                              {salaries.length > 1 && (
                                <button
                                  onClick={() => removeSalaryVariation(index)}
                                  className="ml-2 bg-red-600 text-white w-6 h-6 rounded-full hover:bg-red-500 flex items-center justify-center text-xs"
                                  title="Remove this variation"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-zinc-800/50 border-b border-zinc-800">
                        <td className="px-6 py-4 text-xs font-medium text-white border-r-2 border-zinc-800 bg-zinc-900 sticky left-0 z-30">
                          New CTC (Annual)
                        </td>
                        {salaries.map((salary, index) => (
                          <td key={index} className="pl-6 pr-2 py-4">
                            <input
                              type="number"
                              value={salary}
                              onChange={(e) => handleIncomeChange(e, index)}
                              className="border border-zinc-700 bg-zinc-800 p-2 w-full text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter CTC"
                            />
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-yellow-900/40 hover:bg-yellow-900/60 border-b border-zinc-800">
                        <td className="px-6 py-4 text-xs font-semibold text-white border-r-2 border-zinc-800 bg-yellow-900 sticky left-0 z-30">
                          📈 Hike (%)
                        </td>
                        {salaries.map((salary, index) => (
                          <td key={index} className="pl-6 pr-2 py-4 text-green-400 font-bold text-lg">
                            +{hike(salary, previousSalary).toFixed(1)}%
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-zinc-800/50 border-b border-zinc-800">
                        <td className="px-6 py-4 text-xs font-medium text-white border-r-2 border-zinc-800 bg-zinc-900 sticky left-0 z-30">
                          Employer PF (Monthly)
                        </td>
                        {salaries.map((salary, index) => {
                          const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                          return (
                            <td key={index} className="pl-6 pr-2 py-4 text-sm text-gray-400">
                              {formatMoney(incomeDetails.monthlyEmployerPf)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-blue-900/40 hover:bg-blue-900/60 border-b border-zinc-800">
                        <td className="px-6 py-4 text-xs font-semibold text-white border-r-2 border-zinc-800 bg-blue-900 sticky left-0 z-30">
                          💵 Gross Monthly
                        </td>
                        {salaries.map((salary, index) => {
                          const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                          return (
                            <td key={index} className="pl-6 pr-2 py-4 text-sm font-semibold text-white">
                              {formatMoney(incomeDetails.grossMonthlyIncome)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="hover:bg-zinc-800/50 border-b border-zinc-800">
                        <td className="px-6 py-4 text-xs font-medium text-white border-r-2 border-zinc-800 bg-zinc-900 sticky left-0 z-30">
                          Tax (Monthly)
                        </td>
                        {salaries.map((salary, index) => {
                          const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                          return (
                            <td key={index} className="pl-6 pr-2 py-4 text-sm text-red-400">
                              -{formatMoney(incomeDetails.monthlyTaxDeduction)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="hover:bg-zinc-800/50 border-b border-zinc-800">
                        <td className="px-6 py-4 text-xs font-medium text-white border-r-2 border-zinc-800 bg-zinc-900 sticky left-0 z-30">
                          PF (Employee)
                        </td>
                        {salaries.map((salary, index) => {
                          const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                          return (
                            <td key={index} className="pl-6 pr-2 py-4 text-sm text-orange-400">
                              -{formatMoney(incomeDetails.monthlyPfDeduction)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-green-900/40 hover:bg-green-900/60">
                        <td className="px-6 py-4 text-xs font-bold text-white border-r-2 border-zinc-800 bg-green-900 sticky left-0 z-30">
                          💰 In-Hand Monthly
                        </td>
                        {salaries.map((salary, index) => {
                          const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                          return (
                            <td key={index} className="pl-6 pr-2 py-4 text-base font-bold text-green-400">
                              {formatMoney(incomeDetails.inHandMonthlySalary)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-cyan-900/40 hover:bg-cyan-900/60 border-t-2 border-cyan-700">
                        <td className="px-6 py-4 text-xs font-bold text-white border-r-2 border-zinc-800 bg-cyan-900 sticky left-0 z-30">
                          💸 Extra Cash (vs Previous)
                        </td>
                        {salaries.map((salary, index) => {
                          const currentDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                          const previousDetails = calculateIncomeDetails(previousSalary, pfType, pfPercentage, pfFixedAmount);
                          const extraCash = currentDetails.inHandMonthlySalary - previousDetails.inHandMonthlySalary;
                          const isPositive = extraCash > 0;
                          return (
                            <td key={index} className={`px-6 py-4 text-base font-bold ${isPositive ? 'text-cyan-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{formatMoney(extraCash)}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Edit Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-white text-black w-16 h-16 rounded-full shadow-2xl hover:bg-gray-200 transition-all hover:scale-110 flex items-center justify-center text-2xl border border-zinc-800"
        title="Edit Configuration"
      >
        ⚙️
      </button>

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Configuration Settings</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Version Management */}
              {versions.length > 0 && (
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">Saved Configurations</h3>
                    <span className="text-sm text-gray-400">
                      Current: {currentVersion ? `Version ${currentVersion}` : 'Unsaved'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {versions.map(v => (
                      <div key={v.version} className="flex items-center gap-1">
                        <button
                          onClick={() => loadVersion(v.version)}
                          className={`px-3 py-2 rounded border text-sm ${
                            currentVersion === v.version
                              ? 'bg-white text-black border-white'
                              : 'bg-zinc-800 text-gray-300 border-zinc-700 hover:bg-zinc-700'
                          }`}
                        >
                          V{v.version}
                        </button>
                        <button
                          onClick={() => deleteVersion(v.version)}
                          className="px-2 py-2 bg-red-600 text-white rounded hover:bg-red-500 text-xs"
                          title="Delete version"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment Year Selector */}
              <div>
                <label htmlFor="assessmentYear" className="block mb-2 font-medium text-gray-300">
                  Assessment Year
                </label>
                <select
                  id="assessmentYear"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border border-zinc-700 bg-zinc-800 p-2 w-full text-white rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={loading || assessmentYears.length === 0}
                >
                  {assessmentYears.map((year) => (
                    <option key={year.year} value={year.year}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previous CTC */}
              <div>
                <label htmlFor="previousSalary" className="block mb-2 font-medium text-gray-300">
                  Previous CTC (Annual)
                </label>
                <input
                  id="previousSalary"
                  type="number"
                  value={previousSalary}
                  onChange={(e) => setPreviousSalary(parseFloat(e.target.value))}
                  className="border border-zinc-700 bg-zinc-800 p-2 w-full text-white rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your previous annual CTC"
                />
              </div>
              
              {/* PF Type Selector */}
              <div>
                <label htmlFor="pfType" className="block mb-2 font-medium text-gray-300">
                  PF Contribution Type
                </label>
                <select
                  id="pfType"
                  value={pfType}
                  onChange={(e) => setPfType(e.target.value as 'percentage' | 'fixed')}
                  className="border border-zinc-700 bg-zinc-800 p-2 w-full text-white rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage of Salary</option>
                  <option value="fixed">Fixed Monthly Amount</option>
                </select>
              </div>

              {/* PF Value Input */}
              {pfType === 'percentage' ? (
                <div>
                  <label htmlFor="pfPercentage" className="block mb-2 font-medium text-gray-300">
                    PF Contribution (%)
                  </label>
                  <input
                    id="pfPercentage"
                    type="number"
                    value={pfPercentage}
                    onChange={(e) => setPfPercentage(parseFloat(e.target.value))}
                    className="border border-zinc-700 bg-zinc-800 p-2 w-full text-white rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PF percentage (e.g., 12)"
                    min="0"
                    max="100"
                    step="0.5"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="pfFixedAmount" className="block mb-2 font-medium text-gray-300">
                    Monthly PF Amount (₹)
                  </label>
                  <input
                    id="pfFixedAmount"
                    type="number"
                    value={pfFixedAmount}
                    onChange={(e) => setPfFixedAmount(parseFloat(e.target.value))}
                    className="border border-zinc-700 bg-zinc-800 p-2 w-full text-white rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter monthly PF amount (e.g., 1800)"
                    min="0"
                    step="100"
                  />
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex gap-3">
              <button
                onClick={saveConfiguration}
                className="flex-1 bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-gray-200 transition-colors"
              >
                💾 Save Configuration
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-zinc-800 text-white border border-zinc-700 rounded-md font-semibold hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
