import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            return savedCart
                ? JSON.parse(savedCart)
                : { items: [], shopId: null, shopName: '' };
        } catch (e) {
            console.error('Failed to load cart from localStorage:', e);
            localStorage.removeItem('cart');
            return { items: [], shopId: null, shopName: '' };
        }
    });

    const [xeroxFile, setXeroxFile] = useState(null); // { url, originalName, size, mimetype }

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, shop) => {
        setCart(prev => {
            // If adding from a different shop, clear cart first
            if (prev.shopId && prev.shopId !== shop.id) {
                return {
                    items: [{ ...item, quantity: 1 }],
                    shopId: shop.id,
                    shopName: shop.name
                };
            }

            const existingItem = prev.items.find(i => i.id === item.id);
            if (existingItem) {
                return {
                    ...prev,
                    items: prev.items.map(i =>
                        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                    ),
                    shopId: shop.id,
                    shopName: shop.name
                };
            }

            return {
                ...prev,
                items: [...prev.items, { ...item, quantity: 1 }],
                shopId: shop.id,
                shopName: shop.name
            };
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prev => {
            const existingItem = prev.items.find(i => i.id === itemId);
            if (existingItem?.quantity > 1) {
                return {
                    ...prev,
                    items: prev.items.map(i =>
                        i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
                    )
                };
            }
            const newItems = prev.items.filter(i => i.id !== itemId);
            return {
                ...prev,
                items: newItems,
                shopId: newItems.length === 0 ? null : prev.shopId,
                shopName: newItems.length === 0 ? '' : prev.shopName
            };
        });
    };

    const clearCart = () => {
        setCart({ items: [], shopId: null, shopName: '' });
    };

    const getSubtotal = () => {
        return cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const getTotalItems = () => {
        return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            clearCart,
            getSubtotal,
            getTotalItems,
            xeroxFile,
            setXeroxFile
        }}>
            {children}
        </CartContext.Provider>
    );
};

// Export hook separately after component to fix Vite Fast Refresh compatibility
// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
