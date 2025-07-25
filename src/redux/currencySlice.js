import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk to fetch country and currency
export const detectCurrency = createAsyncThunk("currency/detect", async () => {
  // Step 1: Detect country
  const ipRes = await fetch("http://ip-api.com/json");
  const ipData = await ipRes.json();
  const country = ipData?.country;
  const currency = country === "Canada" ? "CAD" : "USD";

  // Step 2: Get live exchange rate from open.er-api.com
  const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
  const rateData = await rateRes.json();

  const rate = rateData?.rates?.[currency] ?? 1;

  console.log("COUNTRY:", country);
  console.log("CURRENCY:", currency);
  console.log("RATE:", rate);

  return { currency, rate };
});

const currencySlice = createSlice({
  name: "currency",
  initialState: {
    currency: "USD",
    rate: 1,
    status: "idle",
  },
  reducers: {
    // ✅ Manual override reducer
    setCurrencyManually: (state, action) => {
      const { currency, rate } = action.payload;
      state.currency = currency;
      state.rate = rate;
      state.status = "manual";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(detectCurrency.pending, (state) => {
        state.status = "loading";
      })
      .addCase(detectCurrency.fulfilled, (state, action) => {
        state.currency = action.payload.currency;
        state.rate = action.payload.rate;
        state.status = "success";
      })
      .addCase(detectCurrency.rejected, (state) => {
        state.status = "error";
      });
  },
});

// ✅ Export the manual action for dropdown use
export const { setCurrencyManually } = currencySlice.actions;

export default currencySlice.reducer;
