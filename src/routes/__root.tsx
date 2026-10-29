/// <reference types="vite/client" />
import { type ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import siteIdentity from "~/lib/og/site.json";
import appCss from "~/styles.css?url";

const OG_IMAGE_WIDTH = "1200";
const OG_IMAGE_HEIGHT = "630";

export const Route = createRootRoute({
  head: () => {
    const title = siteIdentity.title || "Booth — On-Device Text to Speech";
    const imagePath = siteIdentity.imagePath || "/og.jpg";
    const imageAlt = title;

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title },
        { name: "application-name", content: siteIdentity.shortName || "Booth" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: siteIdentity.shortName || "Booth" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "theme-color", content: siteIdentity.themeColor || "#0e0d0c" },
        { property: "og:title", content: title },
        { property: "og:type", content: "website" },
        { property: "og:image", content: imagePath },
        { property: "og:image:width", content: OG_IMAGE_WIDTH },
        { property: "og:image:height", content: OG_IMAGE_HEIGHT },
        { property: "og:image:alt", content: imageAlt },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:image", content: imagePath },
        { name: "twitter:image:alt", content: imageAlt },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/icon-180.png" },
        { rel: "manifest", href: "/manifest.webmanifest" },
      ],
    };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
