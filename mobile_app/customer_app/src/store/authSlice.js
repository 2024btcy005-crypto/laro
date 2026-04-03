import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    selectedUniversity: null, // { id: string, name: string }
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        restoreToken: (state, action) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.selectedUniversity = action.payload.selectedUniversity || null;
            state.isAuthenticated = !!action.payload.token;
            state.isLoading = false;
        },
        signIn: (state, action) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;
        },
        setUniversity: (state, action) => {
            state.selectedUniversity = action.payload;
        },
        signOut: (state) => {
            state.token = null;
            state.user = null;
            state.selectedUniversity = null;
            state.isAuthenticated = false;
        },
        updateCredentials: (state, action) => {
            state.user = { ...state.user, ...action.payload.user };
        },
    },
});

export const { restoreToken, signIn, signOut, updateCredentials, setUniversity } = authSlice.actions;
export default authSlice.reducer;
