import pathlib

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from routers import devices, battery
from fastapi.responses import FileResponse

app = FastAPI(title="Device API")

origins = ["*"]  # "*" — разрешаем все домены, для теста ок, потом можно ограничить

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # кто может делать запросы
    allow_credentials=True,      # разрешаем отправку cookie
    allow_methods=["*"],         # разрешаем все методы (GET, POST и т.д.)
    allow_headers=["*"],         # разрешаем все заголовки
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# Подключаем роутеры
app.include_router(devices.router)
app.include_router(battery.router)

@app.get("/", response_class=FileResponse)
async def root():
    return pathlib.Path("frontend/index.html")