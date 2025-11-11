"use client";
import { useState, useEffect } from "react";
import { TrendingUp, Wallet, Receipt, Coins, DollarSign, PiggyBank, ArrowUpRight, Settings, Info, X, Plus, BarChart3, Table as TableIcon, Check, AlertCircle, ChevronDown, ChevronUp, Minus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showTaxSlabs, setShowTaxSlabs] = useState<boolean>(false);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState<number>(0);

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Auto-detect view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setViewMode('table');
      } else {
        setViewMode('card');
      }
    };
    
    // Set initial view mode
    handleResize();
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load configurations from localStorage on mount
  useEffect(() => {
    loadVersions();
    const latest = CTCStorage.getLatest();
    if (latest) {
      loadConfiguration(latest);
    } else {
      // Open modal for first-time users
      setIsModalOpen(true);
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
      
      showToast(`Configuration saved as Version ${config.version}`, 'success');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save configuration:', err);
      showToast('Failed to save configuration', 'error');
    }
  };

  // Delete a version
  const deleteVersion = (version: number) => {
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
      
      showToast(`Version ${version} deleted`, 'success');
    } catch (err) {
      console.error('Failed to delete version:', err);
      showToast('Failed to delete version', 'error');
    }
  };
  
  const hike = (newSalary: number, previousSalary: number): number => {
    return previousSalary > 0
      ? ((newSalary - previousSalary) / previousSalary) * 100
      : 0;
  };

  /**
   * Calculate Rebate under Section 87A
   * 
   * @param taxableIncome - Income after standard deduction
   * @param slabTaxBeforeCess - Regular slab tax (before cess, excluding special-rate income)
   * @param rebateConfig - Rebate configuration from tax slab data (amount cap & income threshold)
   * @param isResidentIndividual - Residency status (rebate only for resident individuals)
   * @returns Rebate amount between 0 and the year's cap
   */
  const calculateRebate87A = (
    taxableIncome: number,
    slabTaxBeforeCess: number,
    rebateConfig: { amount: number; incomeThreshold: number } | undefined,
    isResidentIndividual: boolean = true
  ): number => {
    // Validation: Input sanitization
    if (
      taxableIncome < 0 ||
      slabTaxBeforeCess < 0 ||
      isNaN(taxableIncome) ||
      isNaN(slabTaxBeforeCess)
    ) {
      console.error('Invalid rebate calculation inputs', { taxableIncome, slabTaxBeforeCess });
      return 0;
    }

    // No rebate config available
    if (!rebateConfig) {
      return 0;
    }

    const { amount: maxRebate, incomeThreshold } = rebateConfig;

    // Eligibility Rule 1: Non-resident individuals are not eligible
    if (!isResidentIndividual) {
      return 0;
    }

    // Eligibility Rule 2: Cliff rule - income must be ≤ threshold
    // If income exceeds threshold by even ₹1, rebate = 0
    if (taxableIncome > incomeThreshold) {
      return 0;
    }

    // Eligibility Rule 3: No tax, no rebate
    if (slabTaxBeforeCess <= 0) {
      return 0;
    }

    // Rebate Amount Rule: min(slab tax, max rebate cap)
    // Cannot exceed the actual tax liability or the year's cap
    const rebateAmount = Math.min(slabTaxBeforeCess, maxRebate);

    // Guard: Ensure rebate is non-negative and doesn't exceed tax
    const finalRebate = Math.max(0, Math.min(rebateAmount, slabTaxBeforeCess));

    return Math.round(finalRebate); // Round to nearest rupee
  };

  /**
   * Centralized Tax Calculation Function
   * Calculates all tax-related details for a given annual income
   * Returns both detailed breakdown and monthly income details
   */
  const calculateTaxDetails = (annualIncome: number, pfType: 'percentage' | 'fixed', pfPercent: number, pfFixed: number) => {
    if (!taxSlabData) {
      return {
        // Slab breakdown
        slabDetails: [],
        totalTax: 0,
        rebateAmount: 0,
        taxAfterRebate: 0,
        cess: 0,
        totalTaxWithCess: 0,
        taxableIncome: 0,
        // Monthly details
        grossMonthlyIncome: 0,
        monthlyTaxDeduction: 0,
        monthlyPfDeduction: 0,
        monthlyEmployerPf: 0,
        inHandMonthlySalary: 0,
      };
    }

    const { standardDeduction, cessRate, slabs } = taxSlabData;

    // 1. Calculate PF contributions
    let monthlyEmployerPf = 0;
    let monthlyEmployeePf = 0;
    let actualGrossAnnual = annualIncome;
    
    if (pfType === 'percentage') {
      monthlyEmployerPf = (annualIncome * pfPercent) / 100 / 12;
      actualGrossAnnual = annualIncome - (monthlyEmployerPf * 12);
      monthlyEmployeePf = (actualGrossAnnual * pfPercent) / 100 / 12;
    } else {
      monthlyEmployeePf = pfFixed;
      monthlyEmployerPf = pfFixed;
      actualGrossAnnual = annualIncome - (monthlyEmployerPf * 12);
    }
    
    // 2. Calculate taxable income
    const taxableIncome = Math.max(0, actualGrossAnnual - standardDeduction);

    // 3. Calculate tax slab-by-slab with detailed breakdown
    const slabDetails: { range: string; taxableAmount: number; rate: number; tax: number }[] = [];
    let totalTax = 0;
    let remainingIncome = taxableIncome;
    let previousLimit = 0;

    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];
      
      if (remainingIncome <= 0) break;

      // Handle the last slab (Infinity)
      if (slab.upTo === null || slab.upTo === Infinity) {
        const taxInSlab = remainingIncome * slab.rate;
        slabDetails.push({
          range: `Above ₹${(previousLimit / 100000).toFixed(1)}L`,
          taxableAmount: remainingIncome,
          rate: slab.rate * 100,
          tax: taxInSlab,
        });
        totalTax += taxInSlab;
        break;
      }

      const slabRange = slab.upTo - previousLimit;
      
      if (remainingIncome > slabRange) {
        const taxInSlab = slabRange * slab.rate;
        slabDetails.push({
          range: `₹${(previousLimit / 100000).toFixed(1)}L - ₹${(slab.upTo / 100000).toFixed(1)}L`,
          taxableAmount: slabRange,
          rate: slab.rate * 100,
          tax: taxInSlab,
        });
        totalTax += taxInSlab;
        remainingIncome -= slabRange;
        previousLimit = slab.upTo;
      } else {
        const taxInSlab = remainingIncome * slab.rate;
        slabDetails.push({
          range: `₹${(previousLimit / 100000).toFixed(1)}L - ₹${(slab.upTo / 100000).toFixed(1)}L`,
          taxableAmount: remainingIncome,
          rate: slab.rate * 100,
          tax: taxInSlab,
        });
        totalTax += taxInSlab;
        break;
      }
    }

    // 4. Apply rebate under Section 87A (before cess)
    const rebateAmount = calculateRebate87A(
      taxableIncome,
      totalTax,
      taxSlabData.rebate,
      true // Assuming resident individual
    );

    // 5. Calculate tax after rebate
    const taxAfterRebate = Math.max(0, totalTax - rebateAmount);

    // 6. Calculate cess on tax after rebate
    const cess = taxAfterRebate * cessRate;

    // 7. Total tax including cess
    const totalTaxWithCess = taxAfterRebate + cess;

    // 8. Calculate monthly details
    const grossMonthlyIncome = actualGrossAnnual / 12;
    const monthlyTaxDeduction = totalTaxWithCess / 12;
    const inHandMonthlySalary = grossMonthlyIncome - monthlyTaxDeduction - monthlyEmployeePf;

    return {
      // Slab breakdown
      slabDetails,
      totalTax,
      rebateAmount,
      taxAfterRebate,
      cess,
      totalTaxWithCess,
      taxableIncome,
      // Monthly details
      grossMonthlyIncome,
      monthlyTaxDeduction,
      monthlyPfDeduction: monthlyEmployeePf,
      monthlyEmployerPf,
      inHandMonthlySalary,
    };
  };

  // Legacy function - kept for backward compatibility, uses centralized logic
  const calculateIncomeDetails = (annualIncome: number, pfType: 'percentage' | 'fixed', pfPercent: number, pfFixed: number) => {
    const details = calculateTaxDetails(annualIncome, pfType, pfPercent, pfFixed);
    return {
      grossMonthlyIncome: details.grossMonthlyIncome,
      monthlyTaxDeduction: details.monthlyTaxDeduction,
      monthlyPfDeduction: details.monthlyPfDeduction,
      monthlyEmployerPf: details.monthlyEmployerPf,
      inHandMonthlySalary: details.inHandMonthlySalary,
    };
  };

  // Legacy function - kept for backward compatibility, uses centralized logic
  const calculateTaxBreakdown = (annualIncome: number, pfType: 'percentage' | 'fixed', pfPercent: number, pfFixed: number) => {
    const details = calculateTaxDetails(annualIncome, pfType, pfPercent, pfFixed);
    return {
      slabDetails: details.slabDetails,
      totalTax: details.totalTax,
      cess: details.cess,
      rebateAmount: details.rebateAmount,
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

  const adjustSalary = (idx: number, amount: number) => {
    setSalaries((prevSalaries) => {
      const updatedSalaries = [...prevSalaries];
      updatedSalaries[idx] = Math.max(0, updatedSalaries[idx] + amount);
      return updatedSalaries;
    });
  };

  return (
    <main className="flex min-h-screen flex-col lg:flex-row items-start justify-start px-6 py-8 md:p-12 gap-6 bg-black">
            {/* Left Sidebar - Tax Slabs (Desktop Only) */}
      {!loading && taxSlabData && salaries.length > 0 && (
        <aside className="hidden lg:block lg:w-80 bg-zinc-900 border border-zinc-800 rounded-lg p-4 sticky top-10 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">Tax Breakdown</h3>
            <span className="text-[10px] text-gray-400">Variation {selectedVariationIndex + 1}</span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setSelectedVariationIndex(Math.max(0, selectedVariationIndex - 1))}
              disabled={selectedVariationIndex === 0}
              className="flex-1 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-xs text-gray-300"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => setSelectedVariationIndex(Math.min(salaries.length - 1, selectedVariationIndex + 1))}
              disabled={selectedVariationIndex === salaries.length - 1}
              className="flex-1 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-xs text-gray-300"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Salary Info */}
          <div className="mb-3 p-2.5 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <p className="text-[10px] text-blue-300 mb-0.5">CTC (Annual)</p>
            <p className="text-base font-bold text-white">{formatMoney(salaries[selectedVariationIndex])}</p>
          </div>

          {/* Tax Breakdown by Slab */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-300 mb-2">Tax Calculation</h4>
            {(() => {
              const breakdown = calculateTaxBreakdown(salaries[selectedVariationIndex], pfType, pfPercentage, pfFixedAmount);
              return (
                <>
                  {breakdown.slabDetails.map((detail, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-2 py-1.5 bg-zinc-800/50 rounded">
                      <p className="text-xs font-semibold text-gray-200">{detail.range}</p>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-[10px] text-gray-400">
                          {formatMoney(detail.taxableAmount)} @ {detail.rate}%
                        </p>
                        <p className="text-xs font-semibold text-red-400">
                          {formatMoney(detail.tax)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-3 pt-3 border-t border-zinc-700 space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">Subtotal:</span>
                      <span className="font-semibold text-white">{formatMoney(breakdown.totalTax)}</span>
                    </div>
                    {breakdown.rebateAmount && breakdown.rebateAmount > 0 && (
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400">Rebate u/s 87A:</span>
                        <span className="font-semibold text-green-400">-{formatMoney(breakdown.rebateAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400">Cess ({(taxSlabData.cessRate * 100)}%):</span>
                      <span className="font-semibold text-white">{formatMoney(breakdown.cess)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1.5 border-t border-zinc-700">
                      <span className="text-gray-300 font-semibold">Total Tax:</span>
                      <span className="font-bold text-red-400">{formatMoney(breakdown.cess + Math.max(0, breakdown.totalTax - (breakdown.rebateAmount || 0)))}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Std. Deduction: ₹{(taxSlabData.standardDeduction / 1000).toFixed(0)}k applied
                    </div>
                    {taxSlabData.rebate && (
                      <div className="text-[10px] text-gray-500 mt-1">
                        Rebate: Eligible if income ≤ ₹{(taxSlabData.rebate.incomeThreshold / 100000).toFixed(1)}L (max ₹{(taxSlabData.rebate.amount / 1000).toFixed(1)}k)
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
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
              className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
              aria-label="Information"
            >
              <Info className="w-4 h-4" />
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
          <>
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
                  <Settings className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex-shrink-0 md:hidden w-11 h-11 bg-white text-black rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                  title="Edit Configuration"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Tax Slabs Accordion */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowTaxSlabs(!showTaxSlabs)}
                className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-white">Tax Breakdown</span>
                  <span className="text-xs text-gray-400">• Variation {selectedVariationIndex + 1}</span>
                </div>
                {showTaxSlabs ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {showTaxSlabs && salaries.length > 0 && (
                <div className="mt-2 p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3">
                  {/* Navigation Controls */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setSelectedVariationIndex(Math.max(0, selectedVariationIndex - 1))}
                      disabled={selectedVariationIndex === 0}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-sm text-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button
                      onClick={() => setSelectedVariationIndex(Math.min(salaries.length - 1, selectedVariationIndex + 1))}
                      disabled={selectedVariationIndex === salaries.length - 1}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-sm text-gray-300"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Current Salary */}
                  <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg mb-3">
                    <p className="text-xs text-blue-300 mb-1">CTC (Annual)</p>
                    <p className="text-base font-bold text-white">{formatMoney(salaries[selectedVariationIndex])}</p>
                  </div>

                  {/* Tax Breakdown */}
                  {(() => {
                    const breakdown = calculateTaxBreakdown(salaries[selectedVariationIndex], pfType, pfPercentage, pfFixedAmount);
                    return (
                      <>
                        {breakdown.slabDetails.map((detail, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-2 py-1.5 bg-zinc-800/50 rounded">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-gray-200">{detail.range}</p>
                              <p className="text-xs font-semibold text-red-400">{formatMoney(detail.tax)}</p>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[10px] text-gray-400">
                                {formatMoney(detail.taxableAmount)} @ {detail.rate}%
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-3 pt-3 border-t border-zinc-700 space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-400">Subtotal:</span>
                            <span className="font-semibold text-white">{formatMoney(breakdown.totalTax)}</span>
                          </div>
                          {breakdown.rebateAmount && breakdown.rebateAmount > 0 && (
                            <div className="flex justify-between text-[10px]">
                              <span className="text-gray-400">Rebate u/s 87A:</span>
                              <span className="font-semibold text-green-400">-{formatMoney(breakdown.rebateAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-400">Cess ({(taxSlabData.cessRate * 100)}%):</span>
                            <span className="font-semibold text-white">{formatMoney(breakdown.cess)}</span>
                          </div>
                          <div className="flex justify-between text-sm pt-1.5 border-t border-zinc-700">
                            <span className="text-gray-300 font-semibold">Total Tax:</span>
                            <span className="font-bold text-red-400">{formatMoney(breakdown.cess + Math.max(0, breakdown.totalTax - (breakdown.rebateAmount || 0)))}</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            Std. Deduction: ₹{(taxSlabData.standardDeduction / 1000).toFixed(0)}k applied
                          </div>
                          {taxSlabData.rebate && (
                            <div className="text-[10px] text-gray-500 mt-1 p-1.5 bg-zinc-800/50 rounded border border-zinc-700/50">
                              <span className="text-blue-400 font-semibold">💡 Rebate:</span> Eligible if income ≤ ₹{(taxSlabData.rebate.incomeThreshold / 100000).toFixed(1)}L (max ₹{(taxSlabData.rebate.amount / 1000).toFixed(1)}k)
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </>
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
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      viewMode === 'card'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      viewMode === 'table'
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <TableIcon className="w-4 h-4" />
                    Table
                  </button>
                </div>
                {salaries.length < 5 && (
                  <button
                    onClick={addSalaryVariation}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Variation
                  </button>
                )}
              </div>
            </div>
            
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="mb-32 grid lg:mb-0 lg:w-full lg:grid-cols-3 xl:grid-cols-4 lg:text-left gap-4">
                {salaries?.map((salary, index) => {
                  const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                  const isSelected = index === selectedVariationIndex;
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedVariationIndex(index)}
                      className={`p-4 bg-zinc-900 border-2 rounded-lg flex flex-col gap-3 relative transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {salaries.length > 1 && (
                        <button
                          onClick={() => removeSalaryVariation(index)}
                          className="absolute top-2 right-2 border-2 border-red-500/50 text-red-400 w-9 h-9 rounded-lg hover:bg-red-500/10 hover:border-red-500 flex items-center justify-center transition-all"
                          title="Remove this variation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <label htmlFor={`newSalary-${index}`} className="text-gray-400 text-sm">
                        New CTC{" "}
                        {(() => {
                          const hikePercentage = hike(salary, previousSalary);
                          const isPositive = hikePercentage >= 0;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full font-semibold text-xs ${
                              isPositive 
                                ? 'bg-green-900/50 border-green-700 text-green-400' 
                                : 'bg-red-900/50 border-red-700 text-red-400'
                            }`}>
                              <TrendingUp className="w-3 h-3" />
                              {isPositive ? '+' : ''}{hikePercentage.toFixed(1)}% Hike
                            </span>
                          );
                        })()}
                      </label>
                      <div className="flex gap-1.5 mb-4 items-stretch">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustSalary(index, -50000);
                          }}
                          className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-gray-300 hover:bg-zinc-700 hover:border-zinc-600 transition-colors flex items-center justify-center gap-0.5 whitespace-nowrap"
                        >
                          <Minus className="w-3 h-3" /> 50k
                        </button>
                        <input
                          id={`newSalary-${index}`}
                          type="number"
                          value={salary}
                          onChange={(e) => handleIncomeChange(e, index)}
                          onClick={(e) => e.stopPropagation()}
                          className="border border-zinc-700 bg-zinc-800 p-2 flex-1 min-w-0 w-3 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your annual CTC"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            adjustSalary(index, 50000);
                          }}
                          className="px-2.5 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-xs text-gray-300 hover:bg-zinc-700 hover:border-zinc-600 transition-colors flex items-center justify-center gap-0.5 whitespace-nowrap"
                        >
                          <Plus className="w-3 h-3" /> 50k
                        </button>
                      </div>
                      <div className="text-left flex flex-col gap-2">
                        <p className="text-xs text-gray-500">
                          CTC (Annual): <span className="text-gray-300">{formatMoney(salary)}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Employer PF: <span className="text-gray-300">{formatMoney(incomeDetails.monthlyEmployerPf)}</span>
                        </p>
                        <hr className="my-1 border-zinc-800" />
                        <p className="text-xs text-gray-500">
                          Gross Monthly Income :{"   "}
                          <span className="text-white font-semibold">
                            {formatMoney(incomeDetails.grossMonthlyIncome)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Monthly Tax Deduction :{"   "}
                          <span className="text-red-400 font-semibold">
                            -{formatMoney(incomeDetails.monthlyTaxDeduction)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Monthly PF (Employee) :{"   "}
                          <span className="text-orange-400 font-semibold">
                            -{formatMoney(incomeDetails.monthlyPfDeduction)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          In-Hand/Monthly :{"   "}
                          <span className="text-green-400 text-base font-semibold">
                            {formatMoney(incomeDetails.inHandMonthlySalary)}
                          </span>
                        </p>
                        <hr className="my-1 border-zinc-800" />
                        <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-700/50 rounded-lg p-3 mt-2">
                          <p className="text-xs text-cyan-300/80 mb-1">Extra Cash vs Previous</p>
                          <p className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5" />
                            +{formatMoney(incomeDetails.inHandMonthlySalary - calculateIncomeDetails(previousSalary, pfType, pfPercentage, pfFixedAmount).inHandMonthlySalary)}
                          </p>
                          <p className="text-xs text-cyan-300/60 mt-1">per month</p>
                        </div>
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
                        {salaries.map((salary, index) => {
                          const isSelected = index === selectedVariationIndex;
                          return (
                            <th 
                              key={index} 
                              onClick={() => setSelectedVariationIndex(index)}
                              className={`pl-6 pr-2 py-3 text-left text-sm font-semibold text-white min-w-[180px] cursor-pointer transition-all ${
                                isSelected ? 'bg-blue-900/30 border-t-4 border-t-blue-500' : 'hover:bg-zinc-800/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>Variation {index + 1}</span>
                                {salaries.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSalaryVariation(index);
                                    }}
                                    className="ml-2 border-2 border-red-500/50 text-red-400 w-9 h-9 rounded-lg hover:bg-red-500/10 hover:border-red-500 flex items-center justify-center transition-all"
                                    title="Remove this variation"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-zinc-800/50 border-b border-zinc-800">
                        <td className="px-6 py-4 text-xs font-medium text-white border-r-2 border-zinc-800 bg-zinc-900 sticky left-0 z-30">
                          New CTC (Annual)
                        </td>
                        {salaries.map((salary, index) => {
                          const isSelected = index === selectedVariationIndex;
                          return (
                            <td 
                              key={index} 
                              onClick={() => setSelectedVariationIndex(index)}
                              className={`pl-6 pr-2 py-4 cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-900/20' : ''
                              }`}
                            >
                              <input
                                type="number"
                                value={salary}
                                onChange={(e) => handleIncomeChange(e, index)}
                                className="border border-zinc-700 bg-zinc-800 p-2 w-full text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter CTC"
                              />
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-yellow-900/40 hover:bg-yellow-900/60 border-b border-zinc-800">
                        <td className="px-6 py-4 text-xs font-semibold text-white border-r-2 border-zinc-800 bg-yellow-900 sticky left-0 z-30">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Hike (%)
                          </div>
                        </td>
                        {salaries.map((salary, index) => {
                          const hikePercentage = hike(salary, previousSalary);
                          const isPositive = hikePercentage >= 0;
                          const isSelected = index === selectedVariationIndex;
                          return (
                            <td 
                              key={index} 
                              onClick={() => setSelectedVariationIndex(index)}
                              className={`pl-6 pr-2 py-4 font-bold text-lg cursor-pointer transition-colors ${
                                isPositive ? 'text-green-400' : 'text-red-400'
                              } ${isSelected ? 'bg-blue-900/20' : ''}`}
                            >
                              {isPositive ? '+' : ''}{hikePercentage.toFixed(1)}%
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="hover:bg-zinc-800/50 border-b border-zinc-800">
                        <td className="px-6 py-4 text-xs font-medium text-white border-r-2 border-zinc-800 bg-zinc-900 sticky left-0 z-30">
                          Employer PF (Monthly)
                        </td>
                        {salaries.map((salary, index) => {
                          const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                          const isSelected = index === selectedVariationIndex;
                          return (
                            <td 
                              key={index} 
                              onClick={() => setSelectedVariationIndex(index)}
                              className={`pl-6 pr-2 py-4 text-sm text-gray-400 cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-900/20' : ''
                              }`}
                            >
                              {formatMoney(incomeDetails.monthlyEmployerPf)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-blue-900/40 hover:bg-blue-900/60 border-b border-zinc-800">
                        <td className="px-6 py-4 text-xs font-semibold text-white border-r-2 border-zinc-800 bg-blue-900 sticky left-0 z-30">
                          <div className="flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5" />
                            Gross Monthly
                          </div>
                        </td>
                        {salaries.map((salary, index) => {
                          const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                          const isSelected = index === selectedVariationIndex;
                          return (
                            <td 
                              key={index} 
                              onClick={() => setSelectedVariationIndex(index)}
                              className={`pl-6 pr-2 py-4 text-sm font-semibold text-white cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-900/30' : ''
                              }`}
                            >
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
                          const isSelected = index === selectedVariationIndex;
                          return (
                            <td 
                              key={index} 
                              onClick={() => setSelectedVariationIndex(index)}
                              className={`pl-6 pr-2 py-4 text-sm text-red-400 cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-900/20' : ''
                              }`}
                            >
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
                          const isSelected = index === selectedVariationIndex;
                          return (
                            <td 
                              key={index} 
                              onClick={() => setSelectedVariationIndex(index)}
                              className={`pl-6 pr-2 py-4 text-sm text-orange-400 cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-900/20' : ''
                              }`}
                            >
                              -{formatMoney(incomeDetails.monthlyPfDeduction)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-green-900/40 hover:bg-green-900/60">
                        <td className="px-6 py-4 text-xs font-bold text-white border-r-2 border-zinc-800 bg-green-900 sticky left-0 z-30">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            In-Hand Monthly
                          </div>
                        </td>
                        {salaries.map((salary, index) => {
                          const incomeDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                          const isSelected = index === selectedVariationIndex;
                          return (
                            <td 
                              key={index} 
                              onClick={() => setSelectedVariationIndex(index)}
                              className={`pl-6 pr-2 py-4 text-base font-bold text-green-400 cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-900/30' : ''
                              }`}
                            >
                              {formatMoney(incomeDetails.inHandMonthlySalary)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="bg-cyan-900/40 hover:bg-cyan-900/60 border-t-2 border-cyan-700">
                        <td className="px-6 py-4 text-xs font-bold text-white border-r-2 border-zinc-800 bg-cyan-900 sticky left-0 z-30">
                          <div className="flex items-center gap-1.5">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Extra Cash (vs Previous)
                          </div>
                        </td>
                        {salaries.map((salary, index) => {
                          const currentDetails = calculateIncomeDetails(salary, pfType, pfPercentage, pfFixedAmount);
                          const previousDetails = calculateIncomeDetails(previousSalary, pfType, pfPercentage, pfFixedAmount);
                          const extraCash = currentDetails.inHandMonthlySalary - previousDetails.inHandMonthlySalary;
                          const isPositive = extraCash > 0;
                          const isSelected = index === selectedVariationIndex;
                          return (
                            <td 
                              key={index} 
                              onClick={() => setSelectedVariationIndex(index)}
                              className={`px-6 py-4 text-base font-bold cursor-pointer transition-colors ${
                                isPositive ? 'text-cyan-400' : 'text-red-400'
                              } ${isSelected ? 'bg-blue-900/30' : ''}`}
                            >
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

      {/* Floating Edit Button - Hidden on mobile since we have it in header */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 bg-white text-black w-16 h-16 rounded-full shadow-2xl hover:bg-gray-200 transition-all hover:scale-110 items-center justify-center border border-zinc-800 z-40"
        title="Edit Configuration"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 right-8 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border ${
            toast.type === 'success' 
              ? 'bg-green-900 border-green-700 text-green-100' 
              : 'bg-red-900 border-red-700 text-red-100'
          }`}>
            {toast.type === 'success' ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Configuration Settings</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
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
                          className="p-2 border-2 border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 hover:border-red-500 transition-all"
                          title="Delete version"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                className="flex-1 bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <PiggyBank className="w-4 h-4" />
                Save Configuration
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
