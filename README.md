# ml-4-geos

**Machine learning in the geosciences**: an interactive lecture for incoming graduate students, School of Geosciences, University of Oklahoma.

The whole lecture is one static site with no slides. It runs as a row of tabs, each with talking points on top and a short activity below. Every panel runs in the browser on synthetic data, so the page works on a projector and on student laptops without a server, an account, or a network connection (apart from the visit counter on the published site).

Published at `https://hbedle-subsurface.github.io/ml-4-geos/`

## Contents of the page

**Part 1. The vocabulary** (about 25 minutes)
AI / machine learning / deep learning / LLM, when machine learning fits (a six-card sorting activity), dimension reduction (PCA), unsupervised learning (k-means), supervised learning (a hand-drawn boundary, then k-nearest neighbors with a train/test split), semi-supervised learning (label propagation), neural networks (a small playground), and large language models in research (a next-token demo and a real-or-made-up citation game).

**Part 2. Geophysics, then three more fields** (about 15 minutes)
Geophysics is a five-step live demo on a synthetic channel system: (1) a seismic section and the wavelet that made it, (2) four attributes measured in a window and a crossplot, (3) a self-organizing map that groups the attributes into facies, (4) which attributes the map relies on (shuffling and refitting without one), (5) wells and a supervised map, including the facies the first wells never cut. Then tabs for sedimentology (facies from four log curves, with choices of curves, core length and core position, and a confusion matrix), geochemistry and critical minerals (PCA on raw, standardized, and log-transformed stream-sediment data, then prospectivity from few known deposits), and paleontology (morphometrics).

**Part 3. Before trusting a result** (about 4 minutes)
Small samples, spatial autocorrelation, and rare targets, then a short list of tools and a first project.

## How a tab is laid out

The lecture is a row of tabs, and every tab has the same two bands:

* **Talk** (top, tinted): the few points the instructor covers, as short cards or one picture. Nothing in this band needs to be read to do the activity.
* **Try it** (below): a one to two minute activity with sliders and buttons, and a short list of steps on the right.

The instructor talks through the top band, the class does the activity, and everyone moves on with the Next button (or the right arrow key). All tabs are open, so students who get ahead can look, and nothing breaks if they do.

## Features

* Every module has a panel with sliders and a numbered list of exercises.
* **Pop out the exercises** or **pop out the panel** into a separate window (buttons under each module), so the steps stay visible while the controls are in use.
* Technical terms are clickable and open a short glossary entry (`js/glossary.js`).
* All axis ranges are fixed, so a slider changes the data on the plot and never the scale.

## Files

```
index.html          page shell
css/style.css       styles
js/ml.js            PCA, k-means, k-nearest neighbors, logistic regression, label propagation, small neural network
js/data.js          synthetic datasets (fixed seeds)
js/plot.js          canvas plotting with fixed axes
js/glossary.js      clickable term definitions
js/modules1.js      vocabulary, dimension reduction, unsupervised
js/modules2.js      supervised, semi-supervised, neural network, LLMs
js/seismic.js       synthetic seismic, attributes, and SOM for the geophysics demo
js/modules_geo.js   the geophysics demo (five steps)
js/modules3.js      paleontology, sedimentology, critical minerals, pitfalls, next steps
js/main.js          builds the tabs, glossary links, pop-outs, opening figure
js/talk.js          the talking-points band at the top of each tab
LECTURE-PLAN.md     timing and running notes
ADD-COUNTING.md     visit counting
```

## Publishing

Push to a repo named `ml-4-geos` under `hbedle-subsurface`, then in Settings > Pages choose the `main` branch and the root folder.

## Using it locally

Open `index.html` in a browser. No build step.

## Data

All data are synthetic and generated with fixed seeds in `js/data.js` and `js/seismic.js`. In the seismic model the channel sand also attenuates the wavelet (its reflections use a wavelet at 0.7 of the source frequency), which is what gives mean frequency its contrast. The lithology values are shaped like typical log responses and are not measurements from any well. The eight references in the citation game are four real papers (Breiman 2001; Bergen et al. 2019; Hall 2016; Kohonen 1982) and four written for the exercise.

## License

CC BY-SA 4.0. See `LICENSE.md`.
