import React from 'react';
import { Dashboard } from './dashboard';
import { EditorPanel } from './editor-panel';

export function App(): React.ReactElement {
  const rootEl = document.getElementById('root');
  const view = rootEl?.dataset.view;

  if (view === 'editor-panel') {
    return <EditorPanel />;
  }
  return <Dashboard />;
}
