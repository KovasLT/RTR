-- ============================================================================
-- Seed reference data. Safe to re-run (idempotent via ON CONFLICT).
-- These are starting values for Honor of Kings — adjust freely; they are data,
-- not code.
-- ============================================================================

insert into regions (code, name, sort) values
  ('GLOBAL', 'Global',            0),
  ('WEU',    'Western Europe',   10),
  ('EEU',    'Eastern Europe',   20),
  ('MENA',   'MENA',             30),
  ('SEA',    'Southeast Asia',   40),
  ('NA',     'North America',    50),
  ('SA',     'South America',    60)
on conflict (code) do nothing;

-- Honor of Kings lanes / positions
insert into lanes (name, sort) values
  ('Clash Lane', 10),  -- solo / fighter top lane
  ('Jungle',     20),
  ('Mid Lane',   30),
  ('Farm Lane',  40),  -- marksman / AD carry
  ('Roaming',    50)   -- support
on conflict (name) do nothing;

-- Honor of Kings ranked ladder (lowest → highest)
insert into ranks (name, tier_order) values
  ('Bronze',       10),
  ('Silver',       20),
  ('Gold',         30),
  ('Platinum',     40),
  ('Diamond',      50),
  ('Master',       60),
  ('Grandmaster',  70),
  ('Mythic',       80),
  ('Epic',         90),
  ('Legend',      100)
on conflict (name) do nothing;

-- A small starter set of heroes (full roster can be imported later).
insert into heroes (name, lane_id)
select v.name, l.id
from (values
  ('Lu Bu',       'Clash Lane'),
  ('Arthur',      'Clash Lane'),
  ('Sun Wukong',  'Jungle'),
  ('Nakroth',     'Jungle'),
  ('Diao Chan',   'Mid Lane'),
  ('Angela',      'Mid Lane'),
  ('Marco Polo',  'Farm Lane'),
  ('Consort Yu',  'Farm Lane'),
  ('Dolia',       'Roaming'),
  ('Sun Bin',     'Roaming')
) as v(name, lane)
left join lanes l on l.name = v.lane
on conflict (name) do nothing;
