import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk to fetch country and currency
export const detectCurrency = createAsyncThunk("currency/detect", async () => {
  try {
    // Step 1: Detect country
    const ipRes = await fetch("http://ip-api.com/json");
    const ipData = await ipRes.json();
    const country = ipData?.country;

    // Step 2: Get live exchange rate from open.er-api.com (USD base)
    const rateRes = await fetch("https://open.er-api.com/v6/latest/USD");
    const rateData = await rateRes.json();

    // USD → CAD rate from API
    const usdToCad = rateData?.rates?.["CAD"] ?? 1;

    let currency, rate;

    if (country === "Canada") {
      currency = "CAD";
      rate = 1; // No conversion needed, prices already in CAD
    } else {
      currency = "USD";
      rate = 1 / usdToCad; // Convert CAD prices to USD
    }

    console.log("COUNTRY:", country);
    console.log("CURRENCY:", currency);
    console.log("RATE:", rate);

    return { currency, rate };
  } catch (error) {
    console.error("Currency detection failed:", error);
    // Fallback to CAD since prices are in CAD
    return { currency: "CAD", rate: 1 };
  }
});

const currencySlice = createSlice({
  name: "currency",
  initialState: {
    currency: "CAD", // Default to CAD since prices are in CAD
    rate: 1,
    status: "idle",
  },
  reducers: {
    // Manual override reducer
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

export const { setCurrencyManually } = currencySlice.actions;

export default currencySlice.reducer;