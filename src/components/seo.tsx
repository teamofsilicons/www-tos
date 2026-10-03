import { Meta, Title } from "@solidjs/meta";

const SITE = "Team of Silicons";

export function Seo(props: { title?: string; description: string }) {
  const title = () => (props.title ? `${props.title} · ${SITE}` : SITE);

  return (
    <>
      <Title>{title()}</Title>
      <Meta name="description" content={props.description} />
      <Meta property="og:title" content={title()} />
      <Meta property="og:description" content={props.description} />
      <Meta property="og:type" content="website" />
      <Meta property="og:site_name" content={SITE} />
    </>
  );
}
