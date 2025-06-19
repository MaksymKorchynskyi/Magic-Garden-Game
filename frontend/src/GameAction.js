import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import ground_empty from './assets/images/ground_empty.png';
import lock_ground from './assets/images/lock_ground.png';
import coin_image from './assets/images/coin.png';
import level_image from './assets/images/lvl_image.png';
import exp_image from './assets/images/exp_image.png';
import ShopMagic from './ShopMagic';
import MybackgroundImage from './assets/images/new_background_v2.png';
import defaultAvatar from './assets/images/avatar_default.png';

const GameAction = ({ userData, onBack, onUpdateUser, apiBaseUrl }) => {
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [gardenBeds, setGardenBeds] = useState([
        { id: 1, plant: null, progress: 0, isLocked: false, startTime: null, growTime: null },
        { id: 2, plant: null, progress: 0, isLocked: true, startTime: null, growTime: null },
        { id: 3, plant: null, progress: 0, isLocked: true, startTime: null, growTime: null },
        { id: 4, plant: null, progress: 0, isLocked: true, startTime: null, growTime: null },
        { id: 5, plant: null, progress: 0, isLocked: true, startTime: null, growTime: null },
        { id: 6, plant: null, progress: 0, isLocked: true, startTime: null, growTime: null }
    ]);
    const [inventory, setInventory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeView, setActiveView] = useState('garden');
    const [showProfile, setShowProfile] = useState(false);
    const [activeAnimation, setActiveAnimation] = useState(null);
    const [showInventory, setShowInventory] = useState(false);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const inventoryResponse = await axios.get(`${apiBaseUrl}/api/user/${userData.id}/inventory`);
            setInventory(inventoryResponse.data.map((plant, index) => ({ ...plant, uniqueId: `${plant.id}-${index}` })));
            
            const gardenResponse = await axios.get(`${apiBaseUrl}/api/user/${userData.id}/garden`);
            setGardenBeds(gardenResponse.data.beds.map(bed => ({
                id: bed.id,
                plant: bed.plant,
                progress: bed.progress,
                isLocked: bed.is_locked,
                startTime: bed.start_time ? new Date(bed.start_time) : null,
                growTime: bed.grow_time
            })));
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [apiBaseUrl, userData.id]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        const interval = setInterval(() => {
            setGardenBeds(prevBeds => 
                prevBeds.map(bed => {
                    if (!bed.plant || !bed.startTime) return bed;
                    
                    const elapsed = (Date.now() - bed.startTime.getTime()) / 1000;
                    const progress = Math.min(100, (elapsed / bed.growTime) * 100);
                    
                    return { ...bed, progress };
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeAnimation) {
            const timer = setTimeout(() => {
                setActiveAnimation(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [activeAnimation]);

    const handleGameAction = useCallback(async (actionType, data = {}) => {
        try {
            setIsLoading(true);
            const response = await axios.post(`${apiBaseUrl}/api/game/action`, {
                user_id: userData.id,
                action_type: actionType,
                ...data
            });
            
            if (response.data.success) {
                if (response.data.animation_type) {
                    setActiveAnimation({
                        type: response.data.animation_type,
                        message: response.data.message
                    });
                }

                const updatedUser = {
                    ...userData,
                    level: response.data.new_level || userData.level,
                    coins: response.data.reward ? userData.coins + response.data.reward : 
                          response.data.coinsSpent ? userData.coins - response.data.coinsSpent : 
                          userData.coins,
                    experience: response.data.current_exp || userData.experience,
                    exp_to_next_level: response.data.exp_to_next_level || userData.exp_to_next_level
                };

                onUpdateUser(updatedUser);

                if (actionType === 'buy_plant' && response.data.plant) {
                    setInventory(prev => [...prev, { ...response.data.plant, uniqueId: `${response.data.plant.id}-${Date.now()}` }]);
                }

                if (response.data.bed) {
                    setGardenBeds(prev => prev.map(bed => 
                        bed.id === response.data.bed.id ? {
                            ...bed,
                            plant: response.data.bed.plant,
                            progress: response.data.bed.progress || 0,
                            isLocked: response.data.bed.is_locked,
                            startTime: response.data.bed.start_time ? new Date(response.data.bed.start_time) : null,
                            growTime: response.data.bed.grow_time
                        } : bed
                    ));
                }

                return response.data;
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.response?.data?.detail || "Action failed";
            setActiveAnimation({
                type: 'error',
                message: errorMessage
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [apiBaseUrl, userData, onUpdateUser]);

    const buyItem = useCallback(async (plant) => {
        if (!plant || !plant.id) {
            setActiveAnimation({
                type: 'error',
                message: "Invalid plant selected"
            });
            return;
        }

        if (userData.coins < plant.price) {
            setActiveAnimation({
                type: 'error',
                message: "Not enough coins!"
            });
            return;
        }

        await handleGameAction('buy_plant', { 
            plantId: plant.id,
            price: plant.price
        });
    }, [handleGameAction, userData.coins]);

    const plantSeed = useCallback(async (bedId) => {
        if (!selectedPlant) {
            setActiveAnimation({
                type: 'error',
                message: "Please select a plant from inventory first!"
            });
            return;
        }

        const result = await handleGameAction('plant_seed', { 
            bedId: bedId,
            plantId: selectedPlant.id,
            growTime: selectedPlant.grow_time
        });
        
        if (result) {
            setInventory(prev => prev.filter(item => item.uniqueId !== selectedPlant.uniqueId));
            setSelectedPlant(null);
        }
    }, [handleGameAction, selectedPlant]);

    const unlockBed = useCallback(async (bedId) => {
        const unlockCost = 200;
        if (userData.coins < unlockCost) {
            setActiveAnimation({
                type: 'error',
                message: `You need ${unlockCost} coins to unlock this bed!`
            });
            return;
        }

        await handleGameAction('unlock_bed', { 
            bedId: bedId,
            cost: unlockCost
        });
    }, [handleGameAction, userData.coins]);

    const getPlantImage = useCallback((plant) => {
        if (!plant) return ground_empty;
        return `${apiBaseUrl}${plant.image}`;
    }, [apiBaseUrl]);

    const toggleProfile = useCallback(() => {
        setShowProfile(prev => !prev);
    }, []);

    const toggleInventory = useCallback(() => {
        setShowInventory(prev => !prev);
    }, []);

    if (isLoading) {
        return (
            <div style={styles.loadingOverlay}>
                <div style={styles.loadingContent}>
                    <div style={styles.spinner}></div>
                    <p>Loading game data...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.background}></div>
            
            {activeAnimation && (
                <div style={{
                    ...styles.notification,
                    ...(activeAnimation.type === 'buy_success' && styles.buyNotification),
                    ...(activeAnimation.type === 'harvest_success' && styles.harvestNotification),
                    ...(activeAnimation.type === 'plant_success' && styles.plantNotification),
                    ...(activeAnimation.type === 'unlock_success' && styles.unlockNotification),
                    ...(activeAnimation.type === 'error' && styles.errorNotification),
                }}>
                    {activeAnimation.message}
                </div>
            )}

            <div style={styles.content}>
                <header style={styles.header}>
                    <h1 style={styles.title} onClick={onBack}>Luthenia</h1>
                    <div style={styles.profileButton} onClick={toggleProfile}>
                        <img 
                            src={userData.avatar || defaultAvatar} 
                            alt="Avatar" 
                            style={styles.userAvatar}
                        />
                        <span style={styles.usernameText}>{userData.username}</span>
                    </div>
                </header>

                <div style={styles.statsBar}>
                    <div style={styles.statItem}>
                        <img src={coin_image} alt="Coins" style={styles.statIcon} />
                        <span>{userData.coins}</span>
                    </div>
                    <div style={styles.statItem}>
                        <img src={level_image} alt="Level" style={styles.statIcon} />
                        <span>Lvl {userData.level}</span>
                    </div>
                    <div style={styles.statItem}>
                        <img src={exp_image} alt="Experience" style={styles.statIcon} />
                        <span>EXP: {userData.experience}/{userData.experience + userData.exp_to_next_level}</span>
                    </div>
                </div>

                {showProfile && (
                    <div style={styles.profileModal}>
                        <div style={styles.profileContent}>
                            <h2 style={styles.profileTitle}>Profile</h2>
                            <div style={styles.profileInfo}>
                                <p><strong>Username:</strong> {userData.username}</p>
                                {userData.email && <p><strong>Email:</strong> {userData.email}</p>}
                                <p><strong>Level:</strong> {userData.level}</p>
                                <p><strong>Coins:</strong> {userData.coins}</p>
                                {userData.telegram_id && <p><strong>Telegram ID:</strong> {userData.telegram_id}</p>}
                            </div>
                            <button 
                                style={styles.closeProfileButton}
                                onClick={toggleProfile}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                <main style={styles.main}>
                    {activeView === 'garden' && (
                        <div style={styles.gardenView}>
                            <div style={styles.gardenRow}>
                                {gardenBeds.slice(0, 3).map(bed => (
                                    <GardenBed 
                                        key={bed.id}
                                        bed={bed}
                                        selectedPlant={selectedPlant}
                                        onPlantSeed={plantSeed}
                                        onUnlockBed={unlockBed}
                                        onHarvest={() => handleGameAction('harvest', { bedId: bed.id })}
                                        getPlantImage={getPlantImage}
                                        isLoading={isLoading}
                                    />
                                ))}
                            </div>
                            
                            <div style={styles.gardenRow}>
                                {gardenBeds.slice(3, 6).map(bed => (
                                    <GardenBed 
                                        key={bed.id}
                                        bed={bed}
                                        selectedPlant={selectedPlant}
                                        onPlantSeed={plantSeed}
                                        onUnlockBed={unlockBed}
                                        onHarvest={() => handleGameAction('harvest', { bedId: bed.id })}
                                        getPlantImage={getPlantImage}
                                        isLoading={isLoading}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeView === 'shop' && (
                        <div style={styles.modalOverlay}>
                            <ShopMagic 
                                userData={userData} 
                                apiBaseUrl={apiBaseUrl} 
                                onBuyPlant={buyItem}
                                isLoading={isLoading}
                                onClose={() => setActiveView('garden')}
                            />
                        </div>
                    )}
                </main>

                {/* Inventory as bottom drawer */}
                <div style={{
                    ...styles.inventoryDrawer,
                    transform: showInventory ? 'translateY(0)' : 'translateY(100%)'
                }}>
                    <div style={styles.inventoryTab} onClick={toggleInventory}>
                        <div style={styles.tabHandle}></div>
                        {inventory.length > 0 && (
                            <div style={styles.inventoryCounter}>
                                {inventory.length}
                            </div>
                        )}
                    </div>
                    <div style={styles.inventoryHeader}>
                        <h3 style={styles.inventoryTitle}>YOUR INVENTORY</h3>
                    </div>
                    {inventory.length === 0 ? (
                        <p style={styles.emptyInventory}>Your inventory is empty. Buy plants in the shop!</p>
                    ) : (
                        <div style={styles.inventoryScroll}>
                            <div style={styles.inventoryGrid}>
                                {inventory.map(plant => (
                                    <div key={plant.uniqueId} style={styles.inventoryItem}>
                                        <div style={styles.inventoryImageContainer}>
                                            <img 
                                                src={`${apiBaseUrl}${plant.image}`} 
                                                alt={plant.name} 
                                                style={styles.inventoryImage} 
                                            />
                                        </div>
                                        <button 
                                            style={selectedPlant?.uniqueId === plant.uniqueId ? 
                                                styles.selectedPlantButton : 
                                                styles.selectPlantButton}
                                            onClick={() => setSelectedPlant(plant)}
                                            disabled={isLoading}
                                        >
                                            {selectedPlant?.uniqueId === plant.uniqueId ? 'SELECTED' : 'SELECT'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={styles.navButtons}>
                    <button 
                        style={styles.shopNavButton}
                        onClick={() => setActiveView('shop')}
                        disabled={isLoading}
                    >
                        SHOP
                    </button>
                </div>
                
                <button 
                    style={styles.backButton}
                    onClick={onBack}
                    disabled={isLoading}
                >
                    BACK TO MAIN MENU
                </button>
            </div>
        </div>
    );
};

const GardenBed = ({ bed, selectedPlant, onPlantSeed, onUnlockBed, onHarvest, getPlantImage, isLoading }) => {
    return (
        <div style={styles.gardenBedContainer}>
            {bed.isLocked ? (
                <div style={styles.lockedBed}>
                    <img src={lock_ground} alt="Locked" style={styles.lockedBedImage} />
                    <button 
                        style={styles.unlockBedButton}
                        onClick={() => onUnlockBed(bed.id)}
                        disabled={isLoading}
                    >
                        UNLOCK (200)
                    </button>
                </div>
            ) : (
                <div style={bed.plant ? styles.plantedBed : styles.emptyBed}>
                    {bed.plant ? (
                        <>
                            <img 
                                src={getPlantImage(bed.plant)} 
                                alt={bed.plant.name} 
                                style={styles.plantImage} 
                            />
                            <div style={styles.progressBarContainer}>
                                <div style={styles.progressBarTrack}>
                                    <div 
                                        style={{
                                            ...styles.progressBarFill,
                                            width: `${bed.progress}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                            <button 
                                style={styles.harvestButton}
                                onClick={() => onHarvest(bed.id)}
                                disabled={bed.progress < 100 || isLoading}
                            >
                                {bed.progress < 100 ? `${Math.floor(bed.progress)}%` : 'HARVEST'}
                            </button>
                        </>
                    ) : (
                        <>
                            <img src={ground_empty} alt="Empty" style={styles.emptyBedImage} />
                            {selectedPlant && (
                                <button 
                                    style={styles.plantButton}
                                    onClick={() => onPlantSeed(bed.id)}
                                    disabled={isLoading}
                                >
                                    PLANT
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    background: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${MybackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0,
        filter: 'brightness(0.8)',
    },
    content: {
        position: 'relative',
        zIndex: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        marginBottom: '15px',
    },
    title: {
        color: '#ffffff',
        fontSize: '28px',
        fontWeight: 'bold',
        textShadow: '0 0 10px rgba(123, 61, 255, 0.8)',
        margin: 0,
        cursor: 'pointer',
    },
    profileButton: {
        backgroundColor: 'rgba(123, 61, 255, 0.3)',
        color: 'white',
        padding: '8px 15px',
        borderRadius: '20px',
        fontSize: '16px',
        fontWeight: 'bold',
        border: '2px solid #7b3dff',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        ':hover': {
            backgroundColor: 'rgba(123, 61, 255, 0.5)',
        }
    },
    userAvatar: {
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        objectFit: 'cover',
    },
    usernameText: {
        maxWidth: '100px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    statsBar: {
        position: 'fixed',
        top: '100px',
        left: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '15px',
        borderRadius: '15px',
        color: 'white',
        fontSize: '14px',
        zIndex: 10,
        width: 'auto',
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
    },
    statIcon: {
        width: '20px',
        height: '20px',
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    gardenView: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        overflow: 'hidden',
    },
    gardenRow: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        width: '100%',
    },
    gardenBedContainer: {
        width: '25vmin',
        height: '25vmin',
        minWidth: '120px',
        minHeight: '120px',
        maxWidth: '180px',
        maxHeight: '180px',
        position: 'relative',
    },
    lockedBed: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    lockedBedImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        opacity: 0.7,
    },
    unlockBedButton: {
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(123, 61, 255, 0.7)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    },
    plantedBed: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    emptyBed: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    emptyBedImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        opacity: 0.7,
    },
    plantImage: {
        width: '70%',
        height: '70%',
        objectFit: 'contain',
        marginBottom: '10px',
    },
    progressBarContainer: {
        width: '90%',
        margin: '10px 0',
    },
    progressBarTrack: {
        width: '100%',
        height: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '5px',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#7b3dff',
        borderRadius: '5px',
        transition: 'width 0.5s ease',
        boxShadow: '0 0 5px rgba(123, 61, 255, 0.8)',
    },
    harvestButton: {
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ':disabled': {
            backgroundColor: 'rgba(85, 85, 85, 0.7)',
            cursor: 'not-allowed',
        },
    },
    plantButton: {
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(123, 61, 255, 0.7)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    },
    notification: {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '15px 25px',
        borderRadius: '10px',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        zIndex: 1000,
        animation: 'fadeInOut 3s ease-in-out',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center',
    },
    buyNotification: {
        backgroundColor: 'rgba(123, 61, 255, 0.9)',
    },
    harvestNotification: {
        backgroundColor: 'rgba(76, 175, 80, 0.9)',
    },
    plantNotification: {
        backgroundColor: 'rgba(255, 193, 7, 0.9)',
        color: 'black',
    },
    unlockNotification: {
        backgroundColor: 'rgba(33, 150, 243, 0.9)',
    },
    errorNotification: {
        backgroundColor: 'rgba(244, 67, 54, 0.9)',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    inventoryDrawer: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(30, 15, 60, 0.95)',
        borderTopLeftRadius: '15px',
        borderTopRightRadius: '15px',
        padding: '15px 15px 0 15px',
        zIndex: 50,
        transition: 'transform 0.3s ease',
        maxHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -5px 15px rgba(0, 0, 0, 0.3)',
    },
    inventoryTab: {
        position: 'absolute',
        top: '-25px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120px',
        height: '25px',
        backgroundColor: 'rgba(123, 61, 255, 0.8)',
        borderTopLeftRadius: '13px',
        borderTopRightRadius: '13px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '5px',
    },
    tabHandle: {
        width: '40px',
        height: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: '2px',
    },
    inventoryCounter: {
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        backgroundColor: '#ff3d3d',
        color: 'white',
        borderRadius: '50%',
        width: '20px',
        height: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    inventoryHeader: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '15px',
    },
    inventoryTitle: {
        color: '#ffffff',
        margin: 0,
        fontSize: '18px',
        textTransform: 'uppercase',
    },
    inventoryScroll: {
        flex: 1,
        overflowY: 'auto',
        paddingBottom: '15px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#7b3dff rgba(0, 0, 0, 0.3)',
        '::-webkit-scrollbar': {
            width: '8px',
        },
        '::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
        },
        '::-webkit-scrollbar-thumb': {
            backgroundColor: '#7b3dff',
            borderRadius: '4px',
        },
    },
    inventoryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '10px',
        padding: '5px',
    },
    inventoryItem: {
        backgroundColor: 'rgba(123, 61, 255, 0.1)',
        border: '1px solid #7b3dff',
        borderRadius: '8px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    inventoryImageContainer: {
        width: '60px',
        height: '60px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '8px',
    },
    inventoryImage: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
    },
    selectPlantButton: {
        backgroundColor: 'rgba(123, 61, 255, 0.5)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 8px',
        fontSize: '10px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textTransform: 'uppercase',
        width: '100%',
        transition: 'all 0.2s ease',
        ':hover': {
            backgroundColor: 'rgba(123, 61, 255, 0.7)',
        },
    },
    selectedPlantButton: {
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 8px',
        fontSize: '10px',
        fontWeight: 'bold',
        cursor: 'default',
        textTransform: 'uppercase',
        width: '100%',
    },
    emptyInventory: {
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '16px',
        padding: '20px',
    },
    profileModal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    profileContent: {
        backgroundColor: 'rgba(30, 15, 60, 0.95)',
        borderRadius: '15px',
        padding: '25px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center',
    },
    profileTitle: {
        color: '#ffffff',
        fontSize: '22px',
        marginBottom: '20px',
    },
    profileInfo: {
        color: 'white',
        textAlign: 'left',
        marginBottom: '25px',
        lineHeight: '1.8',
    },
    closeProfileButton: {
        backgroundColor: '#7b3dff',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 25px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        width: '100%',
    },
    navButtons: {
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        zIndex: 5,
    },
    shopNavButton: {
        backgroundColor: 'rgba(123, 61, 255, 0.8)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textTransform: 'uppercase',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        ':disabled': {
            opacity: 0.6,
            cursor: 'not-allowed',
        },
    },
    backButton: {
        position: 'fixed',
        bottom: '40px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '25px',
        padding: '12px 25px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        zIndex: 5,
        ':disabled': {
            opacity: 0.6,
            cursor: 'not-allowed',
        },
    },
    loadingOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'white',
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: '5px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '50%',
        borderTopColor: '#7b3dff',
        animation: 'spin 1s ease-in-out infinite',
        marginBottom: '20px',
    },
    '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
    },
    '@keyframes fadeInOut': {
        '0%': { opacity: 0, transform: 'translateX(-50%) translateY(-20px)' },
        '20%': { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
        '80%': { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
        '100%': { opacity: 0, transform: 'translateX(-50%) translateY(-20px)' },
    }
};

GardenBed.propTypes = {
    bed: PropTypes.object.isRequired,
    selectedPlant: PropTypes.object,
    onPlantSeed: PropTypes.func.isRequired,
    onUnlockBed: PropTypes.func.isRequired,
    onHarvest: PropTypes.func.isRequired,
    getPlantImage: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired
};

GameAction.propTypes = {
    userData: PropTypes.object.isRequired,
    onBack: PropTypes.func.isRequired,
    onUpdateUser: PropTypes.func.isRequired,
    apiBaseUrl: PropTypes.string.isRequired
};

export default GameAction;