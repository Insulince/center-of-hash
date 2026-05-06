# CHANGELOG

### v0.3.0 - 6 May 2026
- **Simulation date controls**: play/pause/rewind scrubber with six speeds (1d/s → 100yr/s); date range extended to 200 CE–4999 CE
- **Sun visual overhaul**: six additive-blending corona shells give a convincing star glow without post-processing; solar disc at emissiveIntensity 12
- **Mining distribution panel**: four symmetric proportional-reallocation sliders (Earth, Moon, Mars, Sun) — dragging any slider continuously redistributes all others by their current ratio, guaranteeing percentages always sum to 100%; nine presets for common scenarios (Earth, Moon, Mars, Sun, E+Moon, E+Mars, Near Future, Equal, Off-World)
- **Camera anchor mode**: ⊙ toggle next to each jump button locks the camera to follow that body as the simulation date plays; anchor and jump are independent actions
- **Fix**: weighted centroid now properly divides by total weight (was relying on weights summing to ~1); returns null instead of the heliocentric origin (Sun position) when all weights are zero

### v0.2.0 - 5 May 2026
- Add Sun: to-scale solar disc with corona glow, Sun-driven directional lighting (replaces fake point light), "Sun" jump target, and redesigned Full View showing top-down ecliptic perspective including the Sun

### v0.1.2 - 5 May 2026, 11:00 PM
- WASD and arrow-key camera movement with Shift (10×) and Ctrl (0.1×) speed modifiers; Q/E for vertical movement
- Add camera WASD controls, scale bar, and frustum culling fixes

### v0.1.1 - 5 May 2026, 1:48 PM
- Add Moon indicator, solar-system view, and wishlist updates

### v0.1.0 - 5 May 2026
- Initial project created.
