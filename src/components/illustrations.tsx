import { For, onMount, type JSX } from "solid-js";

/**
 * Small looping scenes for the function cards, drawn in the product-logo
 * language: an ink field, flat beige geometry, one blue accent, and a faint
 * pixel grid. CSS keyframes live in styles.css under "Function illustrations".
 */

const INK = "#181818";
const BEIGE = "#EDE8E0";
const BLUE = "#1F5CB1";
const BLUE_LIGHT = "#4F86D6";
const DIM = "#34332F";

type SceneProps = { id: string; label: string; children: JSX.Element };

function Scene(props: SceneProps) {
  let svg!: SVGSVGElement;

  onMount(() => {
    // CSS handles reduced motion for keyframes; SMIL needs pausing by hand.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      svg.pauseAnimations();
    }
  });

  return (
    <svg
      ref={svg}
      class="illo"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={props.label}
      style={{ "--illo-dim": DIM, "--illo-pick": BLUE }}
    >
      <defs>
        <pattern id={`grid-${props.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill={BEIGE} opacity="0.14" />
        </pattern>
      </defs>
      <rect width="320" height="180" fill={INK} />
      <rect width="320" height="180" fill={`url(#grid-${props.id})`} />
      {props.children}
    </svg>
  );
}

const delay = (seconds: number) => ({ "--d": seconds }) as JSX.CSSProperties;

/** Spec on the left, build progress in the middle, the shipped product on the right. */
export function ProductScene() {
  const specLines = [46, 38, 50, 30, 42, 24];

  return (
    <Scene id="product" label="A spec turning into a deployed product">
      <rect x="30" y="38" width="72" height="104" fill={BEIGE} />
      <rect x="30" y="38" width="72" height="14" fill={BLUE} />
      <For each={specLines}>
        {(width, i) => (
          <rect
            x="40"
            y={62 + i() * 12}
            width={width}
            height="4"
            fill={INK}
            data-anim="fill"
            style={delay(i() * 0.18)}
          />
        )}
      </For>

      <For each={[0, 1, 2, 3, 4]}>
        {(i) => (
          <rect
            x={120 + i * 15}
            y="85"
            width="10"
            height="10"
            fill={i === 4 ? BLUE_LIGHT : BLUE}
            data-anim="pop"
            style={delay(1.1 + i * 0.2)}
          />
        )}
      </For>

      <rect x="211" y="39" width="82" height="102" fill="none" stroke={BEIGE} stroke-width="2" />
      <rect x="211" y="39" width="82" height="13" fill={BEIGE} />
      <rect x="216" y="44" width="3" height="3" fill={INK} />
      <rect x="222" y="44" width="3" height="3" fill={INK} />
      <rect x="228" y="44" width="3" height="3" fill={INK} />
      <rect x="219" y="60" width="31" height="34" fill={BLUE} data-anim="pop" style={delay(2.2)} />
      <rect x="254" y="60" width="31" height="16" fill={BEIGE} data-anim="pop" style={delay(2.4)} />
      <rect x="254" y="80" width="31" height="14" fill={BEIGE} data-anim="pop" style={delay(2.5)} />
      <rect x="219" y="100" width="66" height="8" fill={BEIGE} data-anim="pop" style={delay(2.7)} />
      <rect x="219" y="113" width="44" height="8" fill={BEIGE} data-anim="pop" style={delay(2.8)} />
      <rect
        x="219"
        y="126"
        width="26"
        height="8"
        fill={BLUE_LIGHT}
        data-anim="pop"
        style={delay(3)}
      />
    </Scene>
  );
}

/** Broadcast rings feeding a bar chart that climbs, with the trend drawn over it. */
export function MarketingScene() {
  const heights = [22, 34, 46, 62, 82, 104];
  const tops = heights.map((h, i) => `${100 + i * 34 + 11},${152 - h - 8}`).join(" ");

  return (
    <Scene id="marketing" label="Organic channels growing monthly orders">
      <For each={[0, 1, 2]}>
        {(i) => (
          <circle
            cx="52"
            cy="64"
            r="34"
            fill="none"
            stroke={BEIGE}
            stroke-width="2"
            data-anim="ripple"
            style={delay(i * 1)}
          />
        )}
      </For>
      <rect x="44" y="56" width="16" height="16" fill={BLUE} />

      <rect x="92" y="152" width="208" height="2" fill={DIM} />
      <For each={heights}>
        {(height, i) => (
          <rect
            x={100 + i() * 34}
            y={152 - height}
            width="22"
            height={height}
            fill={i() === heights.length - 1 ? BLUE : BEIGE}
            data-anim="grow"
            style={delay(i() * 0.16)}
          />
        )}
      </For>
      <polyline
        points={tops}
        fill="none"
        stroke={BLUE_LIGHT}
        stroke-width="2.5"
        stroke-linejoin="bevel"
        pathLength="1"
        data-anim="draw"
        style={delay(0.9)}
      />
    </Scene>
  );
}

/** A scan line sweeps a field of companies and keeps the few with a warm path. */
export function SalesScene() {
  const cols = 12;
  const rows = 5;
  const picked = new Set(["1-1", "3-3", "4-0", "6-2", "7-4", "9-1", "10-3", "11-0"]);
  const startX = 42;
  const spacing = 21;
  const sweep = 252;
  const sweepSeconds = 6 * 0.6;

  const cells = Array.from({ length: cols * rows }, (_, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = startX + col * spacing;
    return { col, row, x, y: 38 + row * 22, key: `${col}-${row}` };
  });

  return (
    <Scene id="sales" label="Hundreds of companies narrowed to a warm shortlist">
      <For each={cells}>
        {(cell) =>
          picked.has(cell.key) ? (
            <rect
              x={cell.x}
              y={cell.y}
              width="10"
              height="10"
              fill={DIM}
              data-anim="pick"
              // Flip to blue exactly as the scan line crosses this column.
              style={delay(((cell.x - startX + 6) / sweep) * sweepSeconds - 6 * 0.3)}
            />
          ) : (
            <rect x={cell.x} y={cell.y} width="10" height="10" fill={DIM} />
          )
        }
      </For>
      <rect
        x={startX - 6}
        y="28"
        width="3"
        height="118"
        fill={BEIGE}
        data-anim="scan"
        style={{ "--scan-distance": `${sweep}px` }}
      />
      <rect x="42" y="152" width="40" height="4" fill={BLUE} />
      <rect x="88" y="152" width="18" height="4" fill={DIM} />
    </Scene>
  );
}

/** Invoices land in a pile while the weekly cash-flow line draws itself. */
export function FinanceScene() {
  return (
    <Scene id="finance" label="Invoices collected into a weekly cash flow report">
      <For each={[0, 1, 2, 3]}>
        {(i) => (
          <g data-anim="drop" style={delay(i * 0.35)}>
            <rect
              x={34 + (i % 2) * 4}
              y={130 - i * 20}
              width="62"
              height="16"
              fill={i === 3 ? BLUE : BEIGE}
            />
            <rect
              x={42 + (i % 2) * 4}
              y={136 - i * 20}
              width="22"
              height="4"
              fill={i === 3 ? BEIGE : INK}
            />
            <rect
              x={74 + (i % 2) * 4}
              y={136 - i * 20}
              width="14"
              height="4"
              fill={i === 3 ? BEIGE : INK}
            />
          </g>
        )}
      </For>

      <rect x="124" y="36" width="1.5" height="114" fill={DIM} />
      <rect x="124" y="148" width="170" height="2" fill={DIM} />
      <For each={[0, 1, 2, 3]}>
        {(i) => <rect x="128" y={52 + i * 24} width="166" height="1" fill={DIM} />}
      </For>
      <For each={[0, 1, 2, 3, 4, 5, 6]}>
        {(i) => (
          <rect
            x={134 + i * 23}
            y={148 - [14, 22, 18, 30, 26, 36, 42][i]}
            width="9"
            height={[14, 22, 18, 30, 26, 36, 42][i]}
            fill="#2A2926"
            data-anim="grow"
            style={delay(0.4 + i * 0.1)}
          />
        )}
      </For>
      <polyline
        points="138,122 161,108 184,114 207,90 230,96 253,70 276,56"
        fill="none"
        stroke={BEIGE}
        stroke-width="2.5"
        stroke-linejoin="bevel"
        pathLength="1"
        data-anim="draw"
        style={delay(0.6)}
      />
      <rect x="271" y="51" width="10" height="10" fill={BLUE} data-anim="pop" style={delay(3.2)} />
    </Scene>
  );
}

/** Issues reach a hub and are routed straight to the silicon that can solve them. */
export function OperationsScene() {
  const routes = [
    { path: "M 88 90 C 150 90, 170 48, 238 48", y: 40 },
    { path: "M 88 90 C 150 90, 170 90, 238 90", y: 82 },
    { path: "M 88 90 C 150 90, 170 132, 238 132", y: 124 },
  ];
  // Each packet owns a third of the 6s loop.
  const order = [1, 0, 2];

  return (
    <Scene id="operations" label="Problems routed to the right silicon in hours">
      <For each={routes}>
        {(route) => (
          <path d={route.path} fill="none" stroke={DIM} stroke-width="2" stroke-dasharray="4 4" />
        )}
      </For>

      <For each={[0, 1, 2]}>
        {(i) => <rect x="24" y={60 + i * 24} width="12" height="12" fill={BEIGE} opacity="0.55" />}
      </For>
      <rect x="40" y="88" width="24" height="4" fill={DIM} />

      <rect x="64" y="70" width="40" height="40" fill={BEIGE} />
      <rect x="76" y="82" width="16" height="16" fill={INK} />

      <For each={order}>
        {(routeIndex, slot) => {
          const begin = `${slot() * 2}s`;
          return (
            <>
              <rect x="-5" y="-5" width="10" height="10" fill={BLUE_LIGHT} opacity="0">
                <animateMotion
                  dur="6s"
                  begin={begin}
                  repeatCount="indefinite"
                  path={routes[routeIndex].path}
                  keyPoints="0;0;1;1"
                  keyTimes="0;0.05;0.25;1"
                  calcMode="linear"
                />
                <animate
                  attributeName="opacity"
                  dur="6s"
                  begin={begin}
                  repeatCount="indefinite"
                  values="0;1;1;0;0"
                  keyTimes="0;0.05;0.25;0.26;1"
                />
              </rect>
              <rect x="238" y={routes[routeIndex].y} width="56" height="16" fill={BEIGE}>
                <animate
                  attributeName="fill"
                  dur="6s"
                  begin={begin}
                  repeatCount="indefinite"
                  calcMode="discrete"
                  values={`${BEIGE};${BLUE};${BEIGE}`}
                  keyTimes="0;0.25;0.5"
                />
              </rect>
            </>
          );
        }}
      </For>

      <circle cx="286" cy="24" r="9" fill="none" stroke={BEIGE} stroke-width="1.5" opacity="0.6" />
      <rect
        x="285.25"
        y="17"
        width="1.5"
        height="7"
        fill={BEIGE}
        data-anim="spin"
        style={{ "transform-origin": "50% 100%" }}
      />
    </Scene>
  );
}
