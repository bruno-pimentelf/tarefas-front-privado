import { configureStore } from "@reduxjs/toolkit"
import bookingsReducer from "./slices/bookingsSlice"

export const store = configureStore({
  reducer: {
    bookings: bookingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["bookings/fetchBookings/pending"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

