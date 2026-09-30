# Lecture plan, 40 minutes

Students open the site on their own laptops and the instructor projects the same page. Every tab has the same layout:

* **Concept** (top band): the few points to cover, as cards or one picture. The site does not show any minutes; the table below is for planning only.
* **Try it Out!** (below): a one-line hook that ties the activity to what was just said, the steps on the left, the activity on the right, and a short **Check yourself** quiz at the bottom.

Talk through the Concept band, let the class do the activity, then press *Next* (or the right arrow). All tabs are open, so students who get ahead can look, and nothing breaks.

| Tab | Talk | Try it | Running | Note |
|---|---|---|---|---|
| Start | 1 | 1 | 2 | |
| Vocabulary | 1 | 1 | 4 | |
| Types of ML | 2 | 1 | 7 | |
| When ML fits | 1 | 1 | 9 | |
| Dimensions | 2 | 1 | 12 | |
| Unsupervised | 1 | 2 | 15 | |
| Semi-supervised | 1 | 1 | 17 | |
| Supervised | 2 | 3 | 22 |
| Neural networks | 1 | 1 | 24 | |
| CNN (muffin or chihuahua) | 1 | 2 | 27 | |
| Segment Anything | 1 | 2 | 30 | optional |
| LLMs | 2 | 2 | 34 | |
| Geophysics | 2 | 4 | 40 | |
| Other fields | 1 | 2 | 43 | |
| Pitfalls | 1 | 2 | 46 | |
| Next steps | 1 | | 47 | |

Everything adds up to about 47 minutes. Skipping the two optional tabs (Semi-supervised and Segment Anything) brings it to about 44, so a few more cuts are needed for 40: drop Other fields to its Concept band, and run the Pitfalls tab with the small-sample slider only. The quizzes at the bottom of each tab can run out loud or be skipped when time is short.


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
* **CNN (muffin or chihuahua).** Talk from the four cards. Activity: the eight-picture game (drawn for this page, not the famous photos), then slide the resolution down and try again. Below the game, a two-layer network with hand-set filters: a spot filter and a filter for two spots above a third. Sliders for spot size, eye spacing and threshold move the 40 test dots apart. The famous @teenybiscuit photo grid can appear in the talk band if the file `img/muffin-or-chihuahua.png` is added (see below).
* **Segment Anything.** Talk from the cards. Activity in three steps: click a grain and slide between three masks (part, grain, grain with look-alike neighbors); segment everything with sliders for color sensitivity, click spacing and smallest mask; group the masks, name each group, and compare the modal percentages with the true ones. The segmenter is a region-growing stand-in on a synthetic thin section, and the page says so. It links to the real model.
* **LLMs.** Talk from the strengths and limits columns. Activity: the real-or-made-up game (vote out loud). The temperature demo is below it for spare time.
* **Geophysics.** The deep one. Five steps in about 50 seconds each: *Play the line across the map*, change the window and compare attributes, *Watch the map train*, shuffle an attribute and read the refit chart, then add wells until the channel appears.
* **Other fields.** Sedimentology (gamma ray alone, then more curves), geochemistry (raw, standardized, log10), prospectivity (5 and then 30 deposits), paleontology if time allows.
* **Pitfalls.** Small sample, spatial split, rare targets.
* **Next steps.** The tools list, a first project, and the closing ask.
* **Homework.** Not part of the 40 minutes. Point students to it at the end. They load a .csv or .xlsx of their own (or a sample table), work through Look, PCA, Clusters and Predict, and download a summary to answer six questions. The page links to Analyze 2D and scan-lecture for anyone who wants seismic.

If time runs short: drop *Semi-supervised* to its talk band, keep the neural network to the ring demo only, and skip the crossplot in geophysics step 2. Keep unsupervised versus supervised at full length.

## Pop-out windows

Each tab has *Pop out these steps* and *Pop out this panel*. Pop-ups may need to be allowed for the site in the browser.

## Things to know before presenting

* The muffin and chihuahua pictures in the game are drawn by the page. The well-known photo grid is by @teenybiscuit (see the BBC Three article the page links to). It is not in the zip. To show it in the CNN talk band, copy your copy to `img/muffin-or-chihuahua.png`. Until that file exists the figure is simply hidden. If the repo is public, decide whether you are comfortable hosting the image there.
* The Segment Anything activity is not the real model. It uses a simple region-growing stand-in that mimics a click returning several masks and a grid of clicks segmenting everything, on a synthetic thin section.
* The eight citations in the game: four are real and four were written for the exercise. The answer is shown after each click.
* The temperature demo uses a toy distribution written for the page and is not output from a real model.
* Deposit, well, seismic, shell, and geochemistry data are all synthetic.
* In the seismic model the channel sand attenuates the wavelet by construction, so mean frequency is lower in the channel. The mean-frequency card on the page says so.
* In the geochemistry tab the raw-ppm PCA is dominated by the elements with the largest numbers (potassium, magnesium), and points outside the fixed axes are clipped. The log-transformed result still mixes a felsic signal with the pegmatite signal, which is intended.
* The well order is fixed (seed 8): the first well in the channel is the 11th, so the supervised map has no channel until then.
