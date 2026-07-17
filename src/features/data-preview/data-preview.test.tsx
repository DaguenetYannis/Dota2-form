import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppStateProvider } from '@/lib/app-state';
import { DataPreview } from './data-preview';

describe('DataPreview', () => {
  it('serializes the in-memory data shape as JSON', async () => {
    render(
      <AppStateProvider>
        <DataPreview />
      </AppStateProvider>,
    );

    expect(await screen.findByText(/"players"/)).toBeInTheDocument();
    expect(screen.getByText(/"playerHeroes"/)).toBeInTheDocument();
    expect(screen.getByText(/"heroes"/)).toBeInTheDocument();
  });
});
