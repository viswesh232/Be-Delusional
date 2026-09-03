/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setLoading(true);
            API.get('/wishlist')
                .then(res => setWishlistItems(res.data || []))
                .catch(() => setWishlistItems([]))
                .finally(() => setLoading(false));
        } else {
            const localWish = localStorage.getItem('trueThreadsWishlist');
            if (localWish) {
                try {
                    setWishlistItems(JSON.parse(localWish));
                } catch (e) {
                    setWishlistItems([]);
                }
            } else {
                setWishlistItems([]);
            }
        }
    }, [user]);

    const isInWishlist = (productId) => {
        return wishlistItems.some(item => (item._id || item) === (productId._id || productId));
    };

    const toggleWishlist = async (product) => {
        const pId = product._id || product;
        const exists = isInWishlist(pId);

        if (user) {
            try {
                const res = await API.post('/wishlist/toggle', { productId: pId });
                setWishlistItems(res.data.products || []);
            } catch (err) {
                console.error('Wishlist toggle error:', err);
            }
        } else {
            let updated = [];
            if (exists) {
                updated = wishlistItems.filter(item => (item._id || item) !== pId);
            } else {
                updated = [...wishlistItems, product];
            }
            setWishlistItems(updated);
            localStorage.setItem('trueThreadsWishlist', JSON.stringify(updated));
        }
    };

    return (
        <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist, loading }}>
            {children}
        </WishlistContext.Provider>
    );
};
