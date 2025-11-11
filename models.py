# -*- coding: utf-8 -*-

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Devices(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100),unique=True, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    status = Column(Boolean, default=True)

    # 1 ко многим
    batteries = relationship("Battery", back_populates="device", cascade="all, delete-orphan")


class Batterys(Base):
    __tablename__ = "batteries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    voltage = Column(Integer, nullable=False)
    capacity = Column(Integer, nullable=False)
    lifetime = Column(Integer, nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)

    device = relationship("Device", back_populates="batteries")