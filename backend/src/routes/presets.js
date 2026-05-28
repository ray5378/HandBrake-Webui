const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const { getDatabase } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.get('/', authenticateToken, (req, res, next) => {
  try {
    const db = getDatabase();

    const presets = db
      .prepare(
        `
        SELECT * FROM presets
        ORDER BY is_built_in DESC, name ASC
      `
      )
      .all();

    const formattedPresets = presets.map(p => ({
      ...p,
      settings: JSON.parse(p.settings),
      isBuiltIn: p.is_built_in === 1
    }));

    res.json({
      success: true,
      data: { presets: formattedPresets }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticateToken, (req, res, next) => {
  try {
    const db = getDatabase();

    const preset = db.prepare('SELECT * FROM presets WHERE id = ?').get(req.params.id);

    if (!preset) {
      return res.status(404).json({
        success: false,
        error: 'Preset not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...preset,
        settings: JSON.parse(preset.settings),
        isBuiltIn: preset.is_built_in === 1
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authenticateToken,
  body('name').notEmpty().trim(),
  body('settings').isObject(),
  validate,
  (req, res, next) => {
    try {
      const { name, description, settings } = req.body;
      const db = getDatabase();

      const existingPreset = db.prepare('SELECT id FROM presets WHERE name = ?').get(name);
      if (existingPreset) {
        return res.status(400).json({
          success: false,
          error: 'Preset name already exists'
        });
      }

      const presetId = uuidv4();

      db.prepare(
        `
        INSERT INTO presets (id, name, description, settings, is_built_in)
        VALUES (?, ?, ?, ?, 0)
      `
      ).run(presetId, name, description || '', JSON.stringify(settings));

      const preset = db.prepare('SELECT * FROM presets WHERE id = ?').get(presetId);

      res.status(201).json({
        success: true,
        data: {
          ...preset,
          settings: JSON.parse(preset.settings),
          isBuiltIn: false
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authenticateToken,
  body('name').optional().trim(),
  body('settings').optional().isObject(),
  validate,
  (req, res, next) => {
    try {
      const db = getDatabase();

      const preset = db.prepare('SELECT * FROM presets WHERE id = ?').get(req.params.id);

      if (!preset) {
        return res.status(404).json({
          success: false,
          error: 'Preset not found'
        });
      }

      if (preset.is_built_in === 1) {
        return res.status(403).json({
          success: false,
          error: 'Cannot modify built-in presets'
        });
      }

      const { name, description, settings } = req.body;

      db.prepare(
        `
        UPDATE presets
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            settings = COALESCE(?, settings)
        WHERE id = ?
      `
      ).run(
        name || null,
        description !== undefined ? description : null,
        settings ? JSON.stringify(settings) : null,
        req.params.id
      );

      const updatedPreset = db.prepare('SELECT * FROM presets WHERE id = ?').get(req.params.id);

      res.json({
        success: true,
        data: {
          ...updatedPreset,
          settings: JSON.parse(updatedPreset.settings),
          isBuiltIn: updatedPreset.is_built_in === 1
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authenticateToken, (req, res, next) => {
  try {
    const db = getDatabase();

    const preset = db.prepare('SELECT * FROM presets WHERE id = ?').get(req.params.id);

    if (!preset) {
      return res.status(404).json({
        success: false,
        error: 'Preset not found'
      });
    }

    if (preset.is_built_in === 1) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete built-in presets'
      });
    }

    db.prepare('DELETE FROM presets WHERE id = ?').run(req.params.id);

    res.json({
      success: true,
      message: 'Preset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
