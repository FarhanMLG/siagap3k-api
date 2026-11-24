require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Inisialisasi Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('Peringatan: SUPABASE_URL atau SUPABASE_KEY belum diisi di file .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'API SiagaP3K Aktif' });
});

// 2. GET /darurat - Ambil semua data darurat (urut title) + filter ?urgency= & ?search=
app.get('/darurat', async (req, res) => {
  try {
    const { urgency, search } = req.query;
    let query = supabase.from('darurat').select('*').order('title', { ascending: true });

    if (urgency) {
      query = query.eq('urgency', urgency);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /darurat/:id - Ambil 1 item darurat by id
app.get('/darurat/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('darurat')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Data darurat tidak ditemukan' });
      }
      throw error;
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /obat - Ambil semua data obat_p3k (urut name) + filter ?category= & ?search=
app.get('/obat', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = supabase.from('obat_p3k').select('*').order('name', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /obat/:id - Ambil 1 item obat_p3k by id
app.get('/obat/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('obat_p3k')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Data obat tidak ditemukan' });
      }
      throw error;
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /kotak-saya - Ambil semua data kotak_saya (urut expiry_date ascending)
app.get('/kotak-saya', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kotak_saya')
      .select('*')
      .order('expiry_date', { ascending: true });

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. POST /kotak-saya - Tambah data ke kotak_saya (status 201)
app.post('/kotak-saya', async (req, res) => {
  try {
    const { item_name, quantity, expiry_date, notes } = req.body;
    const { data, error } = await supabase
      .from('kotak_saya')
      .insert([{ item_name, quantity, expiry_date, notes }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. PUT /kotak-saya/:id - Update item kotak_saya by id
app.put('/kotak-saya/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, quantity, expiry_date, notes } = req.body;

    const payload = {};
    if (item_name !== undefined) payload.item_name = item_name;
    if (quantity !== undefined) payload.quantity = quantity;
    if (expiry_date !== undefined) payload.expiry_date = expiry_date;
    if (notes !== undefined) payload.notes = notes;

    const { data, error } = await supabase
      .from('kotak_saya')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Item kotak_saya tidak ditemukan' });
      }
      throw error;
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. DELETE /kotak-saya/:id - Hapus item kotak_saya by id
app.delete('/kotak-saya/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('kotak_saya')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Item kotak_saya tidak ditemukan' });
      }
      throw error;
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ekspor app untuk Vercel Serverless Function
module.exports = app;

// Jalankan listen hanya saat dieksekusi langsung secara lokal
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server SiagaP3K API aktif di port ${PORT}`);
  });
}
