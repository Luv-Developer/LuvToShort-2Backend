require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LuvToShort API is running' });
});

// Redirect route
app.get('/:shortId', async (req, res) => {
  const { shortId } = req.params;

  if (!supabase) {
    return res.status(500).send('Supabase not configured on the server.');
  }

  try {
    // 1. Find the URL mapping in the database
    const { data, error } = await supabase
      .from('urls')
      .select('original_url, click_count')
      .eq('short_id', shortId)
      .single();

    if (error || !data) {
      return res.status(404).send('URL not found');
    }

    // 2. Increment the click count (Analytics - Optional Advanced Feature)
    await supabase
      .from('urls')
      .update({ click_count: data.click_count + 1 })
      .eq('short_id', shortId);

    // 3. Redirect to the original URL
    res.redirect(data.original_url);
  } catch (err) {
    console.error('Error redirecting:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Root route (for health check or redirect)
app.get('/', (req, res) => {
  res.json({ message: 'LuvToShort API is running. Client is hosted separately.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
