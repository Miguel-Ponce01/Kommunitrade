import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import Tesseract from 'tesseract.js';

let mobilenetModel = null;
let tesseractWorker = null;

// Load MobileNet CNN model with retry support
export async function loadMobileNet(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      if (!mobilenetModel) {
        await tf.ready();
        mobilenetModel = await mobilenet.load();
      }
      return mobilenetModel;
    } catch (error) {
      console.warn(`MobileNet load attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Load Tesseract worker with retry support
export async function loadTesseract(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      if (!tesseractWorker) {
        tesseractWorker = await Tesseract.createWorker('eng');
      }
      return tesseractWorker;
    } catch (error) {
      console.warn(`Tesseract worker load attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Run CNN detection on image element or image source
export async function runCNN(imageElement) {
  try {
    const model = await loadMobileNet();
    const predictions = await model.classify(imageElement);
    return predictions.map(p => ({
      label: p.className.toLowerCase(),
      confidence: p.probability,
    }));
  } catch (error) {
    console.error('CNN analysis failed locally:', error);
    return [];
  }
}

// Run OCR on image file or URL
export async function runOCR(imageFileOrUrl) {
  try {
    const worker = await loadTesseract();
    const { data: { text } } = await worker.recognize(imageFileOrUrl);
    
    // Split into lines and clean
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
      
    return lines;
  } catch (error) {
    console.error('OCR analysis failed locally:', error);
    return [];
  }
}

// Clean up references to free up memory
export async function cleanupOfflineModels() {
  if (tesseractWorker) {
    await tesseractWorker.terminate();
    tesseractWorker = null;
  }
  if (mobilenetModel) {
    mobilenetModel = null;
  }
}
