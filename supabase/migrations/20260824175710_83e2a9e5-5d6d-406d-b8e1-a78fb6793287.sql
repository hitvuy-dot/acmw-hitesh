CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt text NOT NULL,
  options text[] NOT NULL,
  correct_index integer NOT NULL,
  category text NOT NULL DEFAULT 'general',
  explanation text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.questions TO anon;
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are publicly readable" ON public.questions FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name text NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 24),
  score integer NOT NULL CHECK (score >= 0),
  total integer NOT NULL CHECK (total > 0),
  seconds integer NOT NULL DEFAULT 0 CHECK (seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.scores TO anon;
GRANT SELECT, INSERT ON public.scores TO authenticated;
GRANT ALL ON public.scores TO service_role;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard is publicly readable" ON public.scores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can submit a score" ON public.scores FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.questions (prompt, options, correct_index, category, explanation, sort_order) VALUES
('What does ACM stand for?', ARRAY['Association for Computing Machinery','Association of Computer Manufacturers','Advanced Computing Members','American Center for Machines'], 0, 'ACM', 'ACM is the Association for Computing Machinery, founded in 1947.', 1),
('In which year was ACM founded?', ARRAY['1936','1947','1962','1975'], 1, 'ACM', 'ACM was founded in 1947, making it the world''s oldest computing society.', 2),
('What is the primary mission of ACM-W?', ARRAY['Selling computing hardware','Supporting, celebrating and advocating for women in computing','Regulating internet standards','Hosting esports tournaments'], 1, 'ACM-W', 'ACM-W supports, celebrates and advocates internationally for women in computing.', 3),
('Which prestigious award, often called the "Nobel Prize of Computing", is given by ACM?', ARRAY['Fields Medal','Turing Award','Shannon Award','Von Neumann Medal'], 1, 'ACM', 'The ACM A.M. Turing Award is widely regarded as the highest honor in computing.', 4),
('The ACM-W scholarship program primarily supports women students to do what?', ARRAY['Buy laptops','Attend research conferences','Start companies','Pay tuition only'], 1, 'ACM-W', 'ACM-W provides scholarships for women students to attend research conferences.', 5),
('Which ACM-W celebration series recognizes women in computing regionally?', ARRAY['ACM-W Celebrations of Women in Computing','ACM Hackfest','ACM Open Source Days','ACM Coding Cup'], 0, 'ACM-W', 'ACM-W Celebrations are regional conferences held around the world.', 6),
('What is Artificial Intelligence, most simply put?', ARRAY['Machines performing tasks that typically require human intelligence','A type of computer monitor','A programming language','A database engine'], 0, 'AI', 'AI is about building systems that perform tasks requiring human-like intelligence.', 7),
('Which of these is a subset of Artificial Intelligence?', ARRAY['Machine Learning','Cable Management','Spreadsheet Formatting','Disk Defragmentation'], 0, 'AI', 'Machine Learning is a subfield of AI focused on learning from data.', 8),
('In supervised learning, the training data is:', ARRAY['Unlabeled','Labeled with correct answers','Randomly generated only','Always images'], 1, 'AI', 'Supervised learning uses input-output pairs, i.e. labeled data.', 9),
('A neural network is loosely inspired by what?', ARRAY['Solar panels','The human brain''s neurons','Railway networks','Ocean currents'], 1, 'AI', 'Artificial neural networks are inspired by biological neurons.', 10),
('What does "LLM" stand for in modern AI?', ARRAY['Large Language Model','Linear Logic Machine','Long Loop Memory','Layered Learning Method'], 0, 'AI', 'LLMs are large neural networks trained to model and generate language.', 11),
('When an AI model performs great on training data but poorly on new data, it is called:', ARRAY['Underfitting','Overfitting','Normalization','Tokenization'], 1, 'AI', 'Overfitting means the model memorized the training data instead of generalizing.', 12);