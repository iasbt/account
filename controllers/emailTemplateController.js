
import pool from '../db.js';
import { loadTemplates } from '../utils/emailTemplates.js';

export const getTemplates = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.email_templates ORDER BY type');
    res.json(result.rows);
  } catch (err) {
    console.error('Get templates error:', err);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
};

export const updateTemplate = async (req, res) => {
  const { type } = req.params;
  const { subject, content } = req.body;

  try {
    const result = await pool.query(
      'UPDATE public.email_templates SET subject = $1, content = $2, updated_at = NOW() WHERE type = $3 RETURNING *',
      [subject, content, type]
    );

    if (result.rowCount === 0) {
      // If not exists, maybe insert it?
      // For now, only update existing ones.
      return res.status(404).json({ message: 'Template not found' });
    }

    // Refresh cache
    await loadTemplates();

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update template error:', err);
    res.status(500).json({ message: 'Failed to update template' });
  }
};
