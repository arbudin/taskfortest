from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from schemas import DeviceCreate, DeviceResponse, DeviceUpdate

router = APIRouter(prefix="/devices", tags=["devices"])

# Вывести все устройства
class Depend:
    pass


@router.get("/")
def get_devices(Session = Depends(get_db)):
    cursor = Session.cursor()
    cursor.execute("SELECT * FROM devices")
    return cursor.fetchall()


# Добавить устройство
@router.post("/create", response_model=DeviceResponse)
def create_device(device: DeviceCreate):
    conn = get_db()
    cursor = conn.cursor()


    # Добавляем устройство
    cursor.execute(
        """INSERT INTO devices (name, version, status)
         VALUES (%s, %s, %s) RETURNING id, name, version, status""",
        (device.name, device.version, device.status),
    )

    new_device = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()

    return new_device

# Обновить данные
@router.put("/update")
def update_device(device_id: int, device_update: DeviceUpdate, db = Depends(get_db)):
    with db.cursor() as cursor:
        cursor.execute("""
        UPDATE devices
        SET name = COALESCE(%s, name),
            version = COALESCE(%s, version),
            status = COALESCE(%s, status)
        WHERE id = %s
        RETURNING *
    """, (
            device_update.name,
            device_update.version,
            device_update.status,
            device_id
        ))

        updated = cursor.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="No such device")

        db.commit()
        return updated

# Удалить устройство
@router.delete("/delete_device")
def delete_device(device_id: int):
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE batteries SET device_id = NULL WHERE device_id = %s",
                (device_id,)
            )

            cursor.execute("DELETE FROM devices WHERE id = %s", (device_id,))

            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="devices not found")

            conn.commit()
            return {"message": "device deleted"}