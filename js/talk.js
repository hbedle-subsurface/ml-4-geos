/* talk.js - the top band of each tab: what the instructor talks through before the activity below it.
   cards: short headline plus one line. html: a richer visual. mins: [talk, try] minutes shown in the band labels. */
(function (g) {
  const { ML, DATA: D } = g;
  const H = g.H;

  /* three small pictures of labeled and unlabeled samples; the current one is outlined */
  function learnStrip(active) {
    const r = ML.rng(6), cen = [[34, 34], [96, 28], [66, 78]], pts = [];
    cen.forEach((c, k) => { for (let i = 0; i < 16; i++) pts.push([c[0] + 15 * ML.gauss(r), c[1] + 11 * ML.gauss(r), k]); });
    const draw = kind => pts.map((p, i) => {
      const lab = kind === 'sup' || (kind === 'semi' && [3, 20, 37].includes(i));
      const fill = lab ? D.LCOL[p[2]] : '#B4BAC1';
      return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${lab && kind === 'semi' ? 6.5 : 4}" fill="${fill}"${lab && kind === 'semi' ? ' stroke="#16191C" stroke-width="2"' : ''}/>`;
    }).join('');
    const one = (kind, name, cap) => `<figure class="learn${kind === active ? ' on' : ''}"><svg viewBox="0 0 130 108" role="img" aria-label="${name}">${draw(kind)}</svg><figcaption><b>${name}</b><br>${cap}</figcaption></figure>`;
    return `<div class="learn-row">${one('un', 'Unsupervised', 'no labels')}${one('semi', 'Semi-supervised', 'a few labels')}${one('sup', 'Supervised', 'every sample labeled')}</div>`;
  }
  g.learnStrip = learnStrip;

  const pair = (a, b) => `<div class="pc">
      <div class="pc-col good"><h5>${a.h}</h5><ul>${a.l.map(x => `<li>${x}</li>`).join('')}</ul></div>
      <div class="pc-col bad"><h5>${b.h}</h5><ul>${b.l.map(x => `<li>${x}</li>`).join('')}</ul></div>
    </div>`;

  g.TALK = {
    vocab: {
      mins: [2, 1],
      html: `<div class="split">
          <svg id="v-rings" viewBox="0 0 400 400" role="group" aria-label="Nested circles: AI, machine learning, deep learning, LLM"></svg>
          <div id="v-info" class="info" aria-live="polite"></div>
        </div>
        <p class="hint">Click the rings from the outside in.</p>`
    },
    fit: {
      mins: [1, 1],
      html: pair(
        { h: 'Often a good fit', l: ['Many examples, and some with known answers', 'Patterns that are hard to write down as rules', 'The same measurement repeated many times: logs, traces, images, samples'] },
        { h: 'Often a poor fit', l: ['A handful of samples', 'The physics already gives the answer', 'Predictions far outside the range of the training data', 'No independent way to check the result'] })
    },
    pca: {
      mins: [2, 1],
      cards: [
        { h: 'Many variables per sample', t: 'Four log curves make each sample a point in four dimensions.' },
        { h: 'Directions of spread', t: 'PCA finds the direction with the most variance, then the next one at right angles to it.' },
        { h: 'Keeping fewer components', t: 'Two components can hold most of the variance, so the samples fit on a page.' },
        { h: 'Reading a component', t: 'Each component is a weighted mix of the original variables. The loadings show the mix.' }
      ]
    },
    unsup: {
      mins: [2, 1], html: learnStrip('un'),
      cards: [
        { h: 'No labels', t: 'The method sees only the measurements.' },
        { h: 'k-means', t: 'Place k centers, assign each sample to the nearest one, move each center to the mean of its samples, and repeat.' },
        { h: 'Choosing k', t: 'The elbow in total distance is one guide. Geological knowledge is another.' },
        { h: 'Self-organizing maps', t: 'A grid of neurons that is widely used for seismic facies. It comes back in the geophysics section.' }
      ]
    },
    sup: {
      mins: [2, 2], html: learnStrip('sup'),
      cards: [
        { h: 'Known labels', t: 'Some samples carry an answer, such as a lithology from core.' },
        { h: 'The model is a boundary', t: 'Training decides where the boundary between classes goes.' },
        { h: 'Training and test data', t: 'Test samples are kept out of the fitting and used only to check the predictions.' },
        { h: 'Overfitting', t: 'A model can match the training samples closely and predict new samples worse.' }
      ]
    },
    semi: {
      mins: [1, 1], html: learnStrip('semi'),
      cards: [
        { h: 'Few labels, many samples', t: 'A cored interval is short and the logs run the whole well.' },
        { h: 'Label propagation', t: 'Each sample is linked to its near neighbors, and labels spread along the links.' },
        { h: 'When it helps', t: 'Most when labels are few and the classes form separate clusters.' }
      ]
    },
    nn: {
      mins: [2, 1],
      cards: [
        { h: 'Layers of neurons', t: 'Each neuron takes a weighted sum of its inputs and passes it through a nonlinear function.' },
        { h: 'Training', t: 'The weights are adjusted to make the loss smaller, one epoch at a time.' },
        { h: 'Hidden layers', t: 'More neurons and more layers let the boundary bend around shapes such as a ring.' },
        { h: 'Deep learning', t: 'Networks with many layers. Convolutional networks pick faults on seismic sections.' }
      ]
    },
    llm: {
      mins: [2, 2],
      html: pair(
        { h: 'Strengths in research', l: ['Drafting and debugging code for reading files and making plots', 'Summaries and plain-language explanations of unfamiliar methods', 'Rewording, translation, and editing', 'Suggesting methods to look up'] },
        { h: 'Limits in research', l: ['References and numbers that read correctly and may not exist', 'No knowledge of anything after the training cutoff', 'Text typed in is sent to the provider, including unpublished data', 'The same prompt can return different text, and models change over time'] })
    },
    geo: {
      mins: [2, 4],
      html: `<ol class="flow"><li>Seismic section</li><li>Attributes</li><li>Self-organizing map</li><li>Facies map</li><li>Wells</li></ol>
             <p class="hint">A synthetic channel system with three facies: floodplain shale, channel sand, and levee.</p>`
    },
    tracks: {
      mins: [1, 2],
      cards: [
        { h: 'Sedimentology', t: 'Facies from logs. The curves used and the place where the core is cut change the answer.' },
        { h: 'Geochemistry', t: 'PCA on concentrations depends on how the data are scaled and transformed.' },
        { h: 'Critical minerals', t: 'A few known deposits among many barren cells.' },
        { h: 'Paleontology', t: 'Size and shape can separate onto different axes.' }
      ]
    },
    traps: {
      mins: [1, 2],
      cards: [
        { h: 'Small samples', t: 'A test score from a few samples can land almost anywhere.' },
        { h: 'Neighbors resemble each other', t: 'Random splits of spatial data put near-copies of each test sample in the training set.' },
        { h: 'Rare targets', t: 'When positives are rare, accuracy can stay high while the target is missed.' }
      ]
    }
  };
})(window);
