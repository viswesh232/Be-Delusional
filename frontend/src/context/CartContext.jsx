/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

const getPrimaryImage = (product) => {
    if (product.image) return product.image;
    if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
    return '';
};

export const normalizeCartItem = (product) => {
    const size = product.selectedSize || product.size || (product.sizes?.length > 0 ? product.sizes[0] : 'M');
    const color = product.selectedColor || product.color || (product.colors?.length > 0 ? product.colors[0].name : 'Standard');
    const colorHex = product.selectedColorHex || (product.colors?.length > 0 ? product.colors[0].hex : '#000000');
    
    // Check variant override or discount price
    let price = product.price;
    if (product.discountPrice && product.discountPrice > 0) {
        price = product.discountPrice;
    }
    if (Array.isArray(product.variants)) {
        const matchingVariant = product.variants.find(v => v.size === size && (v.color === color || color === 'Standard'));
        if (matchingVariant && matchingVariant.price) {
            price = matchingVariant.price;
        }
    }

    const cartId = `${product._id || product.product}_${size}_${color}`;

    return {
        ...product,
        product: product.product || product._id,
        size,
        color,
        colorHex,
        price,
        cartId,
        image: getPrimaryImage(product),
        images: Array.isArray(product.images)
            ? product.images
            : (product.image ? [product.image] : []),
    };
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('trueThreadsCart') || localStorage.getItem('trueEatsCart');
        if (savedCart) {
            try {
                return JSON.parse(savedCart).map(normalizeCartItem);
            } catch (e) {
                return [];
            }
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('trueThreadsCart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, qtyToAdd = 1, options = {}) => {
        const itemToNormalize = {
            ...product,
            selectedSize: options.size || product.selectedSize || product.size,
            selectedColor: options.color || product.selectedColor || product.color,
            selectedColorHex: options.colorHex || product.selectedColorHex || product.colorHex,
        };
        const normalizedProduct = normalizeCartItem(itemToNormalize);

        setCartItems(prev => {
            const exist = prev.find((x) => x.cartId === normalizedProduct.cartId);
            if (exist) {
                return prev.map((x) => x.cartId === normalizedProduct.cartId ? { ...exist, qty: exist.qty + qtyToAdd } : x);
            } else {
                return [...prev, { ...normalizedProduct, qty: qtyToAdd }];
            }
        });
    };

    const removeFromCart = (product) => {
        const normalizedProduct = normalizeCartItem(product);
        setCartItems(prev => {
            const exist = prev.find((x) => x.cartId === normalizedProduct.cartId);
            if (!exist) return prev;
            if (exist.qty === 1) {
                return prev.filter((x) => x.cartId !== normalizedProduct.cartId);
            } else {
                return prev.map((x) => x.cartId === normalizedProduct.cartId ? { ...exist, qty: exist.qty - 1 } : x);
            }
        });
    };

    const deleteFromCart = (product) => {
        const normalizedProduct = normalizeCartItem(product);
        setCartItems(prev => prev.filter(x => x.cartId !== normalizedProduct.cartId));
    };

    const clearCart = () => setCartItems([]);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, deleteFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
