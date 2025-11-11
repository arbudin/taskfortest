from pydantic import BaseModel
from typing import Optional, List


class DeviceBase(BaseModel):
    name: str
    version: int
    status: bool

class BatteryBase(BaseModel):
    name: str
    voltage: int
    capacity: int
    lifetime: int

class DeviceCreate(DeviceBase):
    pass

class BatteryCreate(BatteryBase):
    device_id: Optional[int] = None

class BatteryUpdate(BaseModel):
    name: Optional[str] = None
    voltage: Optional[int] = None
    capacity: Optional[int] = None
    lifetime: Optional[int] = None
    device_id: Optional[int] = None

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    version: Optional[int] = None
    status: Optional[bool] = None

class DeviceResponse(DeviceBase):
    id: int
    batteries: list['BatteryResponse'] = []

    class Config:
        from_attributes = True

class BatteryResponse(BatteryBase):
    id: int
    device_id: Optional[int] = None

    class Config:
        from_attributes = True

BatteryResponse.update_forward_refs()