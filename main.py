#-*- coding: utf-8 -*-
from fastapi import FastAPI

from routers import devices, battery

app = FastAPI(title="Device API")

# Подключаем роутеры
app.include_router(devices.router)
app.include_router(battery.router)

@app.get("/")
def read_root():
    return "Bibon"