-- TripSync Initial Schema
-- Run this as a single migration in Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE trip_status AS ENUM (
  'gathering_inputs',
  'voting',
  'planning',
  'active',
  'completed'
);

CREATE TYPE member_role AS ENUM ('organizer', 'member');

CREATE TYPE item_category AS ENUM (
  'activity',
  'meal',
  'transport',
  'accommodation'
);

CREATE TYPE chat_role AS ENUM ('user', 'assistant');

CREATE TYPE event_type AS ENUM (
  'link_opened',
  'trip_joined',
  'date_vote_completed',
  'budget_submitted',
  'destination_voted',
  'itinerary_viewed',
  'chat_message_sent',
  'expense_added',
  'settlement_link_opened',
  'nudge_sent'
);

-- ─── Core Tables ─────────────────────────────────────────────────────────────

CREATE TABLE trips (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              text UNIQUE NOT NULL,
  name              text NOT NULL,
  created_by        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status            trip_status NOT NULL DEFAULT 'gathering_inputs',
  date_window_start date,
  date_window_end   date,
  confirmed_start   date,
  confirmed_end     date,
  destination       text,
  budget_min        integer,
  budget_max        integer,
  vibes             text[] DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE trip_members (
  trip_id   uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);

CREATE TABLE date_poll_config (
  trip_id      uuid PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,
  is_anonymous boolean NOT NULL DEFAULT false,
  deadline     timestamptz
);

CREATE TABLE date_votes (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         date NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id, date)
);

CREATE TABLE budget_votes (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_min integer NOT NULL,
  budget_max integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);

CREATE TABLE vibe_votes (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vibes      text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);

CREATE TABLE destinations (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id            uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name               text NOT NULL,
  pitch              text NOT NULL,
  estimated_cost_min integer,
  estimated_cost_max integer,
  pros               text[] DEFAULT '{}',
  cons               text[] DEFAULT '{}',
  travel_options     jsonb DEFAULT '[]',
  why_fits_group     text,
  google_place_id    text,
  coordinates        point,
  photo_url          text,
  ai_generated       boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE destination_votes (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id        uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  rank           integer NOT NULL CHECK (rank >= 1),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id, destination_id)
);

CREATE TABLE itinerary_items (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id          uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number       integer NOT NULL CHECK (day_number >= 1),
  position         integer NOT NULL DEFAULT 0,
  place_name       text NOT NULL,
  place_id         text,
  coordinates      point,
  category         item_category NOT NULL DEFAULT 'activity',
  notes            text,
  booking_url      text,
  booking_platform text,
  start_time       time,
  duration_minutes integer,
  is_offbeat       boolean NOT NULL DEFAULT false,
  how_to_get_there text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX itinerary_items_trip_day ON itinerary_items(trip_id, day_number, position);

CREATE TABLE itinerary_snapshots (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  snapshot   jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id),
  content    text NOT NULL,
  role       chat_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_trip ON chat_messages(trip_id, created_at);

CREATE TABLE expenses (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  paid_by     uuid NOT NULL REFERENCES auth.users(id),
  amount      numeric(10,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  category    text NOT NULL DEFAULT 'other',
  receipt_url text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE expense_splits (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  amount     numeric(10,2) NOT NULL,
  is_settled boolean NOT NULL DEFAULT false,
  settled_at timestamptz,
  UNIQUE (expense_id, user_id)
);

CREATE TABLE event_logs (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id    uuid REFERENCES trips(id) ON DELETE SET NULL,
  user_id    uuid REFERENCES auth.users(id),
  event_type event_type NOT NULL,
  metadata   jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX event_logs_trip ON event_logs(trip_id, created_at);
CREATE INDEX event_logs_type ON event_logs(event_type, created_at);

CREATE TABLE offbeat_experiences (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  destination text NOT NULL,
  name        text NOT NULL,
  description text NOT NULL,
  category    text NOT NULL,
  price_range text,
  local_tip   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX offbeat_destination ON offbeat_experiences(destination);

-- ─── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_poll_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE offbeat_experiences ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION is_trip_member(trip_uuid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = trip_uuid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_trip_organizer(trip_uuid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = trip_uuid AND user_id = auth.uid() AND role = 'organizer'
  );
$$;

-- trips
CREATE POLICY "trips_select" ON trips FOR SELECT USING (is_trip_member(id));
CREATE POLICY "trips_insert" ON trips FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "trips_update" ON trips FOR UPDATE USING (is_trip_organizer(id));

-- trip_members
CREATE POLICY "members_select" ON trip_members FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "members_insert" ON trip_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members_delete" ON trip_members FOR DELETE
  USING (user_id = auth.uid() OR is_trip_organizer(trip_id));

-- date_poll_config
CREATE POLICY "dpc_select" ON date_poll_config FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "dpc_insert" ON date_poll_config FOR INSERT WITH CHECK (is_trip_organizer(trip_id));
CREATE POLICY "dpc_update" ON date_poll_config FOR UPDATE USING (is_trip_organizer(trip_id));

-- date_votes
CREATE POLICY "dv_select" ON date_votes FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "dv_insert" ON date_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_trip_member(trip_id));
CREATE POLICY "dv_update" ON date_votes FOR UPDATE USING (auth.uid() = user_id);

-- budget_votes
CREATE POLICY "bv_select" ON budget_votes FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "bv_insert" ON budget_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_trip_member(trip_id));
CREATE POLICY "bv_update" ON budget_votes FOR UPDATE USING (auth.uid() = user_id);

-- vibe_votes
CREATE POLICY "vv_select" ON vibe_votes FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "vv_insert" ON vibe_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_trip_member(trip_id));
CREATE POLICY "vv_update" ON vibe_votes FOR UPDATE USING (auth.uid() = user_id);

-- destinations
CREATE POLICY "dest_select" ON destinations FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "dest_insert" ON destinations FOR INSERT WITH CHECK (is_trip_member(trip_id));

-- destination_votes
CREATE POLICY "destv_select" ON destination_votes FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "destv_insert" ON destination_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_trip_member(trip_id));

-- itinerary_items
CREATE POLICY "ii_select" ON itinerary_items FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "ii_insert" ON itinerary_items FOR INSERT WITH CHECK (is_trip_member(trip_id));
CREATE POLICY "ii_update" ON itinerary_items FOR UPDATE USING (is_trip_member(trip_id));
CREATE POLICY "ii_delete" ON itinerary_items FOR DELETE USING (is_trip_member(trip_id));

-- itinerary_snapshots
CREATE POLICY "is_select" ON itinerary_snapshots FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "is_insert" ON itinerary_snapshots FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_trip_member(trip_id));

-- chat_messages
CREATE POLICY "cm_select" ON chat_messages FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "cm_insert" ON chat_messages FOR INSERT WITH CHECK (is_trip_member(trip_id));

-- expenses
CREATE POLICY "exp_select" ON expenses FOR SELECT USING (is_trip_member(trip_id));
CREATE POLICY "exp_insert" ON expenses FOR INSERT
  WITH CHECK (auth.uid() = paid_by AND is_trip_member(trip_id));

-- expense_splits
CREATE POLICY "es_select" ON expense_splits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_trip_member(e.trip_id)
  ));
CREATE POLICY "es_insert" ON expense_splits FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_trip_member(e.trip_id)
  ));
CREATE POLICY "es_update" ON expense_splits FOR UPDATE USING (auth.uid() = user_id);

-- event_logs: open insert for any authenticated user
CREATE POLICY "el_insert" ON event_logs FOR INSERT WITH CHECK (true);

-- offbeat_experiences: public read
CREATE POLICY "oe_select" ON offbeat_experiences FOR SELECT USING (true);

-- ─── Seed: offbeat_experiences ───────────────────────────────────────────────

INSERT INTO offbeat_experiences (destination, name, description, category, price_range, local_tip) VALUES
-- GOA
('Goa', 'Chorao Island Bicycle Tour', 'Cycle through bird sanctuary and mangroves on this hidden island via a tiny ferry', 'nature', '₹500-800/person', 'Take the 6am ferry from Ribandar for the bird spotting window'),
('Goa', 'Fontainhas Heritage Walk', 'Portuguese-era Latin Quarter with painted houses, bakeries, and feni tasting', 'culture', '₹200-500/person', 'Visit Tue-Sun; most art studios closed Monday'),
('Goa', 'Cabo de Rama Fort Sunset', 'Ruined Portuguese fort on a cliff with unobstructed Arabian Sea views', 'adventure', 'Free', 'Arrive 45 min before sunset; no food stalls — carry snacks'),
('Goa', 'Arambol Paragliding', 'Launch from cliff above Arambol beach for 15-min sea flights', 'adventure', '₹2500-3500/person', 'Book with Nikhil Paragliding; avoid monsoon (Jun-Sep)'),
('Goa', 'Old Quarter Feni Crawl', 'Sample cashew and coconut feni at toddy shops in Panjim old town', 'food', '₹150-400/person', 'Ask for "special reserve" — not on the menu card'),
('Goa', 'Divar Island Village Stay', 'Overnight homestay on a car-free river island with Portuguese-Goan cooking', 'culture', '₹2000-3500/night', 'Book 2+ weeks ahead; ferry from Old Goa stops at 11pm'),
('Goa', 'Butterfly Beach Boat Trip', 'Private boat to a secluded beach only accessible by water, with dolphins', 'nature', '₹1500-2000 for full boat', 'Haggle at Palolem jetty; best in October-November'),
('Goa', 'Spice Plantation Cooking Class', 'Half-day at a working spice farm with cooking demo and Goan thali', 'food', '₹1500-2500/person', 'Sahakari Spice Farm is best maintained; book weekday to avoid crowds'),
-- MANALI
('Manali', 'Hampta Pass Day Trek', 'Cross a 4270m pass with glacier views — doable as a challenging day hike', 'adventure', '₹2500-4000/person with guide', 'Start at 5am from Jobra; acclimatize one day first'),
('Manali', 'Old Manali Cafe Hop', 'Laid-back village 3km from main bazaar with wooden cafes, apple orchards', 'food', '₹300-700/person', 'Lazy Dog and Drifters Inn for the best roof decks'),
('Manali', 'Solang Valley Snowtubing', 'Winter tubing lanes with Himalayan backdrop — more fun than skiing for groups', 'adventure', '₹500-800/person', 'Weekday mornings only; weekends are chaotic'),
('Manali', 'Naggar Castle Heritage', 'Medieval Hungarian-style castle converted to government hotel; museum inside', 'culture', '₹50 entry', 'Rooftop gives the best Kullu Valley panorama — often empty'),
('Manali', 'Chandratal Lake Overnight', 'Moon Lake at 4300m — camp by the crescent-shaped glacial lake', 'nature', '₹3000-5000/person (tent+meals)', 'Requires Spiti valley permit; accessible Jun-Oct only'),
('Manali', 'Kasol-Kheerganga Hot Springs Trek', '13km uphill trek to natural hot water springs in the forest', 'adventure', '₹200-400 guide optional', 'Springs open year-round; avoid Diwali week — impossibly crowded'),
('Manali', 'Hadimba Temple Deodar Forest', 'Ancient wooden pagoda temple surrounded by 1000-year-old cedar trees', 'culture', 'Free', 'Morning visit before 9am for zero crowds; no photos inside'),
('Manali', 'Kullu River Rafting', '14km Grade III rafting on Beas river through pine-forested gorge', 'adventure', '₹600-1200/person', 'Pirdi to Jhiri route; mid-July to August is peak flow'),
-- PONDICHERRY
('Pondicherry', 'Auroville Matrimandir Visit', 'Giant golden sphere meditation center at the utopian township', 'culture', 'Free (prior registration)', 'Register at Visitors Centre 9am-1pm; camera not allowed inside'),
('Pondicherry', 'White Town Sunrise Cycle', 'Colonial French quarter cycle at dawn before tourist crowds and heat', 'culture', '₹150-300 cycle rental', 'Start at promenade; cafes open by 7am'),
('Pondicherry', 'Tamil Quarter Fish Market', 'Bustling 5am fish market in the Villianur area — raw, unfiltered Pondy', 'food', 'Free to walk through', 'Go with a local; vendors start packing by 7:30am'),
('Pondicherry', 'Karaikal Beach Day Trip', 'Underrated beach 1hr south; no tourists, real fishing village atmosphere', 'nature', '₹500-700 auto round trip', 'Pair with lunch at a local mess — ask for "sappadu"'),
('Pondicherry', 'Heritage Villa Cooking Class', 'French-Tamil fusion cooking in a restored 18th-century villa', 'food', '₹2000-3500/person', 'Villa de Pondicherry — book 1 week ahead'),
('Pondicherry', 'Sri Aurobindo Ashram Evening Prayer', 'Candlelit collective meditation at India oldest spiritual commune', 'culture', 'Free', 'Silence is strictly enforced; remove shoes 50m before entrance'),
('Pondicherry', 'Paradise Beach Catamaran', 'Deserted beach 8km from Chunnambar; reach only by catamaran', 'nature', '₹250-400 return boat', 'Last boat back at 5:30pm — do not miss it'),
-- JAIPUR
('Jaipur', 'Abhaneri Stepwell Day Trip', 'Chand Baori — one of the deepest stepwells in India, 13 stories deep', 'culture', '₹25 entry', '95km from Jaipur; combine with Fatehpur Sikri if going further'),
('Jaipur', 'Blue Pottery Workshop', 'Learn the rare Persian-influenced craft from a master potter in Sanganer', 'culture', '₹800-1500/person', 'Kripal Kumbh studio is the most authentic — call ahead'),
('Jaipur', 'Chokhi Dhani Village Evening', 'Ethnic Rajasthani village resort with folk dance, camel rides, unlimited thali', 'food', '₹700-1200/person', 'Buy the premium pass for sit-down thali vs buffet'),
('Jaipur', 'Amber Fort Light and Sound Show', 'Dramatic Hindi/English show narrating Rajput history on the fort walls', 'culture', '₹200-250/person', 'Book online; arrive 30 min early for front rows'),
('Jaipur', 'Johri Bazaar Thali Crawl', 'Old city bazaar — start at LMB Hotel thali, finish with Rawat kachori', 'food', '₹300-500/person', 'Avoid post-5pm on weekends — streets become impassable'),
('Jaipur', 'Nahargarh Fort Rooftop Cafe', 'Hilltop fort with cafe giving 360° city views — best at golden hour', 'nature', '₹200 entry + cafe prices', 'Drive up 30 min before sunset; no auto-rickshaw access'),
('Jaipur', 'Sanganer Block Printing Studio', 'Watch artisans hand-print textiles using centuries-old wooden blocks', 'culture', '₹500-1000 workshop', 'Buy direct from printers — 40% cheaper than boutiques'),
-- COORG
('Coorg', 'Mandalpatti Peak Trek', 'Drive to Mallalli then trek to meadow plateau with misty valley views', 'nature', '₹200 jeep + free trek', 'Open only June-January; forest dept jeep is mandatory'),
('Coorg', 'Iruppu Falls Sunrise Hike', 'Sacred waterfall at edge of Brahmagiri wildlife sanctuary', 'nature', 'Free (₹100 forest fee)', 'Start before 7am to beat pilgrims on weekends'),
('Coorg', 'Coffee Estate Homestay', 'Wake up in a working coffee/pepper estate, guided plantation walk + filter coffee', 'nature', '₹3000-6000/night', 'Rainforest Retreat or Honey Valley — book 3+ weeks ahead in season'),
('Coorg', 'Kodagu Cuisine Cooking Class', 'Learn Pandi curry, Koli curry, and Kadambuttu from a Kodava home cook', 'food', '₹1500-2500/person', 'Coorg Cuisine cooking school in Madikeri is best for groups'),
('Coorg', 'Dubare Elephant Camp', 'Wade into the Kaveri river with working elephants at dawn', 'nature', '₹500-700/person', 'Camp starts at 7am; book Forest Dept directly — avoid middlemen');
