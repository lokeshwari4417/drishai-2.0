'use client';

import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const classNames = ['Mild', 'Moderate', 'No_DR', 'Proliferate_DR', 'Severe'];

export default function DRPrediction() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const imageElement = new Image();
    imageElement.src = URL.createObjectURL(file);

    imageElement.onload = async () => {
      const model = await tf.loadLayersModel('/models/dr-model/model.json');

      let tensor = tf.browser
        .fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims(0);

      const prediction = model.predict(tensor) as tf.Tensor;
      const classIndex = (await prediction.argMax(-1).data())[0];

      setResult(classNames[classIndex]);
      setLoading(false);
    };
  };

  return (
    <div className="p-4">
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {loading && <p>Analyzing...</p>}
      {result && <p className="mt-4 font-semibold">Predicted DR Grade: {result}</p>}
    </div>
  );
}