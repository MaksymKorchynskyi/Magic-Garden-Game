from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging
from typing import Optional, List, Dict
import uuid
from datetime import datetime, timedelta
import random
from pydantic import Field
from fastapi.staticfiles import StaticFiles


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Luthenia Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock database
users_db = {}
gardens_db = {}
inventory_db = {}

app.mount("/static", StaticFiles(directory="static"), name="static")

# Game data - expanded to 6 plants
PLANTS = {
    1: {"id": 1, "name": "Чарівна троянда", "price": 100, "image": "/static/red_rose_magic_v2.png", "grow_time": 30, "reward": 1000, "exp": 20},
    2: {"id": 2, "name": "Магічний гриб", "price": 150, "image": "/static/mushroom_blue_magic.png", "grow_time": 45, "reward": 1500, "exp": 35},
    3: {"id": 3, "name": "Місячний цвіт", "price": 200, "image": "/static/starlight_flower_v2.png", "grow_time": 60, "reward": 2000, "exp": 50},
    4: {"id": 4, "name": "Giant Pumpkin", "price": 250, "image": "/static/garbus_image.png", "grow_time": 75, "reward": 2500, "exp": 70},
    5: {"id": 5, "name": "Кришталева лілія", "price": 300, "image": "/static/crystal_lily_v1.png", "grow_time": 90, "reward": 3000, "exp": 90},
    6: {"id": 6, "name": "Темний орхідей", "price": 350, "image": "/static/moon_flower_v1.png", "grow_time": 120, "reward": 3500, "exp": 120},
}

# Experience needed for each level
LEVEL_EXP = {
    1: 100,
    2: 250,
    3: 450,
    4: 700,
    5: 1000,
    6: 1400,
    7: 1900,
    8: 2500,
    9: 3200,
    10: 4000,
}

# Models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    birth_date: str
    wallet_address: str
    telegram_id: Optional[int] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    birth_date: str
    wallet_address: str
    telegram_id: Optional[int]
    level: int
    coins: int
    experience: int
    exp_to_next_level: int
    created_at: datetime

class UserUpdate(BaseModel):
    username: Optional[str]
    password: Optional[str]
    birth_date: Optional[str]
    wallet_address: Optional[str]
    avatar: Optional[str]

class GameAction(BaseModel):
    user_id: str
    action_type: str
    plant_id: Optional[int] = Field(None, alias="plantId")
    bed_id: Optional[int] = Field(None, alias="bedId")
    price: Optional[int] = None
    cost: Optional[int] = None
    grow_time: Optional[int] = Field(None, alias="growTime")

    class Config:
        allow_population_by_field_name = True

class GameResponse(BaseModel):
    success: bool
    new_level: Optional[int] = None
    reward: Optional[int] = None
    experience_gained: Optional[int] = None
    coinsSpent: Optional[int] = None
    message: Optional[str] = None
    plant: Optional[Dict] = None
    bed: Optional[Dict] = None
    current_exp: Optional[int] = None
    exp_to_next_level: Optional[int] = None
    animation_type: Optional[str] = None  # New field for frontend animations

# Helper functions
def get_user(user_id: str):
    user = users_db.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

def generate_user_id():
    return str(uuid.uuid4())

def init_user_garden(user_id: str):
    if user_id not in gardens_db:
        gardens_db[user_id] = {
            "beds": [
                {"id": 1, "plant": None, "progress": 0, "is_locked": False, "start_time": None, "grow_time": None},
                {"id": 2, "plant": None, "progress": 0, "is_locked": True, "start_time": None, "grow_time": None},
                {"id": 3, "plant": None, "progress": 0, "is_locked": True, "start_time": None, "grow_time": None},
                {"id": 4, "plant": None, "progress": 0, "is_locked": True, "start_time": None, "grow_time": None},
                {"id": 5, "plant": None, "progress": 0, "is_locked": True, "start_time": None, "grow_time": None},
                {"id": 6, "plant": None, "progress": 0, "is_locked": True, "start_time": None, "grow_time": None},
            ]
        }
    return gardens_db[user_id]

def init_user_inventory(user_id: str):
    if user_id not in inventory_db:
        inventory_db[user_id] = []
    return inventory_db[user_id]

def calculate_growth_progress(start_time: datetime, grow_time: int) -> int:
    if not start_time or not grow_time:
        return 0
    elapsed = (datetime.now() - start_time).total_seconds()
    progress = min(100, (elapsed / grow_time) * 100)
    return int(progress)

def calculate_exp_to_next_level(level: int, current_exp: int) -> int:
    next_level = level + 1
    if next_level not in LEVEL_EXP:
        return 0
    return LEVEL_EXP[next_level] - current_exp

def check_level_up(user: dict, exp_gained: int) -> bool:
    current_level = user["level"]
    current_exp = user["experience"] + exp_gained
    
    if current_level + 1 in LEVEL_EXP and current_exp >= LEVEL_EXP[current_level + 1]:
        user["level"] += 1
        user["experience"] = current_exp - LEVEL_EXP[current_level]
        return True
    return False

def validate_wallet_address(address: str) -> bool:
    return len(address) >= 12 and address.isalnum()

# API endpoints
@app.post("/api/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    for user in users_db.values():
        if user["email"] == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        if user_data.telegram_id and user.get("telegram_id") == user_data.telegram_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telegram account already linked"
            )
    
    if not validate_wallet_address(user_data.wallet_address):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wallet address must be at least 12 alphanumeric characters"
        )
    
    user_id = generate_user_id()
    new_user = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": user_data.password,
        "birth_date": user_data.birth_date,
        "wallet_address": user_data.wallet_address,
        "telegram_id": user_data.telegram_id,
        "level": 1,
        "coins": 500,  # Increased starting coins
        "experience": 0,
        "exp_to_next_level": calculate_exp_to_next_level(1, 0),
        "created_at": datetime.now(),
        "avatar": None
    }
    
    users_db[user_id] = new_user
    init_user_garden(user_id)
    init_user_inventory(user_id)
    
    logger.info(f"New user registered: {user_id}")
    return new_user

@app.post("/api/login", response_model=UserResponse)
async def login_user(login_data: UserLogin):
    user = None
    for u in users_db.values():
        if u["email"] == login_data.email and u["password"] == login_data.password:
            user = u
            break
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return user

@app.put("/api/user/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, update_data: UserUpdate):
    user = get_user(user_id)
    
    if update_data.username:
        user["username"] = update_data.username
    
    if update_data.password:
        user["password"] = update_data.password
    
    if update_data.birth_date:
        user["birth_date"] = update_data.birth_date
    
    if update_data.wallet_address:
        if not validate_wallet_address(update_data.wallet_address):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Wallet address must be at least 12 alphanumeric characters"
            )
        user["wallet_address"] = update_data.wallet_address
    
    if update_data.avatar:
        user["avatar"] = update_data.avatar
    
    return user

@app.post("/api/game/action", response_model=GameResponse)
async def game_action(action: GameAction):
    user = get_user(action.user_id)
    garden = init_user_garden(action.user_id)
    inventory = init_user_inventory(action.user_id)
    
    logger.info(f"Received action: {action.action_type}, Data: {action.dict()}")
    
    if action.action_type == "buy_plant":
        if action.plant_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Plant ID is required"
            )
        
        plant = PLANTS.get(action.plant_id)
        if not plant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plant not found. Available IDs: {list(PLANTS.keys())}"
            )
        
        if user["coins"] < plant["price"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enough coins"
            )
        
        purchased_plant = plant.copy()
        inventory.append(purchased_plant)
        user["coins"] -= plant["price"]
        
        return {
            "success": True,
            "coinsSpent": plant["price"],
            "plant": purchased_plant,
            "message": f"You bought {plant['name']}!",
            "animation_type": "buy_success"
        }
    
    elif action.action_type == "plant_seed":
        if action.plant_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Plant ID is required"
            )
        
        # Find and remove exactly one matching plant from inventory
        plant_index = next((i for i, p in enumerate(inventory) if p["id"] == action.plant_id), None)
        if plant_index is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Plant not found in inventory"
            )
        
        plant = inventory.pop(plant_index)
        
        if action.bed_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bed ID is required"
            )
        
        bed = next((b for b in garden["beds"] if b["id"] == action.bed_id), None)
        if not bed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Garden bed not found"
            )
        
        if bed["is_locked"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Garden bed is locked"
            )
        
        if bed["plant"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Garden bed is already occupied"
            )
        
        bed["plant"] = plant
        bed["start_time"] = datetime.now()
        bed["grow_time"] = action.grow_time
        
        return {
            "success": True,
            "bed": bed,
            "message": f"You planted {plant['name']}!",
            "animation_type": "plant_success"
        }
    
    elif action.action_type == "harvest":
        if action.bed_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bed ID is required"
            )
        
        bed = next((b for b in garden["beds"] if b["id"] == action.bed_id), None)
        if not bed or not bed["plant"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nothing to harvest"
            )
        
        progress = calculate_growth_progress(bed["start_time"], bed["grow_time"])
        if progress < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Plant is not ready for harvest"
            )
        
        plant_name = bed["plant"]["name"]
        reward = bed["plant"]["reward"]
        exp_gained = bed["plant"]["exp"]
        
        user["coins"] += reward
        user["experience"] += exp_gained
        
        level_up = check_level_up(user, exp_gained)
        
        bed["plant"] = None
        bed["start_time"] = None
        bed["grow_time"] = None
        bed["progress"] = 0
        
        return {
            "success": True,
            "reward": reward,
            "experience_gained": exp_gained,
            "new_level": user["level"] if level_up else None,
            "current_exp": user["experience"],
            "exp_to_next_level": calculate_exp_to_next_level(user["level"], user["experience"]),
            "bed": bed,
            "message": f"You harvested {plant_name} and earned {reward} coins and {exp_gained} exp!",
            "animation_type": "harvest_success"
        }
    
    elif action.action_type == "unlock_bed":
        if action.bed_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bed ID is required"
            )
        
        if action.cost is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cost is required"
            )
        
        if user["coins"] < action.cost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enough coins to unlock"
            )
        
        bed = next((b for b in garden["beds"] if b["id"] == action.bed_id), None)
        if not bed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Garden bed not found"
            )
        
        if not bed["is_locked"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Garden bed is already unlocked"
            )
        
        user["coins"] -= action.cost
        bed["is_locked"] = False
        
        return {
            "success": True,
            "coinsSpent": action.cost,
            "bed": bed,
            "message": "Garden bed unlocked!",
            "animation_type": "unlock_success"
        }
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid action type"
    )

@app.get("/api/plants")
async def get_available_plants():
    return list(PLANTS.values())

@app.get("/api/user/{user_id}", response_model=UserResponse)
async def get_user_endpoint(user_id: str):
    user = get_user(user_id)
    user["exp_to_next_level"] = calculate_exp_to_next_level(user["level"], user["experience"])
    return user

@app.get("/api/user/{user_id}/garden")
async def get_user_garden(user_id: str):
    garden = init_user_garden(user_id)
    for bed in garden["beds"]:
        if bed["plant"] and bed["start_time"] and bed["grow_time"]:
            bed["progress"] = calculate_growth_progress(bed["start_time"], bed["grow_time"])
    return garden

@app.get("/api/user/{user_id}/inventory")
async def get_user_inventory(user_id: str):
    return init_user_inventory(user_id)

@app.post("/api/telegram/webhook")
async def telegram_webhook(request: Request):
    data = await request.json()
    logger.info(f"Telegram webhook data: {data}")
    return JSONResponse(content={"status": "ok"})

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)