import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SPACE_COLORS, SPACE_ICONS } from '../utils/constants';
import {
  GraduationCap, Briefcase, Heart, Home, Star,
  BookOpen, Code, Music, Plane, Dumbbell,
  Camera, ShoppingBag, Palette, Gamepad2, Stethoscope,
} from 'lucide-react';

const ICON_MAP = {
  GraduationCap, Briefcase, Heart, Home, Star,
  BookOpen, Code, Music, Plane, Dumbbell,
  Camera, ShoppingBag, Palette, Gamepad2, Stethoscope,
};

/**
 * Modal for creating or editing a space.
 */
export default function SpaceEditor({ space, onSave, onDelete, onClose }) {
  const isEditing = !!space;

  const [name, setName] = useState(space?.name || '');
  const [color, setColor] = useState(space?.color || SPACE_COLORS[0].value);
  const [icon, setIcon] = useState(space?.icon || SPACE_ICONS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, icon }, space?.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal__header">
          <h2 className="modal__title">{isEditing ? 'Edit Space' : 'New Space'}</h2>
          <button className="modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal__body">
          <div className="field">
            <label className="field__label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Space name…"
              autoFocus
              id="space-name-input"
            />
          </div>

          <div className="field">
            <label className="field__label">Color</label>
            <div className="space-color-picker">
              {SPACE_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`space-color-swatch ${color === c.value ? 'space-color-swatch--active' : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field__label">Icon</label>
            <div className="space-icon-picker">
              {SPACE_ICONS.map((iconName) => {
                const IconComp = ICON_MAP[iconName] || Star;
                return (
                  <button
                    key={iconName}
                    className={`space-icon-btn ${icon === iconName ? 'space-icon-btn--active' : ''}`}
                    onClick={() => setIcon(iconName)}
                    title={iconName}
                  >
                    <IconComp size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal__footer">
          {isEditing && onDelete && (
            <button
              className="btn btn--danger"
              onClick={() => {
                onDelete(space.id);
                onClose();
              }}
              style={{ marginRight: 'auto' }}
            >
              Delete Space
            </button>
          )}
          <button className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSave} id="space-save-btn">
            {isEditing ? 'Save' : 'Create Space'}
          </button>
        </div>
      </div>
    </div>
  );
}
