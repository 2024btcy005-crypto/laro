const getShopKey = (userId) => `@fav_shops_${userId}`;
const getProductKey = (userId) => `@fav_products_${userId}`;

export const FavouriteService = {
    getFavourites: async (userId, type) => {
        try {
            if (!userId) return [];
            const key = type === 'shop' ? getShopKey(userId) : getProductKey(userId);
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error(`[FavouriteService] Error getting ${type} favourites:`, error);
            return [];
        }
    },

    toggleFavourite: async (userId, item, type) => {
        try {
            if (!userId) return null;
            const key = type === 'shop' ? getShopKey(userId) : getProductKey(userId);
            const stored = localStorage.getItem(key);
            let favourites = stored ? JSON.parse(stored) : [];

            const itemId = item.id || item._id;
            const index = favourites.findIndex(fav => (fav.id || fav._id) === itemId);

            if (index > -1) {
                // Remove
                favourites.splice(index, 1);
            } else {
                // Add
                favourites.push(item);
            }

            localStorage.setItem(key, JSON.stringify(favourites));
            return favourites;
        } catch (error) {
            console.error(`[FavouriteService] Error toggling ${type} favourite:`, error);
            return null;
        }
    },

    isFavourite: async (userId, itemId, type) => {
        try {
            if (!userId) return false;
            const key = type === 'shop' ? getShopKey(userId) : getProductKey(userId);
            const stored = localStorage.getItem(key);
            const favourites = stored ? JSON.parse(stored) : [];
            return favourites.some(fav => (fav.id || fav._id) === itemId);
        } catch (error) {
            console.error(`[FavouriteService] Error checking ${type} status:`, error);
            return false;
        }
    }
};
