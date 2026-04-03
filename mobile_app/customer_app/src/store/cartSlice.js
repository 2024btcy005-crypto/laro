import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [],
    shopId: null, // Ensure cart only holds items from one shop at a time
    totalAmount: 0,
};

const getId = (item) => item.id || item._id;

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const product = action.payload;
            const productId = getId(product);

            // Reset cart if adding from a different shop
            if (state.shopId && product.shopId && state.shopId !== product.shopId) {
                state.items = [];
            }
            if (product.shopId) {
                state.shopId = product.shopId;
            }

            const existingItem = state.items.find(item => getId(item) === productId);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({ ...product, id: productId, quantity: 1 });
            }

            state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        },
        removeFromCart: (state, action) => {
            const productId = action.payload; // Typically passed as string ID
            const existingItem = state.items.find(item => getId(item) === productId);

            if (existingItem) {
                if (existingItem.quantity > 1) {
                    existingItem.quantity -= 1;
                } else {
                    state.items = state.items.filter(item => getId(item) !== productId);
                }
            }

            state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);

            // Clear shopId if cart becomes empty
            if (state.items.length === 0) {
                state.shopId = null;
            }
        },
        clearCart: (state) => {
            state.items = [];
            state.shopId = null;
            state.totalAmount = 0;
        },
        setStoreCart: (state, action) => {
            state.items = action.payload.items || [];
            state.shopId = action.payload.shopId || null;
            state.totalAmount = action.payload.totalAmount || 0;
        },
    },
});

export const { addToCart, removeFromCart, clearCart, setStoreCart } = cartSlice.actions;
export default cartSlice.reducer;
