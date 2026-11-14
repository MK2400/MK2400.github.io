# Mohammad Khallouf — Portfolio

An interactive solar-system portfolio. The **sun** is my profile, every **planet** is a project, and the **comet** is the contact card. Built with plain HTML/CSS/JS and [three.js](https://threejs.org) — no build step.

## Run locally

Any static server works (ES modules do not load from `file://`):

```bash
npx http-server . -p 4173 -c-1
```

Then open http://localhost:4173.

## Edit the content

Everything you see comes from **`js/data.js`** — profile, experience, skills, education, and projects.

### Add screenshots or videos to a project

1. Put the files in `assets/projects/<project-id>/` (folders already exist).
2. Add entries to that project's `media` array in `js/data.js`:

```js
media: [
  { type: 'image',   src: 'assets/projects/kafou/home.webp', caption: 'Home screen' },
  { type: 'video',   src: 'assets/projects/kafou/demo.mp4',  poster: 'assets/projects/kafou/demo.jpg' },
  { type: 'youtube', id: 'VIDEO_ID', caption: 'Walkthrough' },
],
```

A gallery (with a click-to-zoom lightbox) appears automatically in the project panel and in the classic view.
Tips: export screenshots as WebP around 1200 px wide, and keep videos short (or host them on YouTube) — GitHub rejects files over 100 MB.

### Add a new project (= a new planet)

Copy one of the objects in `projects` and change its `planet` settings:

| field | meaning |
|---|---|
| `type` | `rocky`, `earth`, `clouds`, `gas`, or `ice` |
| `radius`, `orbit` | planet size and distance from the sun |
| `speed`, `phase` | orbit speed and starting angle |
| `colors` | three hex colours for the procedural surface |
| `spot: true` | giant storm (Great Red Spot) — gas giants only |
| `rings: true` | Saturn-style rings |
| `moons: n` | small moons |

### Update the CV

Replace `assets/cv/Mohammad-Khallouf-CV.pdf`.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. Repository **Settings → Pages → Build and deployment → Deploy from a branch**, choose `main` and `/ (root)`.
3. The site goes live at `https://<username>.github.io/<repository>/`.

Naming the repository `<username>.github.io` gives the shorter address `https://<username>.github.io/`.

## Structure

```
index.html
css/style.css
js/data.js      ← content
js/main.js      ← UI: panels, navigation, classic view
js/scene.js     ← 3D solar system
js/shaders.js   ← procedural planet / sun / star shaders
vendor/three/   ← three.js r170 (MIT)
assets/         ← CV and project media
```
