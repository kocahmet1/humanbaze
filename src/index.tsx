import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRegistry } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('HumanbazeWeb', () => App);

// Get the root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

// Create root and render
const root = createRoot(container);

// Run the app
AppRegistry.runApplication('HumanbazeWeb', {
  rootTag: container,
});
