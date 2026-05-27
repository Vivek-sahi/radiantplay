# Adding Muze charts to Radiant Play

Muze (`@viz/muze`) is a data-visualization library hosted on a private packagecloud registry. It is **not installed by default** — adding it requires a packagecloud auth token. Follow this guide when you want to build a prototype that uses Muze charts.

## Prerequisites

Get a packagecloud token from your team admin (the token belongs to the ThoughtSpot `modeanalytics` org).

## Step 1 — Configure npm auth

Add these two lines to `~/.npmrc` (create the file if it doesn't exist):

```
//packagecloud.io/modeanalytics/npm/:_authToken=YOUR_TOKEN
@viz:registry=https://packagecloud.io/modeanalytics/npm/npm/
```

The token stays on your machine — it's never committed to the repo.

## Step 2 — Install the packages

Add `@viz/muze` and `@viz/datamodel` to `package.json` dependencies:

```json
"@viz/datamodel": "^3.6.0",
"@viz/muze": "^4.7.10-SCAL-285469.13"
```

Then run:

```bash
npm install
```

## Step 3 — Build a Muze chart component

Place the component inside your prototype folder (`src/prototypes/<YourName>/components/`):

```tsx
import React, { useEffect, useRef } from 'react';
import muze from '@viz/muze';
import '@viz/muze/muze.css';
import { chartColors } from '../../_shared/tiles/chartPalette';

const schema = [
  { name: 'Quarter', type: 'dimension' },
  { name: 'Segment', type: 'dimension' },
  { name: 'Revenue', type: 'measure', defAggFn: 'sum' },
];

const data = [
  { Quarter: 'Q1', Segment: 'New business', Revenue: 320000 },
  { Quarter: 'Q1', Segment: 'Renewals',     Revenue: 405000 },
  // ...
];

interface Props { width?: number; height?: number; }

export const MuzeDualColumnChart: React.FC<Props> = ({ width = 600, height = 320 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || width < 10 || height < 10) return;

    const { DataModel } = muze;
    const dm = new DataModel(DataModel.loadDataSync(data, schema));

    const canvas = muze().canvas()
      .data(dm)
      .rows(['Revenue'])
      .columns(['Quarter'])
      .color('Segment', { range: chartColors.slice(0, 2) })
      .width(width)
      .height(height)
      .mount(containerRef.current);

    canvasRef.current = canvas;
    return () => { canvasRef.current?.dispose(); canvasRef.current = null; };
  }, [width, height]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
```

## Step 4 — Mount it in a tile that handles resize

Muze needs explicit width/height. Wrap the chart in a tile that observes its container and passes pixel dimensions:

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const [size, setSize] = useState({ w: 0, h: 0 });

useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  const observer = new ResizeObserver(entries => {
    const { width, height } = entries[0].contentRect;
    setSize({ w: Math.floor(width), h: Math.floor(height) });
  });
  observer.observe(el);
  return () => observer.disconnect();
}, []);

return (
  <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
    {size.w > 0 && size.h > 0 && <MuzeDualColumnChart width={size.w} height={size.h} />}
  </div>
);
```

## Common chart shapes

| Shape | Muze API |
|---|---|
| **Single column** | `.rows(['Measure']).columns(['Dim'])` |
| **Grouped / dual column** | `.rows(['Measure']).columns(['Dim1']).color('Dim2')` |
| **Trellis (small multiples)** | `.rows(['Measure']).columns(['Dim1', 'Dim2'])` — the second dim creates facets |
| **Stacked column** | Same as grouped, but use `.config({ axes: { y: { showAxis: true } } })` and stack via Muze layer config |

## Don't forget

- Call `canvas.dispose()` in the cleanup function to prevent memory leaks
- Muze's CSS (`@viz/muze/muze.css`) must be imported once
- Keep Muze chart components inside your prototype's `components/` folder, not `src/components/`
- If you want the chart available as a generic chart type (used via `AnswerTile`), add it to `_shared/tiles/charts/index.tsx` chartMap and the `ChartType` union in `_shared/tiles/AnswerTile.tsx`

## Removing Muze

If you remove the prototype that uses Muze and no other prototype uses it, drop both `@viz/muze` and `@viz/datamodel` from `package.json` and re-run `npm install` so the rest of the team's installs stay friction-free.
