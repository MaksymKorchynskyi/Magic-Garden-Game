import React, { useState, useMemo } from 'react';
import coin_image from './assets/images/coin.png';

const ShopMagic = ({ userData, apiBaseUrl, onBuyPlant, isLoading, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('default');
    
    // Переносимо масив всередину useMemo або використовуємо useMemo для нього
    const availablePlants = useMemo(() => [
        { id: 1, name: "Magic Rose", price: 100, image: "/static/red_rose_magic_v2.png", grow_time: 30, reward: 1000, exp: 20 },
        { id: 2, name: "Magic Mushroom", price: 150, image: "/static/mushroom_blue_magic.png", grow_time: 45, reward: 1500, exp: 35 },
        { id: 3, name: "Moon Flower", price: 200, image: "/static/starlight_flower_v2.png", grow_time: 60, reward: 2000, exp: 50 },
        { id: 4, name: "Giant Pumpkin", price: 250, image: "/static/garbus_image.png", grow_time: 75, reward: 2500, exp: 70 },
        { id: 5, name: "Crystal Lily", price: 300, image: "/static/crystal_lily_v1.png", grow_time: 90, reward: 3000, exp: 90 },
        { id: 6, name: "Dark Orchid", price: 350, image: "/static/moon_flower_v1.png", grow_time: 120, reward: 3500, exp: 120 },
    ], []); // Порожній масив залежностей - дані ніколи не зміняться

    const filteredPlants = useMemo(() => {
        let result = [...availablePlants];
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(plant => 
                plant.name.toLowerCase().includes(term)
            );
        }
        
        switch (sortBy) {
            case 'price_asc': return result.sort((a, b) => a.price - b.price);
            case 'price_desc': return result.sort((a, b) => b.price - a.price);
            case 'time_asc': return result.sort((a, b) => a.grow_time - b.grow_time);
            case 'time_desc': return result.sort((a, b) => b.grow_time - a.grow_time);
            case 'reward_asc': return result.sort((a, b) => a.reward - b.reward);
            case 'reward_desc': return result.sort((a, b) => b.reward - a.reward);
            default: return result;
        }
    }, [searchTerm, sortBy, availablePlants]);

    return (
        <div style={styles.shopContainer}>
            <div style={styles.shopHeader}>
                <h2 style={styles.shopTitle}>MAGIC SHOP</h2>
                <button 
                    style={styles.closeButton}
                    onClick={onClose}
                >
                    ×
                </button>
            </div>
            
            {/* Search and Sort controls */}
            <div style={styles.controls}>
                <input
                    type="text"
                    placeholder="Search plants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={styles.sortSelect}
                >
                    <option value="default">Default</option>
                    <option value="price_asc">Price (Low to High)</option>
                    <option value="price_desc">Price (High to Low)</option>
                    <option value="time_asc">Grow Time (Fast to Slow)</option>
                    <option value="time_desc">Grow Time (Slow to Fast)</option>
                    <option value="reward_asc">Reward (Low to High)</option>
                    <option value="reward_desc">Reward (High to Low)</option>
                </select>
            </div>
            
            <div style={styles.plantsGrid}>
                {filteredPlants.map(plant => (
                    <div key={plant.id} style={styles.plantCard}>
                        <div style={styles.plantImageContainer}>
                            <img 
                                src={`${apiBaseUrl}${plant.image}`} 
                                alt={plant.name} 
                                style={styles.plantImage}
                            />
                        </div>
                        
                        <div style={styles.plantInfo}>
                            <h3 style={styles.plantName}>{plant.name}</h3>
                            
                            <div style={styles.plantStats}>
                                <div style={styles.statRow}>
                                    <img src={coin_image} alt="Price" style={styles.statIcon} />
                                    <span style={styles.statValue}>{plant.price}</span>
                                </div>
                                
                                <div style={styles.statRow}>
                                    <span style={styles.statIcon}>⏱️</span>
                                    <span style={styles.statValue}>{plant.grow_time}s</span>
                                </div>
                                
                                <div style={styles.statRow}>
                                    <span style={styles.statIcon}>💰</span>
                                    <span style={styles.statValue}>{plant.reward}</span>
                                </div>
                                
                                <div style={styles.statRow}>
                                    <span style={styles.statIcon}>⭐</span>
                                    <span style={styles.statValue}>{plant.exp}</span>
                                </div>
                            </div>
                            
                            <button 
                                style={{
                                    ...styles.buyButton,
                                    ...(userData.coins < plant.price ? styles.disabledButton : {})
                                }}
                                onClick={() => onBuyPlant(plant)}
                                disabled={userData.coins < plant.price || isLoading}
                            >
                                {userData.coins < plant.price ? 'Need Coins' : 'Buy'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    shopContainer: {
        backgroundColor: 'rgba(30, 15, 60, 0.95)',
        borderRadius: '15px',
        padding: '15px',
        width: '95%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    shopHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
    },
    shopTitle: {
        color: '#ffffff',
        margin: 0,
        fontSize: '20px',
        textTransform: 'uppercase',
    },
    closeButton: {
        backgroundColor: 'transparent',
        color: 'white',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        padding: '0 10px',
    },
    controls: {
        display: 'flex',
        gap: '10px',
        marginBottom: '15px',
    },
    searchInput: {
        flex: 1,
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
    },
    sortSelect: {
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        color: 'white',
        fontSize: '14px',
        outline: 'none',
        minWidth: '150px',
    },
    plantsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px',
        overflowY: 'auto',
        paddingRight: '5px',
    },
    plantCard: {
        backgroundColor: 'rgba(123, 61, 255, 0.15)',
        border: '1px solid rgba(123, 61, 255, 0.5)',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    plantImageContainer: {
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: '5px',
    },
    plantImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    plantInfo: {
        padding: '10px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    plantName: {
        color: '#ffffff',
        fontSize: '14px',
        margin: '0 0 8px 0',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    plantStats: {
        marginBottom: '10px',
        flex: 1,
    },
    statRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '5px',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    statIcon: {
        width: '16px',
        height: '16px',
        marginRight: '5px',
    },
    statValue: {
        fontWeight: 'bold',
    },
    buyButton: {
        width: '100%',
        padding: '8px',
        backgroundColor: 'rgba(123, 61, 255, 0.7)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        transition: 'all 0.2s ease',
        ':hover': {
            backgroundColor: 'rgba(123, 61, 255, 0.9)',
        },
    },
    disabledButton: {
        backgroundColor: 'rgba(85, 85, 85, 0.7)',
        cursor: 'not-allowed',
        ':hover': {
            backgroundColor: 'rgba(85, 85, 85, 0.7)',
        },
    },
};

export default ShopMagic;
