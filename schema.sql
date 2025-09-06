CREATE TABLE IF NOT EXISTS poi (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: seed some example rows
-- INSERT INTO poi (name, latitude, longitude) VALUES
-- ('City Hall', 37.5665, 126.9780);

