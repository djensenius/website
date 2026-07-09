---
title: Four Stochastic (Virtual) Plants for Auditory and Visual Observation
year: 2008
summary: An L-system generates four virtual plants, each with a unique sonic identity, forming a collage of growth sounds.
tags:
  - composition
  - generative
  - l-system
  - visual
---

This work explores simple algorithmic genetic creation of plants in a virtual
environment. The L-system ruleset exists as follows:

```
F-[[X]+X]+F[+FX]-X   (start: X   angle: 25°)
```

This is used for all four plants with random rates of growth. The only visual
difference, besides minor colour variation, between the plants are the starting and
ending points (x, y — not z) of the growths. (I must add that I personally find it
aesthetically appealing that virtual plants do not have the same physical limitations
as actual plants.) Each plant is given a unique sonic identity, which varies based on
growth rate and location of branches, creating a collage of growth sounds (or the
sound of virtual nature).
