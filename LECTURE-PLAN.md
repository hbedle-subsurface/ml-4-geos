# Lecture plan, 40 minutes

Students open the site on their own laptops. The instructor projects the same page and drives from the top.

| Minutes | Section | What to do in the room |
|---|---|---|
| 0–2 | Opening figure | Talk for two minutes. Press *Group the samples* to show k-means running, then *Show the rock types*. |
| 2–4 | Vocabulary | Click the four rings. Move the training-samples slider. |
| 4–7 | Dimension reduction | Turn the angle slider through 180°, press *Go to PC1*, then step through components kept. |
| 7–10 | Unsupervised | k from 1 to 8, *New start*, then the lithology check. |
| 10–14 | Supervised | Hand-placed line, *Fit by machine*, then k = 1 versus a large k on the train/test curves. This contrast carries the most weight in Part 1. |
| 14–16 | Semi-supervised | One label per lithology, then more. |
| 16–19 | Neural networks | Ring data, 0 hidden layers, train. Then more neurons and layers. |
| 19–22 | LLMs | Temperature and *Sample 20 answers*. Then the citation game (students vote out loud), then the cards. |
| 22–23 | Geophysics 1, seismic | Move the line across the channel and follow it on the section. Lower the wavelet frequency to show the thin edges losing detail. |
| 23–25 | Geophysics 2, attributes | Change the window length, compare the four maps, open the RMS card, then the crossplot with true facies on. |
| 25–27 | Geophysics 3, SOM | 4 × 4 neurons and 3 facies, then 2 × 2 and 8 × 8. Turn on the true facies to compare. |
| 27–29 | Geophysics 4, what matters | Shuffle each attribute. Then the refit chart: removing one attribute can raise the agreement. |
| 29–30 | Geophysics 5, wells | Start with 6 wells and note the facies they never cut. Raise the count until the channel appears. |
| 30–33 | Sedimentology | Gamma ray alone, then add density, sonic, and neutron porosity. Shorten the core, then move where it starts. Read the confusion matrix. |
| 33–36 | Geochemistry and critical minerals | Raw ppm, standardized, log10. Then the prospectivity map with 5 and then 30 known deposits. |
| 36–37 | Paleontology | Optional. One slider for the range of growth stages. Students with the background can open it on their own. |
| 37–40 | Pitfalls and next steps | Small sample, spatial split, rare targets, then the tools list. |

If time runs short: cut the neural network to the ring demo only, drop the semi-supervised module to one minute, and skip the crossplot in geophysics step 2. Keep unsupervised versus supervised at full length.

## Pop-out windows

Each module has *Pop out the exercises* and *Pop out this panel*. Pop-ups may need to be allowed for the site in the browser.

## Things to know before presenting

* The eight citations in the game: four are real and four were written for the exercise. The answer is shown after each click.
* The temperature demo uses a toy distribution written for the page and is not output from a real model.
* Deposit, well, seismic, and shell data are all synthetic.
* In the seismic model the channel sand attenuates the wavelet by construction, so mean frequency is lower in the channel. This is stated in the mean-frequency card on the page.
* In the geochemistry tab the raw-ppm PCA is dominated by the elements with the largest numbers (potassium, magnesium), and points outside the fixed axes are clipped. The log-transformed result still mixes a felsic signal with the pegmatite signal, which is intended.
* The well order is fixed (seed 8): the first well in the channel is the 11th, so the supervised map has no channel until then.
