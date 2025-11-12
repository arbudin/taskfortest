import pathlib

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from routers import devices, battery
from fastapi.responses import FileResponse

app = FastAPI(title="Device API")

app.mount("/static", StaticFiles(directory="static"), name="static")

# Подключаем роутеры
app.include_router(devices.router)
app.include_router(battery.router)

@app.get("/", response_class=FileResponse)
async def root():
    return pathlib.Path("frontend/index.html")