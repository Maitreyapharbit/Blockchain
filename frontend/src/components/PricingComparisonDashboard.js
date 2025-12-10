import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertCircle, TrendingDown, DollarSign, Eye, EyeOff } from 'react-feather';
import toast from 'react-hot-toast';

const Container = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
`;

const Header = styled.div`
  margin-bottom: 24px;
  
  h2 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  p {
    opacity: 0.9;
    font-size: 14px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  .label {
    font-size: 12px;
    text-transform: uppercase;
    opacity: 0.8;
    margin-bottom: 8px;
  }
  
  .value {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  .change {
    font-size: 12px;
    opacity: 0.8;
    display: flex;
    align-items: center;
    gap: 4px;
    
    &.positive { color: #4ade80; }
    &.negative { color: #f87171; }
  }
`;

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  
  h3 {
    color: #333;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
  }
`;

const PharmacyList = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  overflow: hidden;
`;

const PharmacyItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e7ff;
  transition: background 0.2s;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f8f9ff;
  }
`;

const PharmacyInfo = styled.div`
  flex: 1;
  
  .name {
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }
  
  .meta {
    font-size: 12px;
    color: #999;
  }
`;

const PriceInfo = styled.div`
  text-align: right;
  
  .cash-price {
    font-size: 18px;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 4px;
  }
  
  .savings {
    font-size: 12px;
    color: #4ade80;
    font-weight: 600;
  }
`;

const AlertBox = styled.div`
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  color: #f87171;
  font-size: 14px;
  
  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  
  button {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    
    &.primary {
      background: white;
      color: #667eea;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    }
    
    &.secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
`;

const PricingComparisonDashboard = ({ batchId, drugName }) => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chain, setChain] = useState([]);
  const [showHiddenMarkups, setShowHiddenMarkups] = useState(false);
  const [stats, setStats] = useState({
    avgPrice: 0,
    minPrice: 0,
    maxPrice: 0,
    variance: 0,
    savings: 0
  });

  useEffect(() => {
    if (batchId) {
      fetchPriceData();
      fetchPricingChain();
    }
  }, [batchId]);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      const response = await (await import('../utils/api')).default.authFetch(`/pricing/cash-prices/${batchId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPrices(data.prices || []);
        setStats(data.statistics || {});
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingChain = async () => {
    try {
      const response = await (await import('../utils/api')).default.authFetch(`/pricing/pricing-ledger/${batchId}`);
      
      if (response.ok) {
        const data = await response.json();
        setChain(data.chain || []);
      }
    } catch (error) {
      console.error('Error fetching chain:', error);
    }
  };

  const handlePublishTransparency = async () => {
    try {
      const response = await (await import('../utils/api')).default.authFetch('/pricing/pricing-reports/transparency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId })
      });
      
      if (response.ok) {
        toast.success('Transparency report generated and published');
        fetchPriceData();
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Failed to publish transparency');
    }
  };

  const chainData = chain.map((item, idx) => ({
    stage: item.participant_type || `Stage ${idx}`,
    price: item.participant_price || item.manufacturer_price || 0
  }));

  const maxPrice = prices.length > 0 ? Math.max(...prices.map(p => p.cash_price)) : 0;

  return (
    <Container>
      <Header>
        <h2>
          <DollarSign size={32} />
          Drug Pricing Transparency
        </h2>
        <p>Real-time pricing comparison across pharmacies and supply chain</p>
      </Header>

      <Controls>
        <button className="primary" onClick={handlePublishTransparency}>
          Publish Transparency Report
        </button>
        <button 
          className="secondary" 
          onClick={() => setShowHiddenMarkups(!showHiddenMarkups)}
        >
          {showHiddenMarkups ? <EyeOff size={18} /> : <Eye size={18} />}
          {showHiddenMarkups ? 'Hide Hidden Markups' : 'Show Hidden Markups'}
        </button>
      </Controls>

      {showHiddenMarkups && (
        <AlertBox>
          <AlertCircle size={18} />
          <div>
            <strong>Hidden Markups Detected:</strong> Some supply chain participants are applying unusually high markups. This data has been flagged for regulatory review.
          </div>
        </AlertBox>
      )}

      <StatsGrid>
        <StatCard>
          <div className="label">Average Price</div>
          <div className="value">${stats.avgPrice?.toFixed(2) || '0.00'}</div>
          <div className="change positive">Baseline for comparison</div>
        </StatCard>
        <StatCard>
          <div className="label">Price Range</div>
          <div className="value">${stats.minPrice?.toFixed(2) || '0.00'} - ${stats.maxPrice?.toFixed(2) || '0.00'}</div>
          <div className="change">Variance: {stats.priceVariance}%</div>
        </StatCard>
        <StatCard>
          <div className="label">Potential Savings</div>
          <div className="value">${stats.savings?.toFixed(2) || '0.00'}</div>
          <div className="change positive">By using lowest price</div>
        </StatCard>
        <StatCard>
          <div className="label">Pharmacies Compared</div>
          <div className="value">{prices.length}</div>
          <div className="change">Data sources active</div>
        </StatCard>
      </StatsGrid>

      {chainData.length > 0 && (
        <ChartContainer>
          <h3>Supply Chain Price Journey</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chainData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="stage" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0e7ff',
                  borderRadius: '8px'
                }}
                formatter={(value) => `$${value.toFixed(2)}`}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#667eea" 
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 6 }}
                name="Price at Stage"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      <ChartContainer>
        <h3>Cash Prices Across Pharmacies</h3>
        {prices.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prices.sort((a, b) => b.cash_price - a.cash_price)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="pharmacy_id" stroke="#666" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0e7ff',
                  borderRadius: '8px'
                }}
                formatter={(value) => `$${value.toFixed(2)}`}
              />
              <Bar dataKey="cash_price" fill="#667eea" name="Cash Price" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
            No pharmacy pricing data available
          </p>
        )}
      </ChartContainer>

      <PharmacyList>
        <PharmacyItem style={{ background: '#f8f9ff', fontWeight: 600, borderBottom: '2px solid #e0e7ff' }}>
          <PharmacyInfo>
            <div className="name">Pharmacy</div>
          </PharmacyInfo>
          <PriceInfo>
            <div className="cash-price">Cash Price</div>
          </PriceInfo>
        </PharmacyItem>
        
        {prices.length > 0 ? (
          prices
            .sort((a, b) => a.cash_price - b.cash_price)
            .map((price, idx) => (
              <PharmacyItem key={idx}>
                <PharmacyInfo>
                  <div className="name">{price.pharmacy_id || `Pharmacy ${idx + 1}`}</div>
                  <div className="meta">
                    {price.insurance_covered_price 
                      ? `Insurance Price: $${price.insurance_covered_price.toFixed(2)}`
                      : 'No insurance data'
                    }
                  </div>
                </PharmacyInfo>
                <PriceInfo>
                  <div className="cash-price">${price.cash_price.toFixed(2)}</div>
                  {price.cash_price === Math.min(...prices.map(p => p.cash_price)) && (
                    <div className="savings">✓ Lowest Price</div>
                  )}
                </PriceInfo>
              </PharmacyItem>
            ))
        ) : (
          <PharmacyItem style={{ justifyContent: 'center', color: '#999' }}>
            No pharmacy data available yet
          </PharmacyItem>
        )}
      </PharmacyList>
    </Container>
  );
};

export default PricingComparisonDashboard;
