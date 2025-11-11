from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from schemas import BatteryCreate, BatteryResponse, BatteryUpdate

router = APIRouter(prefix="/battery", tags=["battery"])

@router.get("/")
def get_battery(Session = Depends(get_db)):
    cursor = Session.cursor()
    cursor.execute("SELECT * FROM batteries")
    return cursor.fetchall()

# Добавить новую батарею
@router.post("/create", response_model=BatteryResponse)
def create_battery(battery: BatteryCreate):
    conn = get_db()
    cursor = conn.cursor()


    # Добавляем устройство
    cursor.execute(
        """INSERT INTO batteries (name, voltage, capacity, lifetime, device_id)
         VALUES (%s, %s, %s, %s, %s) RETURNING id, name, voltage, capacity, lifetime""",
        (battery.name, battery.voltage, battery.capacity, battery.lifetime, battery.device_id),
    )

    new_battery = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()

    return new_battery

# Обновить данные
@router.put("/update")
def update_battery(battery_id: int, battery_update: BatteryUpdate, db = Depends(get_db)):
    with db.cursor() as cursor:
        # Просто передаем все поля (None останутся без изменений)
        cursor.execute("""
            UPDATE batteries
            SET name = COALESCE(%s, name),
                voltage = COALESCE(%s, voltage),
                capacity = COALESCE(%s, capacity),
                lifetime = COALESCE(%s, lifetime), 
                device_id = COALESCE(%s, device_id)
            WHERE id = %s
            RETURNING *
        """, (
            battery_update.name,
            battery_update.voltage,
            battery_update.capacity,
            battery_update.lifetime,
            battery_update.device_id,
            battery_id
        ))

        updated = cursor.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="batteries not found")

        db.commit()
        return updated




# Удалить батарею
@router.delete("/delete_battery")
def delete_battery(battery_id: int):
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM batteries WHERE id = %s", (battery_id,))

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="battery not found")

            conn.commit()
            return {"message": "battery deleted"}