import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { TestRunner, TestResult } from '../../services/testRunner';

export const TestRunnerView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [totalPassed, setTotalPassed] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);

  const executeTests = async () => {
    setIsRunning(true);
    try {
      const suiteResults = await TestRunner.runAllTests();
      setResults(suiteResults.results);
      setTotalPassed(suiteResults.totalPassed);
      setTotalFailed(suiteResults.totalFailed);
      setLastRunTime(new Date().toLocaleTimeString());
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    executeTests();
  }, []);

  const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-stone-900">
              Automated Business Logic Verification Suite
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real assertion tests verifying RBAC permissions, negative-stock prevention, checkout price validation, duplicate order idempotency, outbox queueing, and cancellation restock transitions.
          </p>
        </div>

        <button
          onClick={executeTests}
          disabled={isRunning}
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running Assertions...' : 'Re-Run All 8 Tests'}</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Total Tests</span>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">{results.length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase">Passed Assertions</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{totalPassed}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase">Failed</span>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{totalFailed}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-xs">
          <span className="text-[11px] font-bold text-stone-500 uppercase">Execution Time</span>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">
            {totalDuration} <span className="text-xs font-normal text-stone-500">ms</span>
          </p>
        </div>
      </div>

      {/* Test Results Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Test Case Results & Diagnostics
          </span>
          {lastRunTime && (
            <span className="text-[11px] text-stone-500 font-mono">
              Last executed at {lastRunTime}
            </span>
          )}
        </div>

        <div className="divide-y divide-stone-100">
          {results.map((result, idx) => (
            <div key={idx} className="p-4 flex items-start justify-between gap-4 hover:bg-stone-50/60 transition-colors">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  {result.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                      {result.suite}
                    </span>
                    <h4 className="text-xs font-bold text-stone-900">{result.name}</h4>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed font-mono">
                    {result.message}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                    result.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {result.passed ? 'PASSED' : 'FAILED'}
                </span>
                <span className="block text-[10px] text-stone-400 font-mono mt-1">
                  {result.durationMs}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
