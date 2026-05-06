# WISHLIST


## New Features
- Make it so you can enter the hypothetical share of hash rate as both a percentage or as a nominal value.
- ~~Add the sun and generate lighting from it as a source.~~ (done v0.1.3)
- Realistic positioning? I don't want to get into orbital simulation and dynamics. However, Mars's distance from the earth varies to such a degree that it is actually illustrative to see how at its closest point it enters the light-lag-sphere, and at its furthest point it's well out of it. This may be sim-able with just a rudimentary "position the Mars around the sun in a circular/elliptical orbit that suitably captures the distance disparity over time without necessarily being representative of Mars's actual orbit". However, we also need to think about earth's orbit as well. And damn, the moon too? It gets complicated. Even with simulated orbits.
  - As an additional note, if we do implement this, it needs time-control features and auto-animate features. You should be able to advance time, reverse time, pause time, and let it play out at a user-set speed. Al lthe planets, indicators, light lag sphere, centroid, etc. would all update in real time.
  - And then as an additional aside, a really cool feature would be to have a mode where the camera is affixed to a planet as it orbits.
- Some sort of way to indicate "yes, this planet is currently in the light sphere!" or "no, this planet is not currently in the light sphere!" Perhaps more generally, a panel or view where when you click on a celestial body, it gives you info. Like that body's share of the hash rate, its distance from the centroid, and whether it's in the sphere or not.
- Multiple levels of light-lag-sphere? How much is one impacted by its distance from the center? Ultimately, the sphere itself is... well, not arbitrary, but it doesn't tell the full picture. If a miner is within the sphere but at the very edge, they are still going to have a very tough time mining efficiently compared to someone much closer to the centroid, like anyone on the surface of the Earth. I could see additional light-lag-spheres being nested within or even on the outside, with the consequences of what they mean being illustrated in some way.
  - Being 50% of the way to the dge of the light sphere means 50% of the time the blocks you mine are outdated.
  - Being 200% of the way beyond the edge of the light sphere means you are physically restricted to being behind by two blocks.
  - These kinds of facts seem useful for this sim to outline.
- Restructure to support the two different "modes".
  - Mode 1 – Historical earth-based analysis. This would analyze the way the centroid has moved over time. This is why wwe have CCAF data, it's granular to the country level and illustrates cleanly how the China ban shifted the centroid around the center of the earth. This mode would be 100% hash rate on earth and would let you move the time slider to show how it has moved in reality over time, according to CCAF.
  - Mode 2 – Hypothetical interplanetary analysis. This would analyze what happens as the share of hashrate moves beyond earth to other bodies like the moon or Mars. You see, in this mode, the timeline and actual country-level granularity don't matter. This is why it feels like it needs a partition of the two different modes.
- Slice open a planet to reveal its core to more visually see where the centroid lies? this would be cool but just a bell/whistle, not really that useful for illustrating the point, I guess.

## Bugs
- Indicators disappear when using full view and looking around. I assume the render radius is too small at certain angles, causing the indicators to fall out of the render view.
- Render order of indicators, planets, and the light-lag-sphere is wrong.
  - Indicators should be rendered in distance order, with the closest indicator always on top. Right now there seems to be a fixed order.
  - When a planet renders, its indicator should fully disappear. It currently still exists at low opacity in the center of the planet.
  - If the camera is such that a planet is blocking an indicator from another planet, that indicator should be rendered to indicate this, meaning, if the moon is translucent (it is) and the Mars indicator is positioned behind it, the Mars indicator should acquire reduced visibility correspondent to if you were looking at it through a translucent surface (the Moon). Currently, it renders in full opacity, as if it were in front of the moon, but it is not (hence this call out). For reference, the centroid indicator for the center of hash does this properly already. If the centroid is within a planet, it's rendered in a reduced opacity way. This reduced opacity is what I expected to see if I positioned a planet in front of another planet's indicator.
  - The moon is easily visible from the earth (and should be), so its indicator does not need to come online when at earth distance scales. The user can simply scan for the moon visually. It should come online at further scales though. Likewise, the earth is also visible from the moon, so the same policy applies in the reverse direction as well.
