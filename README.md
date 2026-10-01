# ml-4-geos

**Machine learning in the geosciences**: an interactive lecture for incoming graduate students, School of Geosciences, University of Oklahoma.

The whole lecture and its homework are one static site with no slides. About 40 minutes of it fits in a live session, and the rest is homework (see LECTURE-PLAN.md). It runs as a row of tabs, each with talking points on top and a short activity below. Every panel runs in the browser on synthetic data, so the page works on a projector and on student laptops without a server, an account, or a network connection (apart from the visit counter on the published site).

Published at `https://hbedle-subsurface.github.io/ml-4-geos/`

## Contents of the page

**Part 1. The vocabulary** (about 26 minutes)
AI / machine learning / deep learning / LLM, a map of the types of machine learning (eight drawings and a naming quiz), when machine learning fits (a six-card sorting activity), dimension reduction (PCA), unsupervised learning (k-means on six-element sandstone chemistry from four made-up mountain ranges), semi-supervised learning (one field sample per range plus label propagation), supervised learning (decision tree, random forest, and what too few samples does), supervised learning (a hand-drawn boundary, then k-nearest neighbors with a train/test split), semi-supervised learning (label propagation), neural networks (a small playground), convolutional networks (labeling LiDAR patches from a photo or from heights, then a two-layer network that maps land cover on a made-up LiDAR scene), Segment Anything (click, segment everything, and name the masks on a synthetic thin section), and large language models in research (an explanation of how a model is trained and why it is statistical, with no activity, only a quiz).

**Part 2. Geophysics, then three more fields** (about 15 minutes)
Geophysics is a set of concept cards and a link to the guided SCAN029 exercise on scan-lecture, which uses a real open 2D seismic line from the Netherlands and opens in a new tab. Then tabs for sedimentology (facies from four log curves, with choices of curves, core length and core position, and a confusion matrix), igneous rocks (volcanic rocks named from four oxides, with a choice of oxides and the number of labeled samples), geochemistry and critical minerals (PCA on raw, standardized, and log-transformed stream-sediment data, then prospectivity from few known deposits), and paleontology (morphometrics).

**Homework** (after class, about 30 minutes)
A last tab where students load their own .csv or .xlsx file, or one of two sample tables, and run the class workflow on it: column summaries and histograms, PCA with loadings, k-means with an elbow curve, and a nearest-neighbor classifier with a random and a blocked split. It ends with a downloadable summary and a few optional prompts for what to look at. Nothing is submitted or graded. Files are read in the browser and are not uploaded. Null flags such as -999.25 count as missing. It also links to Analyze 2D and scan-lecture.

**Part 3. Before trusting a result** (about 4 minutes)
Small samples, spatial autocorrelation, and rare targets, then a short list of tools and a first project.

## How a tab is laid out

The lecture is a row of tabs, and every tab has the same bands:

* **Concept** (top, tinted): a one-sentence introduction and then numbered steps in the order the ideas are needed, each with its own drawing. Every term is explained where it first appears, for readers who have not used machine learning before.
* **The rocks and the data** (a box near the top of the Concept band, on every tab): what the rocks are, what each measurement is and its units, and what we ask the computer to do, so the geology is clear before the machine learning starts. The text is in `js/talk.js` (the `SETUP` block).
* **Try it Out!** (below): a one-line hook tied to the talk, the steps on the left, a one to two minute activity with sliders and buttons on the right, and a short **Check yourself** quiz at the bottom.

The instructor talks through the top band, the class does the activity, and everyone moves on with the Next button (or the right arrow key). All tabs are open, so students who get ahead can look, and nothing breaks if they do.

## Features

* Every module has a panel with sliders and a numbered list of exercises, except the LLMs tab, which is an explanation and a quiz.
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
js/som.js           the self-organizing map used by the Start tab
js/lidarlab.js      made-up LiDAR scene, photo, filters and land-cover rules
js/modules_cnn.js   the CNN tab
js/samlab.js        synthetic thin section and a region-growing segmenter
js/modules_sam.js   the Segment Anything tab
js/modules_prov.js  the Semi-supervised and Supervised tabs (decision tree, random forest)
js/modules3.js      igneous rocks, paleontology, sedimentology, critical minerals, the Geophysics tab (a link), pitfalls, next steps
js/main.js          builds the tabs, glossary links, pop-outs, opening figure
js/start.js         the opening tab (k-means and a SOM on three measurements, with the true rock types revealed on request)
js/art.js           the concept drawings and the strata banner behind each tab title
js/tables.js        reads .csv and .xlsx files in the browser (no library)
js/homework.js      the homework tab
js/talk.js          the talk band, the hook, the steps, and the quiz for each tab
LECTURE-PLAN.md     timing and running notes
ADD-COUNTING.md     visit counting
```

## Publishing

Push to a repo named `ml-4-geos` under `hbedle-subsurface`, then in Settings > Pages choose the `main` branch and the root folder.

## Using it locally

Open `index.html` in a browser. No build step.

## Printing

Printing builds every tab and draws every sub-tab first, so a PDF printout shows all the plots.

## Checking the prose

`tools/prose-scan.py` lists phrases from the LLM-tics checklist (stock openers, importance words, promotional words, em dashes, rhetorical questions, and the words in the voice reference) in the site text. Run `python3 tools/prose-scan.py` from the repo folder. It flags candidates only, and a person decides which ones to change.

## Images

The LiDAR scene is made up and generated in `js/lidarlab.js`. The well-known muffin and chihuahua photo grid by @teenybiscuit is not included. To show it in the CNN talk band, add your copy as `img/muffin-or-chihuahua.png` (the figure stays hidden until the file exists).

## Data

The Redbud Basin sandstones (Boomer Mountains, Sooner Range, Thunder Ridge Mountains, Red Dirt Hills) are invented and used by the Unsupervised, Semi-supervised and Supervised tabs. Each basin sample is a mixture of four end-member chemistries plus heavy-mineral sorting and carbonate cement, and 15 mystery samples come from a mega flood that carried in sand from a fifth, unsampled source. The field samples are stream sand from each range. Everything is generated in `js/data.js`.

All data on this site are synthetic and generated with fixed seeds in `js/data.js` and in the modules. The one exception is the SCAN029 seismic line and wells used by the exercise on scan-lecture, which is a separate site. The lithology values are shaped like typical log responses and are not measurements from any well.

## License

CC BY-SA 4.0. See `LICENSE.md`.
