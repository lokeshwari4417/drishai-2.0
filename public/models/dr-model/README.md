Drop your friend's trained TF.js model files here:

  public/models/dr-model/model.json
  public/models/dr-model/group1-shard1of1.bin   (and any other shard files)

If you exported from Keras/TensorFlow, use the tensorflowjs_converter tool
to produce these files, e.g.:

  tensorflowjs_converter --input_format=keras \
      path/to/model.h5 \
      public/models/dr-model

Once model.json exists here, lib/ai-inference.ts automatically stops using
the mock and loads this real model instead — no other code changes needed.
If your model's output layer isn't a 5-way softmax ordered
[No DR, Mild, Moderate, Severe, Proliferative DR], adjust
`interpretOutput()` in lib/ai-inference.ts to match.
