import { Link, Meta, Title } from "@solidjs/meta";
import { Show } from "solid-js";

const SITE = "Team of Silicons";

export type SeoImage = { url: string; alt: string; width?: number; height?: number };

export function Seo(props: {
  title?: string;
  /** Use `title` as is, without the site name. */
  fullTitle?: boolean;
  description: string;
  canonical?: string;
  robots?: string;
  ogType?: string;
  image?: SeoImage;
}) {
  const title = () =>
    props.fullTitle && props.title ? props.title : props.title ? `${props.title} · ${SITE}` : SITE;

  return (
    <>
      <Title>{title()}</Title>
      <Meta name="description" content={props.description} />
      <Show when={props.robots}>{(robots) => <Meta name="robots" content={robots()} />}</Show>
      <Show when={props.canonical}>
        {(canonical) => (
          <>
            <Link rel="canonical" href={canonical()} />
            <Meta property="og:url" content={canonical()} />
          </>
        )}
      </Show>
      <Meta property="og:title" content={title()} />
      <Meta property="og:description" content={props.description} />
      <Meta property="og:type" content={props.ogType ?? "website"} />
      <Meta property="og:site_name" content={SITE} />
      <Show
        when={props.image}
        fallback={<Meta name="twitter:card" content="summary" />}
      >
        {(image) => (
          <>
            <Meta property="og:image" content={image().url} />
            <Show when={image().width}>
              {(width) => <Meta property="og:image:width" content={String(width())} />}
            </Show>
            <Show when={image().height}>
              {(height) => <Meta property="og:image:height" content={String(height())} />}
            </Show>
            <Meta property="og:image:alt" content={image().alt} />
            <Meta name="twitter:card" content="summary_large_image" />
            <Meta name="twitter:image" content={image().url} />
            <Meta name="twitter:image:alt" content={image().alt} />
          </>
        )}
      </Show>
      <Meta name="twitter:title" content={title()} />
      <Meta name="twitter:description" content={props.description} />
    </>
  );
}
