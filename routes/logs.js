const express = require('express');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get logs with filtering
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { level, category, date } = req.query;
        
        let query = db.select().from('system_logs').orderBy('created_at', 'desc').limit(100);
        
        if (level && level !== 'all') {
            query = query.where('level', '=', level);
        }
        
        if (category && category !== 'all') {
            query = query.where('category', '=', category);
        }
        
        if (date) {
            query = query.where('created_at', '>=', new Date(date));
        }
        
        const logs = await query;
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Download logs as CSV
router.get('/download', authMiddleware, async (req, res) => {
    try {
        const { level, category, date } = req.query;
        
        let query = db.select().from('system_logs').orderBy('created_at', 'desc');
        
        if (level && level !== 'all') {
            query = query.where('level', '=', level);
        }
        
        if (category && category !== 'all') {
            query = query.where('category', '=', category);
        }
        
        if (date) {
            query = query.where('created_at', '>=', new Date(date));
        }
        
        const logs = await query;
        
        // Convert to CSV
        const fields = ['timestamp', 'level', 'category', 'message', 'details'];
        const csv = [
            fields.join(','),
            ...logs.map(log => {
                return fields.map(field => {
                    const value = log[field]?.toString().replace(/"/g, '""') || '';
                    return `"${value}"`;
                }).join(',');
            })
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=system_logs_${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error downloading logs:', error);
        res.status(500).json({ error: 'Failed to download logs' });
    }
});

module.exports = router;
