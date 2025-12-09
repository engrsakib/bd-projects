import { createSlice } from '@reduxjs/toolkit'
const initialState = {
    user: null,
    error: '',
    loading: true,
}

const utilsSlice = createSlice({
    name: 'utils',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        }
    },
})

export const {
    setUser,
    setError,
    setLoading
} = utilsSlice.actions

export default utilsSlice.reducer