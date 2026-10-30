"""
database.py - MongoDB Async Client with In-Memory Fallback
"""

import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger("krishisense")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "krishisense_db")

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.use_memory = True
        self.memory_store: Dict[str, List[Dict[str, Any]]] = {
            "soil_tests": [],
            "sensor_logs": [],
            "pest_scans": [],
            "market_deals": [],
            "farmer_connections": [],
            "kolar_dealers": []
        }

    async def connect(self):
        try:
            import motor.motor_asyncio
            self.client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
            await self.client.server_info()
            self.db = self.client[DB_NAME]
            self.use_memory = False
            logger.info("Connected successfully to MongoDB.")
        except Exception as e:
            self.use_memory = True
            logger.warning(f"MongoDB not available ({e}). Using resilient In-Memory storage fallback.")

    async def close(self):
        if self.client:
            self.client.close()

    async def insert_record(self, collection_name: str, record: Dict[str, Any]):
        if not self.use_memory and self.db is not None:
            await self.db[collection_name].insert_one(record)
        else:
            if collection_name not in self.memory_store:
                self.memory_store[collection_name] = []
            self.memory_store[collection_name].append(record)

    async def get_recent_records(self, collection_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        if not self.use_memory and self.db is not None:
            cursor = self.db[collection_name].find().sort("_id", -1).limit(limit)
            return await cursor.to_list(length=limit)
        else:
            records = self.memory_store.get(collection_name, [])
            return records[-limit:][::-1]

db_manager = DatabaseManager()
