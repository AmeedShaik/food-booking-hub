-- Run this in your PostgreSQL database to create the tables

CREATE TABLE IF NOT EXISTS bookings (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  phone       VARCHAR(15)   NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  date        DATE          NOT NULL,
  time        VARCHAR(50)   NOT NULL,
  guests      INTEGER       NOT NULL DEFAULT 1,
  meal_type   VARCHAR(100)  NOT NULL,
  special_requests TEXT,
  status      VARCHAR(20)   NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','confirmed','completed','cancelled')),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date   ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
