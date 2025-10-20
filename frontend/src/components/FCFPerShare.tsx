/**
 * Free Cash Flow Per Share Component
 * Shows FCF per share and calculates annual cash flow based on shares owned
 */

import React, { useState } from "react";
import { useFCFPerShare } from "../hooks/queries";
import "../styles/FCFPerShare.css";

interface FCFPerShareProps {
  ticker: string;
}

export const FCFPerShare: React.FC<FCFPerShareProps> = ({ ticker }) => {
  const { data, isLoading, error } = useFCFPerShare(ticker);
  const [sharesOwned, setSharesOwned] = useState<string>("");

  // Format currency
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format large numbers (millions)
  const formatMillions = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate annual cash flow based on shares owned
  const calculateAnnualCashFlow = (): number | null => {
    if (!data?.fcf_per_share || !sharesOwned || parseFloat(sharesOwned) <= 0) {
      return null;
    }
    return data.fcf_per_share * parseFloat(sharesOwned);
  };

  const annualCashFlow = calculateAnnualCashFlow();

  if (isLoading) {
    return (
      <div className="fcf-per-share-card loading">
        <div className="loading-spinner"></div>
        <p>Loading Free Cash Flow data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fcf-per-share-card error">
        <h3>Free Cash Flow Per Share</h3>
        <p className="error-message">
          {error.message || "Unable to load FCF per share data"}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="fcf-per-share-card">
      <div className="card-header">
        <h3>Free Cash Flow Per Share</h3>
        {data.year && <span className="year-badge">Fiscal Year {data.year}</span>}
      </div>

      <div className="fcf-metrics">
        <div className="metric-row">
          <div className="metric-item">
            <span className="metric-label">Total Free Cash Flow</span>
            <span className="metric-value primary">
              {formatMillions(data.free_cash_flow)}M
            </span>
          </div>

          <div className="metric-item">
            <span className="metric-label">Shares Outstanding</span>
            <span className="metric-value">
              {formatMillions(data.shares_outstanding)}M
            </span>
          </div>

          <div className="metric-item highlight">
            <span className="metric-label">FCF Per Share</span>
            <span className="metric-value large">
              {formatCurrency(data.fcf_per_share)}
            </span>
          </div>
        </div>
      </div>

      <div className="calculator-section">
        <h4>Calculate Your Annual Cash Flow</h4>
        <p className="calculator-description">
          Enter the number of shares you plan to buy to see the annual free cash flow
          the company generates for you.
        </p>

        <div className="input-group">
          <label htmlFor="shares-input">Number of Shares</label>
          <input
            id="shares-input"
            type="number"
            min="0"
            step="1"
            placeholder="e.g., 100"
            value={sharesOwned}
            onChange={(e) => setSharesOwned(e.target.value)}
            className="shares-input"
          />
        </div>

        {annualCashFlow !== null && (
          <div className="result-box">
            <div className="result-label">Your Annual Cash Flow</div>
            <div className="result-value">{formatCurrency(annualCashFlow)}</div>
            <div className="result-info">
              Based on {sharesOwned} shares × {formatCurrency(data.fcf_per_share)}/share
            </div>
          </div>
        )}

        {!annualCashFlow && sharesOwned && parseFloat(sharesOwned) > 0 && (
          <div className="info-message">
            Enter a valid number of shares to calculate your annual cash flow.
          </div>
        )}
      </div>

      <div className="info-section">
        <p className="info-text">
          <strong>What is Free Cash Flow Per Share?</strong> It represents the amount
          of cash a company generates per share after accounting for capital
          expenditures. This metric helps you understand how much cash the company
          could potentially return to shareholders through dividends or buybacks.
        </p>
      </div>
    </div>
  );
};
