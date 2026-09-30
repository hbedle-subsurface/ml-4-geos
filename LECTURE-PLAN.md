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
| Unsupervised | 1 | 1 | 14 | |
| Supervised | 2 | 2 | 18 | |
| Semi-supervised | 1 | 1 | 20 | optional |
| Neural networks | 1 | 1 | 22 | |
| CNN (muffin or chihuahua) | 1 | 2 | 25 | |
| Segment Anything | 1 | 2 | 28 | optional |
| LLMs | 2 | 2 | 32 | |
| Geophysics | 2 | 4 | 38 | |
| Other fields | 1 | 2 | 41 | |
| Pitfalls | 1 | 2 | 44 | |
| Next steps | 1 | | 45 | |

Everything adds up to about 45 minutes. Skipping the two optional tabs (Semi-supervised and Segment Anything) brings it to about 40. The quizzes at the bottom of each tab can run out loud or be skipped when time is short.


## What happens on each tab

* **Start.** The Concept band introduces k-means and the self-organizing map. Try it Out!: pick k-means and press *Watch it run* (centers move, samples change color), then switch to the SOM and press *Watch it run* (a grid of neurons stretches over the samples), then turn on *Show the true rock type* and compare the two agreement numbers. The plot on the right shows what each method built (an elbow curve for k-means, the neuron map for the SOM). The quiz asks what defines a k-means group and what the SOM adds.
* **Vocabulary.** Click the four rings from the outside in. Activity: slide the number of training samples and watch the learned threshold settle while the expert rule stays put.
* **Types of ML.** The map of machine learning, with eight small drawings (classification, regression, clustering, dimension reduction, anomaly detection, reinforcement learning, ensembles, deep learning). Click a card to open it. The outline follows Vas3k's *Machine Learning for Everyone*, and the drawings are new. Activity: slide the curviness of a regression line and watch the hollow test dots, then the six-question quiz naming the type for each scenario.
* **When ML fits.** Talk from the good-fit and poor-fit columns. Activity: six situations to sort. Several have arguments both ways, so the reasons matter more than the label.
* **Dimensions.** The three-variable cloud turns by itself. Activity: slide *Flatten* to bring it down onto PC1 and PC2. The angle slider and the four-variable panel are below it for anyone who finishes early.
* **Unsupervised.** Activity: *Watch it run* (centers move, samples change color), then raise k and find the bend in the elbow curve.
* **Supervised.** Activity: place the line by hand, *Fit by machine*, then k = 1 versus a large k on the train and test curves. This contrast carries the most weight in Part 1.
* **Semi-supervised.** One label per lithology, then more. Cut this to the talk band alone if time is short.
* **Neural networks.** Ring data, 0 hidden layers, *Train*, then add neurons. Moving the cursor over the map lights up the network diagram.
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
