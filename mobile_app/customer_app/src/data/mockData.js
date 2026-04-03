export const mockShops = [
    {
        id: 's1',
        name: 'The Burger Joint',
        category: 'American • Fast Food',
        rating: 4.5,
        ratingCount: '1K+',
        deliveryTime: '25-30 min',
        costForTwo: '₹400 for two',
        isOpen: true,
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1000&auto=format&fit=crop',
        promoted: true,
        discount: '30% OFF up to ₹75',
    },
    {
        id: 's2',
        name: 'Biryani Blues',
        category: 'North Indian • Biryani',
        rating: 4.2,
        ratingCount: '500+',
        deliveryTime: '35-40 min',
        costForTwo: '₹600 for two',
        isOpen: true,
        imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93cb0?q=80&w=1000&auto=format&fit=crop',
        promoted: false,
        discount: 'Flat ₹100 OFF',
    },
    {
        id: 's3',
        name: 'Pizza Hut',
        category: 'Pizza • Fast Food',
        rating: 4.0,
        ratingCount: '2K+',
        deliveryTime: '30-40 min',
        costForTwo: '₹500 for two',
        isOpen: true,
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop',
        promoted: false,
        discount: 'Buy 1 Get 1 Free',
    },
    {
        id: 's4',
        name: 'Wok in the Clouds',
        category: 'Chinese • Asian',
        rating: 4.7,
        ratingCount: '800+',
        deliveryTime: '40-45 min',
        costForTwo: '₹800 for two',
        isOpen: false,
        imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=1000&auto=format&fit=crop',
        promoted: true,
        discount: '',
    }
];

export const mockProducts = {
    's1': [
        { id: 'p1_1', name: 'Classic Cheeseburger', description: 'Juicy beef patty with melted cheddar, lettuce, tomato, and house sauce.', price: 199, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop', isVeg: false },
        { id: 'p1_2', name: 'Veggie Delight Burger', description: 'Crispy herb potato patty with fresh veggies and vegan mayo.', price: 149, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=500&auto=format&fit=crop', isVeg: true },
        { id: 'p1_3', name: 'Loaded Fries', description: 'Crispy fries topped with cheese sauce, jalapenos, and bacon bits.', price: 129, isAvailable: false, imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?q=80&w=500&auto=format&fit=crop', isVeg: false },
    ],
    's2': [
        { id: 'p2_1', name: 'Chicken Dum Biryani', description: 'Slow-cooked aromatic basmati rice with marinated chicken pieces and spices.', price: 349, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=500&auto=format&fit=crop', isVeg: false },
        { id: 'p2_2', name: 'Paneer Tikka Biryani', description: 'Aromatic rice cooked with spicy paneer tikka chunks.', price: 299, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1633504581786-316c8002b1b9?q=80&w=500&auto=format&fit=crop', isVeg: true },
        { id: 'p2_3', name: 'Butter Chicken', description: 'Classic creamy tomato gravy with tender roasted chicken.', price: 399, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b6ae398?q=80&w=500&auto=format&fit=crop', isVeg: false },
    ],
    's3': [
        { id: 'p3_1', name: 'Margherita Pizza', description: 'Classic cheese and tomato pizza.', price: 249, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=500&auto=format&fit=crop', isVeg: true },
        { id: 'p3_2', name: 'Pepperoni Pizza', description: 'Loaded with premium pepperoni and mozzarella.', price: 399, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=500&auto=format&fit=crop', isVeg: false },
    ],
    's4': [
        { id: 'p4_1', name: 'Hakka Noodles', description: 'Wok-tossed noodles with crunchy vegetables.', price: 199, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=500&auto=format&fit=crop', isVeg: true },
        { id: 'p4_2', name: 'Chilli Chicken', description: 'Spicy soy-coated crispy chicken with capsicum.', price: 289, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1626082895617-2c6b4125b2dd?q=80&w=500&auto=format&fit=crop', isVeg: false },
    ]
};

export const mockDailyItemsShops = [
    {
        id: 'ds1',
        name: 'FreshMart Essentials',
        category: 'Groceries • Dairy • Eggs',
        rating: 4.8,
        ratingCount: '3K+',
        deliveryTime: '10-15 min',
        costForTwo: '₹150 for two',
        isOpen: true,
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
        promoted: true,
        discount: '10% OFF up to ₹50',
    },
    {
        id: 'ds2',
        name: 'Sweet Tooth Corner',
        category: 'Chocolates • Biscuits • Snacks',
        rating: 4.6,
        ratingCount: '2K+',
        deliveryTime: '15-20 min',
        costForTwo: '₹200 for two',
        isOpen: true,
        imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=1000&auto=format&fit=crop',
        promoted: false,
        discount: 'Buy 2 Get 1 Free',
    }
];

export const mockDailyItemsProducts = {
    'ds1': [
        { id: 'dp1_1', name: 'Farm Fresh Eggs, 6 Pcs', description: 'Locally sourced farm fresh eggs.', price: 45, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?q=80&w=500&auto=format&fit=crop', isVeg: false },
        { id: 'dp1_2', name: 'Full Cream Milk, 1L', description: 'Rich and creamy farm fresh cow milk.', price: 60, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1570197781417-0e82375c9371?q=80&w=500&auto=format&fit=crop', isVeg: true },
        { id: 'dp1_3', name: 'Brown Bread', description: 'Healthy and soft whole wheat bread.', price: 40, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=500&auto=format&fit=crop', isVeg: true },
    ],
    'ds2': [
        { id: 'dp2_1', name: 'Dairy Milk Silk', description: 'Smooth, creamy chocolate bar.', price: 150, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=500&auto=format&fit=crop', isVeg: true },
        { id: 'dp2_2', name: 'Oreo Biscuits Family Pack', description: 'Crunchy chocolate biscuits with sweet creme filling.', price: 80, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=500&auto=format&fit=crop', isVeg: true },
    ]
};
