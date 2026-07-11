import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    selectedUniversity: null, // { id: string, name: string }
    setupPending: false, // true only for brand-new registrations (drives onboarding flow)
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
            state.setupPending = false; // always false on restore (returning user)
        },
        signIn: (state, action) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.setupPending = action.payload.setupPending === true;
        },
        clearSetupPending: (state) => {
            state.setupPending = false;
        },
        setUniversity: (state, action) => {
            state.selectedUniversity = action.payload;
        },
        signOut: (state) => {
            state.token = null;
            state.user = null;
            state.selectedUniversity = null;
            state.isAuthenticated = false;
            state.setupPending = false;
        },
        updateCredentials: (state, action) => {
            state.user = { ...state.user, ...action.payload.user };
        },
    },
});

export const { restoreToken, signIn, signOut, updateCredentials, setUniversity, clearSetupPending } = authSlice.actions;
export default authSlice.reducer;
