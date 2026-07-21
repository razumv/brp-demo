"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { LayerProvider } from "@astryxdesign/core/Layer";
import { Link, LinkProvider } from "@astryxdesign/core/Link";
import {
  proportional,
  Table,
} from "@astryxdesign/core/Table";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@/themes/neutral/neutral";

type ThemeRegionProps = {
  mode: "light" | "dark";
};

const foundationRows = [{ part: "Foundation row" }];

const foundationColumns = [
  {
    key: "part",
    header: "Foundation column",
    width: proportional(1),
  },
];

function ThemeRegion({ mode }: ThemeRegionProps) {
  return (
    <section data-testid={`astryx-foundation-${mode}`}>
      <Button label="Foundation action" variant="primary" />
      <TextInput
        isLabelHidden
        label="Foundation input"
        onChange={() => {}}
        value=""
      />
      <Card data-testid={`astryx-foundation-card-${mode}`} padding={4}>
        Foundation card
      </Card>
      <Table columns={foundationColumns} data={foundationRows} />
      <Link href="/" label="Foundation link">
        Foundation link
      </Link>
    </section>
  );
}

/** Gated production probe for validating Astryx's compiled CSS foundation. */
export function AstryxFoundationProbe() {
  const pathname = usePathname();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsEnabled(new URLSearchParams(window.location.search).get("astryx-foundation-probe") === "1");
  }, []);

  if (pathname !== "/login" || !isEnabled) return null;

  return (
    <section data-design-system="astryx" data-testid="astryx-foundation-probe">
      <LinkProvider component={NextLink}>
        <LayerProvider>
          <Theme mode="light" theme={neutralTheme}>
            <ThemeRegion mode="light" />
            <Theme mode="dark" theme={neutralTheme}>
              <ThemeRegion mode="dark" />
            </Theme>
          </Theme>
        </LayerProvider>
      </LinkProvider>
    </section>
  );
}
