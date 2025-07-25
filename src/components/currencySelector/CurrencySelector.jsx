'use client';

import { useDispatch, useSelector } from 'react-redux';
import { setCurrencyManually } from '@/redux/currencySlice';

const CurrencySelector = () => {
  const dispatch = useDispatch();
  const { currency } = useSelector((state) => state.currency);

  const handleChange = async (e) => {
    const selected = e.target.value;

    // Fetch the latest exchange rate for selected currency
    const res = await fetch(`https://open.er-api.com/v6/latest/USD`);
    const data = await res.json();
    const rate = data?.rates?.[selected] ?? 1;

    dispatch(setCurrencyManually({ currency: selected, rate }));
  };

  return (
    <select
      value={currency}
      onChange={handleChange}
      className="border rounded px-2 py-1 text-sm"
    >
      <option value="USD">USD</option>
      <option value="CAD">CAD</option>
    </select>
  );
};

export default CurrencySelector;
