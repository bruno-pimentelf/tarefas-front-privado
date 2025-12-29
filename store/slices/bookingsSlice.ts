import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { bookingsApi, Booking, BookingsResponse } from "@/lib/api/bookings"
import { ApiError } from "@/lib/api/client"

interface BookingsState {
  items: Booking[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  } | null
  loading: boolean
  error: string | null
  currentPage: number
  limit: number
}

const initialState: BookingsState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
  currentPage: 1,
  limit: 10,
}

// Async thunks
export const fetchStudentBookings = createAsyncThunk<
  BookingsResponse,
  { page?: number; limit?: number },
  { rejectValue: ApiError }
>(
  "bookings/fetchStudentBookings",
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await bookingsApi.getStudentBookings(page, limit)
      return response
    } catch (error) {
      return rejectWithValue(error as ApiError)
    }
  }
)

const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    clearBookings: (state) => {
      state.items = []
      state.meta = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch student bookings
      .addCase(fetchStudentBookings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStudentBookings.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.meta = action.payload.meta
        state.currentPage = action.payload.meta.page
      })
      .addCase(fetchStudentBookings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || "Erro ao carregar tarefas"
      })
  },
})

export const { setPage, setLimit, clearError, clearBookings } = bookingsSlice.actions
export default bookingsSlice.reducer

