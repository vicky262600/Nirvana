'use client';

import { useDispatch, useSelector } from 'react-redux';
import { setCurrencyManually } from '@/redux/currencySlice';

const CurrencySelector = () => {
  const dispatch = useDispatch();
  const { currency } = useSelector((state) => state.currency);

  const handleChange = async (e) => {
    const selected = e.target.value;
  
    // Fetch latest USD base exchange rates
    const res = await fetch(`https://open.er-api.com/v6/latest/USD`);
    const data = await res.json();
  
    const usdToCad = data?.rates?.["CAD"] ?? 1;
  
    let rate;
  
    if (selected === "CAD") {
      rate = 1; // prices already in CAD, no conversion
    } else if (selected === "USD") {
      rate = 1 / usdToCad; // convert CAD prices to USD
    } else {
      rate = 1; // fallback
    }
  
    dispatch(setCurrencyManually({ currency: selected, rate }));
  };
  

  return (
    <select
      value={currency}
      onChange={handleChange}
      className="border rounded px-1 py-1 text-xs sm:px-2 sm:text-sm"
    >
      <option value="USD">USD</option>
      <option value="CAD">CAD</option>
    </select>
  );
};

export default CurrencySelector;