# Lecture plan, 40 minutes

Students open the site on their own laptops and the instructor projects the same page. Every tab has two bands: the **Talk** band at the top (what to say) and the **Try it** band below (a one to two minute activity). Talk through the top, let the class do the activity, then press *Next* (or the right arrow) to move on. All tabs are open.

| Tab | Talk | Try it | Running |
|---|---|---|---|
| Start | 1 | | 1 |
| Vocabulary | 2 | 1 | 4 |
| When ML fits | 1 | 1 | 6 |
| Dimensions | 2 | 1 | 9 |
| Unsupervised | 2 | 1 | 12 |
| Supervised | 2 | 2 | 16 |
| Semi-supervised | 1 | 1 | 18 |
| Neural networks | 2 | 1 | 21 |
| LLMs | 2 | 2 | 25 |
| Geophysics | 2 | 4 | 31 |
| Other fields | 1 | 2 | 34 |
| Pitfalls | 1 | 2 | 37 |
| Next steps | 1 | | 38 |

That leaves about two minutes of slack for questions. Minutes are also printed in each band.

## What happens on each tab

* **Start.** Press *Group the samples* to show k-means running, then *Show the rock types*.
* **Vocabulary.** Click the four rings from the outside in while talking. Activity: slide the number of training samples and watch the learned threshold settle while the expert rule stays put.
* **When ML fits.** Talk from the good-fit and poor-fit columns. Activity: six situations to sort. Several have arguments both ways, so the reasons are the point.
* **Dimensions.** The three-variable cloud turns by itself. Activity: slide *Flatten* to bring it down onto PC1 and PC2. The angle slider and the four-variable panel are below it for anyone who finishes early.
* **Unsupervised.** Activity: *Watch it run* (centers move, samples change color), then raise k and find the bend in the elbow curve.
* **Supervised.** Activity: place the line by hand, *Fit by machine*, then k = 1 versus a large k on the train and test curves. This contrast carries the most weight in Part 1.
* **Semi-supervised.** One label per lithology, then more. Cut this to the talk band alone if time is short.
* **Neural networks.** Ring data, 0 hidden layers, *Train*, then add neurons. Moving the cursor over the map lights up the network diagram.
* **LLMs.** Talk from the strengths and limits columns. Activity: the real-or-made-up game (vote out loud). The temperature demo is below it for spare time.
* **Geophysics.** The deep one. Five steps in about 50 seconds each: *Play the line across the map*, change the window and compare attributes, *Watch the map train*, shuffle an attribute and read the refit chart, then add wells until the channel appears.
* **Other fields.** Sedimentology (gamma ray alone, then more curves), geochemistry (raw, standardized, log10), prospectivity (5 and then 30 deposits), paleontology if time allows. Students can stay on the tab for their own discipline.
* **Pitfalls.** Small sample, spatial split, rare targets.
* **Next steps.** The tools list and a first project.

If time runs short: drop *Semi-supervised* to its talk band, keep the neural network to the ring demo only, and skip the crossplot in geophysics step 2. Keep unsupervised versus supervised at full length.

## Pop-out windows

Each tab has *Pop out these steps* and *Pop out this panel*. Pop-ups may need to be allowed for the site in the browser.

## Things to know before presenting

* The eight citations in the game: four are real and four were written for the exercise. The answer is shown after each click.
* The temperature demo uses a toy distribution written for the page and is not output from a real model.
* Deposit, well, seismic, shell, and geochemistry data are all synthetic.
* In the seismic model the channel sand attenuates the wavelet by construction, so mean frequency is lower in the channel. This is stated in the mean-frequency card on the page.
* In the geochemistry tab the raw-ppm PCA is dominated by the elements with the largest numbers (potassium, magnesium), and points outside the fixed axes are clipped. The log-transformed result still mixes a felsic signal with the pegmatite signal, which is intended.
* The well order is fixed (seed 8): the first well in the channel is the 11th, so the supervised map has no channel until then.
