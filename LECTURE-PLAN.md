# Lecture plan: a live session and homework

The site is built as a teaching tool first. About 40 minutes of it fits in a live session, and the rest is homework. Students open the site on their own laptops and the instructor projects the same page. Every tab has the same layout:

* **Concept** (top band): the few points to cover, as cards or one picture, in plain language that assumes no background in machine learning.
* **Try it Out!** (below): a one-line hook that ties the activity to what was just said, the steps on the left, the activity on the right, and a short **Check yourself** quiz at the bottom. Activities with several steps have tabs, and each step opens with a box that says *What to do* and *What to notice*, so a student working alone knows what to look for.

All tabs are open, so students can go in any order and nothing breaks. The Next and Back buttons (or the arrow keys) move between tabs.

## A suggested split

| In the live session (about 40 minutes) | Approximate minutes |
|---|---|
| Start | 3 |
| Vocabulary | 2 |
| Types of ML | 3 |
| When ML fits | 2 |
| Dimensions (steps 1 and 3) | 5 |
| Unsupervised | 5 |
| Supervised (steps 1 to 3) | 7 |
| Neural networks (step 1) | 4 |
| Pitfalls (small samples) | 3 |
| Next steps | 1 |

| Homework | Why it works as homework |
|---|---|
| Dimensions steps 2 and 4 | The by-hand search for PC2 and the four-measurement loadings |
| Semi-supervised | One labeled sample per range, and label propagation |
| Supervised step 4 | The mystery samples and the mega flood |
| Neural networks step 2 | The ore shell map and the small maps of each neuron |
| CNN | Labeling LiDAR patches, then the two-layer network |
| Segment Anything | Click, segment everything, name the masks |
| LLMs | The real-or-made-up reference game |
| Geophysics | Five steps from a seismic section to a facies map |
| Other fields | Sedimentology, geochemistry, prospectivity, paleontology |
| Pitfalls (spatial and rare targets) | Why a high score can mislead |
| Homework tab | The same workflow on the student's own table, with six write-up questions |

This split is a suggestion. The minutes are for planning only, and the site does not show any. The quizzes at the bottom of each tab can run out loud in the session, or they can be part of the homework.

## What happens on each tab

* **Start.** The Concept steps go in order: a table of samples, similar rocks bunching together, k-means, the self-organizing map, and checking the answer. Try it Out!: the samples are described by three measurements and drawn as a cloud that turns by itself (drag to turn it). Pick k-means and press *Watch it run* (the centers move), change k, then switch to the map and press *Watch it run* (a grid stretches over the cloud and every neuron gets its own color). Turn on *Reveal the true rock types* to fill the second cloud and show the scores. The map can be merged into k groups with the checkbox, which shows the difference between many neurons and a few groups.
* **Vocabulary.** Click the four rings from the outside in. Activity: slide the number of training samples and watch the learned threshold settle while the expert rule stays put.
* **Types of ML.** The map of machine learning, with eight small drawings (classification, regression, clustering, dimension reduction, anomaly detection, reinforcement learning, ensembles, deep learning). Click a card to open it. The outline follows Vas3k's *Machine Learning for Everyone*, and the drawings are new. Activity: slide the curviness of a regression line and watch the hollow test dots, then the six-question quiz naming the type for each scenario.
* **When ML fits.** Talk from the good-fit and poor-fit columns. Activity: six situations to sort. Several have arguments both ways, so the reasons matter more than the label.
* **Dimensions.** Four sub-steps. (1) The class turns a 3D cloud with two sliders until it looks as wide as possible left to right. A strip under the cloud and a meter show the spread, and the meter remembers each student's best. Then *Show the computer's answer* glides to PC1 and compares. (2) The same idea for PC2, with PC1 fixed and one slider for turning around it. (3) *Flatten* drops the cloud onto PC1 and PC2. (4) All four measurements: components kept, share of the spread, and loadings, with a what-to-do and what-to-notice box for each step.
* **Unsupervised.** The Redbud Basin story. Sand from four invented ranges (Boomer Mountains, Sooner Range, Thunder Ridge Mountains, Red Dirt Hills) washed into the basin. 375 sandstone samples with six measurements each (K₂O, Zr, Cr, Ni, CaO, Sr), so k-means works in six dimensions and the clouds show the first three principal components. Students press *Watch it run*, read the group-chemistry table (red is above average, blue is below) to decide which range each group matches, then reveal the true sources. The curve flattens after about k = 4. At k = 5 a small group of 14 or so samples splits off that matches no range. These are the mystery samples, and the one unicorn reference is in the Choosing k step.
* **Semi-supervised.** Now the crew can bring back a single field sample from each range: 4 labeled samples against 375 unlabeled. The left cloud gives each basin sample the label of the closest field sample. The right cloud also lets labels spread through the basin samples. The default field trip shows 76% against 93%, and the 20-trip average is printed too (about 88% against 91% at one sample per range, and about the same at three). It goes before Supervised because the labels arrive in the order none, a few, plenty.
* **Supervised.** Four steps. (1) Grow a tree from the field samples and slide its depth. The tree diagram shows the questions, and the readout compares the score on the field samples with the score on the basin, so overfitting is visible. (2) Grow a forest and slide the number of trees. Click any sample to see how the trees voted. (3) Slide the number of field samples per range from 1 to 30 and watch 25 field trips for a single tree and for a forest, so too little data shows up as scattered dots. (4) Reveal the true sources. The 15 mystery samples were carried in by a mega flood from a range nobody sampled, and the forest has to call them something else (usually Thunder Ridge). The tab tells that story in a reveal box.
* **Neural networks.** Two steps. (1) One measurement: siltstone reads in the middle on gamma ray. Students first set two cuts by hand (the best window scores about 93%), then train a tiny network with 0, 1, 2 and 4 hidden neurons. With 0 or 1 it scores 67% (it can only cut once, so it calls everything not siltstone), and with 2 or more it reaches about 92% every time, close to the best hand-set window. The thin colored curves are what each hidden neuron reports. (2) The map: an ore shell around a barren core, as in a porphyry deposit. Small maps show what each first-layer neuron sees (one soft straight edge each), and the network diagram lights up under the cursor. With no hidden layer the map scores about 70%, one hidden layer of 3 neurons about 77%, and 8 neurons about 86% (a rough blob with a core). Two hidden layers of 6 reach nearly 100% and carve the core out cleanly, which is the reason to talk about layers as well as neurons. The lithology data gets about 89% with no hidden layer, so not every problem needs one.
* **CNN (a LiDAR scene).** The Concept band uses the muffin and chihuahua as the motivating trap: dry grass looks like bare soil and shrubs look like small trees from above. Activity, step 1: label eight 16 by 16 cell patches (bare soil, grass, shrubs, trees, roofs) first in an aerial photo and then in LiDAR heights, same patches, and see the scores side by side. Slide the LiDAR points per square meter down and the heights get noisy. Step 2: a two-layer network on a made-up 96 by 96 scene. Layer 1 makes typical height (a median filter) and average returns per pulse (a mean filter). Layer 2 combines them with four thresholds. The filter-size and point-density sliders show a balance (a small filter is noisy when there are few points, and a large one smears edges). Auto-tune learns the thresholds from 600 labeled pixels (about 77% at the defaults) and the page prints how a color-only classifier does (about 70%). The famous @teenybiscuit photo grid can appear in the Concept band if the file `img/muffin-or-chihuahua.png` is added (see below).
* **Segment Anything.** Talk from the cards. Activity in three steps: click a grain and slide between three masks (part, grain, grain with look-alike neighbors); segment everything with sliders for color sensitivity, click spacing and smallest mask; group the masks, name each group, and compare the modal percentages with the true ones. The segmenter is a region-growing stand-in on a synthetic thin section, and the page says so. It links to the real model.
* **LLMs.** Talk from the strengths and limits columns. Activity: the real-or-made-up game (vote out loud). The temperature demo is below it for spare time.
* **Geophysics.** The deep one. Five steps in about 50 seconds each: *Play the line across the map*, change the window and compare attributes, *Watch the map train*, shuffle an attribute and read the refit chart, then add wells until the channel appears.
* **Other fields.** Sedimentology (gamma ray alone, then more curves), geochemistry (raw, standardized, log10), prospectivity (5 and then 30 deposits), paleontology if time allows.
* **Pitfalls.** Small sample, spatial split, rare targets.
* **Next steps.** The tools list, a first project, and the closing ask.
* **Homework.** The last tab, for after the session. Point students to it at the end. They load a .csv or .xlsx of their own (or a sample table), work through Look, PCA, Clusters and Predict, and download a summary to answer six questions. The page links to Analyze 2D and scan-lecture for anyone who wants seismic.

If time runs short: drop *Semi-supervised* to its talk band, keep the neural network to the ring demo only, and skip the crossplot in geophysics step 2. Keep unsupervised versus supervised at full length.

## Printing the site

Printing (Ctrl or Cmd + P) builds every tab and draws every sub-tab first, so the printout shows all the plots. Use the browser's Print to PDF for review. Only the tabs you have visited were built before, which is why plots could be blank in an earlier printout.

## Pop-out windows

Each tab has *Pop out these steps* and *Pop out this panel*. Pop-ups may need to be allowed for the site in the browser.

## Things to know before presenting

* The LiDAR scene and its photo are made up and generated in `js/lidarlab.js`. The well-known muffin and chihuahua photo grid is by @teenybiscuit (see the BBC Three article the page links to). It is not in the zip. To show it in the CNN talk band, copy your copy to `img/muffin-or-chihuahua.png`. Until that file exists the figure is simply hidden. If the repo is public, decide whether you are comfortable hosting the image there.
* The Segment Anything activity is not the real model. It uses a simple region-growing stand-in that mimics a click returning several masks and a grid of clicks segmenting everything, on a synthetic thin section.
* The eight citations in the game: four are real and four were written for the exercise. The answer is shown after each click.
* The temperature demo uses a toy distribution written for the page and is not output from a real model.
* Deposit, well, seismic, shell, and geochemistry data are all synthetic.
* In the seismic model the channel sand attenuates the wavelet by construction, so mean frequency is lower in the channel. The mean-frequency card on the page says so.
* In the geochemistry tab the raw-ppm PCA is dominated by the elements with the largest numbers (potassium, magnesium), and points outside the fixed axes are clipped. The log-transformed result still mixes a felsic signal with the pegmatite signal, which is intended.
* The well order is fixed (seed 8): the first well in the channel is the 11th, so the supervised map has no channel until then.
