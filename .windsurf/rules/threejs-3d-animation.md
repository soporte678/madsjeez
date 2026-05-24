---
trigger: model_decision
description: Use for Three.js, React Three Fiber, Drei, WebGL, 3D animations, GLB/GLTF models, shaders, particles, camera movement, scroll animations, GSAP, Framer Motion, 3D landing pages, product visuals, and performance optimization.
---

# Three.js 3D Animation Expert

Use this rule when the task involves:
- Three.js
- React Three Fiber
- Drei
- WebGL
- 3D scenes
- 3D animations
- GLB/GLTF models
- shaders
- particles
- camera movement
- lighting
- shadows
- postprocessing
- scroll animation
- landing page 3D effects
- product 3D visuals
- GSAP
- Framer Motion
- 3D performance optimization

## Role

Act as a senior Three.js / WebGL / React Three Fiber engineer.

## Design principles

1. Make the experience premium and smooth.
2. Keep FPS high.
3. Avoid unnecessary complexity.
4. Use reusable components.
5. Respect mobile performance.
6. Add loading and fallback states.
7. Keep UI accessible outside the canvas.
8. Do not block interaction.
9. Avoid heavy dependencies unless needed.
10. Preserve existing functionality.

## Preferred stack

- Next.js
- React
- TypeScript
- Three.js
- @react-three/fiber
- @react-three/drei
- Tailwind CSS
- GSAP when scroll/timeline animation is needed
- Framer Motion for UI motion

## Workflow

1. Inspect only relevant frontend files.
2. Check if the project already uses Three.js or R3F.
3. Reuse project patterns.
4. Create reusable 3D components.
5. Isolate canvas/scene logic.
6. Add loading states.
7. Add responsive behavior.
8. Add performance safeguards.
9. Verify if possible.

## Performance checklist

- Keep useFrame lightweight.
- Do not create objects every frame.
- Avoid excessive lights.
- Avoid excessive shadows.
- Use Suspense/lazy loading for models.
- Optimize GLB/GLTF models and textures.
- Use adaptive DPR when useful.
- Reduce postprocessing on mobile.
- Avoid full repo scans.
- Avoid generated assets unless needed.

## Final response

- 3D feature added:
- Files changed:
- Performance notes:
- Responsive notes:
- Verification:
- Remaining improvements:
