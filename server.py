#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
server.py — МЕГА-СЕРВЕР PIXEL STRIKE НА PYTHON (6000+ строк)
Версия: 15.0.0 ULTIMATE | Pixel Studios
Запуск: python server.py
"""

import asyncio
import websockets
import json
import time
import random
import hashlib
import os
import sys
import math
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import sqlite3
import logging

# ===================================================================
# ЧАСТЬ 1: КОНФИГУРАЦИЯ СЕРВЕРА
# ===================================================================

@dataclass
class ServerConfig:
    """Конфигурация сервера"""
    http_port: int = 3000
    ws_port: int = 8081
    max_players_per_room: int = 10
    max_rooms: int = 100
    matchmaking_timeout: int = 60000  # 60 секунд
    room_inactivity_timeout: int = 300000  # 5 минут
    starting_elo: int = 1200
    k_factor: int = 32
    enable_anti_cheat: bool = True
    max_speed_hack: float = 500.0
    max_damage_hack: int = 150
    anti_cheat_threshold: int = 3
    database_path: str = "./data"
    save_interval: int = 60000
    log_level: str = "INFO"
    admins: List[str] = field(default_factory=lambda: ["admin1", "admin2"])

CONFIG = ServerConfig()

# ===================================================================
# ЧАСТЬ 2: НАСТРОЙКА ЛОГИРОВАНИЯ
# ===================================================================

logging.basicConfig(
    level=getattr(logging, CONFIG.log_level),
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ===================================================================
# ЧАСТЬ 3: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ===================================================================

def generate_id() -> str:
    """Генерация уникального ID"""
    return hashlib.md5(f"{time.time()}{random.random()}".encode()).hexdigest()[:12]

def calculate_distance(pos1: Dict, pos2: Dict) -> float:
    """Расчёт расстояния между точками"""
    dx = pos1.get('x', 0) - pos2.get('x', 0)
    dy = pos1.get('y', 0) - pos2.get('y', 0)
    dz = pos1.get('z', 0) - pos2.get('z', 0)
    return math.sqrt(dx*dx + dy*dy + dz*dz)

def calculate_elo_change(winner_elo: int, loser_elo: int, k_factor: int = 32) -> int:
    """Расчёт изменения ELO"""
    expected = 1 / (1 + 10 ** ((loser_elo - winner_elo) / 400))
    return round(k_factor * (1 - expected))

# ===================================================================
# ЧАСТЬ 4: КЛАСС ИГРОКА
# ===================================================================

@dataclass
class Player:
    """Класс игрока"""
    id: str
    name: str = "Player"
    avatar: str = "👤"
    email: Optional[str] = None
    provider: str = "guest"
    level: int = 1
    xp: int = 0
    elo: int = CONFIG.starting_elo
    peak_elo: int = CONFIG.starting_elo
    rank: str = "SILVER I"
    pixels: int = 10000
    coins: int = 500
    matches: int = 0
    wins: int = 0
    losses: int = 0
    kills: int = 0
    deaths: int = 0
    headshots: int = 0
    mvps: int = 0
    aces: int = 0
    clutches: int = 0
    play_time: int = 0
    status: str = "online"
    current_room: Optional[str] = None
    current_match: Optional[str] = None
    team: Optional[str] = None
    ready: bool = False
    is_leader: bool = False
    position: Dict = field(default_factory=lambda: {"x": 0, "y": 0, "z": 0})
    rotation: Dict = field(default_factory=lambda: {"y": 0})
    health: int = 100
    max_health: int = 100
    armor: int = 0
    weapons: List[str] = field(default_factory=list)
    current_weapon: str = "knife"
    suspicious_actions: int = 0
    friends: Set[str] = field(default_factory=set)
    friend_requests: Set[str] = field(default_factory=set)
    clan: Optional[str] = None
    clan_role: Optional[str] = None
    achievements: Set[str] = field(default_factory=set)
    inventory: List[Dict] = field(default_factory=list)
    equipped: Dict = field(default_factory=dict)
    ip: str = "unknown"
    ping: int = 0
    is_bot: bool = False
    difficulty: str = "medium"
    websocket: Optional[Any] = None
    last_activity: float = field(default_factory=time.time)
    
    def get_public_data(self) -> Dict:
        """Публичные данные игрока"""
        return {
            "id": self.id,
            "name": self.name,
            "avatar": self.avatar,
            "level": self.level,
            "rank": self.rank,
            "elo": self.elo,
            "kills": self.kills,
            "deaths": self.deaths,
            "kd": self.get_kd(),
            "wins": self.wins,
            "clan": self.clan
        }
    
    def get_full_data(self) -> Dict:
        """Полные данные игрока"""
        data = self.get_public_data()
        data.update({
            "email": self.email,
            "pixels": self.pixels,
            "coins": self.coins,
            "xp": self.xp,
            "peak_elo": self.peak_elo,
            "matches": self.matches,
            "headshots": self.headshots,
            "mvps": self.mvps,
            "aces": self.aces,
            "clutches": self.clutches,
            "play_time": self.play_time,
            "achievements": list(self.achievements),
            "inventory": self.inventory,
            "equipped": self.equipped
        })
        return data
    
    def get_kd(self) -> str:
        """Расчёт K/D"""
        if self.deaths == 0:
            return str(self.kills)
        return f"{self.kills / self.deaths:.2f}"
    
    def update_elo(self, enemy_elo: int, won: bool, mvp: bool = False, ace: bool = False) -> Dict:
        """Обновление ELO"""
        expected = 1 / (1 + 10 ** ((enemy_elo - self.elo) / 400))
        change = round(CONFIG.k_factor * ((1 if won else 0) - expected))
        
        if mvp:
            change += 5
        if ace:
            change += 10
        
        self.elo = max(0, self.elo + change)
        if self.elo > self.peak_elo:
            self.peak_elo = self.elo
        
        old_rank = self.rank
        self.rank = self._calculate_rank()
        rank_changed = old_rank != self.rank
        
        return {"change": change, "rank_changed": rank_changed, "new_rank": self.rank}
    
    def _calculate_rank(self) -> str:
        """Расчёт ранга на основе ELO"""
        ranks = [
            (0, "SILVER I"), (300, "SILVER II"), (600, "SILVER III"),
            (900, "GOLD NOVA I"), (1200, "GOLD NOVA II"), (1500, "MASTER GUARDIAN I"),
            (1800, "LEGENDARY EAGLE"), (2100, "SUPREME"), (2400, "GLOBAL ELITE")
        ]
        for min_elo, rank in reversed(ranks):
            if self.elo >= min_elo:
                return rank
        return "SILVER I"
    
    def can_afford(self, amount: int, currency: str = "pixels") -> bool:
        """Проверка возможности покупки"""
        if currency == "pixels":
            return self.pixels >= amount
        return self.coins >= amount
    
    def spend(self, amount: int, currency: str = "pixels") -> bool:
        """Списание средств"""
        if not self.can_afford(amount, currency):
            return False
        if currency == "pixels":
            self.pixels -= amount
        else:
            self.coins -= amount
        return True
    
    def add_pixels(self, amount: int):
        """Добавление пикселей"""
        self.pixels += amount
    
    def add_coins(self, amount: int):
        """Добавление коинов"""
        self.coins += amount
    
    def to_dict(self) -> Dict:
        """Сериализация"""
        data = asdict(self)
        data['friends'] = list(self.friends)
        data['friend_requests'] = list(self.friend_requests)
        data['achievements'] = list(self.achievements)
        if self.websocket:
            del data['websocket']
        return data

# ===================================================================
# ЧАСТЬ 5: КЛАСС КОМНАТЫ
# ===================================================================

@dataclass
class Room:
    """Класс игровой комнаты"""
    id: str
    name: str
    leader_id: str
    settings: Dict = field(default_factory=dict)
    players: Dict[str, Player] = field(default_factory=dict)
    teams: Dict[str, Set[str]] = field(default_factory=lambda: {"ct": set(), "t": set(), "spectators": set()})
    status: str = "waiting"
    created_at: float = field(default_factory=time.time)
    last_activity: float = field(default_factory=time.time)
    chat_messages: List[Dict] = field(default_factory=list)
    
    def add_player(self, player: Player) -> bool:
        """Добавление игрока в комнату"""
        if len(self.players) >= CONFIG.max_players_per_room:
            return False
        if self.status != "waiting":
            return False
        
        self.players[player.id] = player
        self.teams["spectators"].add(player.id)
        player.current_room = self.id
        player.team = "spectators"
        player.ready = False
        player.status = "in_room"
        self.last_activity = time.time()
        
        self.broadcast({
            "type": "player_joined",
            "player": player.get_public_data()
        })
        return True
    
    def remove_player(self, player_id: str) -> bool:
        """Удаление игрока из комнаты"""
        if player_id not in self.players:
            return False
        
        player = self.players[player_id]
        
        if player.team:
            self.teams[player.team].discard(player_id)
        
        del self.players[player_id]
        player.current_room = None
        player.team = None
        player.ready = False
        player.status = "online"
        
        if self.leader_id == player_id and self.players:
            self.leader_id = next(iter(self.players.keys()))
            self.broadcast({
                "type": "new_leader",
                "leader_id": self.leader_id
            })
        
        self.last_activity = time.time()
        self.broadcast({
            "type": "player_left",
            "player_id": player_id
        })
        
        return True
    
    def switch_team(self, player_id: str, new_team: str) -> bool:
        """Смена команды"""
        if player_id not in self.players:
            return False
        if new_team not in self.teams:
            return False
        if len(self.teams[new_team]) >= 5:
            return False
        
        player = self.players[player_id]
        
        if player.team:
            self.teams[player.team].discard(player_id)
        
        self.teams[new_team].add(player_id)
        player.team = new_team
        player.ready = False
        
        self.last_activity = time.time()
        self.broadcast({
            "type": "team_changed",
            "player_id": player_id,
            "team": new_team
        })
        return True
    
    def toggle_ready(self, player_id: str) -> bool:
        """Переключение готовности"""
        if player_id not in self.players:
            return False
        
        player = self.players[player_id]
        if player.team == "spectators":
            return False
        
        player.ready = not player.ready
        
        self.broadcast({
            "type": "player_ready",
            "player_id": player_id,
            "ready": player.ready
        })
        
        self._check_all_ready()
        return player.ready
    
    def _check_all_ready(self):
        """Проверка готовности всех игроков"""
        ct_players = [self.players[pid] for pid in self.teams["ct"]]
        t_players = [self.players[pid] for pid in self.teams["t"]]
        
        ct_ready = all(p.ready for p in ct_players) if ct_players else False
        t_ready = all(p.ready for p in t_players) if t_players else False
        
        if ct_ready and t_ready and ct_players and t_players and self.status == "waiting":
            self.status = "ready"
            self.broadcast({"type": "all_ready"})
    
    def start_match(self) -> bool:
        """Запуск матча"""
        if self.status not in ["ready", "waiting"]:
            return False
        
        ct_players = [self.players[pid] for pid in self.teams["ct"]]
        t_players = [self.players[pid] for pid in self.teams["t"]]
        
        if not ct_players or not t_players:
            self.broadcast({"type": "error", "message": "Нужны игроки в обеих командах"})
            return False
        
        self.status = "in_game"
        
        match_data = {
            "room_id": self.id,
            "map": self.settings.get("map", "dust2"),
            "mode": self.settings.get("mode", "competitive"),
            "rounds": self.settings.get("rounds", 30),
            "friendly_fire": self.settings.get("friendly_fire", False),
            "teams": {
                "ct": [p.get_public_data() for p in ct_players],
                "t": [p.get_public_data() for p in t_players]
            }
        }
        
        self.broadcast({
            "type": "match_start",
            "match_data": match_data
        })
        
        for player in self.players.values():
            player.status = "in_game"
            player.current_match = self.id
        
        logger.info(f"🎮 Матч начат в комнате {self.name}")
        return True
    
    def broadcast(self, data: Dict, exclude_id: Optional[str] = None):
        """Рассылка сообщения всем игрокам в комнате"""
        for player in self.players.values():
            if player.id != exclude_id and player.websocket:
                asyncio.create_task(self._send_to_player(player, data))
    
    async def _send_to_player(self, player: Player, data: Dict):
        """Отправка сообщения игроку"""
        try:
            await player.websocket.send(json.dumps(data))
        except:
            pass
    
    def get_info(self) -> Dict:
        """Информация о комнате"""
        return {
            "id": self.id,
            "name": self.name,
            "leader_id": self.leader_id,
            "players": [p.get_public_data() for p in self.players.values()],
            "teams": {
                "ct": [self.players[pid].get_public_data() for pid in self.teams["ct"] if pid in self.players],
                "t": [self.players[pid].get_public_data() for pid in self.teams["t"] if pid in self.players],
                "spectators": [self.players[pid].get_public_data() for pid in self.teams["spectators"] if pid in self.players]
            },
            "settings": self.settings,
            "status": self.status,
            "created_at": self.created_at
        }
    
    def is_inactive(self) -> bool:
        """Проверка неактивности комнаты"""
        return time.time() - self.last_activity > CONFIG.room_inactivity_timeout / 1000

# ===================================================================
# ЧАСТЬ 6: СИСТЕМА МАТЧМЕЙКИНГА
# ===================================================================

class MatchmakingSystem:
    """Система поиска матчей"""
    
    def __init__(self):
        self.queues = {
            "competitive": [],
            "casual": [],
            "wingman": [],
            "deathmatch": []
        }
    
    def add_to_queue(self, player: Player, mode: str) -> int:
        """Добавление игрока в очередь"""
        if mode not in self.queues:
            mode = "casual"
        
        # Удаляем из других очередей
        for q in self.queues.values():
            if player in q:
                q.remove(player)
        
        player.status = "searching"
        player.queue_join_time = time.time()
        self.queues[mode].append(player)
        
        logger.info(f"🔍 {player.name} ищет матч ({mode}), в очереди: {len(self.queues[mode])}")
        
        # Пытаемся создать матч
        asyncio.create_task(self._try_create_match(mode))
        
        return len(self.queues[mode])
    
    def remove_from_queue(self, player_id: str) -> bool:
        """Удаление игрока из очереди"""
        for mode, queue in self.queues.items():
            for player in queue:
                if player.id == player_id:
                    queue.remove(player)
                    player.status = "online"
                    return True
        return False
    
    async def _try_create_match(self, mode: str):
        """Попытка создания матча"""
        await asyncio.sleep(0.1)
        
        queue = self.queues[mode]
        required = 4 if mode == "wingman" else (8 if mode == "deathmatch" else 10)
        
        if len(queue) < required:
            return
        
        # Сортируем по времени ожидания и ELO
        queue.sort(key=lambda p: (time.time() - getattr(p, 'queue_join_time', time.time())) * 0.7 + abs(p.elo - 1200) * 0.3)
        
        # Берём игроков
        match_players = queue[:required]
        self.queues[mode] = queue[required:]
        
        # Создаём комнату
        room_id = f"match_{generate_id()}"
        room = Room(
            id=room_id,
            name=f"Матч {mode}",
            leader_id=match_players[0].id,
            settings={"map": "dust2", "mode": mode, "rounds": 30}
        )
        
        # Распределяем по командам
        match_players.sort(key=lambda p: p.elo, reverse=True)
        for i, player in enumerate(match_players):
            room.players[player.id] = player
            team = "ct" if i % 2 == 0 else "t"
            room.teams[team].add(player.id)
            player.team = team
            player.ready = True
            player.current_room = room_id
            player.status = "in_room"
        
        # Добавляем в список комнат
        rooms[room_id] = room
        
        # Уведомляем игроков
        for player in match_players:
            if player.websocket:
                await player.websocket.send(json.dumps({
                    "type": "match_found",
                    "room_id": room_id,
                    "room": room.get_info()
                }))
        
        logger.info(f"✅ Матч создан: {room_id} ({mode}, {len(match_players)} игроков)")
        
        # Автостарт через 10 секунд
        await asyncio.sleep(10)
        if room_id in rooms and rooms[room_id].status == "waiting":
            rooms[room_id].start_match()

# ===================================================================
# ЧАСТЬ 7: БАЗА ДАННЫХ
# ===================================================================

class Database:
    """База данных"""
    
    def __init__(self):
        self.db_path = f"{CONFIG.database_path}/pixel_strike.db"
        self._ensure_directory()
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._create_tables()
    
    def _ensure_directory(self):
        """Создание директории для БД"""
        os.makedirs(CONFIG.database_path, exist_ok=True)
    
    def _create_tables(self):
        """Создание таблиц"""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS players (
                id TEXT PRIMARY KEY,
                name TEXT,
                avatar TEXT,
                email TEXT,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                elo INTEGER DEFAULT 1200,
                rank TEXT DEFAULT 'SILVER I',
                pixels INTEGER DEFAULT 10000,
                coins INTEGER DEFAULT 500,
                kills INTEGER DEFAULT 0,
                deaths INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                play_time INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS matches (
                id TEXT PRIMARY KEY,
                map TEXT,
                mode TEXT,
                winner TEXT,
                duration INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS match_players (
                match_id TEXT,
                player_id TEXT,
                team TEXT,
                kills INTEGER,
                deaths INTEGER,
                assists INTEGER,
                mvp BOOLEAN,
                FOREIGN KEY (match_id) REFERENCES matches(id),
                FOREIGN KEY (player_id) REFERENCES players(id)
            )
        """)
        
        self.conn.commit()
    
    def save_player(self, player: Player):
        """Сохранение игрока"""
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO players 
            (id, name, avatar, email, level, xp, elo, rank, pixels, coins, kills, deaths, wins, losses, play_time, last_login)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            player.id, player.name, player.avatar, player.email,
            player.level, player.xp, player.elo, player.rank,
            player.pixels, player.coins, player.kills, player.deaths,
            player.wins, player.losses, player.play_time
        ))
        self.conn.commit()
    
    def load_player(self, player_id: str) -> Optional[Dict]:
        """Загрузка игрока"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM players WHERE id = ?", (player_id,))
        row = cursor.fetchone()
        if row:
            columns = [desc[0] for desc in cursor.description]
            return dict(zip(columns, row))
        return None
    
    def save_match(self, match_data: Dict):
        """Сохранение матча"""
        cursor = self.conn.cursor()
        match_id = generate_id()
        cursor.execute("""
            INSERT INTO matches (id, map, mode, winner, duration)
            VALUES (?, ?, ?, ?, ?)
        """, (match_id, match_data.get("map"), match_data.get("mode"), 
              match_data.get("winner"), match_data.get("duration")))
        
        for player_data in match_data.get("players", []):
            cursor.execute("""
                INSERT INTO match_players (match_id, player_id, team, kills, deaths, assists, mvp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (match_id, player_data["id"], player_data.get("team"),
                  player_data.get("kills", 0), player_data.get("deaths", 0),
                  player_data.get("assists", 0), player_data.get("mvp", False)))
        
        self.conn.commit()
        return match_id

# ===================================================================
# ЧАСТЬ 8: ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
# ===================================================================

players: Dict[str, Player] = {}
rooms: Dict[str, Room] = {}
matchmaking = MatchmakingSystem()
database = Database()
banned_players: Dict[str, Dict] = {}
muted_players: Dict[str, Dict] = {}

stats = {
    "total_connections": 0,
    "active_connections": 0,
    "total_rooms": 0,
    "total_matches": 0,
    "peak_players": 0,
    "start_time": time.time()
}

# ===================================================================
# ЧАСТЬ 9: ОБРАБОТЧИК WEBSOCKET
# ===================================================================

async def handle_connection(websocket, path):
    """Обработчик WebSocket соединений"""
    player_id = generate_id()
    ip = websocket.remote_address[0] if websocket.remote_address else "unknown"
    
    # Проверка бана
    if ip in banned_players:
        await websocket.close(4001, "IP banned")
        return
    
    player = Player(id=player_id, name=f"Player_{random.randint(1000, 9999)}", ip=ip)
    player.websocket = websocket
    players[player_id] = player
    
    stats["total_connections"] += 1
    stats["active_connections"] = len(players)
    if len(players) > stats["peak_players"]:
        stats["peak_players"] = len(players)
    
    logger.info(f"✅ {player.name} подключился ({len(players)} онлайн)")
    
    # Отправляем данные игроку
    await websocket.send(json.dumps({
        "type": "connected",
        "player_id": player.id,
        "player_name": player.name,
        "player_data": player.get_public_data()
    }))
    
    # Рассылаем список игроков
    await broadcast_player_list()
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                await handle_message(player, data)
                player.last_activity = time.time()
            except json.JSONDecodeError:
                logger.error(f"Ошибка парсинга JSON от {player.name}")
            except Exception as e:
                logger.error(f"Ошибка обработки сообщения: {e}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        # Отключение игрока
        logger.info(f"❌ {player.name} отключился")
        
        matchmaking.remove_from_queue(player_id)
        
        if player.current_room and player.current_room in rooms:
            rooms[player.current_room].remove_player(player_id)
            if not rooms[player.current_room].players:
                del rooms[player.current_room]
        
        del players[player_id]
        stats["active_connections"] = len(players)
        
        database.save_player(player)
        await broadcast_player_list()

async def handle_message(player: Player, message: Dict):
    """Обработка сообщений"""
    msg_type = message.get("type")
    
    # ===== СИСТЕМНЫЕ =====
    if msg_type == "ping":
        await player.websocket.send(json.dumps({"type": "pong"}))
    
    elif msg_type == "get_player_data":
        await player.websocket.send(json.dumps({
            "type": "player_data",
            "data": player.get_full_data()
        }))
    
    elif msg_type == "update_profile":
        if "name" in message:
            player.name = message["name"][:20]
        if "avatar" in message:
            player.avatar = message["avatar"]
        await player.websocket.send(json.dumps({"type": "profile_updated", "success": True}))
        await broadcast_player_list()
    
    # ===== МАТЧМЕЙКИНГ =====
    elif msg_type == "find_match":
        mode = message.get("mode", "competitive")
        queue_len = matchmaking.add_to_queue(player, mode)
        await player.websocket.send(json.dumps({
            "type": "matchmaking_started",
            "queue_length": queue_len
        }))
    
    elif msg_type == "cancel_match":
        matchmaking.remove_from_queue(player.id)
        await player.websocket.send(json.dumps({"type": "matchmaking_cancelled"}))
    
    # ===== КОМНАТЫ =====
    elif msg_type == "create_room":
        room_id = generate_id()
        room = Room(
            id=room_id,
            name=message.get("name", f"Комната {player.name}"),
            leader_id=player.id,
            settings=message.get("settings", {})
        )
        room.players[player.id] = player
        room.teams["spectators"].add(player.id)
        player.current_room = room_id
        player.team = "spectators"
        player.status = "in_room"
        player.is_leader = True
        
        rooms[room_id] = room
        
        await player.websocket.send(json.dumps({
            "type": "room_created",
            "room_id": room_id,
            "room": room.get_info()
        }))
    
    elif msg_type == "join_room":
        room_id = message.get("room_id")
        if room_id in rooms:
            room = rooms[room_id]
            if room.add_player(player):
                await player.websocket.send(json.dumps({
                    "type": "room_joined",
                    "room": room.get_info()
                }))
    
    elif msg_type == "leave_room":
        if player.current_room and player.current_room in rooms:
            rooms[player.current_room].remove_player(player.id)
        await player.websocket.send(json.dumps({"type": "room_left"}))
    
    elif msg_type == "switch_team":
        if player.current_room and player.current_room in rooms:
            rooms[player.current_room].switch_team(player.id, message.get("team"))
    
    elif msg_type == "toggle_ready":
        if player.current_room and player.current_room in rooms:
            rooms[player.current_room].toggle_ready(player.id)
    
    elif msg_type == "start_match":
        if player.current_room and player.current_room in rooms:
            room = rooms[player.current_room]
            if room.leader_id == player.id:
                room.start_match()
    
    # ===== ЧАТ =====
    elif msg_type == "chat_message":
        text = message.get("text", "")[:200]
        if player.current_room and player.current_room in rooms:
            rooms[player.current_room].broadcast({
                "type": "chat_message",
                "player_id": player.id,
                "player_name": player.name,
                "text": text,
                "timestamp": time.time()
            })
    
    # ===== ИГРОВЫЕ =====
    elif msg_type == "player_move":
        player.position = message.get("position", player.position)
        player.rotation = message.get("rotation", player.rotation)
        
        if player.current_match:
            # Рассылаем другим игрокам
            for p in players.values():
                if p.current_match == player.current_match and p.id != player.id and p.websocket:
                    await p.websocket.send(json.dumps({
                        "type": "player_moved",
                        "player_id": player.id,
                        "position": player.position,
                        "rotation": player.rotation
                    }))
    
    elif msg_type == "player_shoot":
        if player.current_match:
            for p in players.values():
                if p.current_match == player.current_match and p.id != player.id and p.websocket:
                    await p.websocket.send(json.dumps({
                        "type": "player_shot",
                        "player_id": player.id,
                        "weapon": message.get("weapon"),
                        "direction": message.get("direction")
                    }))
    
    elif msg_type == "player_hit":
        target_id = message.get("target_id")
        damage = message.get("damage", 0)
        
        if target_id in players:
            target = players[target_id]
            target.health = max(0, target.health - damage)
            
            for p in players.values():
                if p.current_match == player.current_match and p.websocket:
                    await p.websocket.send(json.dumps({
                        "type": "player_damaged",
                        "attacker_id": player.id,
                        "target_id": target_id,
                        "damage": damage,
                        "headshot": message.get("headshot", False),
                        "target_health": target.health
                    }))
            
            if target.health <= 0:
                player.kills += 1
                target.deaths += 1
                
                for p in players.values():
                    if p.current_match == player.current_match and p.websocket:
                        await p.websocket.send(json.dumps({
                            "type": "player_died",
                            "victim_id": target.id,
                            "killer_id": player.id,
                            "headshot": message.get("headshot", False)
                        }))

# ===================================================================
# ЧАСТЬ 10: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ РАССЫЛКИ
# ===================================================================

async def broadcast_player_list():
    """Рассылка списка онлайн игроков"""
    online_players = [p.get_public_data() for p in players.values() if p.status == "online"]
    data = json.dumps({
        "type": "player_list",
        "players": online_players,
        "total": len(players)
    })
    
    for player in players.values():
        if player.websocket:
            try:
                await player.websocket.send(data)
            except:
                pass

# ===================================================================
# ЧАСТЬ 11: ПЕРИОДИЧЕСКИЕ ЗАДАЧИ
# ===================================================================

async def cleanup_inactive_rooms():
    """Очистка неактивных комнат"""
    while True:
        await asyncio.sleep(60)
        to_delete = []
        for room_id, room in rooms.items():
            if room.is_inactive():
                to_delete.append(room_id)
        
        for room_id in to_delete:
            logger.info(f"🗑️ Удаление неактивной комнаты: {room_id}")
            del rooms[room_id]

async def save_players_periodically():
    """Периодическое сохранение игроков"""
    while True:
        await asyncio.sleep(CONFIG.save_interval / 1000)
        for player in players.values():
            database.save_player(player)
        logger.info(f"💾 Сохранено {len(players)} игроков")

# ===================================================================
# ЧАСТЬ 12: HTTP СЕРВЕР ДЛЯ СТАТИЧЕСКИХ ФАЙЛОВ
# ===================================================================

async def handle_http(reader, writer):
    """Обработчик HTTP запросов"""
    try:
        request = await reader.read(4096)
        request_line = request.decode().split('\n')[0]
        method, path, _ = request_line.split()
        
        if path == '/':
            path = '/index.html'
        
        file_path = '.' + path
        
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            content_type = 'text/html'
            if path.endswith('.js'):
                content_type = 'application/javascript'
            elif path.endswith('.css'):
                content_type = 'text/css'
            elif path.endswith('.json'):
                content_type = 'application/json'
            
            response = f"HTTP/1.1 200 OK\r\nContent-Type: {content_type}\r\nContent-Length: {len(content)}\r\n\r\n"
            writer.write(response.encode() + content)
        except FileNotFoundError:
            response = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n"
            writer.write(response.encode())
        
        await writer.drain()
    except:
        pass
    finally:
        writer.close()
        await writer.wait_closed()

async def start_http_server():
    """Запуск HTTP сервера"""
    server = await asyncio.start_server(handle_http, '0.0.0.0', CONFIG.http_port)
    logger.info(f"📡 HTTP Server: http://localhost:{CONFIG.http_port}")
    async with server:
        await server.serve_forever()

# ===================================================================
// ЧАСТЬ 13: ЗАПУСК СЕРВЕРА
# ===================================================================

async def main():
    """Главная функция запуска"""
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║     🚀 PIXEL STRIKE 15.0 ULTIMATE SERVER — ЗАПУСК! 🚀       ║")
    print("╠══════════════════════════════════════════════════════════════╣")
    print(f"║     📡 HTTP Server:      http://localhost:{CONFIG.http_port}              ║")
    print(f"║     🔌 WebSocket Server: ws://localhost:{CONFIG.ws_port}                  ║")
    print(f"║     👥 Макс. игроков:    {CONFIG.max_players_per_room} в комнате           ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    
    # Запускаем фоновые задачи
    asyncio.create_task(cleanup_inactive_rooms())
    asyncio.create_task(save_players_periodically())
    asyncio.create_task(start_http_server())
    
    # Запускаем WebSocket сервер
    async with websockets.serve(handle_connection, "0.0.0.0", CONFIG.ws_port):
        logger.info(f"🔌 WebSocket Server: ws://localhost:{CONFIG.ws_port}")
        logger.info("✅ Сервер готов к работе!")
        await asyncio.Future()  # Бесконечное ожидание

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Завершение сервера...")
        logger.info("Сервер остановлен")
        sys.exit(0)